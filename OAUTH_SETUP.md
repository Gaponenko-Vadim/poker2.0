# Настройка OAuth авторизации

Это руководство поможет настроить OAuth авторизацию через Google и Яндекс для вашего приложения.

## Google OAuth Setup

### 1. Создание OAuth приложения

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в раздел **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**
5. Выберите тип приложения: **Web application**

### 2. Настройка Redirect URIs

Добавьте следующие URI в разделе **Authorized redirect URIs**:

- Для разработки: `http://localhost:3000/api/auth/google/callback`
- Для production: `https://yourdomain.com/api/auth/google/callback`

### 3. Получение credentials

После создания приложения вы получите:
- **Client ID** - скопируйте в переменную `GOOGLE_CLIENT_ID`
- **Client Secret** - скопируйте в переменную `GOOGLE_CLIENT_SECRET`

### 4. Добавление в .env.local

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## Yandex OAuth Setup

### 1. Создание OAuth приложения

1. Перейдите на [Яндекс OAuth](https://oauth.yandex.ru/)
2. Войдите в свой аккаунт Яндекс
3. Нажмите **Зарегистрировать новое приложение**

### 2. Заполнение информации о приложении

- **Название приложения**: Poker Analytics (или ваше название)
- **Платформы**: выберите **Веб-сервисы**
- **Redirect URI**: добавьте следующие адреса:
  - Для разработки: `http://localhost:3000/api/auth/yandex/callback`
  - Для production: `https://yourdomain.com/api/auth/yandex/callback`

### 3. Настройка доступа к данным

В разделе **Доступ к данным** выберите:
- **login:email** - доступ к email адресу
- **login:info** - доступ к информации о пользователе

### 4. Получение credentials

После создания приложения вы получите:
- **ID приложения** - скопируйте в переменную `YANDEX_CLIENT_ID`
- **Пароль приложения** - скопируйте в переменную `YANDEX_CLIENT_SECRET`

### 5. Добавление в .env.local

```bash
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_REDIRECT_URI=http://localhost:3000/api/auth/yandex/callback
```

---

## Миграция базы данных

После настройки OAuth необходимо обновить структуру базы данных:

```bash
# Подключитесь к вашей PostgreSQL базе данных
psql -U postgres -d poker

# Выполните миграционный скрипт
\i scripts/migrate-oauth.sql
```

Или выполните скрипт вручную:

```bash
psql -U postgres -d poker -f scripts/migrate-oauth.sql
```

---

## Проверка работы

1. Запустите dev-сервер: `npm run dev`
2. Откройте приложение: http://localhost:3000
3. Нажмите кнопку **Войти** или **Регистрация**
4. Попробуйте войти через Google или Яндекс

После успешной авторизации вы будете перенаправлены обратно в приложение с автоматическим входом.

---

## Troubleshooting

### Google OAuth ошибки

**Error: redirect_uri_mismatch**
- Убедитесь, что URL в `.env.local` совпадает с URL в Google Cloud Console
- Проверьте, что нет лишних слешей в конце URL

**Error: access_denied**
- Проверьте, что пользователь подтвердил доступ к своему аккаунту
- Убедитесь, что приложение не находится в тестовом режиме

### Yandex OAuth ошибки

**Error: invalid_client**
- Проверьте правильность `YANDEX_CLIENT_ID` и `YANDEX_CLIENT_SECRET`
- Убедитесь, что Redirect URI указан правильно

**Error: unauthorized_client**
- Проверьте, что приложение активировано в настройках Яндекс OAuth
- Убедитесь, что вы запросили правильные scope (login:email, login:info)

### Общие проблемы

**Токен не сохраняется**
- Проверьте консоль браузера на наличие ошибок JavaScript
- Убедитесь, что localStorage доступен в вашем браузере

**База данных не обновлена**
- Выполните миграционный скрипт `scripts/migrate-oauth.sql`
- Проверьте наличие новых полей в таблице `users`:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users';
  ```

---

## Production Deployment

При деплое на production не забудьте:

1. Обновить Redirect URIs в Google Cloud Console и Yandex OAuth
2. Изменить переменные окружения:
   ```bash
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   YANDEX_REDIRECT_URI=https://yourdomain.com/api/auth/yandex/callback
   ```
3. Убедиться, что JWT_SECRET - это криптографически стойкий ключ
4. Включить HTTPS для вашего домена
