import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Валидация входных данных
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Неверный формат email" },
        { status: 400 }
      );
    }

    // Валидация пароля
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await hashPassword(password);

    // Создание пользователя
    const result = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Создание дефолтных настроек для игрока
    await pool.query(
      `INSERT INTO player_defaults (user_id, default_range)
       VALUES ($1, $2)`,
      [newUser.id, ["JTo"]] // Дефолтный диапазон
    );

    // Генерация JWT токена
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Возврат успешного ответа
    return NextResponse.json(
      {
        success: true,
        message: "Пользователь успешно зарегистрирован",
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            createdAt: newUser.created_at,
          },
          token,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
