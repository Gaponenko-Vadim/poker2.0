import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Хеширование пароля
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверка пароля
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Валидация пароля
 * Минимум 6 символов
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 6) {
    return {
      valid: false,
      error: "Пароль должен содержать минимум 6 символов",
    };
  }

  return { valid: true };
}
