"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface RegistrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (token: string, email: string, nickname: string) => void;
  onSwitchToLogin?: () => void;
}

export default function RegistrationPopup({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: RegistrationPopupProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!email || !nickname || !password || !confirmPassword) {
      setError("Все поля обязательны для заполнения");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, nickname, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при регистрации");
      }

      // Сохраняем токен в localStorage
      localStorage.setItem("authToken", data.data.token);
      localStorage.setItem("userEmail", data.data.user.email);
      localStorage.setItem("userNickname", data.data.user.nickname);

      setSuccess(true);
      setError("");

      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess(data.data.token, data.data.user.email, data.data.user.nickname);
      }

      // Закрываем попап через 1.5 секунды
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail("");
        setNickname("");
        setPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setNickname("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-700">
        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Заголовок */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Регистрация</h2>
          <p className="text-gray-400 text-sm">
            Создайте аккаунт для доступа к покерной аналитике
          </p>
        </div>

        {/* Сообщения об успехе/ошибке */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-400 text-sm">
              ✅ Регистрация успешна! Добро пожаловать!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
              disabled={loading || success}
            />
          </div>

          {/* Никнейм */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Никнейм
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Как вас называть?"
              disabled={loading || success}
            />
          </div>

          {/* Пароль */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Минимум 6 символов"
              disabled={loading || success}
            />
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Повторите пароль"
              disabled={loading || success}
            />
          </div>

          {/* Кнопка регистрации */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading
              ? "Регистрация..."
              : success
              ? "✓ Готово!"
              : "Создать аккаунт"}
          </button>
        </form>

        {/* Разделитель */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400">
              или зарегистрируйтесь через
            </span>
          </div>
        </div>

        {/* OAuth кнопки */}
        <div className="space-y-3">
          {/* Google */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Войти через Google</span>
          </a>

          {/* Яндекс */}
          <a
            href="/api/auth/yandex"
            className="flex items-center justify-center gap-3 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 18h-2.25v-6.75h-1.5L10.5 18H8.25l2.625-7.125H9V9h6v1.875h-1.875L15.75 18h.75z" />
            </svg>
            <span>Войти через Яндекс</span>
          </a>
        </div>

        {/* Переключение на вход */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Уже есть аккаунт?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Войти
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
