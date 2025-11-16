-- Миграция для добавления поддержки OAuth
-- Выполните этот скрипт для обновления существующей базы данных

-- Добавление новых полей в таблицу users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS yandex_id VARCHAR(255);

-- Изменение поля password - делаем его необязательным
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Создание индексов для OAuth идентификаторов
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_yandex_id ON users(yandex_id);

-- Добавление уникальных constraints
ALTER TABLE users ADD CONSTRAINT unique_google_id UNIQUE (google_id);
ALTER TABLE users ADD CONSTRAINT unique_yandex_id UNIQUE (yandex_id);

-- Обновление комментариев к таблице
COMMENT ON COLUMN users.provider IS 'Провайдер аутентификации: local, google, yandex';
COMMENT ON COLUMN users.google_id IS 'Уникальный идентификатор пользователя Google';
COMMENT ON COLUMN users.yandex_id IS 'Уникальный идентификатор пользователя Яндекс';
