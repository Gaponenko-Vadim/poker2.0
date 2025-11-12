import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";

// GET /api/user-ranges/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rangeSetId = parseInt(id);

    if (isNaN(rangeSetId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid range set ID",
        },
        { status: 400 }
      );
    }

    // В реальном приложении получаем user_id из сессии/JWT
    const userId = 1;

    const query = `
      SELECT id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
      FROM user_range_sets
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [rangeSetId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Range set not found or access denied",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching user range set:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch range set",
      },
      { status: 500 }
    );
  }
}
