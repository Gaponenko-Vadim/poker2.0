import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { CreateRangeSetRequest } from "@/lib/types/userRanges";

// POST /api/user-ranges/create
export async function POST(request: NextRequest) {
  try {
    const body: CreateRangeSetRequest = await request.json();
    const { name, tableType, category, startingStack, bounty, rangeData } = body;

    // Валидация
    if (
      !name?.trim() ||
      !tableType ||
      !category ||
      typeof startingStack !== 'number' ||
      typeof bounty !== 'boolean' ||
      rangeData === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // В реальном приложении получаем user_id из сессии/JWT
    const userId = 1;

    const query = `
      INSERT INTO user_range_sets (user_id, name, table_type, category, starting_stack, bounty, range_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
    `;

    const result = await pool.query(query, [
      userId,
      name,
      tableType,
      category,
      startingStack,
      bounty,
      JSON.stringify(rangeData),
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating user range set:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create range set",
      },
      { status: 500 }
    );
  }
}
