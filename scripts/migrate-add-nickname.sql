-- Миграция для добавления поля nickname
-- Выполните этот скрипт для обновления существующей базы данных

-- Добавление поля nickname в таблицу users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

-- Создание индекса для быстрого поиска по никнейму
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Обновление существующих записей - установим nickname = email (до символа @)
UPDATE users
SET nickname = SPLIT_PART(email, '@', 1)
WHERE nickname IS NULL;

-- Комментарий к полю
COMMENT ON COLUMN users.nickname IS 'Отображаемое имя пользователя';
