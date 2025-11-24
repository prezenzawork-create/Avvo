# Avvo Frontend

Frontend приложение для платформы Avvo - AI Helper for Avito.

## Технологии

- React 18
- Vite
- TailwindCSS
- React Router
- Zustand (state management)
- TanStack Query (server state)
- Axios
- Lucide React (icons)

## Установка

```bash
npm install
```

## Запуск

### Development
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Production build
```bash
npm run build
npm run preview
```

## Структура проекта

```
frontend/
├── src/
│   ├── components/
│   │   └── layout/      # Header, Sidebar, Layout
│   ├── pages/           # Dashboard, Login, Register, Profile, etc.
│   ├── services/        # API clients
│   ├── store/           # Zustand stores
│   ├── App.jsx          # Routing and route protection
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Переменные окружения

Создайте файл `.env.local`:

```
VITE_API_BASE_URL=http://localhost:3000
```

## Страницы

- `/login` - Вход в систему
- `/register` - Регистрация
- `/dashboard` - Панель управления
- `/listings` - Управление объявлениями
- `/chat` - Сообщения
- `/price-optimizer` - Оптимизация цен
- `/analytics` - Аналитика
- `/profile` - Профиль пользователя

## Особенности

- Защищенные маршруты с автоматической переадресацией
- Сохранение состояния аутентификации в localStorage
- Автоматическое обновление токена
- Полностью на русском языке
- Responsive design
- Clean, modern UI
