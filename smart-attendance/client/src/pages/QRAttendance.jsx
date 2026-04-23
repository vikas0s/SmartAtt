import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

export default function QRAttendance() {
  const { user, api, showToast, isAdmin } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    fetchActiveSessions();
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data } = await api.get('/session/active');
      setActiveSessions(data.data);
    } catch (error) {
      // Silently fail
    }
  };

  const startScanner = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      if (!scannerRef.current) return;

      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      });

      scanner.render(
        async (decodedText) => {
          // Success
          try {
            const qrData = JSON.parse(decodedText);
            scanner.clear().catch(() => {});
            scannerInstanceRef.current = null;

            // Submit attendance
            try {
              const { data } = await api.post('/session/scan', {
                qrData,
                deviceInfo: navigator.userAgent,
              });
              setScanResult({ success: true, message: data.message });
              showToast('✅ Attendance marked successfully!', 'success');
            } catch (error) {
              const msg = error.response?.data?.message || 'Failed to mark attendance';
              setScanResult({ success: false, message: msg });
              showToast(msg, 'error');
            }
            setScanning(false);
          } catch (e) {
            setScanResult({ success: false, message: 'Invalid QR code format' });
            showToast('Invalid QR code', 'error');
          }
        },
        (errorMessage) => {
          // Error - continue scanning
        }
      );

      scannerInstanceRef.current = scanner;
    }, 300);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.clear().catch(() => {});
      scannerInstanceRef.current = null;
    }
    setScanning(false);
  };

  return (
    <>
      <Header title="QR Code Attendance" subtitle="Scan QR to mark attendance" />
      <div className="page-content animate-fadeIn">
        <div className="grid-2">
          {/* Scanner */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📱 QR Scanner</div>
              {scanning && (
                <div className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● Scanning</div>
              )}
            </div>

            {scanning ? (
              <div>
                <div id="qr-reader" ref={scannerRef} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}></div>
                <button className="btn btn-danger w-full mt-2" onClick={stopScanner}>
                  ⏹ Stop Scanner
                </button>
              </div>
            ) : (
              <div>
                {scanResult ? (
                  <div style={{
                    padding: 32,
                    textAlign: 'center',
                    borderRadius: 'var(--radius-lg)',
                    background: scanResult.success ? 'var(--success-50)' : 'var(--danger-50)',
                    marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                      {scanResult.success ? '✅' : '❌'}
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: scanResult.success ? 'var(--success-700)' : 'var(--danger-500)'
                    }}>
                      {scanResult.success ? 'Attendance Marked!' : 'Failed'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                      {scanResult.message}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <div className="empty-state-icon">📷</div>
                    <h3>Ready to Scan</h3>
                    <p>Click the button below to open the QR scanner</p>
                  </div>
                )}

                <button className="btn btn-primary w-full" onClick={startScanner}>
                  📷 Start QR Scanner
                </button>

                {scanResult && (
                  <button
                    className="btn btn-ghost w-full mt-1"
                    onClick={() => setScanResult(null)}
                  >
                    Scan Again
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">ℹ️ Information</div>
            </div>

            {/* Active Sessions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active Sessions</div>
              {activeSessions.length === 0 ? (
                <div style={{
                  padding: 16, background: 'var(--warning-50)',
                  borderRadius: 'var(--radius-md)', fontSize: 13,
                  color: 'var(--warning-600)'
                }}>
                  ⚠️ No active sessions available
                </div>
              ) : (
                activeSessions.map(session => (
                  <div key={session._id} style={{
                    padding: 14,
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 8,
                    borderLeft: '3px solid var(--success-500)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{session.subjectName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Class: {session.classId} • Expires: {new Date(session.expiresAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How to use:</h4>
              <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 16 }}>
                <li>Make sure there&apos;s an active session</li>
                <li>Click &quot;Start QR Scanner&quot;</li>
                <li>Allow camera access</li>
                <li>Point camera at the QR code</li>
                <li>Attendance will be marked automatically</li>
              </ol>
            </div>

            <div style={{
              marginTop: 20, padding: 16,
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 12,
              color: 'var(--primary-700)',
            }}>
              <strong>🔒 Security:</strong> QR codes expire after 5 minutes. Each student can only scan once per session. Device fingerprinting prevents sharing.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
