// Утилита для генерации структуры диапазонов с пустыми значениями

const positions = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const strengths = ['fish', 'amateur', 'regular'];
const playStyles = ['tight', 'balanced', 'aggressor'];
const stackSizes = ['very_short', 'short', 'medium', 'big'];
const stages = ['early', 'middle', 'pre-bubble', 'late', 'pre-final', 'final'];

const actions = {
  very_short: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet'],
  short: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet'],
  medium: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet', '5bet'],
  big: ['open_raise', 'push_range', 'call_vs_shove', 'defense_vs_open', '3bet', 'defense_vs_3bet', '4bet', 'defense_vs_4bet', '5bet', 'defense_vs_5bet']
};

const stackBBLabels = {
  very_short: '< 20',
  short: '20-80',
  medium: '80-180',
  big: '> 180'
};

function generateEmptyRangeStructure() {
  const structure = {
    ranges: {
      user: {
        stages: {}
      }
    }
  };

  // Для каждой стадии турнира
  for (const stage of stages) {
    structure.ranges.user.stages[stage] = {
      positions: {}
    };

    // Для каждой позиции
    for (const position of positions) {
      structure.ranges.user.stages[stage].positions[position] = {};

      // Для каждой силы игрока
      for (const strength of strengths) {
        structure.ranges.user.stages[stage].positions[position][strength] = {};

        // Для каждого стиля игры
        for (const playStyle of playStyles) {
          structure.ranges.user.stages[stage].positions[position][strength][playStyle] = {
            ranges_by_stack: {}
          };

          // Для каждого размера стека
          for (const stackSize of stackSizes) {
            const rangeObj = {
              stack_bb: stackBBLabels[stackSize]
            };

            // Добавляем все действия для этого размера стека
            for (const action of actions[stackSize]) {
              rangeObj[action] = '';  // Пустая строка для заполнения
            }

            structure.ranges.user.stages[stage].positions[position][strength][playStyle].ranges_by_stack[stackSize] = rangeObj;
          }
        }
      }
    }
  }

  return structure;
}

// Генерация и вывод
const rangeStructure = generateEmptyRangeStructure();
console.log(JSON.stringify(rangeStructure, null, 2));
