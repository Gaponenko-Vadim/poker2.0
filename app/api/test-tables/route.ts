import { NextResponse } from "next/server";
import pool from "@/lib/db/connection";

/**
 * GET /api/test-tables
 * Проверка существования таблиц в БД
 */
export async function GET() {
  try {
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
        message: `Найдено таблиц: ${tables.length}`,
        tables,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при проверке таблиц:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}
