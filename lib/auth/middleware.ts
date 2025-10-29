import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader, JWTPayload } from "./jwt";

/**
 * Middleware для проверки JWT токена
 * Использование в API routes:
 *
 * const authResult = await authMiddleware(request);
 * if (authResult.error) {
 *   return authResult.response;
 * }
 * const user = authResult.user;
 */
export async function authMiddleware(request: NextRequest): Promise<{
  user?: JWTPayload;
  error?: boolean;
  response?: NextResponse;
}> {
  try {
    // Извлечение токена из заголовка Authorization
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        error: true,
        response: NextResponse.json(
          { error: "Токен не предоставлен" },
          { status: 401 }
        ),
      };
    }

    // Проверка токена
    const payload = verifyToken(token);

    if (!payload) {
      return {
        error: true,
        response: NextResponse.json(
          { error: "Недействительный или истекший токен" },
          { status: 401 }
        ),
      };
    }

    // Возврат данных пользователя
    return {
      user: payload,
    };
  } catch (error) {
    console.error("Ошибка в authMiddleware:", error);
    return {
      error: true,
      response: NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Вспомогательная функция для защищенных роутов
 * Пример использования:
 *
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (user) => {
 *     // Ваша логика с доступом к user
 *     return NextResponse.json({ data: "protected data" });
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authMiddleware(request);

  if (authResult.error) {
    return authResult.response!;
  }

  return handler(authResult.user!);
}
