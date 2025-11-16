import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth/oauth/google';

/**
 * GET /api/auth/google
 * Инициация OAuth авторизации через Google
 * Редиректит пользователя на страницу авторизации Google
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
}
