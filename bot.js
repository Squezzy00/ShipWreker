const { Telegraf, Markup } = require('telegraf');
const { Pool } = require('pg');
const express = require('express');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://shipwreker.onrender.com';

// Инициализация БД
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipwreker_games (
        game_id SERIAL PRIMARY KEY,
        player1_id BIGINT NOT NULL,
        player2_id BIGINT DEFAULT 0,
        player1_field JSONB NOT NULL,
        player2_field JSONB,
        player1_shots JSONB DEFAULT '{}',
        player2_shots JSONB DEFAULT '{}',
        status TEXT DEFAULT 'waiting'
      );
    `);
    console.log('✅ Таблица shipwreker_games готова');
  } catch (err) {
    console.error('❌ Ошибка БД:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Генерация игрового поля
function generateBoard() {
  const board = Array(10).fill().map(() => Array(10).fill(0));
  // ... (ваш код генерации поля)
  return board;
}

// Команда /rules
bot.command('rules', (ctx) => {
  try {
    ctx.replyWithMarkdown(`
      *📖 Правила Морского боя:*
      
      1. Игра ведётся на поле 10×10
      2. Корабли расставляются автоматически
      3. Стреляйте по очереди, вводя координаты (например, A1)
      4. 💥 - попадание, 🌊 - промах
      5. Побеждает тот, кто первым потопит все корабли противника

      *Команды:*
      /playbot - начать игру с ботом
      /rules - показать это сообщение
    `);
  } catch (err) {
    console.error('Ошибка в /rules:', err);
    ctx.reply('❌ Не удалось показать правила');
  }
});

// Команда /playbot
bot.command('playbot', async (ctx) => {
  try {
    const playerBoard = generateBoard();
    const botBoard = generateBoard();

    await pool.query(
      `INSERT INTO shipwreker_games 
       (player1_id, player1_field, player2_field, status) 
       VALUES ($1, $2, $3, 'active')`,
      [ctx.from.id, playerBoard, botBoard]
    );

    await ctx.reply('🎮 Игра началась! Ваше поле:');
    await ctx.reply(renderBoard(playerBoard));
    await ctx.reply('Стреляйте командой, например: "A1"');
  } catch (err) {
    console.error('Ошибка в /playbot:', err);
    ctx.reply('❌ Ошибка: ' + err.message);
  }
});

// Обработка inline-кнопок
bot.action('show_rules', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(`
      *📖 Правила игры:*
      Используйте команду /playbot для начала игры...
    `);
  } catch (err) {
    console.error('Ошибка в кнопке правил:', err);
  }
});

// Запуск сервера
app.use(bot.webhookCallback('/webhook'));
bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`);

app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  try {
    await initDB();
    console.log('🤖 Бот готов к работе!');
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
  }
});
