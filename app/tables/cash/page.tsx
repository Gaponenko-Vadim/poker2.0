"use client";

import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  setCashUsersCount,
  rotateCashTable,
  PlayerStrength,
  setCashPlayerStrength,
  setCashPlayerCards,
  setCashPlayerRange,
  setCashPlayerAction,
  Card,
  PlayerAction,
} from "@/lib/redux/slices/tableSlice";
import { getNextStrength } from "@/lib/utils/playerStrength";

/**
 * Страница Cash игры
 * Отображает стол с настраиваемым количеством игроков (от 2 до 9)
 */
export default function CashPage() {
  const dispatch = useAppDispatch();

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.cashUsers);
  const usersCount = useAppSelector((state) => state.table.cashUsersCount);
  const heroIndex = useAppSelector((state) => state.table.cashHeroIndex);

  // Обработчик изменения количества игроков
  const handleUsersCountChange = (count: number) => {
    dispatch(setCashUsersCount(count));
  };

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateCashTable());
  };

  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength);
    dispatch(setCashPlayerStrength({ index, strength: newStrength }));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setCashPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setCashPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setCashPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header showBackButton backUrl="/" title="Cash Игра" />

      <main className="container mx-auto px-4 py-8">
        {/* Информационный блок с селектором */}
        <section className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Кеш-игра</h2>
            <p className="text-gray-400 mb-4">
              Настраиваемый формат игры с возможностью выбора количества игроков
              от 2 до 9.
            </p>

            {/* Селектор количества игроков */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Количество игроков за столом
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="9"
                  value={usersCount}
                  onChange={(e) =>
                    handleUsersCountChange(Number(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-purple-400">
                    {usersCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Быстрый выбор количества игроков */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
                <button
                  key={count}
                  onClick={() => handleUsersCountChange(count)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    usersCount === count
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Игроков за столом</p>
                <p className="text-2xl font-bold text-purple-400">
                  {users.length}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Тип игры</p>
                <p className="text-lg font-semibold text-gray-100">Cash</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Формат</p>
                <p className="text-lg font-semibold text-gray-100">
                  {usersCount <= 6 ? "Short-handed" : "Full Ring"}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Средний стек</p>
                <p className="text-lg font-semibold text-purple-400">
                  {Math.round(
                    users.reduce((acc, u) => acc + u.stack, 0) / users.length
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Покерный стол */}
        <section>
          <PokerTable
            users={users}
            tableType="cash"
            heroIndex={heroIndex}
            onRotateTable={handleRotateTable}
            onTogglePlayerStrength={handleTogglePlayerStrength}
            onCardsChange={handleCardsChange}
            onRangeChange={handleRangeChange}
            onActionChange={handleActionChange}
          />
        </section>

        {/* Панель отладки - отображение всех игроков */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Все игроки за столом (из Redux Store)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user, index) => (
                <div
                  key={index}
                  className={`bg-gray-950 border rounded p-4 ${
                    index === heroIndex
                      ? "border-yellow-400 ring-2 ring-yellow-400/50"
                      : "border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-purple-400">
                      {user.name} ({user.position})
                    </h4>
                    {index === heroIndex && (
                      <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-bold">
                        HERO
                      </span>
                    )}
                  </div>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
