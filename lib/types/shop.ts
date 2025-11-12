// Типы для магазина диапазонов

export interface RangeProduct {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  seller: {
    name: string;
    rating: number;
    avatar?: string;
    bio: string;
  };
  price: number;
  category: 'tournament' | 'cash';
  positions: string[];
  preview: string[]; // Примеры рук из диапазона
  tags: string[];
}
