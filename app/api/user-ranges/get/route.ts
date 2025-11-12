import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";

// GET /api/user-ranges/get?tableType=6-max&category=micro&startingStack=100&bounty=false
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableType = searchParams.get("tableType");
    const category = searchParams.get("category");
    const startingStack = searchParams.get("startingStack");
    const bounty = searchParams.get("bounty") === "true";

    // В реальном приложении получаем user_id из сессии/JWT
    // Пока используем заглушку
    const userId = 1;

    const query = `
      SELECT id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
      FROM user_range_sets
      WHERE user_id = $1
        AND table_type = $2
        AND category = $3
        AND starting_stack = $4
        AND bounty = $5
      ORDER BY updated_at DESC
    `;

    const result = await pool.query(query, [
      userId,
      tableType,
      category,
      parseInt(startingStack || "100"),
      bounty,
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching user range sets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch range sets",
      },
      { status: 500 }
    );
  }
}
