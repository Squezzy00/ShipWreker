const { Telegraf, Markup } = require('telegraf');
const { Pool } = require('pg');
const express = require('express');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { agent: null }, // Ускоряем запросы
  handlerTimeout: 3000 // Таймаут обработки 3 сек
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://shipwreker.onrender.com';

// Ускоренная генерация поля
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

// Исправленное сохранение в БД
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
    const startTime = Date.now();
    
    // Быстрая генерация
    const [playerBoard, botBoard] = await Promise.all([
      Promise.resolve(generateBoard()),
      Promise.resolve(generateBoard())
    ]);
    
    // Асинхронное сохранение с таймаутом
    await Promise.race([
      saveGame(ctx.from.id, playerBoard, botBoard),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout saving game')), 2000)
    ]);
    
    // Быстрый ответ
    await ctx.reply('🎮 Игра началась! Ваш ход...');
    await ctx.reply(formatBoard(playerBoard));
    
    console.log(`Game started in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('Playbot error:', err.message);
    ctx.reply('❌ ' + (err.message.includes('Timeout') ? 
      'Сервер перегружен, попробуйте позже' : 
      'Ошибка начала игры');
  }
});

// Оптимизированный вывод поля
function formatBoard(board) {
  return board.map(row => 
    row.map(cell => cell === 1 ? '🚢' : '🌊').join('')
  ).join('\n');
}

// Настройка вебхука
app.use(express.json({ limit: '10kb' }));
app.use(bot.webhookCallback('/webhook', { timeout: 3000 }));

bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`, {
  drop_pending_updates: true
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready on ${PORT}`);
  process.on('SIGINT', () => bot.stop('SIGINT'));
});
