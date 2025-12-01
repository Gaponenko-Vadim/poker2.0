# API Документация

## Аутентификация

Все защищенные endpoints требуют JWT токен в заголовке Authorization:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Регистрация пользователя

**Endpoint:** `POST /api/auth/register`

**Описание:** Создание нового пользователя с email и паролем

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Валидация:**
- Email должен быть валидным (формат email)
- Пароль минимум 6 символов
- Email должен быть уникальным

**Success Response (201):**
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "createdAt": "2025-10-29T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- **400 Bad Request:** Невалидные данные
  ```json
  {
    "error": "Email и пароль обязательны"
  }
  ```

- **409 Conflict:** Email уже существует
  ```json
  {
    "error": "Пользователь с таким email уже существует"
  }
  ```

**Пример curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 2. Вход пользователя

**Endpoint:** `POST /api/auth/login`

**Описание:** Аутентификация существующего пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Вход выполнен успешно",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "createdAt": "2025-10-29T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- **400 Bad Request:** Отсутствуют данные
  ```json
  {
    "error": "Email и пароль обязательны"
  }
  ```

- **401 Unauthorized:** Неверные credentials
  ```json
  {
    "error": "Неверный email или пароль"
  }
  ```

**Пример curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 3. OAuth авторизация (Google)

**Endpoint:** `GET /api/auth/google`

**Описание:** Инициирует OAuth авторизацию через Google

**Процесс:**
1. Редирект на Google authorization page
2. Пользователь подтверждает доступ
3. Callback на `/api/auth/google/callback`
4. Создание/обновление пользователя в БД
5. Генерация JWT токена
6. Редирект на главную страницу с токеном в URL

**Использование:**
```html
<a href="/api/auth/google">Войти через Google</a>
```

---

## 4. OAuth авторизация (Yandex)

**Endpoint:** `GET /api/auth/yandex`

**Описание:** Инициирует OAuth авторизацию через Яндекс

**Процесс:**
1. Редирект на Yandex authorization page
2. Пользователь подтверждает доступ
3. Callback на `/api/auth/yandex/callback`
4. Создание/обновление пользователя в БД
5. Генерация JWT токена
6. Редирект на главную страницу с токеном в URL

**Использование:**
```html
<a href="/api/auth/yandex">Войти через Яндекс</a>
```

---

## 5. Получение пользовательских диапазонов

**Endpoint:** `GET /api/user-ranges/get`

**Описание:** Получение всех наборов диапазонов пользователя

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `tableType` (опционально): "6-max" | "8-max" | "cash"
- `category` (опционально): "micro" | "low" | "mid" | "high"

**Success Response (200):**
```json
{
  "rangeSets": [
    {
      "id": 1,
      "name": "My PKO Ranges",
      "table_type": "6-max",
      "category": "micro",
      "starting_stack": 200,
      "bounty": true,
      "range_data": { ... },
      "created_at": "2025-11-28T12:00:00.000Z",
      "updated_at": "2025-11-28T12:00:00.000Z"
    }
  ]
}
```

**Пример curl:**
```bash
curl -X GET "http://localhost:3000/api/user-ranges/get?tableType=6-max" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6. Создание набора диапазонов

**Endpoint:** `POST /api/user-ranges/create`

**Описание:** Создание нового пользовательского набора диапазонов

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Custom Ranges",
  "table_type": "6-max",
  "category": "micro",
  "starting_stack": 200,
  "bounty": true,
  "range_data": {
    "ranges": {
      "user": { ... },
      "hero": { ... }
    }
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "rangeSetId": 1
}
```

---

## 7. Обновление набора диапазонов

**Endpoint:** `PUT /api/user-ranges/update`

