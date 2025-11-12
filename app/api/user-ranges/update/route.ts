import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { UpdateRangeSetRequest } from "@/lib/types/userRanges";

// PUT /api/user-ranges/update
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateRangeSetRequest = await request.json();
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

    // В реальном приложении получаем user_id из сессии/JWT
    const userId = 1;

    // Проверяем, принадлежит ли набор пользователю
    const checkQuery = "SELECT id FROM user_range_sets WHERE id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Range set not found or access denied",
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
      UPDATE user_range_sets
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
    console.error("Error updating user range set:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update range set",
      },
      { status: 500 }
    );
  }
}
