import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * POST /api/player-ranges
 * Создание набора диапазонов игрока
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Неверный токен" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    const body = await request.json();
    const { name, tableType, startingStack, category, bounty, rangeData } = body;

    // Валидация
    if (!name || !tableType || !startingStack || !category || rangeData === undefined) {
      return NextResponse.json(
        { error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    // Сохраняем набор диапазонов в базу данных
    const result = await pool.query(
      `INSERT INTO player_range_sets (user_id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name, tableType, category, startingStack, bounty || false, JSON.stringify(rangeData)]
    );

    return NextResponse.json({
      success: true,
      message: "Набор диапазонов успешно создан",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Ошибка при создании набора диапазонов игрока:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