**Описание:** Обновление существующего набора диапазонов

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": 1,
  "name": "Updated Ranges",
  "range_data": {
    "ranges": {
      "user": { ... },
      "hero": { ... }
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

## 8. Получение конкретного набора диапазонов

**Endpoint:** `GET /api/user-ranges/[id]`

**Описание:** Получение набора диапазонов по ID

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "My PKO Ranges",
  "table_type": "6-max",
  "category": "micro",
  "starting_stack": 200,
  "bounty": true,
  "range_data": { ... },
  "created_at": "2025-11-28T12:00:00.000Z",
  "updated_at": "2025-11-28T12:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Range set not found"
}
```

---

## 9. Удаление набора диапазонов

**Endpoint:** `DELETE /api/user-ranges/[id]`

**Описание:** Удаление набора диапазонов по ID

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Response (404):**
```json
{
  "error": "Range set not found"
}
```

---

## Тестирование с Postman/Insomnia

### 1. Регистрация
1. Создайте POST запрос на `http://localhost:3000/api/auth/register`
2. Добавьте Header: `Content-Type: application/json`
3. Body (JSON):
   ```json
   {
     "email": "myemail@example.com",
     "password": "mypassword123"
   }
   ```
4. Отправьте запрос
5. Сохраните полученный токен

### 2. Вход
1. Создайте POST запрос на `http://localhost:3000/api/auth/login`
2. Добавьте Header: `Content-Type: application/json`
3. Body (JSON):
   ```json
   {
     "email": "myemail@example.com",
     "password": "mypassword123"
   }
   ```
4. Отправьте запрос
5. Используйте токен для защищенных endpoints

### 3. Получение пользовательских диапазонов
1. Создайте GET запрос на `http://localhost:3000/api/user-ranges/get`
2. Добавьте Header: `Authorization: Bearer YOUR_JWT_TOKEN`
3. Отправьте запрос
4. Получите список всех диапазонов пользователя

### 4. Создание набора диапазонов
1. Создайте POST запрос на `http://localhost:3000/api/user-ranges/create`
2. Добавьте Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
3. Body (JSON):
   ```json
   {
     "name": "Test Ranges",
     "table_type": "6-max",
     "category": "micro",
     "starting_stack": 200,
     "bounty": true,
     "range_data": {
       "ranges": {
         "user": {},
         "hero": {}
       }
     }
   }
   ```
4. Отправьте запрос
5. Сохраните полученный ID

---

## Структура JWT токена

Токен содержит следующую информацию:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1698588000,
  "exp": 1699192800
}
```

Токен действителен 7 дней после выпуска.

---

## Типы данных

### RangeSetData (range_data)

Структура данных для хранения диапазонов:

```json
{
  "ranges": {
    "user": {
      "stages": {
        "early": {
          "positions": {
            "UTG": {
              "fish": {
                "tight": {
                  "ranges_by_stack": {
                    "very_short": {
                      "open_raise": "AA, KK, QQ",
                      "3bet": "AA, KK",
                      "push_range": "AA, KK, QQ, JJ"
                    },
                    "short": { ... },
                    "medium": { ... },
                    "big": { ... }
                  }
                },
                "balanced": { ... },
                "aggressor": { ... }
              },
              "amateur": { ... },
              "regular": { ... }
            },
            "BTN": { ... },
            "SB": { ... },
            "BB": { ... }
          }
        },
        "middle": { ... },
        "pre-bubble": { ... },
        "late": { ... },
        "pre-final": { ... },
        "final": { ... }
      }
    },
    "hero": {
      "stages": {
        "early": {
          "positions": {
            "BTN": {
              "tight": {
                "ranges_by_stack": {
                  "very_short": {
                    "open_raise": "AA, KK, QQ",
                    "3bet": "AA, KK"
                  },
                  "short": { ... },
                  "medium": { ... },
                  "big": { ... }
                }
              },
              "balanced": { ... },
              "aggressor": { ... }
            }
          }
        }
      }
    }
  }
}
```

**ВАЖНО**: Hero диапазоны НЕ содержат уровень `strength` - путь напрямую к `playStyle`.

---

## Коды ошибок

### Аутентификация (400, 401, 409)
- **400 Bad Request**: Отсутствуют обязательные поля, невалидные данные
- **401 Unauthorized**: Неверные credentials, невалидный JWT токен
- **409 Conflict**: Email уже зарегистрирован

### User Ranges (401, 404, 500)
- **401 Unauthorized**: Отсутствует или невалидный JWT токен
- **404 Not Found**: Набор диапазонов не найден
- **500 Internal Server Error**: Ошибка сервера или базы данных

---

## Примеры использования API

### Полный workflow создания и использования диапазонов

```javascript
// 1. Регистрация/Вход
const authResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { data: { token } } = await authResponse.json();

