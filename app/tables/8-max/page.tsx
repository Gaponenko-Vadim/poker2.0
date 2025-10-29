"use client";

import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  rotateEightMaxTable,
  setEightMaxPlayerStrength,
  setEightMaxPlayerCards,
  setEightMaxPlayerRange,
  setEightMaxPlayerAction,
  PlayerStrength,
  Card,
  PlayerAction,
} from "@/lib/redux/slices/tableSlice";
import { getNextStrength } from "@/lib/utils/playerStrength";

/**
 * Страница турнира 8-Max
 * Отображает стол на 8 игроков с данными из Redux store
 */
export default function EightMaxPage() {
  const dispatch = useAppDispatch();

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.eightMaxUsers);
  const heroIndex = useAppSelector((state) => state.table.eightMaxHeroIndex);

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateEightMaxTable());
  };

  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength);
    dispatch(setEightMaxPlayerStrength({ index, strength: newStrength }));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setEightMaxPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setEightMaxPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setEightMaxPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header showBackButton backUrl="/" title="8-Max Турнир" />

      <main className="container mx-auto px-4 py-8">
        {/* Информационный блок */}
        <section className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              Турнирный стол 8-Max
            </h2>
            <p className="text-gray-400">
              Анализ игры за полным столом на 8 игроков. Все позиции заняты и
              готовы к игре.
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Игроков за столом</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {users.length}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Тип игры</p>
                <p className="text-lg font-semibold text-gray-100">Турнир</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Формат</p>
                <p className="text-lg font-semibold text-gray-100">8-Max</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Средний стек</p>
                <p className="text-lg font-semibold text-emerald-400">
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
            tableType="8-max"
            heroIndex={heroIndex}
            onRotateTable={handleRotateTable}
            onTogglePlayerStrength={handleTogglePlayerStrength}
            onCardsChange={handleCardsChange}
            onRangeChange={handleRangeChange}
            onActionChange={handleActionChange}
          />
        </section>

        {/* Панель отладки - отображение объекта Hero */}
        <section className="max-w-4xl mx-auto mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Объект Hero (из Redux Store)
            </h3>
            <pre className="bg-gray-950 border border-gray-700 rounded p-4 text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(users[heroIndex], null, 2)}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}
