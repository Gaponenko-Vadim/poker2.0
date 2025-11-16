import { NextRequest, NextResponse } from 'next/server';
import { getYandexAuthUrl } from '@/lib/auth/oauth/yandex';

/**
 * GET /api/auth/yandex
 * Инициация OAuth авторизации через Яндекс
 * Редиректит пользователя на страницу авторизации Яндекса
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = getYandexAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Yandex OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Yandex authentication' },
      { status: 500 }
    );
  }
}
