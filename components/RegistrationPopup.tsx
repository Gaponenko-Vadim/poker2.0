"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface RegistrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (token: string, email: string) => void;
  onSwitchToLogin?: () => void;
}

export default function RegistrationPopup({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: RegistrationPopupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!email || !password || !confirmPassword) {
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при регистрации");
      }

      // Сохраняем токен в localStorage
      localStorage.setItem("authToken", data.data.token);
      localStorage.setItem("userEmail", data.data.user.email);

      setSuccess(true);
      setError("");

      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess(data.data.token, data.data.user.email);
      }

      // Закрываем попап через 1.5 секунды
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail("");
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
            {loading ? "Регистрация..." : success ? "✓ Готово!" : "Создать аккаунт"}
          </button>
        </form>

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
