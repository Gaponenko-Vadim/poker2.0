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

## Дефолтные настройки игроков

При регистрации для каждого пользователя автоматически создаются дефолтные настройки:
- **Дефолтный диапазон:** `["JTo"]`

Эти настройки можно изменить через соответствующие API endpoints (будут добавлены позже).
