import { useAuthStore } from '../store/authStore';
import { Package, Eye, MessageSquare, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const stats = [
    { label: 'Активных объявлений', value: '0 / ' + (user?.listing_limit || 300), icon: Package, color: 'blue' },
    { label: 'Просмотры за неделю', value: '0', icon: Eye, color: 'green' },
    { label: 'Новых сообщений', value: '0', icon: MessageSquare, color: 'purple' },
    { label: 'Средняя цена', value: '0 ₽', icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Добро пожаловать, {user?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Панель управления вашими объявлениями на Avito
        </p>
      </div>

      {user?.plan === 'PRO' && user?.subscription_active && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">🎉 Пробная версия PRO активна</h3>
          <p className="text-primary-100">
            У вас есть доступ ко всем функциям PRO плана до окончания пробного периода
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                <stat.icon className={`text-${stat.color}-600`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Последняя активность</h3>
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p>Пока нет объявлений</p>
            <p className="text-sm mt-2">Подключите Avito API для начала работы</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">График цен</h3>
          <div className="text-center py-12 text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-3 text-gray-400" />
            <p>Нет данных для отображения</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрый старт</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Подключите Avito API</p>
              <p className="text-sm text-gray-600">Перейдите в Профиль → Подключить Avito</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Синхронизируйте объявления</p>
              <p className="text-sm text-gray-600">Импортируйте ваши объявления с Avito</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Включите оптимизацию цен</p>
              <p className="text-sm text-gray-600">Настройте автоматическое управление ценами</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
