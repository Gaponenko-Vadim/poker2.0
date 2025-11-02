import { PlayerStrength } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает силу игрока
 * amateur -> fish -> regular -> amateur
 * @param currentStrength - Текущая сила игрока
 * @returns Новая сила игрока
 */
export function getNextStrength(currentStrength: PlayerStrength): PlayerStrength {
  const strengthCycle: Record<PlayerStrength, PlayerStrength> = {
    amateur: "fish",
    fish: "regular",
    regular: "amateur",
  };
  return strengthCycle[currentStrength];
}

/**
 * Получает конфигурацию отображения для силы игрока
 * @param strength - Сила игрока
 * @returns Конфигурация с цветом, фоном и текстом
 */
export function getStrengthConfig(strength: PlayerStrength) {
  const configs = {
    fish: {
      label: "Фиш",
      bgColor: "bg-green-500",
      textColor: "text-white",
    },
    amateur: {
      label: "Любитель",
      bgColor: "bg-yellow-500",
      textColor: "text-gray-900",
    },
    regular: {
      label: "Регуляр",
      bgColor: "bg-red-500",
      textColor: "text-white",
    },
  };
  return configs[strength];
}
