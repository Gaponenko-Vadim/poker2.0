import pool from '../lib/db/connection';
import fs from 'fs';
import path from 'path';

/**
 * Миграция для добавления поля nickname в таблицу users
 */
async function migrateNickname() {
  try {
    console.log('🔄 Запуск миграции для добавления nickname...');

    // Читаем SQL-скрипт
    const migrationPath = path.join(process.cwd(), 'scripts', 'migrate-add-nickname.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    // Выполняем SQL-скрипт
    await pool.query(migration);

    console.log('✅ Миграция успешно выполнена');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    process.exit(1);
  }
}

migrateNickname();
