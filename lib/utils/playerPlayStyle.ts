import { PlayerPlayStyle } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает стиль игры
 * balanced -> tight -> aggressor -> balanced
 * @param currentPlayStyle - Текущий стиль игры
 * @returns Новый стиль игры
 */
export function getNextPlayStyle(currentPlayStyle: PlayerPlayStyle): PlayerPlayStyle {
  const playStyleCycle: Record<PlayerPlayStyle, PlayerPlayStyle> = {
    balanced: "tight",
    tight: "aggressor",
    aggressor: "balanced",
  };
  return playStyleCycle[currentPlayStyle];
}

/**
 * Получает конфигурацию отображения для стиля игры
 * @param playStyle - Стиль игры
 * @returns Конфигурация с цветом, фоном и текстом
 */
export function getPlayStyleConfig(playStyle: PlayerPlayStyle) {
  const configs = {
    tight: {
      label: "Тайт",
      bgColor: "bg-blue-500",
      textColor: "text-white",
    },
    balanced: {
      label: "Баланс",
      bgColor: "bg-purple-500",
      textColor: "text-white",
    },
    aggressor: {
      label: "Агрессор",
      bgColor: "bg-orange-500",
      textColor: "text-white",
    },
  };
  return configs[playStyle];
}
