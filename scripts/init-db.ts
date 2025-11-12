#!/usr/bin/env tsx

import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Загружаем переменные окружения из .env.local
config({ path: join(process.cwd(), ".env.local") });

import pool from "../lib/db/connection";

async function initDatabase() {
  console.log("🚀 Initializing database...");

  try {
    // Тестируем подключение
    const testResult = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful:", testResult.rows[0].now);

    // Читаем SQL файл
    const schemaPath = join(process.cwd(), "lib", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Выполняем SQL
    await pool.query(schema);
    console.log("✅ Database schema initialized successfully");

    // Проверяем таблицы
    const tablesResult = await pool.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("\n📋 Available tables:");
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.tablename}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initDatabase();
