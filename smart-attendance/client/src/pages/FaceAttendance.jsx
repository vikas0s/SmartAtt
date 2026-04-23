import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

const MODEL_URL = '/models';

export default function FaceAttendance() {
  const { user, api, showToast, isAdmin } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, scanning, matched, failed
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [faceCount, setFaceCount] = useState(0);

  // Registration mode (admin only)
  const [registerMode, setRegisterMode] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [capturingFace, setCapturingFace] = useState(false);

  useEffect(() => {
    loadModels();
    fetchActiveSessions();
    if (isAdmin) fetchStudents();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    setStatus('loading');
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus('idle');
      showToast('Face recognition models loaded', 'success');
    } catch (error) {
      setStatus('failed');
      showToast('Failed to load face models. Make sure models are in public/models/', 'error');
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const { data } = await api.get('/session/active');
      setActiveSessions(data.data);
      if (data.data.length > 0) setSelectedSession(data.data[0]._id);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/attendance/students');
      setStudents(data.data);
    } catch (error) {
      // Silently fail
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
    } catch (error) {
      showToast('Camera access denied', 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = async () => {
    if (!modelsLoaded) {
      showToast('Models not loaded yet', 'warning');
      return;
    }

    if (!selectedSession && !registerMode) {
      showToast('Please select an active session', 'warning');
      return;
    }

    await startCamera();
    setIsScanning(true);
    setStatus('scanning');
    setMatchedStudent(null);
  };

  // Face detection loop
  useEffect(() => {
    let animationId;
    let failureTimer;
    let attemptCount = 0;

    const detect = async () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== 4) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resized = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setFaceCount(detections.length);

      // Draw face boxes
      resized.forEach(det => {
        const box = det.detection.box;
        ctx.strokeStyle = status === 'matched' ? '#10b981' : '#3b8eff';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(
          `${(det.detection.score * 100).toFixed(0)}%`,
          box.x, box.y - 8
        );
      });

      // Anti-spoofing: warn if multiple faces
      if (detections.length > 1) {
        showToast('Multiple faces detected! Only one person at a time.', 'warning');
      }

      // Process for recognition (not registration)
      if (!registerMode && detections.length === 1 && status === 'scanning') {
        attemptCount++;
        const descriptor = Array.from(detections[0].descriptor);

        try {
          const { data } = await api.post('/face/recognize', { descriptor });

          if (data.data.matched) {
            setStatus('matched');
            setMatchedStudent(data.data.student);

            // Auto mark attendance
            try {
              await api.post('/attendance/mark', {
                studentId: data.data.student._id,
                sessionId: selectedSession,
                method: 'face',
                deviceInfo: navigator.userAgent,
              });
              showToast(`✅ Attendance marked for ${data.data.student.name}!`, 'success');
            } catch (markError) {
              showToast(markError.response?.data?.message || 'Failed to mark attendance', 'error');
            }

            // Stop scanning after successful match
            setTimeout(() => {
              setIsScanning(false);
              stopCamera();
            }, 3000);
            return;
          }
        } catch (error) {
          // Continue scanning
        }

        // Timeout after ~10 seconds of attempts
        if (attemptCount > 30) {
          setStatus('failed');
          showToast('No match found. Try QR code instead.', 'warning');
          setTimeout(() => {
            setIsScanning(false);
            stopCamera();
          }, 2000);
          return;
        }
      }

      animationId = requestAnimationFrame(detect);
    };

    if (isScanning) {
      setTimeout(() => {
        animationId = requestAnimationFrame(detect);
      }, 1000);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (failureTimer) clearTimeout(failureTimer);
    };
  }, [isScanning, registerMode, status]);

  // Capture face for registration
  const captureForRegistration = async () => {
    if (!videoRef.current || !selectedStudentId) {
      showToast('Please select a student first', 'warning');
      return;
    }

    setCapturingFace(true);
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length !== 1) {
      showToast('Please ensure exactly one face is visible', 'warning');
      setCapturingFace(false);
      return;
    }

    const descriptor = Array.from(detections[0].descriptor);
    const newDescriptors = [...capturedDescriptors, descriptor];
    setCapturedDescriptors(newDescriptors);
    showToast(`Sample ${newDescriptors.length}/5 captured`, 'info');

    if (newDescriptors.length >= 5) {
      // Register face data
      try {
        await api.post('/face/register', {
          studentId: selectedStudentId,
          descriptors: newDescriptors,
        });
        showToast('Face data registered successfully!', 'success');
        setCapturedDescriptors([]);
        setSelectedStudentId('');
        fetchStudents();
      } catch (error) {
        showToast('Failed to register face data', 'error');
      }
    }

    setCapturingFace(false);
  };

  const statusText = {
    idle: 'Ready to scan',
    loading: 'Loading face models...',
    scanning: 'Scanning for faces...',
    matched: `Match found: ${matchedStudent?.name}`,
    failed: 'No match found',
  };

  return (
    <>
      <Header title="Face Recognition" subtitle={registerMode ? 'Register face data' : 'Mark attendance via face'} />
      <div className="page-content animate-fadeIn">
        {/* Mode Toggle (Admin only) */}
        {isAdmin && (
          <div className="filters-row" style={{ marginBottom: 20 }}>
            <button
              className={`btn ${!registerMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setRegisterMode(false); stopCamera(); setIsScanning(false); setStatus('idle'); }}
            >
              🧠 Recognition Mode
            </button>
            <button
              className={`btn ${registerMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setRegisterMode(true); stopCamera(); setIsScanning(false); setStatus('idle'); setCapturedDescriptors([]); }}
            >
              📝 Registration Mode
            </button>
          </div>
        )}

        <div className="grid-2">
          {/* Webcam Feed */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📹 Camera Feed</div>
              {isScanning && (
                <div className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● LIVE</div>
              )}
            </div>

            <div className="webcam-container" style={{ marginBottom: 16 }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
              <canvas ref={canvasRef} className="webcam-overlay" style={{ position: 'absolute', top: 0, left: 0 }} />

              {status !== 'idle' && (
                <div className={`webcam-status ${status}`}>
                  {statusText[status]}
                </div>
              )}
            </div>

            {faceCount > 0 && isScanning && (
              <div style={{ fontSize: 12, color: faceCount > 1 ? 'var(--danger-500)' : 'var(--text-secondary)', marginBottom: 12 }}>
                {faceCount} face{faceCount !== 1 ? 's' : ''} detected
                {faceCount > 1 && ' ⚠️ Only 1 face should be visible'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {!isScanning ? (
                <button className="btn btn-primary w-full" onClick={startScanning} disabled={!modelsLoaded}>
                  {modelsLoaded ? '▶ Start Camera' : '⏳ Loading Models...'}
                </button>
              ) : (
                <button className="btn btn-danger w-full" onClick={() => { stopCamera(); setStatus('idle'); }}>
                  ⏹ Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="card">
            {!registerMode ? (
              /* Recognition Mode Controls */
              <>
                <div className="card-header">
                  <div className="card-title">⚙️ Recognition Settings</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Active Session *</label>
                  <select
                    className="form-select"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                  >
                    <option value="">Select a session</option>
                    {activeSessions.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.subjectName} ({s.classId})
                      </option>
                    ))}
                  </select>
                  {activeSessions.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--warning-500)', marginTop: 6 }}>
                      No active sessions. Create one first.
                    </p>
                  )}
                </div>

                <div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', marginTop: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How it works:</h4>
                  <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 16 }}>
                    <li>Select an active session</li>
                    <li>Start the camera</li>
                    <li>Face towards the camera</li>
                    <li>System matches your face automatically</li>
                    <li>Attendance marked on successful match</li>
                    <li>Falls back to QR if no match in 10s</li>
                  </ol>
                </div>

                {matchedStudent && (
                  <div style={{
                    marginTop: 20, padding: 20,
                    background: 'var(--success-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--success-400)',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success-700)' }}>
                      ✅ Match Found!
                    </div>
                    <div style={{ fontSize: 14, marginTop: 8 }}>
                      <strong>{matchedStudent.name}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {matchedStudent.email} • {matchedStudent.enrollmentNumber}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Registration Mode Controls */
              <>
                <div className="card-header">
                  <div className="card-title">📝 Register Face Data</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => { setSelectedStudentId(e.target.value); setCapturedDescriptors([]); }}
                  >
                    <option value="">Choose a student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.enrollmentNumber}) {s.faceRegistered ? '✅' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudentId && (
                  <>
                    <div style={{
                      padding: 16, background: 'var(--primary-50)',
                      borderRadius: 'var(--radius-lg)', marginBottom: 16
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-700)' }}>
                        Samples captured: {capturedDescriptors.length}/5
                      </div>
                      <div style={{
                        height: 6, background: 'var(--primary-100)',
                        borderRadius: 3, marginTop: 8, overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(capturedDescriptors.length / 5) * 100}%`,
                          background: 'var(--primary-500)',
                          borderRadius: 3,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>

                    <button
                      className="btn btn-success w-full"
                      onClick={captureForRegistration}
                      disabled={!isScanning || capturingFace || capturedDescriptors.length >= 5}
                    >
                      {capturingFace ? '📸 Capturing...' : `📸 Capture Sample ${capturedDescriptors.length + 1}/5`}
                    </button>
                  </>
                )}

                <div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', marginTop: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Instructions:</h4>
                  <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 16 }}>
                    <li>Select a student from the dropdown</li>
                    <li>Start the camera</li>
                    <li>Have the student face the camera</li>
                    <li>Capture 5 samples at different angles</li>
                    <li>Face data will be saved automatically</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
