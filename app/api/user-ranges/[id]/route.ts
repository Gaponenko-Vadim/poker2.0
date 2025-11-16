import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

// GET /api/user-ranges/[id]
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

// DELETE /api/user-ranges/[id]
export async function DELETE(
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

    const query = `
      DELETE FROM user_range_sets
      WHERE id = $1 AND user_id = $2
      RETURNING id
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
      message: "Range set deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user range set:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete range set",
      },
      { status: 500 }
    );
  }
}
