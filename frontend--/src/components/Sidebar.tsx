import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuItems } from '../lib/constants';
import * as Icons from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const items = menuItems[user.role];

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      LayoutDashboard: Icons.LayoutDashboard,
      Users: Icons.Users,
      Users2: Icons.Users2,
      Calendar: Icons.Calendar,
      BookOpen: Icons.BookOpen,
      CalendarDays: Icons.CalendarDays,
      FileText: Icons.FileText,
      Settings: Icons.Settings,
      User: Icons.User,
      BookMarked: Icons.BookMarked,
      Briefcase: Icons.Briefcase,
    };
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={20} /> : null;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-white shadow-lg overflow-y-auto transition-transform duration-300 z-40 md:static md:translate-x-0 md:shadow-none md:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {getIcon(item.icon)}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};
