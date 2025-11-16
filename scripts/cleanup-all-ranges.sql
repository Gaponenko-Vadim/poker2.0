-- Полная очистка всех диапазонов из базы данных

-- Удаление всех диапазонов противников
DELETE FROM user_range_sets;

-- Удаление всех диапазонов игрока
DELETE FROM player_range_sets;

-- Сброс auto-increment счетчиков (опционально, если хотите начать с id = 1)
ALTER SEQUENCE user_range_sets_id_seq RESTART WITH 1;
ALTER SEQUENCE player_range_sets_id_seq RESTART WITH 1;

-- Проверка результатов
SELECT 'user_range_sets' as table_name, COUNT(*) as total_records FROM user_range_sets
UNION ALL
SELECT 'player_range_sets' as table_name, COUNT(*) as total_records FROM player_range_sets;

-- Вывод сообщения
SELECT 'Все диапазоны успешно удалены!' as status;
