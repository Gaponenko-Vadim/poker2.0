import { useState } from "react";
import { User, Card, PlayerAction } from "@/lib/redux/slices/tableSlice";
import PlayerStrength from "./PlayerStrength";
import PlayerPlayStyle from "./PlayerPlayStyle";
import PlayerStackSize from "./PlayerStackSize";
import CardSelector from "./CardSelector";
import RangeSelector from "./RangeSelector";
import PlayerActionDropdown from "./PlayerActionDropdown";

interface PlayerSeatProps {
  user: User;
  position: { left: string; top: string; transform: string };
  isHero?: boolean;
  onHeroClick?: () => void;
  autoAllIn?: boolean; // Глобальная настройка автоматического all-in для всех игроков
  onToggleAutoAllIn?: (value: boolean) => void; // Функция для включения глобальной настройки autoAllIn
  onToggleStrength: () => void; // Функция для переключения силы игрока
  onTogglePlayStyle: () => void; // Функция для переключения стиля игры
  onToggleStackSize: () => void; // Функция для переключения размера стека
  onCardsChange?: (cards: [Card | null, Card | null]) => void; // Функция для изменения карт (опциональная)
  onRangeChange?: (range: string[]) => void; // Функция для изменения диапазона (опциональная)
  onActionChange?: (action: PlayerAction | null) => void; // Функция для изменения действия (опциональная)
  onBetChange?: (bet: number) => void; // Функция для изменения ставки (опциональная)
  allPlayersActions: (PlayerAction | null)[]; // Действия всех игроков за столом
  allPlayersBets: number[]; // Ставки всех игроков за столом
  openRaiseSize?: number; // Размер open raise в BB
  threeBetMultiplier?: number; // Множитель для 3-bet
  fourBetMultiplier?: number; // Множитель для 4-bet
  fiveBetMultiplier?: number; // Множитель для 5-bet
  enabledPlayStyles?: { tight: boolean; balanced: boolean; aggressor: boolean }; // Включенные стили игры
  enabledStrengths?: { fish: boolean; amateur: boolean; regular: boolean }; // Включенные силы игроков
}

