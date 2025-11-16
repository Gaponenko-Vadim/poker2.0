'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { login, logout, restoreSession } from '@/lib/redux/slices/authSlice';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import RegistrationPopup from './RegistrationPopup';
import LoginPopup from './LoginPopup';

interface HeaderProps {
  // Показывать ли кнопку "Назад"
  showBackButton?: boolean;
  // URL для кнопки "Назад"
  backUrl?: string;
  // Заголовок страницы (опционально)
  title?: string;
  // Callback при клике на профиль пользователя
  onProfileClick?: () => void;
}

/**
 * Компонент шапки сайта
 * Отображает название сайта, опциональную кнопку "Назад" и кнопку входа/выхода
 */
export default function Header({
  showBackButton = false,
  backUrl = '/',
  title,
  onProfileClick,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Восстановление сессии из localStorage при загрузке
  useEffect(() => {
    // Проверяем URL параметры на наличие токена из OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlEmail = urlParams.get('email');

    if (urlToken && urlEmail) {
      // Сохраняем токен из OAuth
      localStorage.setItem('authToken', urlToken);
      localStorage.setItem('userEmail', urlEmail);
      dispatch(login({ token: urlToken, email: urlEmail }));

      // Очищаем URL от параметров
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Иначе пытаемся восстановить из localStorage
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');

    if (token && email) {
      dispatch(restoreSession({ token, email }));
    }
  }, [dispatch]);

  // Обработчик успешной аутентификации
  const handleAuthSuccess = (token: string, email: string) => {
    dispatch(login({ token, email }));
  };

  // Обработчик клика по кнопке входа/выхода
  const handleAuthClick = () => {
    if (isAuthenticated) {
      dispatch(logout());
    } else {
      setIsLoginOpen(true);
    }
  };

  // Переключение между попапами
  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <header className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-emerald-500/30 shadow-lg">
      {/* Декоративный градиент сверху */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>

      {/* Анимированные блики */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-100"></div>

      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Левая часть: кнопка "Назад" или название */}
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <Link
                href={backUrl}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Назад</span>
              </Link>
            ) : (
              <Link href="/" className="group flex items-center gap-2">
                <div className="relative">
                  <SparklesIcon className="w-8 h-8 text-emerald-400 animate-pulse" />
                  <div className="absolute inset-0 blur-lg bg-emerald-400 opacity-50"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-emerald-500 transition-all">
                  Poker Analytics
                </span>
              </Link>
            )}
            {/* Заголовок страницы, если передан */}
            {title && (
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>
            )}
          </div>

          {/* Правая часть: навигация, информация о пользователе и кнопка входа */}
          <div className="flex items-center gap-4">
            {/* Навигационная ссылка на магазин */}
            <Link
              href="/shop"
              className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/50 font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/20"
            >
              Магазин диапазонов
            </Link>

            {isAuthenticated && user && (
              <button
                onClick={onProfileClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-emerald-500/30 hover:border-emerald-400 hover:bg-gray-700/50 transition-all cursor-pointer"
                title="Настройки профиля"
              >
                <UserCircleIcon className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-medium text-gray-300">{user.email}</span>
              </button>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="px-4 py-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Регистрация
              </button>
            )}
            <button
              onClick={handleAuthClick}
              className="group relative px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105"
            >
              {/* Эффект свечения */}
              <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">{isAuthenticated ? 'Выйти' : 'Войти'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Попапы аутентификации */}
      <LoginPopup
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={switchToRegister}
      />
      <RegistrationPopup
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={switchToLogin}
      />
    </header>
  );
}
