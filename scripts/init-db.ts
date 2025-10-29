/**
 * Скрипт для инициализации базы данных
 * Запуск: npm run db:init
 */
import { config } from "dotenv";
import { initDatabase, checkTables } from "../lib/db/init";
import { testConnection } from "../lib/db/connection";

// Загружаем переменные окружения
config();

async function main() {
  console.log("🚀 Запуск инициализации базы данных...\n");

  // Проверка подключения
  const connected = await testConnection();
  if (!connected) {
    console.error("❌ Не удалось подключиться к базе данных");
    console.error("Проверьте настройки в .env.local файле");
    process.exit(1);
  }

  console.log();

  // Инициализация базы данных
  const initialized = await initDatabase();
  if (!initialized) {
    console.error("❌ Не удалось инициализировать базу данных");
    process.exit(1);
  }

  console.log();

  // Проверка созданных таблиц
  await checkTables();

  console.log("\n✅ Инициализация базы данных завершена успешно!");
  process.exit(0);
}

main();
