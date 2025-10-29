"use client";

import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  rotateSixMaxTable,
  setSixMaxPlayerStrength,
  setSixMaxPlayerCards,
  setSixMaxPlayerRange,
  setSixMaxPlayerAction,
  PlayerStrength,
  Card,
  PlayerAction,
} from "@/lib/redux/slices/tableSlice";
import { getNextStrength } from "@/lib/utils/playerStrength";

/**
 * Страница турнира 6-Max
 * Отображает стол на 6 игроков с данными из Redux store
 */
export default function SixMaxPage() {
  const dispatch = useAppDispatch();

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.sixMaxUsers);
  const heroIndex = useAppSelector((state) => state.table.sixMaxHeroIndex);

  // Вывод всех пользователей в консоль
  console.log("=== 6-Max Users ===");
  console.log("All users:", users);
  users.forEach((user, index) => {
    console.log(`User ${index}:`, {
      name: user.name,
      stack: user.stack,
      strength: user.strength,
      position: user.position,
    });
  });
  console.log("==================");

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateSixMaxTable());
  };

  // Обработчик переключения силы игрока
  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength);
    dispatch(setSixMaxPlayerStrength({ index, strength: newStrength }));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setSixMaxPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setSixMaxPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setSixMaxPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header showBackButton backUrl="/" title="6-Max Турнир" />

      <main className="container mx-auto px-4 py-8">
        {/* Покерный стол */}
        <section>
          <PokerTable
            users={users}
            tableType="6-max"
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
                    <h4 className="font-bold text-emerald-400">
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
