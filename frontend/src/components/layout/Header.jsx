import { Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary-600">Avvo</h1>
          <span className="text-sm text-gray-500">AI Helper for Avito</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3 border-l pl-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-gray-500">
                {user?.plan || 'PRO'} • {user?.listing_limit || 300} объявлений
              </p>
            </div>
            
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={20} className="text-gray-600" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
