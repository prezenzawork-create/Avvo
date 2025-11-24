# Avvo Backend API

Backend API для платформы Avvo - AI Helper for Avito.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
copy .env.example .env
```

3. Настройте переменные окружения в `.env`:
   - DATABASE_URL - строка подключения к PostgreSQL
   - JWT_SECRET - секретный ключ для JWT
   - ENCRYPTION_KEY - ключ для шифрования (32 символа)
   - И другие необходимые переменные

4. Запустите миграцию базы данных:
```bash
npm run migrate
```

## Запуск

### Development режим с автоперезагрузкой:
```bash
npm run dev
```

### Production режим:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Получить профиль текущего пользователя (требует аутентификации)
- `PUT /api/auth/profile` - Обновить профиль (требует аутентификации)
- `POST /api/auth/avito-connect` - Подключить Avito API токен (требует аутентификации)

### Health Check
- `GET /health` - Проверка состояния сервера

## Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация (БД, константы)
│   ├── controllers/     # Контроллеры для обработки запросов
│   ├── middleware/      # Middleware (auth, rate limiting, errors)
│   ├── models/          # Модели данных
│   ├── routes/          # Маршруты API
│   ├── utils/           # Утилиты (JWT, шифрование, логирование)
│   ├── app.js           # Настройка Express приложения
│   └── server.js        # Точка входа сервера
├── .env.example         # Пример переменных окружения
├── package.json
└── README.md
```

## Безопасность

- Пароли хешируются с использованием bcrypt (12 раундов)
- Токены Avito шифруются с использованием AES-256-GCM
- JWT токены для аутентификации (24 часа)
- Refresh токены (7 дней)
- Rate limiting для всех эндпоинтов
- CORS настроен для frontend URL

## Технологии

- Node.js + Express
- PostgreSQL
- JWT для аутентификации
- bcrypt для хеширования паролей
- Winston для логирования
- express-rate-limit для ограничения запросов
