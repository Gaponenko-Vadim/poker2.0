import Header from '@/components/Header';
import TableCard from '@/components/TableCard';
import {
  UsersIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

/**
 * Главная страница приложения покерной аналитики
 * Отображает приветствие и карточки для выбора типа стола
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-100"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-200"></div>
      </div>

      {/* Шапка сайта */}
      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Герой-секция */}
        <section className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>
          </div>

          <h1 className="text-6xl font-bold text-gray-100 mb-6 relative">
            Добро пожаловать в{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent animate-pulse">
              Poker Analytics
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Профессиональный инструмент для анализа покерных игр и турниров.
            <br />
            <span className="text-emerald-400 font-semibold">
              Выберите тип стола, чтобы начать работу.
            </span>
          </p>

          {/* Декоративные элементы */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full"></div>
          </div>
        </section>

        {/* Карточки выбора типа стола */}
        <section className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Карточка 8-Max Турнир */}
            <TableCard
              title="8-Max Турнир"
              description="Турнирный формат на 8 игроков. Анализируйте позиции, стеки и стратегию игры за полным столом."
              href="/tables/8-max"
              icon={<UsersIcon className="w-12 h-12" />}
              accentColor="emerald"
            />

            {/* Карточка 6-Max Турнир */}
            <TableCard
              title="6-Max Турнир"
              description="Турнирный формат на 6 игроков. Более агрессивная игра с меньшим количеством игроков за столом."
              href="/tables/6-max"
              icon={<TrophyIcon className="w-12 h-12" />}
              accentColor="blue"
            />

            {/* Карточка Cash Игра */}
            <TableCard
              title="Cash Игра"
              description="Кеш-игра с возможностью выбора количества игроков от 2 до 9. Настраиваемый формат игры."
              href="/tables/cash"
              icon={<CurrencyDollarIcon className="w-12 h-12" />}
              accentColor="purple"
            />
          </div>
        </section>

        {/* Дополнительная информация */}
        <section className="mt-16 text-center">
          <div className="max-w-3xl mx-auto relative">
            {/* Фоновое свечение */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-2xl"></div>

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent mb-6">
                Возможности платформы
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="group p-4 rounded-lg bg-gray-800/50 border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">
                    Визуализация
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Интерактивное отображение покерных столов с позициями игроков
                  </p>
                </div>

                <div className="group p-4 rounded-lg bg-gray-800/50 border border-blue-500/20 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">
                    Аналитика
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Инструменты для анализа игровых ситуаций и принятия решений
                  </p>
                </div>

                <div className="group p-4 rounded-lg bg-gray-800/50 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    Гибкость
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Поддержка различных форматов игры и настраиваемые параметры
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