export default function PlayerSeat({
  user,
  position,
  isHero = false,
  onHeroClick,
  autoAllIn = false,
  onToggleAutoAllIn,
  onToggleStrength,
  onTogglePlayStyle,
  onToggleStackSize,
  onCardsChange,
  onRangeChange,
  onActionChange,
  onBetChange,
  allPlayersActions,
  allPlayersBets,
  openRaiseSize,
  threeBetMultiplier,
  fourBetMultiplier,
  fiveBetMultiplier,
  enabledPlayStyles = { tight: false, balanced: true, aggressor: false },
  enabledStrengths = { fish: false, amateur: true, regular: false },
}: PlayerSeatProps) {
  const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);

  // Проверяем, нужно ли показывать меню выбора стиля (показываем только если включены дополнительные стили)
  const shouldShowPlayStyleSelector = enabledPlayStyles.tight || enabledPlayStyles.aggressor;

  // Проверяем, нужно ли показывать меню выбора силы (показываем только если включены дополнительные силы)
  const shouldShowStrengthSelector = enabledStrengths.fish || enabledStrengths.regular;

  const handlePlayerClick = () => {
    if (isHero && onHeroClick) {
      onHeroClick();
    } else if (!isHero && onRangeChange) {
      // Открываем попап диапазона для не-Hero игроков
      setIsRangeSelectorOpen(true);
    }
  };

  const handleRangeChange = (range: string[]) => {
    if (onRangeChange) {
      onRangeChange(range);
    }
  };

  const handleActionChange = (action: PlayerAction | null) => {
    if (onActionChange) {
      onActionChange(action);
    }
  };

  const handleBetChange = (bet: number) => {
    if (onBetChange) {
      onBetChange(bet);
    }
  };
  // Функция для получения стиля и текста фишки позиции
  const getPositionChip = () => {
    switch (user.position) {
      case "BTN":
        return {
          bg: "bg-white",
          text: "text-gray-900",
          shadow: "shadow-white/50",
          label: "D",
        };
      case "SB":
        return {
          bg: "bg-green-500",
          text: "text-white",
          shadow: "shadow-green-500/50",
          label: "SB",
        };
      case "BB":
        return {
          bg: "bg-red-500",
          text: "text-white",
          shadow: "shadow-red-500/50",
          label: "BB",
        };
      default:
        return null;
    }
  };

  const positionChip = getPositionChip();

  return (
    <div className="absolute z-20" style={position}>
      <div className="flex flex-col items-center gap-2">
        {/* Кружок позиции */}
        {/* Выбор карт для Hero */}
        {isHero && onCardsChange && user.cards && (
          <div className="mt-1">
            <CardSelector
              currentCards={user.cards}
              onCardsChange={onCardsChange}
            />
          </div>
        )}
        <div className="relative">
          <div
            onClick={handlePlayerClick}
            className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 ${
              isHero
                ? "border-[3px] border-yellow-400 shadow-lg shadow-yellow-400/50 cursor-pointer"
                : "border-2 border-gray-600 cursor-pointer hover:border-blue-500"
            } flex flex-col items-center justify-center transition-all duration-200 ${
              isHero ? "hover:scale-105" : "hover:scale-105"
            }`}
          >
            <span className="text-xs font-bold text-white">
              {user.position}
            </span>
            <span className="text-yellow-400 text-xs">
              {user.bet == 0 ? "" : `${user.bet} BB`}
            </span>
            {isHero && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-gray-900">H</span>
              </div>
            )}
          </div>

          {/* Фишка позиции (BTN/SB/BB) */}
          {positionChip && (
            <div
              className={`absolute -bottom-2 -left-2 w-8 h-8 ${positionChip.bg} rounded-full flex items-center justify-center shadow-lg ${positionChip.shadow} border-2 border-gray-800`}
            >
              <span
                className={`text-[10px] font-bold ${positionChip.text} tracking-tight`}
              >
                {positionChip.label}
              </span>
            </div>
          )}

          {/* Индикатор силы игрока (показываем только если включены дополнительные силы) */}
          {shouldShowStrengthSelector && (
            <PlayerStrength
              strength={user.strength}
              onToggle={onToggleStrength}
            />
          )}

          {/* Индикатор стиля игры (показываем только если включены дополнительные стили) */}
          {shouldShowPlayStyleSelector && (
            <PlayerPlayStyle
              playStyle={user.playStyle}
              onToggle={onTogglePlayStyle}
            />
          )}
        </div>

        {/* Контейнер для действия и размера стека */}
        <div className="mt-2 flex gap-2 items-center justify-center">
          {/* Индикатор размера стека */}
          <PlayerStackSize
            stackSize={user.stackSize}
            onToggle={onToggleStackSize}
          />

          {/* Dropdown для выбора действия игрока */}
          {onActionChange && (
            <PlayerActionDropdown
              currentAction={user.action}
              onActionChange={handleActionChange}
              onBetChange={handleBetChange}
              currentBet={user.bet}
              playerStack={user.stack}
              autoAllIn={autoAllIn}
              onToggleAutoAllIn={onToggleAutoAllIn}
              allPlayersActions={allPlayersActions}
              allPlayersBets={allPlayersBets}
              openRaiseSize={openRaiseSize}
              threeBetMultiplier={threeBetMultiplier}
              fourBetMultiplier={fourBetMultiplier}
              fiveBetMultiplier={fiveBetMultiplier}
            />
          )}
        </div>

        {/* Имя игрока */}
        <div className="mt-2">
          <div
            className="text-[10px] text-gray-400 truncate max-w-[120px] px-2 py-1"
            title={user.name}
          >
            {user.name}
          </div>
        </div>
      </div>

      {/* Попап выбора диапазона для не-Hero игроков */}
      {!isHero && (
        <RangeSelector
          isOpen={isRangeSelectorOpen}
          onClose={() => setIsRangeSelectorOpen(false)}
          playerName={user.name}
          currentRange={user.range}
          onRangeChange={handleRangeChange}
          position={user.position}
          strength={user.strength}
          playStyle={user.playStyle}
          stackSize={user.stackSize}
          currentAction={user.action}
        />
      )}
    </div>
  );
}
