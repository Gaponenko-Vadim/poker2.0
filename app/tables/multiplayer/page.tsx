"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { UserGroupIcon, PlayIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

/**
 * Страница мультиплеер режима - "Играть с друзьями"
 * Пока заглушка, будет реализована позже
 */
export default function MultiplayerPage() {
  const [isComingSoon] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header
        showBackButton
        backUrl="/"
        title="Играть с друзьями"
      />

      <main className="container mx-auto px-4 py-12">
        {/* Центральный блок "Скоро" */}
        {isComingSoon && (
          <div className="max-w-3xl mx-auto text-center">
            {/* Анимированная иконка */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
              </div>
              <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-2xl shadow-orange-500/50">
                <UserGroupIcon className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Заголовок */}
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">
                Скоро!
              </span>
            </h1>

            <h2 className="text-3xl font-bold text-gray-100 mb-6">
              Мультиплеер режим в разработке
            </h2>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Мы работаем над созданием функционала для игры с друзьями в реальном времени.
              <br />
              Следите за обновлениями!
            </p>

            {/* Декоративная линия */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full"></div>
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full"></div>
            </div>

            {/* Планируемые функции */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-100 mb-6">
                Планируемые возможности
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Создание комнат */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-orange-500/20 hover:border-orange-500/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 mx-auto">
                    <PlayIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-orange-400 mb-2">
                    Создание комнат
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Создавайте приватные игровые комнаты с настраиваемыми параметрами
                  </p>
                </div>

                {/* Приглашение игроков */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-orange-500/20 hover:border-orange-500/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 mx-auto">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-orange-400 mb-2">
                    Игра с друзьями
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Приглашайте друзей по ссылке или коду комнаты
                  </p>
                </div>

                {/* Настройки игры */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-orange-500/20 hover:border-orange-500/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 mx-auto">
                    <Cog6ToothIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-orange-400 mb-2">
                    Настройки
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Гибкие настройки формата игры, блайндов и турнирных параметров
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопка возврата */}
            <div className="mt-12">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Вернуться на главную
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
