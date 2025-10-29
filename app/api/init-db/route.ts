import { NextResponse } from "next/server";
import pool from "@/lib/db/connection";

/**
 * POST /api/init-db
 * Инициализация базы данных (создание таблиц)
 */
export async function POST() {
  try {
    // SQL для создания таблиц
    const schema = `
      -- Создание таблицы users
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Создание индекса для быстрого поиска по email
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- Создание таблицы для дефолтных диапазонов игроков
      CREATE TABLE IF NOT EXISTS player_defaults (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          default_range TEXT[] DEFAULT ARRAY['JTo'],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Выполняем SQL
    await pool.query(schema);

    // Проверяем созданные таблицы
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows.map(r => r.table_name);

    return NextResponse.json(
      {
        success: true,
        message: "✅ База данных успешно инициализирована",
        tables,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при инициализации БД:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}
