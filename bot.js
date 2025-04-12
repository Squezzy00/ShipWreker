const { Telegraf } = require('telegraf');
const { Pool } = require('pg');
const express = require('express');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN, {
  handlerTimeout: 3000,
  telegram: { agent: null }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 10000
});

const PORT = process.env.PORT || 10000;

// Упрощенная генерация поля
function generateBoard() {
  const board = Array(10).fill().map(() => Array(10).fill(0));
  const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  
  ships.forEach(size => {
    let placed = false;
    while (!placed) {
      const vertical = Math.random() > 0.5;
      const x = Math.floor(Math.random() * (10 - (vertical ? 0 : size)));
      const y = Math.floor(Math.random() * (10 - (vertical ? size : 0)));
      
      let canPlace = true;
      for (let i = 0; i < size; i++) {
        const nx = vertical ? x : x + i;
        const ny = vertical ? y + i : y;
        if (board[ny][nx] !== 0) canPlace = false;
      }
      
      if (canPlace) {
        for (let i = 0; i < size; i++) {
          board[vertical ? y + i : y][vertical ? x : x + i] = 1;
        }
        placed = true;
      }
    }
  });
  return board;
}

// Исправленное сохранение игры
async function saveGame(userId, playerBoard, botBoard) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO shipwreker_games 
       (player1_id, player1_field, player2_field, status) 
       VALUES ($1, $2::jsonb, $3::jsonb, 'active')`,
      [userId, JSON.stringify(playerBoard), JSON.stringify(botBoard)]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Быстрая команда /playbot
bot.command('playbot', async (ctx) => {
  try {
    // Быстрая генерация полей
    const playerBoard = generateBoard();
    const botBoard = generateBoard();
    
    // Сохранение с таймаутом (исправленный вариант)
    const savePromise = saveGame(ctx.from.id, playerBoard, botBoard);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout saving game')), 2000);
    });
    
    await Promise.race([savePromise, timeoutPromise]);
    
    await ctx.reply('🎮 Игра началась! Ваше поле:');
    await ctx.reply(formatBoard(playerBoard));
    await ctx.reply('Стреляйте командой, например: "A1"');
  } catch (err) {
    console.error('Playbot error:', err.message);
    ctx.reply('❌ ' + (err.message.includes('Timeout') ? 
      'Сервер перегружен, попробуйте позже' : 
      'Ошибка начала игры');
  }
});

// Форматирование поля
function formatBoard(board) {
  return board.map(row => 
    row.map(cell => cell === 1 ? '🚢' : '🌊').join('')
  ).join('\n');
}

// Проверка работы
app.get('/', (req, res) => {
  res.send('ShipWreker Bot is running');
});

// Вебхук
app.use(bot.webhookCallback('/webhook'));
bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
