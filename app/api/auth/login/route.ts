import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/connection";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";

/**
 * POST /api/auth/login
 * Вход пользователя в систему
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

    // Поиск пользователя по email
    const result = await pool.query(
      "SELECT id, email, password, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Проверка пароля
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Генерация JWT токена
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Возврат успешного ответа
    return NextResponse.json(
      {
        success: true,
        message: "Вход выполнен успешно",
        data: {
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при входе:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
