// Типы для пользовательских диапазонов

import { TournamentCategory } from "@/lib/redux/slices/tableSlice";

// Тип стола
export type TableType = "6-max" | "8-max" | "cash";

// Набор диапазонов пользователя
export interface UserRangeSet {
  id: number;
  userId: number;
  name: string; // Название набора (например, "Мои агрессивные диапазоны")
  tableType: TableType; // Тип стола (6-max, 8-max, cash)
  category: TournamentCategory; // Категория турнира
  startingStack: number; // Начальный стек (100 или 200 BB)
  bounty: boolean; // С баунти или нет
  rangeData: string; // JSON с диапазонами (полная структура tournamentRanges.json, включает все стадии)
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс для создания нового набора
export interface CreateRangeSetRequest {
  name: string;
  tableType: TableType;
  category: TournamentCategory;
  startingStack: number;
  bounty: boolean;
  rangeData: object; // Полный JSON структуры диапазонов (включает все стадии)
}

// Интерфейс для обновления существующего набора
export interface UpdateRangeSetRequest {
  id: number;
  name?: string; // Опционально изменить название
  rangeData: object; // Обновленный JSON
}

// Ответ API при запросе наборов
export interface GetRangeSetsResponse {
  success: boolean;
  data?: UserRangeSet[];
  error?: string;
}

// Ответ API при создании/обновлении
export interface SaveRangeSetResponse {
  success: boolean;
  data?: UserRangeSet;
  error?: string;
}
