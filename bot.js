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

// Игровые константы
const SHIP_TYPES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const BOARD_SIZE = 10;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Установка команд бота
bot.telegram.setMyCommands([
  { command: 'start', description: 'Начать игру' },
  { command: 'playbot', description: 'Играть с ботом' },
  { command: 'rules', description: 'Правила игры' }
]);

// Генерация игрового поля
function generateBoard() {
  const board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
  
  for (const size of SHIP_TYPES) {
    let placed = false;
    while (!placed) {
      const vertical = Math.random() > 0.5;
      const x = Math.floor(Math.random() * (vertical ? BOARD_SIZE : BOARD_SIZE - size));
      const y = Math.floor(Math.random() * (vertical ? BOARD_SIZE - size : BOARD_SIZE));
      
      let canPlace = true;
      for (let i = 0; i < size; i++) {
        const nx = vertical ? x : x + i;
        const ny = vertical ? y + i : y;
        
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (board[ny + dy]?.[nx + dx] === 1) {
              canPlace = false;
            }
          }
        }
      }
      
      if (canPlace) {
        for (let i = 0; i < size; i++) {
          if (vertical) {
            board[y + i][x] = 1;
          } else {
            board[y][x + i] = 1;
          }
        }
        placed = true;
      }
    }
  }
  return board;
}

// Клавиатура для стрельбы
function getShootingKeyboard(shots = {}) {
  const keyboard = [];
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row = [];
    for (let x = 1; x <= BOARD_SIZE; x++) {
      const coord = `${LETTERS[y]}${x}`;
      const emoji = shots[coord] === 'hit' ? '💥' : 
                   shots[coord] === 'miss' ? '🌊' : '⬜';
      row.push(Markup.button.callback(emoji, `shoot_${coord}`));
    }
    keyboard.push(row);
  }
  
  keyboard.push([Markup.button.callback('🏳️ Сдаться', 'surrender')]);
  return Markup.inlineKeyboard(keyboard);
}

// Отображение поля
function renderBoard(board, shots = {}) {
  let result = '  ' + Array(BOARD_SIZE).fill().map((_, i) => i + 1).join(' ') + '\n';
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    result += LETTERS[y] + ' ';
    for (let x = 0; x < BOARD_SIZE; x++) {
      const coord = `${LETTERS[y]}${x + 1}`;
      if (shots[coord] === 'hit') {
        result += '💥';
      } else if (shots[coord] === 'miss') {
        result += '🌊';
      } else if (board[y][x] === 1) {
        result += '🚢';
      } else {
        result += '⬜';
      }
      result += ' ';
    }
    result += '\n';
  }
  
  return `<pre>${result}</pre>`;
}

// Команда /start
bot.command('start', async (ctx) => {
  try {
    await ctx.reply(
      '🚢 Добро пожаловать в ShipWreker - Морской бой!\n\n' +
      'Выберите действие:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🤖 Играть с ботом', 'play_bot')],
        [Markup.button.callback('📖 Правила', 'show_rules')]
      ])
    );
  } catch (err) {
    console.error('Ошибка start:', err);
  }
});

// Команда /playbot
bot.command('playbot', async (ctx) => {
  try {
    const playerBoard = generateBoard();
    const botBoard = generateBoard();
    
    const res = await pool.query(
      `INSERT INTO games (player1_id, player2_id, current_player, player1_field, player2_field, status)
       VALUES ($1, 0, $1, $2, $3, 'active')
       RETURNING game_id`,
      [ctx.from.id, playerBoard, botBoard]
    );
    
    await ctx.reply('🎮 Игра против бота началась! Ваш ход:');
    await ctx.replyWithHTML(renderBoard(playerBoard));
    await ctx.reply('Стреляйте по полю:', getShootingKeyboard());
  } catch (err) {
    console.error('Ошибка playbot:', err);
    ctx.reply('❌ Не удалось начать игру');
  }
});

// Обработка выстрелов
bot.action(/^shoot_/, async (ctx) => {
  const coord = ctx.match[0].replace('shoot_', '');
  const letter = coord[0];
  const x = parseInt(coord.slice(1)) - 1;
  const y = LETTERS.indexOf(letter);
  
  try {
    const gameRes = await pool.query(
      `SELECT * FROM games 
       WHERE player1_id = $1 AND status = 'active'`,
      [ctx.from.id]
    );
    
    if (!gameRes.rows.length) return;
    
    const game = gameRes.rows[0];
    const isHit = game.player2_field[y][x] === 1;
    const newShots = { ...game.player1_shots, [coord]: isHit ? 'hit' : 'miss' };
    
    await pool.query(
      `UPDATE games 
       SET player1_shots = $1, current_player = 0
       WHERE game_id = $2`,
      [newShots, game.game_id]
    );
    
    await ctx.answerCbQuery(isHit ? '💥 Попадание!' : '🌊 Мимо!');
    await ctx.editMessageReplyMarkup(getShootingKeyboard(newShots).reply_markup);
    
    // Ход бота
    await botTurn(ctx, game.game_id);
  } catch (err) {
    console.error('Ошибка shoot:', err);
    ctx.answerCbQuery('❌ Ошибка при выстреле');
  }
});

// Ход бота
async function botTurn(ctx, gameId) {
  const gameRes = await pool.query(
    'SELECT * FROM games WHERE game_id = $1',
    [gameId]
  );
  const game = gameRes.rows[0];
  
  const shots = game.player2_shots || {};
  const field = game.player1_field;
  
  let x, y, coord;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
    coord = `${LETTERS[y]}${x + 1}`;
  } while (shots[coord]);
  
  const isHit = field[y][x] === 1;
  const newShots = { ...shots, [coord]: isHit ? 'hit' : 'miss' };
  
  await pool.query(
    `UPDATE games 
     SET player2_shots = $1, current_player = $2
     WHERE game_id = $3`,
    [newShots, game.player1_id, gameId]
  );
  
  await ctx.telegram.sendMessage(
    game.player1_id,
    `🤖 Бот выстрелил в ${coord} - ${isHit ? '💥 Попадание!' : '🌊 Мимо!'}\nВаш ход:`,
    getShootingKeyboard(game.player1_shots)
  );
}

// Настройка вебхука
bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`);
app.use(bot.webhookCallback('/webhook'));

// Проверка работы
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ShipWreker Bot is running',
    version: '1.0'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Вебхук: ${WEBHOOK_URL}/webhook`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
