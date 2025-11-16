-- Миграция для добавления таблицы player_ranges

-- Создание таблицы для диапазонов игрока (Hero)
CREATE TABLE IF NOT EXISTS player_ranges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(20) NOT NULL, -- BTN, SB, BB, UTG, UTG+1, MP, HJ, CO
    against_style VARCHAR(20) NOT NULL, -- tight, balanced, aggressor
    stack_size VARCHAR(20) NOT NULL, -- very_short, short, medium, big
    action VARCHAR(50) NOT NULL, -- open_raise, 3bet, 4bet, etc.
    range_data TEXT[] NOT NULL, -- Массив рук ["AA", "AKs", "JTo"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, position, against_style, stack_size, action)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_player_ranges_user_id ON player_ranges(user_id);
CREATE INDEX IF NOT EXISTS idx_player_ranges_params ON player_ranges(user_id, position, against_style, stack_size, action);

-- Комментарий к таблице
COMMENT ON TABLE player_ranges IS 'Диапазоны игрока (Hero) против разных стилей противников';
