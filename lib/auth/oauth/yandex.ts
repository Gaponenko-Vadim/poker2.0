/**
 * Утилиты для работы с Яндекс OAuth 2.0
 */

export interface YandexTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export interface YandexUserInfo {
  id: string;
  login: string;
  client_id: string;
  display_name: string;
  real_name: string;
  first_name: string;
  last_name: string;
  sex: string;
  default_email: string;
  emails: string[];
  default_avatar_id: string;
  is_avatar_empty: boolean;
}

/**
 * Генерирует URL для редиректа на страницу авторизации Яндекса
 */
export function getYandexAuthUrl(): string {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const redirectUri = process.env.YANDEX_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Yandex OAuth credentials are not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'login:email login:info'
  });

  return `https://oauth.yandex.ru/authorize?${params.toString()}`;
}

/**
 * Обменивает authorization code на access token
 */
export async function getYandexAccessToken(code: string): Promise<YandexTokenResponse> {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;
  const redirectUri = process.env.YANDEX_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Yandex OAuth credentials are not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
  });

  const response = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  return response.json();
}

/**
 * Получает информацию о пользователе Яндекса
 */
export async function getYandexUserInfo(accessToken: string): Promise<YandexUserInfo> {
  const response = await fetch('https://login.yandex.ru/info', {
    headers: {
      Authorization: `OAuth ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return response.json();
}
