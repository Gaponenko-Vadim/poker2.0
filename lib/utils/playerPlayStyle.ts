import { PlayerPlayStyle } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает стиль игры
 * balanced -> tight -> aggressor -> balanced (с учетом включенных опций)
 * @param currentPlayStyle - Текущий стиль игры
 * @param enabledStyles - Объект с флагами включенных стилей (опционально)
 * @returns Новый стиль игры
 */
export function getNextPlayStyle(
  currentPlayStyle: PlayerPlayStyle,
  enabledStyles?: { tight: boolean; balanced: boolean; aggressor: boolean }
): PlayerPlayStyle {
  // Если enabledStyles не передан, используем стандартное поведение
  if (!enabledStyles) {
    const playStyleCycle: Record<PlayerPlayStyle, PlayerPlayStyle> = {
      balanced: "tight",
      tight: "aggressor",
      aggressor: "balanced",
    };
    return playStyleCycle[currentPlayStyle];
  }

  // Список всех стилей в порядке цикла
  const allStyles: PlayerPlayStyle[] = ["balanced", "tight", "aggressor"];

  // Фильтруем только включенные стили
  const enabledStylesList = allStyles.filter(style => enabledStyles[style]);

  // Если нет включенных стилей, возвращаем текущий
  if (enabledStylesList.length === 0) {
    return currentPlayStyle;
  }

  // Если только один стиль включен, возвращаем его
  if (enabledStylesList.length === 1) {
    return enabledStylesList[0];
  }

  // Находим индекс текущего стиля в списке включенных
  const currentIndex = enabledStylesList.indexOf(currentPlayStyle);

  // Если текущий стиль не в списке включенных, возвращаем первый включенный
  if (currentIndex === -1) {
    return enabledStylesList[0];
  }

  // Переключаем на следующий включенный стиль (циклически)
  const nextIndex = (currentIndex + 1) % enabledStylesList.length;
  return enabledStylesList[nextIndex];
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
