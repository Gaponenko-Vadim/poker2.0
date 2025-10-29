import { PlayerStrength } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает силу игрока
 * medium -> weak -> tight -> medium
 * @param currentStrength - Текущая сила игрока
 * @returns Новая сила игрока
 */
export function getNextStrength(currentStrength: PlayerStrength): PlayerStrength {
  const strengthCycle: Record<PlayerStrength, PlayerStrength> = {
    medium: "weak",
    weak: "tight",
    tight: "medium",
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
    weak: {
      label: "Слабый",
      bgColor: "bg-green-500",
      textColor: "text-white",
    },
    medium: {
      label: "Средний",
      bgColor: "bg-yellow-500",
      textColor: "text-gray-900",
    },
    tight: {
      label: "Тайтовый",
      bgColor: "bg-red-500",
      textColor: "text-white",
    },
  };
  return configs[strength];
}
