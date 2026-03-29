import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, Loader } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if there's an error, navigate to login
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-md h-20 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
        )}
        <div className="flex items-center gap-3">
          {/* University Logo */}
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rglFWmLitQbBPWPvlaUmQHDHI2YiM8.png"
            alt="University of Cabuyao"
            className="h-12 w-12 rounded-full"
          />
          {/* College Logo */}
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JiGNt42HwaPEYoifHlLe8u2pfYzP0m.png"
            alt="College of Computing Studies"
            className="h-12 w-12 rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800"></h1>
            <p className="text-xs text-gray-600">University of Cabuyao</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
        >
          {isLoggingOut ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
          <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
};
