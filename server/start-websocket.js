// Скрипт для запуска WebSocket сервера с tsx
const { spawn } = require('child_process');
const path = require('path');

const websocketPath = path.join(__dirname, 'websocket.ts');

console.log('🚀 Запуск WebSocket сервера...');

const child = spawn('npx', ['tsx', websocketPath], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (error) => {
  console.error('❌ Ошибка запуска WebSocket сервера:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`WebSocket сервер завершился с кодом ${code}`);
  process.exit(code || 0);
});
