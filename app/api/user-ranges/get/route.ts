import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken } from "@/lib/auth/jwt";

// GET /api/user-ranges/get?tableType=6-max&category=micro&startingStack=100&bounty=false
// Если параметры не указаны, возвращает все наборы пользователя
export async function GET(request: NextRequest) {
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
    console.log('🔍 [GET /api/user-ranges/get] userId из токена:', userId);

    const { searchParams } = new URL(request.url);
    const tableType = searchParams.get("tableType");
    const category = searchParams.get("category");
    const startingStack = searchParams.get("startingStack");
    const bountyParam = searchParams.get("bounty");

    let query: string;
    let params: any[];

    // Если параметры не указаны, возвращаем все наборы
    if (!tableType && !category && !startingStack && !bountyParam) {
      query = `
        SELECT id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
        FROM user_range_sets
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;
      params = [userId];
    } else {
      // Иначе фильтруем по параметрам
      const bounty = bountyParam === "true";
      query = `
        SELECT id, name, table_type, category, starting_stack, bounty, range_data, created_at, updated_at
        FROM user_range_sets
        WHERE user_id = $1
          AND table_type = $2
          AND category = $3
          AND starting_stack = $4
          AND bounty = $5
        ORDER BY updated_at DESC
      `;
      params = [
        userId,
        tableType,
        category,
        parseInt(startingStack || "100"),
        bounty,
      ];
    }

    const result = await pool.query(query, params);
    console.log('🔍 [GET /api/user-ranges/get] Найдено записей:', result.rows.length);

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
