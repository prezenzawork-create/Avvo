import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';
import { User, Key, Link as LinkIcon, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  });
  const [avitoToken, setAvitoToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authService.updateProfile(formData);
      updateUser(response.data);
      setMessage('Профиль успешно обновлен');
    } catch (error) {
      setMessage('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAvitoConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authService.connectAvito(avitoToken);
      setMessage('Avito API успешно подключен');
      setAvitoToken('');
    } catch (error) {
      setMessage('Ошибка подключения Avito API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
          {message}
        </div>
      )}

      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <User className="text-primary-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input-field"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Save size={18} />
            <span>Сохранить изменения</span>
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <LinkIcon className="text-primary-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Подключение Avito API</h2>
        </div>

        <form onSubmit={handleAvitoConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Токен доступа Avito
            </label>
            <input
              type="password"
              value={avitoToken}
              onChange={(e) => setAvitoToken(e.target.value)}
              className="input-field"
              placeholder="Введите ваш токен Avito API"
            />
            <p className="text-xs text-gray-500 mt-1">
              Токен будет зашифрован и надежно сохранен
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !avitoToken}
            className="btn-primary flex items-center space-x-2"
          >
            <Key size={18} />
            <span>Подключить Avito</span>
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Подписка</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Текущий тариф:</span>
            <span className="font-semibold text-gray-900">{user?.plan || 'PRO'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Лимит объявлений:</span>
            <span className="font-semibold text-gray-900">{user?.listing_limit || 300}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Статус:</span>
            <span className="font-semibold text-green-600">
              {user?.subscription_active ? 'Активна' : 'Неактивна'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
