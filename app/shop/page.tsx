'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import RangeCard from '@/components/RangeCard';
import RangeDetailsPopup from '@/components/RangeDetailsPopup';
import { RangeProduct } from '@/lib/types/shop';

// Временные примеры диапазонов
const sampleProducts: RangeProduct[] = [
  {
    id: '1',
    title: 'Агрессивные диапазоны для кнопки',
    shortDescription: 'Широкие диапазоны для игры с кнопки в турнирах. Подходит для средних стеков и агрессивного стиля.',
    fullDescription: `Этот набор диапазонов создан специально для агрессивной игры с позиции BTN в турнирах средних лимитов.

Вы получите:
- Диапазоны открытия (open-raise) с кнопки для разных размеров стека
- Диапазоны 3-бета против открытия из ранних позиций
- Диапазоны защиты от 3-бета
- Стратегии против разных типов оппонентов

Эти диапазоны помогут вам максимизировать прибыль с самой выгодной позиции за столом. Подходит для турниров с buy-in от $20 до $100.`,
    seller: {
      name: 'ProPokerCoach',
      rating: 4.8,
      bio: 'Профессиональный игрок и тренер с 10+ лет опыта. Специализируется на турнирном покере средних лимитов.'
    },
    price: 2000,
    category: 'tournament',
    positions: ['BTN'],
    preview: ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKo', 'AQo', 'KQs'],
    tags: ['агрессия', 'средние-стеки', 'mid-stakes']
  },
  {
    id: '2',
    title: 'Тайтовые диапазоны UTG',
    shortDescription: 'Солидные диапазоны для игры из ранней позиции. Оптимизированы для регуляров в кеш-играх.',
    fullDescription: `Профессиональный набор диапазонов для игры с ранней позиции (UTG) в кеш-играх.

Что включено:
- Диапазоны открытия для разных типов столов
- Защита от 3-бета с учетом динамики стола
- Диапазоны колла и 4-бета
- Рекомендации по sizing для каждой ситуации

Эти диапазоны созданы на основе анализа 500,000+ раздач от топовых регуляров на лимитах NL100-NL500. Идеально подходят для построения солидного фундамента игры из ранних позиций.`,
    seller: {
      name: 'CashGamePro',
      rating: 4.9,
      bio: 'Регуляр лимитов NL200-NL1000 с винрейтом 8bb/100. Создаю обучающий контент для кеш игроков.'
    },
    price: 2000,
    category: 'cash',
    positions: ['UTG', 'UTG+1'],
    preview: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo', 'KQs'],
    tags: ['tight', 'cash', 'ранняя-позиция']
  },
  {
    id: '3',
    title: 'Диапазоны малых стеков для турниров',
    shortDescription: 'Оптимальные диапазоны push/fold для коротких стеков в турнирах. Математически выверенные решения.',
    fullDescription: `Комплексный набор диапазонов для игры с короткими стеками (10-20BB) в турнирах.

В набор входят:
- Push/fold диапазоны для всех позиций
- Диапазоны защиты от shove
- Стратегии для разных стадий турнира (early, middle, bubble, ITM)
- ICM соображения для разных ситуаций
- Корректировки под bounty турниры

Эти диапазоны основаны на ICM расчетах и solver решениях. Помогут принимать +EV решения в критических турнирных ситуациях с малым стеком.`,
    seller: {
      name: 'MTTGrinder',
      rating: 4.7,
      bio: 'Специалист по турнирам с 6+ лет грайнда. Фокус на математически точных решениях в критических ситуациях.'
    },
    price: 2000,
    category: 'tournament',
    positions: ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    preview: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AK', 'AQ', 'AJ', 'AT', 'KQ', 'A5s', 'A4s'],
    tags: ['короткий-стек', 'push-fold', 'ICM', 'турниры']
  },
  {
    id: '4',
    title: 'Продвинутые диапазоны блайндов',
    shortDescription: 'Полный набор диапазонов для защиты блайндов против открытия. Для кеш-игр на высоких лимитах.',
    fullDescription: `Профессиональный набор диапазонов для защиты блайндов (SB и BB) в кеш-играх высоких лимитов.

Содержимое:
- Диапазоны 3-бета из SB и BB против каждой позиции
- Диапазоны flat call с учетом глубины стеков
- Защита от squeezing
- Постфлоп стратегии для частых ситуаций
- Корректировки против разных sizing оппонентов

Эти диапазоны разработаны с использованием солверов и протестированы на лимитах NL500+. Максимизируют EV в самых сложных турнирных ситуациях - игре из блайндов.`,
    seller: {
      name: 'HighStakesReg',
      rating: 5.0,
      bio: 'Регуляр лимитов NL500-NL2000. Специализируюсь на оптимальной защите блайндов и postflop игре.'
    },
    price: 2000,
    category: 'cash',
    positions: ['SB', 'BB'],
    preview: ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A5s', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKo', 'AQo', 'KQs', 'KJs'],
    tags: ['блайнды', 'защита', 'high-stakes', '3-bet']
  },
  {
    id: '5',
    title: 'Сбалансированные диапазоны для катофа',
    shortDescription: 'Оптимально сбалансированные диапазоны для позиции CO. Подходит для турниров любого формата.',
    fullDescription: `Универсальный набор диапазонов для игры с позиции Cut-Off (CO) в турнирах.

Что вы получите:
- Диапазоны открытия для разных размеров стека (15BB, 25BB, 40BB+)
- Сбалансированные диапазоны против 3-бета
- Стратегии изоляции лимпа
- Диапазоны против squeeze из блайндов
- Рекомендации по sizing в зависимости от ситуации

Эти диапазоны универсальны и подходят для турниров любого формата - от sit-and-go до больших MTT. Сбалансированный подход позволяет быть непредсказуемым для оппонентов.`,
    seller: {
      name: 'BalancedGame',
      rating: 4.6,
      bio: 'Тренер по GTO стратегиям. Помогаю игрокам строить сбалансированные и защищенные от эксплуатации диапазоны.'
    },
    price: 2000,
    category: 'tournament',
    positions: ['CO'],
    preview: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'AKo', 'AQo', 'KQo'],
    tags: ['сбалансированный', 'GTO', 'катофф', 'универсальный']
  },
  {
    id: '6',
    title: 'Эксплуатационные диапазоны против фишей',
    shortDescription: 'Диапазоны, настроенные на максимальную эксплуатацию слабых игроков. Для всех позиций в кеш-играх.',
    fullDescription: `Специализированный набор диапазонов для игры против слабых оппонентов (фишей) в кеш-играх.

В наборе:
- Расширенные диапазоны открытия для изоляции фишей
- Корректировки sizing для максимизации value
- Диапазоны для игры в мультипот ситуациях
- Стратегии против типичных ошибок слабых игроков
- Рекомендации по table selection

Эти диапазоны созданы специально для эксплуатации типичных ошибок слабых игроков. Если на вашем столе есть фиши - эти диапазоны помогут выжать из них максимум value.`,
    seller: {
      name: 'ExploitMaster',
      rating: 4.8,
      bio: 'Специалист по эксплуатационной игре. Обучаю максимизации винрейта против слабых оппонентов.'
    },
    price: 2000,
    category: 'cash',
    positions: ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    preview: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AK', 'AQ', 'AJ', 'AT', 'KQ', 'KJ', 'QJ', 'JT'],
    tags: ['эксплуатация', 'против-фишей', 'value', 'изоляция']
  }
];

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState<RangeProduct | null>(null);

  const handleBuy = (product: RangeProduct) => {
    // Временная заглушка для покупки
    alert(`Покупка диапазона "${product.title}" за ${product.price} ₽\n\nЭто временная демонстрация функционала.`);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Магазин диапазонов</h1>
          <p className="text-gray-400 text-lg">
            Профессиональные диапазоны от опытных игроков и тренеров
          </p>
        </div>

        {/* Фильтры (пока временные) */}
        <div className="flex gap-4 mb-8">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors">
            Все
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors">
            Турниры
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors">
            Кеш
          </button>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleProducts.map((product) => (
            <RangeCard
              key={product.id}
              product={product}
              onClick={setSelectedProduct}
            />
          ))}
        </div>
      </div>

      {/* Попап с деталями */}
      {selectedProduct && (
        <RangeDetailsPopup
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={handleBuy}
        />
      )}
    </div>
  );
}
