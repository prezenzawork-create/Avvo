import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, MessageSquare, BarChart3, DollarSign, User } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Панель управления' },
  { path: '/listings', icon: Package, label: 'Объявления' },
  { path: '/chat', icon: MessageSquare, label: 'Сообщения' },
  { path: '/price-optimizer', icon: DollarSign, label: 'Оптимизация цен' },
  { path: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
