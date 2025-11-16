import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, getGoogleUserInfo } from '@/lib/auth/oauth/google';
import { generateToken } from '@/lib/auth/jwt';
import pool from '@/lib/db/connection';

/**
 * GET /api/auth/google/callback
 * Обрабатывает callback от Google после авторизации
 * Создает или обновляет пользователя и возвращает JWT токен
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем code из query параметров
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Обмениваем code на access token
    const tokenResponse = await getGoogleAccessToken(code);

    // Получаем информацию о пользователе
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

    if (!userInfo.email || !userInfo.verified_email) {
      return NextResponse.redirect(new URL('/?error=email_not_verified', request.url));
    }

    // Проверяем, существует ли пользователь с таким google_id или email
    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [userInfo.id, userInfo.email]
    );

    let userId: number;

    if (existingUserResult.rows.length > 0) {
      // Пользователь существует - обновляем google_id если его не было
      const existingUser = existingUserResult.rows[0];
      userId = existingUser.id;

      if (!existingUser.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, provider = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [userInfo.id, 'google', userId]
        );
      }
    } else {
      // Создаем нового пользователя
      const insertResult = await pool.query(
        'INSERT INTO users (email, google_id, provider) VALUES ($1, $2, $3) RETURNING id',
        [userInfo.email, userInfo.id, 'google']
      );
      userId = insertResult.rows[0].id;
    }

    // Генерируем JWT токен
    const token = generateToken({ userId, email: userInfo.email });

    // Редиректим на главную страницу с токеном
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('email', userInfo.email);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
