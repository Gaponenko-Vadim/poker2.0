import { StackSize } from "@/lib/redux/slices/tableSlice";

/**
 * Циклически переключает размер стека игрока
 * medium -> very-small -> small -> big -> medium
 * @param currentSize - Текущий размер стека
 * @returns Новый размер стека
 */
export function getNextStackSize(currentSize: StackSize): StackSize {
  const sizeCycle: Record<StackSize, StackSize> = {
    medium: "very-small",
    "very-small": "small",
    small: "big",
    big: "medium",
  };
  return sizeCycle[currentSize];
}

/**
 * Получает конфигурацию отображения для размера стека
 * @param size - Размер стека
 * @returns Конфигурация с цветом, фоном и текстом
 */
export function getStackSizeConfig(size: StackSize) {
  const configs = {
    "very-small": {
      label: "10 BB",
      shortLabel: "XS",
      bgColor: "bg-red-600",
      textColor: "text-white",
      description: "Очень маленький",
    },
    small: {
      label: "25 BB",
      shortLabel: "S",
      bgColor: "bg-orange-500",
      textColor: "text-white",
      description: "Маленький",
    },
    medium: {
      label: "50 BB",
      shortLabel: "M",
      bgColor: "bg-blue-500",
      textColor: "text-white",
      description: "Средний",
    },
    big: {
      label: "100 BB",
      shortLabel: "L",
      bgColor: "bg-green-500",
      textColor: "text-white",
      description: "Большой",
    },
  };
  return configs[size];
}

/**
 * Получает значение стека в BB по размеру
 * @param size - Размер стека
 * @returns Значение стека в BB
 */
export function getStackValue(size: StackSize): number {
  const values: Record<StackSize, number> = {
    "very-small": 10,
    "small": 25,
    "medium": 50,
    "big": 100,
  };
  return values[size];
}
