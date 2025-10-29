import { User, PlayerStrength, Card, PlayerAction } from "@/lib/redux/slices/tableSlice";
import PlayerSeat from "./PlayerSeat";

interface PokerTableProps {
  users: User[]; // Массив игроков
  tableType: "6-max" | "8-max" | "cash";
  heroIndex: number; // Индекс Hero в массиве users
  onRotateTable?: () => void; // Вращение стола (изменение heroIndex)
  onTogglePlayerStrength: (
    index: number,
    currentStrength: PlayerStrength
  ) => void; // Переключение силы игрока
  onCardsChange: (index: number, cards: [Card | null, Card | null]) => void; // Изменение карт игрока
  onRangeChange: (index: number, range: string[]) => void; // Изменение диапазона игрока
  onActionChange: (index: number, action: PlayerAction | null) => void; // Изменение действия игрока
}

export default function PokerTable({
  users,
  tableType,
  heroIndex,
  onRotateTable,
  onTogglePlayerStrength,
  onCardsChange,
  onRangeChange,
  onActionChange,
}: PokerTableProps) {
  const tableColors = {
    "6-max": {
      felt: "from-emerald-700 via-emerald-600 to-emerald-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-blue-400",
      borderColor: "border-blue-400",
    },
    "8-max": {
      felt: "from-green-700 via-green-600 to-green-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-emerald-400",
      borderColor: "border-emerald-400",
    },
    cash: {
      felt: "from-teal-700 via-teal-600 to-teal-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-purple-400",
      borderColor: "border-purple-400",
    },
  };

  const colors = tableColors[tableType];

  // Игроки теперь фиксированы на своих визуальных позициях

  // Координаты для позиций на столе
  const getPositionCoordinates = (index: number) => {
    if (tableType === "6-max") {
      const coords = [
        { left: "50%", top: "112%", transform: "translate(-50%, -50%)" }, // Hero (низ)
        { left: "0%", top: "100%", transform: "translate(-50%, -50%)" }, // 1 (левый низ)
        { left: "0%", top: "8%", transform: "translate(-50%, -50%)" }, // 2 (левый верх)
        { left: "50%", top: "-4%", transform: "translate(-50%, -50%)" }, // 3 (верх)
        { left: "101%", top: "10%", transform: "translate(-50%, -50%)" }, // 4 (правый верх)
        { left: "100%", top: "100%", transform: "translate(-50%, -50%)" }, // 5 (правый низ)
      ];
      return coords[index];
    } else {
      const coords = [
        { left: "50%", top: "112%", transform: "translate(-50%, -50%)" }, // Hero (низ)
        { left: "10%", top: "112%", transform: "translate(-50%, -50%)" }, // 1 (левый низ)
        { left: "-3%", top: "50%", transform: "translate(-50%, -50%)" }, // 2 (левый)
        { left: "9%", top: "-3%", transform: "translate(-50%, -50%)" }, // 3 (левый верх)
        { left: "50%", top: "-4%", transform: "translate(-50%, -50%)" }, // 4 (верх)
        { left: "93%", top: "-2%", transform: "translate(-50%, -50%)" }, // 5 (правый верх)
        { left: "104%", top: "50%", transform: "translate(-50%, -50%)" }, // 6 (правый)
        { left: "93%", top: "110%", transform: "translate(-50%, -50%)" }, // 7 (правый низ)
        { left: "90%", top: "112%", transform: "translate(-50%, -50%)" }, // 8 (правый низ 2)
      ];
      return coords[index];
    }
  };

  // Обработчик клика на Hero - вращение стола
  const handleHeroClick = () => {
    if (onRotateTable) {
      onRotateTable();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <div className="relative w-full h-[500px]">
        {/* Деревянный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 rounded-3xl"></div>

        {/* Тень под столом */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[92%] h-[85%] rounded-[120px] bg-black/40 blur-2xl"></div>
        </div>

        {/* Покерный стол */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {/* Чёрный бортик */}
          <div
            className={`relative w-full h-full rounded-[120px] bg-gradient-to-br ${colors.rail} shadow-2xl`}
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="absolute inset-0 rounded-[120px] shadow-inner opacity-60"></div>

            {/* Зелёный фетр */}
            <div className="absolute inset-0 p-6 flex items-center justify-center">
              <div
                className={`relative w-full h-full rounded-[100px] bg-gradient-to-br ${colors.felt} shadow-inner`}
                style={{
                  boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Текстура фетра */}
                <div
                  className="absolute inset-0 rounded-[100px] opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, transparent 0%, rgba(0,0,0,0.1) 100%)",
                  }}
                ></div>

                {/* Центральный текст */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white/20 text-4xl font-bold tracking-widest mb-2">
                      POKER
                    </p>
                    <p
                      className={`${colors.positionColor} opacity-30 text-sm font-semibold tracking-wider`}
                    >
                      {tableType === "6-max"
                        ? "6-MAX"
                        : tableType === "8-max"
                        ? "8-MAX"
                        : "CASH GAME"}
                    </p>
                  </div>
                </div>

                {/* Игроки */}
                {users.map((user, index) => {
                  const coords = getPositionCoordinates(index);

                  // Пропускаем если нет координат (для cash > 8 игроков)
                  if (!coords) return null;

                  const isHero = index === heroIndex;

                  // Получаем массив всех действий игроков
                  const allPlayersActions = users.map((u) => u.action);

                  return (
                    <PlayerSeat
                      key={index}
                      user={user}
                      position={coords}
                      isHero={isHero}
                      onHeroClick={handleHeroClick}
                      onToggleStrength={() =>
                        onTogglePlayerStrength(index, user.strength)
                      }
                      onCardsChange={
                        isHero
                          ? (cards) => onCardsChange(index, cards)
                          : undefined
                      }
                      onRangeChange={
                        !isHero
                          ? (range) => onRangeChange(index, range)
                          : undefined
                      }
                      onActionChange={(action) => onActionChange(index, action)}
                      allPlayersActions={allPlayersActions}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
