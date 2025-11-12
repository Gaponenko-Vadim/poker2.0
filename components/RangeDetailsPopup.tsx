import React from 'react';
import { RangeProduct } from '@/lib/types/shop';

interface RangeDetailsPopupProps {
  product: RangeProduct;
  onClose: () => void;
  onBuy: (product: RangeProduct) => void;
}

export default function RangeDetailsPopup({ product, onClose, onBuy }: RangeDetailsPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Заголовок */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{product.title}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              product.category === 'tournament'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {product.category === 'tournament' ? 'Турнир' : 'Кеш'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none p-2"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Информация о продавце */}
          <div className="bg-gray-750 rounded-lg p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">О продавце</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                {product.seller.avatar ? (
                  <img
                    src={product.seller.avatar}
                    alt={product.seller.name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {product.seller.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold text-white">{product.seller.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-lg">★</span>
                    <span className="text-sm text-gray-400">{product.seller.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{product.seller.bio}</p>
              </div>
            </div>
          </div>

          {/* Полное описание */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Описание диапазона</h3>
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{product.fullDescription}</p>
          </div>

          {/* Позиции */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Позиции</h3>
            <div className="flex flex-wrap gap-2">
              {product.positions.map((pos, idx) => (
                <span key={idx} className="px-3 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 font-semibold">
                  {pos}
                </span>
              ))}
            </div>
          </div>

          {/* Примеры рук */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Примеры рук из диапазона</h3>
            <div className="flex flex-wrap gap-2">
              {product.preview.map((hand, idx) => (
                <span key={idx} className="px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-mono font-semibold">
                  {hand}
                </span>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Теги</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-2 bg-gray-700/50 text-gray-400 rounded-lg text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Цена и кнопка покупки */}
          <div className="flex items-center justify-between gap-4 p-6 bg-gray-750 rounded-lg border border-gray-700">
            <div>
              <div className="text-sm text-gray-400 mb-1">Цена</div>
              <div className="text-3xl font-bold text-green-400">{product.price} ₽</div>
            </div>
            <button
              onClick={() => onBuy(product)}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors text-lg"
            >
              Купить диапазон
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
