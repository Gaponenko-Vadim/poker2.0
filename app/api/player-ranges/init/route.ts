import { NextResponse } from "next/server";
import pool from "@/lib/db/connection";

export async function POST() {
  try {
    // Удаляем старую таблицу если существует
    await pool.query(`DROP TABLE IF EXISTS player_ranges CASCADE;`);

    // Создаем таблицу player_range_sets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_range_sets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        table_type VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        starting_stack INTEGER NOT NULL,
        bounty BOOLEAN NOT NULL DEFAULT false,
        range_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создаем индексы
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_player_range_sets_user_id ON player_range_sets(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_player_range_sets_params
      ON player_range_sets(user_id, table_type, category, starting_stack, bounty);
    `);

    return NextResponse.json({
      success: true,
      message: "Таблица player_range_sets успешно создана"
    });
  } catch (error) {
    console.error("Ошибка при создании таблицы player_ranges:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при создании таблицы" },
      { status: 500 }
    );
  }
}
