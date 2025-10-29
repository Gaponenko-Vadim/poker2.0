# Настройка базы данных PostgreSQL

## Шаг 1: Установка PostgreSQL

Если PostgreSQL еще не установлен:
1. Скачайте PostgreSQL с https://www.postgresql.org/download/
2. Установите PostgreSQL
3. Запомните пароль для пользователя `postgres`

## Шаг 2: Запуск PostgreSQL

Убедитесь, что сервер PostgreSQL запущен:
- **Windows**: Откройте "Службы" (services.msc) и найдите "postgresql-x64-XX". Убедитесь, что служба запущена.
- **Другие ОС**: Проверьте статус службы через команду `pg_ctl status`

## Шаг 3: Создание базы данных

Откройте командную строку или psql и выполните:

```sql
CREATE DATABASE poker;
```

Или через командную строку Windows:
```bash
psql -U postgres -c "CREATE DATABASE poker;"
```

## Шаг 4: Проверка настроек

Убедитесь, что файл `.env` содержит правильные настройки:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ВАШ_ПАРОЛЬ
DB_NAME=poker
```

## Шаг 5: Инициализация схемы

Вариант 1: Через npm скрипт (рекомендуется)
```bash
npm run db:init
```

Вариант 2: Вручную через psql
```bash
psql -U postgres -d poker -f lib/db/schema.sql
```

## Проверка подключения

Попробуйте подключиться к базе данных:
```bash
psql -U postgres -d poker
```

Если подключение успешно, вы должны увидеть приглашение psql.

## Частые проблемы

### 1. "client password must be a string"
- Убедитесь, что пароль в .env правильный
- Попробуйте изменить пароль пользователя postgres:
  ```bash
  psql -U postgres
  ALTER USER postgres WITH PASSWORD 'новый_пароль';
  ```

### 2. "Connection refused"
- PostgreSQL не запущен - запустите службу
- Проверьте порт - по умолчанию 5432

### 3. "database does not exist"
- Создайте базу данных: `CREATE DATABASE poker;`
