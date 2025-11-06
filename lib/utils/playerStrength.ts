import { PlayerStrength } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает силу игрока
 * amateur -> fish -> regular -> amateur (с учетом включенных опций)
 * @param currentStrength - Текущая сила игрока
 * @param enabledStrengths - Объект с флагами включенных сил (опционально)
 * @returns Новая сила игрока
 */
export function getNextStrength(
  currentStrength: PlayerStrength,
  enabledStrengths?: { fish: boolean; amateur: boolean; regular: boolean }
): PlayerStrength {
  // Если enabledStrengths не передан, используем стандартное поведение
  if (!enabledStrengths) {
    const strengthCycle: Record<PlayerStrength, PlayerStrength> = {
      amateur: "fish",
      fish: "regular",
      regular: "amateur",
    };
    return strengthCycle[currentStrength];
  }

  // Список всех сил в порядке цикла
  const allStrengths: PlayerStrength[] = ["amateur", "fish", "regular"];

  // Фильтруем только включенные силы
  const enabledStrengthsList = allStrengths.filter(strength => enabledStrengths[strength]);

  // Если нет включенных сил, возвращаем текущую
  if (enabledStrengthsList.length === 0) {
    return currentStrength;
  }

  // Если только одна сила включена, возвращаем её
  if (enabledStrengthsList.length === 1) {
    return enabledStrengthsList[0];
  }

  // Находим индекс текущей силы в списке включенных
  const currentIndex = enabledStrengthsList.indexOf(currentStrength);

  // Если текущая сила не в списке включенных, возвращаем первую включенную
  if (currentIndex === -1) {
    return enabledStrengthsList[0];
  }

  // Переключаем на следующую включенную силу (циклически)
  const nextIndex = (currentIndex + 1) % enabledStrengthsList.length;
  return enabledStrengthsList[nextIndex];
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
