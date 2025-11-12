import React from 'react';
import { RangeProduct } from '@/lib/types/shop';

interface RangeCardProps {
  product: RangeProduct;
  onClick: (product: RangeProduct) => void;
}

export default function RangeCard({ product, onClick }: RangeCardProps) {
  return (
    <div
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 hover:border-green-500"
      onClick={() => onClick(product)}
    >
      {/* Заголовок и категория */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            product.category === 'tournament'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-green-500/20 text-green-400'
          }`}>
            {product.category === 'tournament' ? 'Турнир' : 'Кеш'}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{product.price} ₽</div>
        </div>
      </div>

      {/* Информация о продавце */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
          {product.seller.avatar ? (
            <img src={product.seller.avatar} alt={product.seller.name} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-lg font-bold text-gray-400">
              {product.seller.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-300">{product.seller.name}</div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-xs text-gray-400">{product.seller.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Краткое описание */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-3">{product.shortDescription}</p>

      {/* Позиции */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Позиции:</div>
        <div className="flex flex-wrap gap-2">
          {product.positions.map((pos, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
              {pos}
            </span>
          ))}
        </div>
      </div>

      {/* Превью рук */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Примеры рук:</div>
        <div className="flex flex-wrap gap-2">
          {product.preview.slice(0, 8).map((hand, idx) => (
            <span key={idx} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-mono">
              {hand}
            </span>
          ))}
          {product.preview.length > 8 && (
            <span className="px-2 py-1 text-gray-500 text-xs">+{product.preview.length - 8}</span>
          )}
        </div>
      </div>

      {/* Теги */}
      <div className="flex flex-wrap gap-2">
        {product.tags.map((tag, idx) => (
          <span key={idx} className="px-2 py-1 bg-gray-700/50 text-gray-400 rounded text-xs">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
