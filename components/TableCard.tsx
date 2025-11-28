import Link from 'next/link';
import { ReactNode } from 'react';

interface TableCardProps {
  // Заголовок карточки
  title: string;
  // Описание типа стола
  description: string;
  // URL для перехода
  href: string;
  // Иконка для карточки
  icon: ReactNode;
  // Цвет акцента (для градиента)
  accentColor?: string;
}

/**
 * Компонент карточки типа стола на главной странице
 * Отображает информацию о типе стола и ссылку для перехода
 */
export default function TableCard({
  title,
  description,
  href,
  icon,
  accentColor = 'emerald',
}: TableCardProps) {
  // Генерируем классы для градиента на основе цвета акцента
  const gradientClasses =
    accentColor === 'blue'
      ? 'from-blue-500/10 to-transparent'
      : accentColor === 'purple'
      ? 'from-purple-500/10 to-transparent'
      : accentColor === 'orange'
      ? 'from-orange-500/10 to-transparent'
      : 'from-emerald-500/10 to-transparent';

  const borderClasses =
    accentColor === 'blue'
      ? 'border-blue-500/20 hover:border-blue-500/40'
      : accentColor === 'purple'
      ? 'border-purple-500/20 hover:border-purple-500/40'
      : accentColor === 'orange'
      ? 'border-orange-500/20 hover:border-orange-500/40'
      : 'border-emerald-500/20 hover:border-emerald-500/40';

  const iconClasses =
    accentColor === 'blue'
      ? 'text-blue-400'
      : accentColor === 'purple'
      ? 'text-purple-400'
      : accentColor === 'orange'
      ? 'text-orange-400'
      : 'text-emerald-400';

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border ${borderClasses} bg-gray-900 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-${accentColor}-500/10 hover:-translate-y-1`}
    >
      {/* Градиентный фон */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientClasses} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Содержимое карточки */}
      <div className="relative z-10">
        {/* Иконка */}
        <div className={`mb-4 ${iconClasses}`}>{icon}</div>

        {/* Заголовок */}
        <h3 className="text-xl font-bold text-gray-100 mb-2">{title}</h3>

        {/* Описание */}
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>

        {/* Стрелка для перехода */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
          <span>Перейти</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
