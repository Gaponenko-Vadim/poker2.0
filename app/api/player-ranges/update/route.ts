import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * PUT /api/player-ranges/update
 * Обновление набора диапазонов игрока (Hero)
 */
export async function PUT(request: NextRequest) {
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
    const { id, name, rangeData } = body;

    // Валидация
    if (typeof id !== 'number' || rangeData === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields (id, rangeData)",
        },
        { status: 400 }
      );
    }

    // Проверяем, принадлежит ли набор пользователю
    const checkQuery = "SELECT id FROM player_range_sets WHERE id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Player range set not found or access denied",
        },
        { status: 404 }
      );
    }

    // Обновляем набор
    const updateFields = ["range_data = $1", "updated_at = CURRENT_TIMESTAMP"];
    const values: unknown[] = [JSON.stringify(rangeData)];
    let paramIndex = 2;

    if (name) {
      updateFields.unshift(`name = $${paramIndex}`);
      values.unshift(name);
      paramIndex++;
    }

    const query = `
      UPDATE player_range_sets
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
    `;

    values.push(id, userId);

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating player range set:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update player range set",
      },
      { status: 500 }
    );
  }
}
