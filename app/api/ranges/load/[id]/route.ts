import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth/jwt";

/**
 * GET /api/ranges/load/[id]
 * Загрузить полный JSON конкретного набора диапазонов
 */
export async function GET(
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

    // Загружаем полный набор с проверкой принадлежности пользователю
    const result = await pool.query(
      `SELECT id, name, range_data, created_at, updated_at
       FROM user_range_sets
       WHERE id = $1 AND user_id = $2`,
      [rangeSetId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Набор не найден или нет доступа" },
        { status: 404 }
      );
    }

    const rangeSet = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: rangeSet.id,
        name: rangeSet.name,
        rangeData: rangeSet.range_data, // JSONB автоматически парсится
        createdAt: rangeSet.created_at,
        updatedAt: rangeSet.updated_at,
      },
    });

  } catch (error) {
    console.error("❌ Error loading range set:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при загрузке набора" },
      { status: 500 }
    );
  }
}
