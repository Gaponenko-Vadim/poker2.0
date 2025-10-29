import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db/connection";

/**
 * GET /api/test-db
 * Тестовый endpoint для проверки подключения к БД
 */
export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json(
        {
          success: true,
          message: "✅ База данных подключена успешно",
          env: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "❌ Не удалось подключиться к базе данных",
          env: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Ошибка при тестировании БД:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}
