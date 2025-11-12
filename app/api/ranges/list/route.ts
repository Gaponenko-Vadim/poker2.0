import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth/jwt";

/**
 * GET /api/ranges/list
 * Получить список всех наборов диапазонов пользователя
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Неверный токен" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Получаем список наборов (без полных данных JSON для экономии трафика)
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at
       FROM user_range_sets
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("❌ Error fetching range sets list:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при загрузке списка" },
      { status: 500 }
    );
  }
}
