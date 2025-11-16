-- Полная очистка всех данных из базы (пользователи и диапазоны)

-- Удаление всех диапазонов противников
DELETE FROM user_range_sets;

-- Удаление всех диапазонов игрока
DELETE FROM player_range_sets;

-- Удаление всех пользователей
DELETE FROM users;

-- Сброс auto-increment счетчиков
ALTER SEQUENCE user_range_sets_id_seq RESTART WITH 1;
ALTER SEQUENCE player_range_sets_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Проверка результатов
SELECT 'users' as table_name, COUNT(*) as total_records FROM users
UNION ALL
SELECT 'user_range_sets' as table_name, COUNT(*) as total_records FROM user_range_sets
UNION ALL
SELECT 'player_range_sets' as table_name, COUNT(*) as total_records FROM player_range_sets;

-- Вывод сообщения
SELECT 'Все данные (пользователи и диапазоны) успешно удалены!' as status;