// 2. Создание набора диапазонов
const createResponse = await fetch('/api/user-ranges/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'PKO Micro Stakes',
    table_type: '6-max',
    category: 'micro',
    starting_stack: 200,
    bounty: true,
    range_data: rangeDataObject
  })
});
const { rangeSetId } = await createResponse.json();

// 3. Получение списка диапазонов
const listResponse = await fetch('/api/user-ranges/get?tableType=6-max', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { rangeSets } = await listResponse.json();

// 4. Загрузка конкретного набора
const loadResponse = await fetch(`/api/user-ranges/${rangeSetId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const rangeSet = await loadResponse.json();

// 5. Обновление набора
const updateResponse = await fetch('/api/user-ranges/update', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: rangeSetId,
    name: 'Updated Name',
    range_data: updatedRangeData
  })
});

// 6. Удаление набора
const deleteResponse = await fetch(`/api/user-ranges/${rangeSetId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Настройка окружения для API

### Обязательные переменные
```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=poker

# JWT
JWT_SECRET=your-secret-key-min-32-chars
```

### Опциональные переменные (для OAuth)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Yandex OAuth
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_REDIRECT_URI=http://localhost:3000/api/auth/yandex/callback
```

---

## Ограничения и best practices

### Rate Limiting
В текущей версии отсутствует rate limiting. Рекомендуется добавить middleware для ограничения частоты запросов в production.

### Размер данных
- Максимальный размер `range_data`: не ограничен на уровне API, но рекомендуется до 1MB
- Длина названия набора: рекомендуется до 100 символов

### Безопасность
- **ВСЕГДА** используйте HTTPS в production
- JWT токены храните в httpOnly cookies или localStorage с должной защитой от XSS
- Регулярно обновляйте JWT_SECRET
- Используйте сильные пароли (минимум 8 символов, буквы, цифры, спецсимволы)

### Производительность
- Кэшируйте часто используемые диапазоны на клиенте
- Используйте query параметры для фильтрации списков
- Избегайте частых обновлений больших наборов данных

---

## Миграции и версионирование

### Текущая версия API: v1

API endpoints не имеют версионирования в URL. При значительных изменениях будет добавлен префикс `/api/v2/`.

### Обратная совместимость
- Структура `range_data` поддерживает как старый формат (без stages), так и новый (со stages)
- При чтении данных проверяется наличие поля `stages` для определения формата

---

## Troubleshooting

### "Invalid token" / "Token expired"
- Проверьте, что токен не истёк (срок действия 7 дней)
- Убедитесь, что токен передаётся в правильном формате: `Bearer TOKEN`
- Проверьте, что JWT_SECRET одинаковый при создании и проверке токена

### "Database connection error"
- Убедитесь, что PostgreSQL запущен
- Проверьте переменные окружения DB_*
- Выполните `npm run db:init` для инициализации схемы

### "Range set not found"
- Проверьте, что ID существует
- Убедитесь, что пользователь является владельцем набора
- Набор может быть удалён другим процессом

### OAuth редирект не работает
- Проверьте, что REDIRECT_URI совпадает в .env и настройках OAuth провайдера
- Убедитесь, что нет лишних слешей в конце URL
- Проверьте, что приложение не в тестовом режиме (для production)
