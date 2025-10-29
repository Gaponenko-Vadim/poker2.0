import pool from "./connection";
import fs from "fs";
import path from "path";

/**
 * Инициализация базы данных
 * Читает и выполняет SQL-скрипт schema.sql
 */
export async function initDatabase() {
  try {
    console.log("🔄 Инициализация базы данных...");

    // Читаем SQL-скрипт
    const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Выполняем SQL-скрипт
    await pool.query(schema);

    console.log("✅ База данных успешно инициализирована");
    return true;
  } catch (error) {
    console.error("❌ Ошибка при инициализации базы данных:", error);
    return false;
  }
}

/**
 * Проверка существования таблиц
 */
export async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log("📋 Существующие таблицы:", result.rows.map(r => r.table_name));
    return result.rows;
  } catch (error) {
    console.error("❌ Ошибка при проверке таблиц:", error);
    return [];
  }
}
