const fs = require('fs');
const path = require('path');

const stages = ['early', 'middle', 'pre-bubble', 'late', 'pre-final', 'final'];
const positions = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const playStyles = ['tight', 'balanced', 'aggressor'];

const stackSizes = {
  very_short: {
    stack_bb: '< 20',
    actions: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet']
  },
  short: {
    stack_bb: '20-80',
    actions: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet']
  },
  medium: {
    stack_bb: '80-180',
    actions: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet', '5bet']
  },
  big: {
    stack_bb: '> 180',
    actions: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet', '5bet', 'defense_vs_5bet']
  }
};

function createHeroStructure() {
  const structure = {
    ranges: {
      hero: {
        stages: {}
      }
    }
  };

  // Создаем структуру для Hero (БЕЗ уровня strength)
  stages.forEach(stage => {
    structure.ranges.hero.stages[stage] = { positions: {} };

    positions.forEach(position => {
      structure.ranges.hero.stages[stage].positions[position] = {};

      playStyles.forEach(playStyle => {
        structure.ranges.hero.stages[stage].positions[position][playStyle] = { ranges_by_stack: {} };

        Object.entries(stackSizes).forEach(([stackSize, config]) => {
          const rangesObj = { stack_bb: config.stack_bb };
          config.actions.forEach(action => {
            rangesObj[action] = ''; // Пустой диапазон
          });
          structure.ranges.hero.stages[stage].positions[position][playStyle].ranges_by_stack[stackSize] = rangesObj;
        });
      });
    });
  });

  return structure;
}

// Список всех файлов для создания
const files = [
  'heroRanges_micro_100bb.json',
  'heroRanges_micro_200bb.json',
  'heroRanges_low_100bb.json'
];

const heroRangesDir = path.join(__dirname, '../lib/constants/heroRanges');

// Создаем папку если её нет
if (!fs.existsSync(heroRangesDir)) {
  fs.mkdirSync(heroRangesDir, { recursive: true });
}

// Создаем все файлы
files.forEach(filename => {
  const structure = createHeroStructure();
  const filepath = path.join(heroRangesDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(structure, null, 2));
  console.log(`✅ Created: ${filename}`);
});

console.log('\n🎯 All hero range files created successfully!');
console.log('📊 Structure: ranges.hero.stages.{STAGE}.positions.{POSITION}.{playStyle}.ranges_by_stack.{stackSize}.{action}');
console.log('📁 Files created:', files.length);
