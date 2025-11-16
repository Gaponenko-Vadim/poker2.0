import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * GET /api/player-ranges/[id]/get
 * Получение конкретного набора диапазонов игрока
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const rangeSetId = parseInt(resolvedParams.id);

    if (isNaN(rangeSetId)) {
      return NextResponse.json(
        { error: "Неверный ID набора" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT * FROM player_range_sets WHERE id = $1 AND user_id = $2`,
      [rangeSetId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Набор диапазонов не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Ошибка при получении набора диапазонов:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
