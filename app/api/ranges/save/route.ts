import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth/jwt";
import { validateRangeData, RangeDataJSON } from "@/lib/utils/rangeDataManager";

/**
 * POST /api/ranges/save
 * Сохранить или обновить набор диапазонов
 */
export async function POST(request: NextRequest) {
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

    // Парсим тело запроса
    const body = await request.json();
    const { id, name, rangeData } = body;

    // Валидация
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Название набора обязательно" },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Название слишком длинное (максимум 255 символов)" },
        { status: 400 }
      );
    }

    if (!rangeData || !validateRangeData(rangeData)) {
      return NextResponse.json(
        { error: "Неверная структура данных диапазонов" },
        { status: 400 }
      );
    }

    // Если передан ID - обновляем существующий набор
    if (id) {
      const updateResult = await pool.query(
        `UPDATE user_range_sets
         SET name = $1, range_data = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4
         RETURNING id, name, created_at, updated_at`,
        [name, JSON.stringify(rangeData), id, userId]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Набор не найден или нет доступа" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Набор диапазонов обновлен",
        data: updateResult.rows[0],
      });
    }

    // Иначе создаем новый набор
    const insertResult = await pool.query(
      `INSERT INTO user_range_sets (user_id, name, range_data)
       VALUES ($1, $2, $3)
       RETURNING id, name, created_at, updated_at`,
      [userId, name, JSON.stringify(rangeData)]
    );

    return NextResponse.json({
      success: true,
      message: "Набор диапазонов создан",
      data: insertResult.rows[0],
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error saving range set:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при сохранении" },
      { status: 500 }
    );
  }
}
