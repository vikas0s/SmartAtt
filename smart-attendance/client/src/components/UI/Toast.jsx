import { useAuth } from '../../context/AuthContext';

export default function Toast() {
  const { toast } = useAuth();

  if (!toast) return null;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{icons[toast.type]}</span>
      {toast.message}
    </div>
  );
}
