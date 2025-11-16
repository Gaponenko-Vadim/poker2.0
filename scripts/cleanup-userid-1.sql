-- Удаление всех диапазонов, созданных с hardcoded user_id = 1

-- Удаление диапазонов противников
DELETE FROM user_range_sets WHERE user_id = 1;

-- Удаление диапазонов игрока
DELETE FROM player_range_sets WHERE user_id = 1;

-- Проверка результатов
SELECT 'user_range_sets' as table_name, COUNT(*) as remaining_count FROM user_range_sets WHERE user_id = 1
UNION ALL
SELECT 'player_range_sets' as table_name, COUNT(*) as remaining_count FROM player_range_sets WHERE user_id = 1;
