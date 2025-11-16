import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * GET /api/player-ranges/get
 * Получение всех наборов диапазонов игрока для текущего пользователя
 */
export async function GET(request: NextRequest) {
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
    console.log('🔍 [GET /api/player-ranges/get] userId из токена:', userId);

    // Фильтры из query параметров (опционально)
    const { searchParams } = new URL(request.url);
    const tableType = searchParams.get("tableType");
    const category = searchParams.get("category");
    const startingStack = searchParams.get("startingStack");
    const bounty = searchParams.get("bounty");

    // Строим запрос с фильтрацией по user_id
    let query = `SELECT id, name, table_type, category, starting_stack, bounty, created_at, updated_at
       FROM player_range_sets
       WHERE user_id = $1`;
    const params: any[] = [userId];

    if (tableType) {
      params.push(tableType);
      query += ` AND table_type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (startingStack) {
      params.push(parseInt(startingStack));
      query += ` AND starting_stack = $${params.length}`;
    }

    if (bounty !== null && bounty !== undefined) {
      params.push(bounty === "true");
      query += ` AND bounty = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    console.log('🔍 [GET /api/player-ranges/get] Найдено записей:', result.rows.length);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Ошибка при получении диапазонов игрока:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
