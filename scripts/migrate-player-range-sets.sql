-- Миграция для изменения структуры диапазонов игрока

-- Удаляем старую таблицу player_ranges если существует
DROP TABLE IF EXISTS player_ranges CASCADE;

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

-- Комментарий к таблице
COMMENT ON TABLE player_range_sets IS 'Наборы диапазонов игрока (Hero) против разных стилей противников (полные JSON структуры)';
