import { Pool } from "pg";

// Создаем пул подключений к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  database: process.env.DB_NAME || "poker",
  max: 20, // Максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // Закрывать неактивные подключения через 30 секунд
  connectionTimeoutMillis: 2000, // Таймаут подключения 2 секунды
});

// Обработка ошибок подключения
pool.on("error", (err) => {
  console.error("Неожиданная ошибка подключения к БД:", err);
  process.exit(-1);
});

// Функция для проверки подключения
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Успешное подключение к PostgreSQL");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Ошибка подключения к PostgreSQL:", error);
    return false;
  }
}

// Экспортируем пул для использования в других файлах
export default pool;
