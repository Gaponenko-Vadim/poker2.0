import { NextRequest, NextResponse } from 'next/server';
import { getYandexAccessToken, getYandexUserInfo } from '@/lib/auth/oauth/yandex';
import { generateToken } from '@/lib/auth/jwt';
import pool from '@/lib/db/connection';

/**
 * GET /api/auth/yandex/callback
 * Обрабатывает callback от Яндекса после авторизации
 * Создает или обновляет пользователя и возвращает JWT токен
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем code из query параметров
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Yandex OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Обмениваем code на access token
    const tokenResponse = await getYandexAccessToken(code);

    // Получаем информацию о пользователе
    const userInfo = await getYandexUserInfo(tokenResponse.access_token);

    if (!userInfo.default_email) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    // Проверяем, существует ли пользователь с таким yandex_id или email
    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE yandex_id = $1 OR email = $2',
      [userInfo.id, userInfo.default_email]
    );

    let userId: number;

    if (existingUserResult.rows.length > 0) {
      // Пользователь существует - обновляем yandex_id если его не было
      const existingUser = existingUserResult.rows[0];
      userId = existingUser.id;

      if (!existingUser.yandex_id) {
        await pool.query(
          'UPDATE users SET yandex_id = $1, provider = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [userInfo.id, 'yandex', userId]
        );
      }
    } else {
      // Создаем нового пользователя
      const insertResult = await pool.query(
        'INSERT INTO users (email, yandex_id, provider) VALUES ($1, $2, $3) RETURNING id',
        [userInfo.default_email, userInfo.id, 'yandex']
      );
      userId = insertResult.rows[0].id;
    }

    // Генерируем JWT токен
    const token = generateToken({ userId, email: userInfo.default_email });

    // Редиректим на главную страницу с токеном
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('email', userInfo.default_email);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Yandex OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
