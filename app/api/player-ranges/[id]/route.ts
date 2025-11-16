import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * DELETE /api/player-ranges/[id]
 * Удаление диапазона игрока
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем токен
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(authHeader.replace("Bearer ", ""));
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Неверный токен" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const rangeId = parseInt(resolvedParams.id);
    if (isNaN(rangeId)) {
      return NextResponse.json(
        { error: "Неверный ID диапазона" },
        { status: 400 }
      );
    }

    // Удаляем набор диапазонов (только если принадлежит пользователю)
    const result = await pool.query(
      `DELETE FROM player_range_sets
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [rangeId, decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Набор диапазонов не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Набор диапазонов успешно удален"
    });
  } catch (error) {
    console.error("Ошибка при удалении диапазона игрока:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
