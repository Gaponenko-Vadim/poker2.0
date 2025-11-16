-- Создание таблицы users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Nullable для OAuth пользователей
    provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'yandex'
    google_id VARCHAR(255) UNIQUE, -- Google user ID
    yandex_id VARCHAR(255) UNIQUE, -- Yandex user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_yandex_id ON users(yandex_id);

-- Создание таблицы для дефолтных диапазонов игроков
CREATE TABLE IF NOT EXISTS player_defaults (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    default_range TEXT[] DEFAULT ARRAY['JTo'], -- Дефолтный диапазон
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Удаляем старую таблицу если существует (для обновления схемы)
DROP TABLE IF EXISTS user_range_sets CASCADE;

-- Создание таблицы для пользовательских наборов диапазонов
CREATE TABLE IF NOT EXISTS user_range_sets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    table_type VARCHAR(20) NOT NULL, -- Тип стола (6-max, 8-max, cash)
    category VARCHAR(50) NOT NULL, -- Категория турнира (micro, low, mid, high)
    starting_stack INTEGER NOT NULL, -- Начальный стек (100 или 200 BB)
    bounty BOOLEAN NOT NULL DEFAULT false, -- С баунти или нет
    range_data JSONB NOT NULL, -- Полная структура диапазонов в формате tournamentRanges.json (включает все стадии)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_range_sets_user_id ON user_range_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_range_sets_params ON user_range_sets(user_id, table_type, category, starting_stack, bounty);

-- Создание таблицы для наборов диапазонов игрока (Hero)
CREATE TABLE IF NOT EXISTS player_range_sets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    table_type VARCHAR(20) NOT NULL, -- Тип стола (6-max, 8-max, cash)
    category VARCHAR(50) NOT NULL, -- Категория турнира (micro, low, mid, high)
    starting_stack INTEGER NOT NULL, -- Начальный стек (100 или 200 BB)
    bounty BOOLEAN NOT NULL DEFAULT false, -- С баунти или нет
    range_data JSONB NOT NULL, -- Структура: ranges.user.stages.{stage}.positions.{position}.{against_style}.ranges_by_stack.{stackSize}.{action}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_player_range_sets_user_id ON player_range_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_player_range_sets_params ON player_range_sets(user_id, table_type, category, starting_stack, bounty);

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON TABLE player_defaults IS 'Дефолтные настройки для игроков (диапазоны)';
COMMENT ON TABLE user_range_sets IS 'Пользовательские наборы диапазонов рук противников (полные JSON структуры)';
COMMENT ON TABLE player_range_sets IS 'Наборы диапазонов игрока (Hero) против разных стилей противников (полные JSON структуры)';
