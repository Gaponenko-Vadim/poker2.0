# Hero Ranges

Эта папка содержит JSON файлы с диапазонами для **Hero** (главного игрока).

## Структура

**ВАЖНО:** Структура файлов Hero отличается от структуры оппонентов!

### Путь к диапазону Hero:
```
ranges.hero.stages.{STAGE}.positions.{POSITION}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```

### Отличия от структуры оппонентов:
- ❌ **НЕТ** уровня `strength` (fish/amateur/regular)
- ✅ **ЕСТЬ** уровень `stages` (early/middle/pre-bubble/late/pre-final/final)
- ✅ **ЕСТЬ** `playStyle` (tight/balanced/aggressor)

## Доступные файлы

- `heroRanges_micro_100bb.json` - Микро-лимиты, начальный стек 100 BB
- `heroRanges_micro_200bb.json` - Микро-лимиты, начальный стек 200 BB (баунти турниры)
- `heroRanges_low_100bb.json` - Низкие лимиты, начальный стек 100 BB

## Использование

Эти файлы будут загружаться для Hero через функционал выбора диапазонов.

Файлы в родительской папке (`lib/constants/`) используются для диапазонов противников и имеют другую структуру (с уровнем strength).
