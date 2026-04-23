import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../UI/Toast';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
      <Toast />
    </div>
  );
}
