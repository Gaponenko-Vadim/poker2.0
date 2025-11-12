import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth/jwt";

/**
 * DELETE /api/ranges/delete/[id]
 * Удалить набор диапазонов
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const rangeSetId = parseInt(params.id, 10);

    if (isNaN(rangeSetId)) {
      return NextResponse.json(
        { error: "Неверный ID набора" },
        { status: 400 }
      );
    }

    // Удаляем набор с проверкой принадлежности пользователю
    const result = await pool.query(
      `DELETE FROM user_range_sets
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [rangeSetId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Набор не найден или нет доступа" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Набор диапазонов удален",
    });

  } catch (error) {
    console.error("❌ Error deleting range set:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при удалении" },
      { status: 500 }
    );
  }
}
