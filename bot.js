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
        status TEXT DEFAULT 'waiting'
      );
    `);
    console.log('✅ Таблица shipwreker_games готова');
  } finally {
    client.release();
  }
}

// Генерация игрового поля
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

// Сохранение игры с обработкой ошибок
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
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB Error:', err.message);
    return false;
  } finally {
    client.release();
  }
}

// Команда /playbot с исправленной обработкой ошибок
bot.command('playbot', async (ctx) => {
  try {
    const startTime = Date.now();
    
    // Генерация полей
    const playerBoard = generateBoard();
    const botBoard = generateBoard();
    
    // Сохранение с таймаутом
    const saved = await Promise.race([
      saveGame(ctx.from.id, playerBoard, botBoard),
      new Promise(resolve => setTimeout(() => resolve(false), 2000))
    ]);
    
    if (!saved) {
      throw new Error('Не удалось сохранить игру. Попробуйте позже.');
    }
    
    await ctx.reply('🎮 Игра началась! Ваше поле:');
    await ctx.reply(formatBoard(playerBoard));
    await ctx.reply('Стреляйте командой, например: "A1"');
    
    console.log(`Game started in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('Playbot error:', err.message);
    await ctx.reply(`❌ ${err.message}`);
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
  res.status(200).send('ShipWreker Bot is running');
});

// Вебхук
app.use(express.json());
app.use(bot.webhookCallback('/webhook'));
bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`);

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Server started on port ${PORT}`);
  try {
    await initDB();
    console.log('🤖 Bot is ready!');
  } catch (err) {
    console.error('❌ Failed to initialize:', err);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
