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
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Хранение состояния игры
const games = new Map();

// Генерация поля
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

// Компактная клавиатура
function getShootingKeyboard(shots = {}) {
  const keyboard = [];
  
  // Заголовок с цифрами
  const header = [{ text: ' ', callback_data: 'none' }];
  for (let i = 1; i <= 10; i++) {
    header.push({ text: i > 9 ? '⏹' : i.toString(), callback_data: 'none' });
  }
  keyboard.push(header);
  
  // Основное поле
  for (let y = 0; y < 10; y++) {
    const row = [{ text: LETTERS[y], callback_data: 'none' }];
    for (let x = 1; x <= 10; x++) {
      const coord = `${LETTERS[y]}${x}`;
      row.push({
        text: shots[coord] === 'hit' ? '💥' : 
              shots[coord] === 'miss' ? '🌊' : '·',
        callback_data: `shoot_${coord}`
      });
    }
    keyboard.push(row);
  }
  
  keyboard.push([{ text: '🏳️ Сдаться', callback_data: 'surrender' }]);
  return Markup.inlineKeyboard(keyboard);
}

// Проверка победы
function checkWin(shots, board) {
  let hits = 0;
  let ships = 0;
  
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const coord = `${LETTERS[y]}${x+1}`;
      if (shots[coord] === 'hit') hits++;
      if (board[y][x] === 1) ships++;
    }
  }
  
  return hits === ships;
}

// Ход бота
function makeBotMove(game) {
  let x, y, coord;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
    coord = `${LETTERS[y]}${x+1}`;
  } while (game.botShots[coord]);
  
  const isHit = game.playerBoard[y][x] === 1;
  game.botShots[coord] = isHit ? 'hit' : 'miss';
  
  return { coord, isHit };
}

// Команда /playbot
bot.command('playbot', async (ctx) => {
  try {
    const playerBoard = generateBoard();
    const botBoard = generateBoard();
    
    games.set(ctx.from.id, {
      playerBoard,
      botBoard,
      shots: {},
      botShots: {}
    });
    
    await ctx.replyWithHTML('🎮 <b>Игра началась!</b>\nВаше поле:');
    await ctx.replyWithHTML(renderBoard(playerBoard));
    await ctx.reply('Стреляйте по полю противника:', getShootingKeyboard());
  } catch (err) {
    console.error('Playbot error:', err);
    ctx.reply('❌ Ошибка начала игры');
  }
});

// Обработка выстрелов
bot.action(/^shoot_/, async (ctx) => {
  try {
    const coord = ctx.match[0].replace('shoot_', '');
    const game = games.get(ctx.from.id);
    
    if (!game || game.shots[coord]) {
      return ctx.answerCbQuery('❌ Нельзя стрелять сюда');
    }
    
    // Выстрел игрока
    const letter = coord[0];
    const x = parseInt(coord.slice(1)) - 1;
    const y = LETTERS.indexOf(letter);
    const isHit = game.botBoard[y][x] === 1;
    game.shots[coord] = isHit ? 'hit' : 'miss';
    
    // Проверка победы
    if (checkWin(game.shots, game.botBoard)) {
      await ctx.reply('🎉 Вы победили! Все корабли противника потоплены!');
      games.delete(ctx.from.id);
      return;
    }
    
    // Ход бота
    const botMove = makeBotMove(game);
    if (checkWin(game.botShots, game.playerBoard)) {
      await ctx.reply('😢 Бот победил! Все ваши корабли потоплены!');
      games.delete(ctx.from.id);
      return;
    }
    
    // Обновление интерфейса
    await ctx.answerCbQuery(isHit ? '💥 Попадание!' : '🌊 Мимо!');
    await ctx.editMessageReplyMarkup(
      getShootingKeyboard(game.shots).reply_markup
    );
    
    // Отчет о ходе бота
    await ctx.reply(
      `🤖 Бот выстрелил в ${botMove.coord} - ` +
      `${botMove.isHit ? '💥 Попадание!' : '🌊 Мимо!'}\n` +
      `Ваше поле:\n${renderBoardHit(game.playerBoard, game.botShots)}`
    );
    
  } catch (err) {
    console.error('Shoot error:', err);
    ctx.answerCbQuery('❌ Ошибка выстрела');
  }
});

// Команда /surrender
bot.command('surrender', (ctx) => {
  if (games.has(ctx.from.id)) {
    games.delete(ctx.from.id);
    ctx.reply('🏳️ Вы сдались! Игра завершена.');
  } else {
    ctx.reply('❌ Нет активной игры для сдачи.');
  }
});

// Обработка сдачи через кнопку
bot.action('surrender', async (ctx) => {
  await ctx.answerCbQuery();
  if (games.has(ctx.from.id)) {
    games.delete(ctx.from.id);
    await ctx.reply('🏳️ Вы сдались! Игра завершена.');
    await ctx.deleteMessage();
  }
});

// Отображение поля с попаданиями
function renderBoardHit(board, shots) {
  let result = '  1 2 3 4 5 6 7 8 9 10\n';
  for (let y = 0; y < 10; y++) {
    result += LETTERS[y] + ' ';
    for (let x = 0; x < 10; x++) {
      const coord = `${LETTERS[y]}${x+1}`;
      if (shots[coord] === 'hit') {
        result += '💥 ';
      } else if (shots[coord] === 'miss') {
        result += '🌊 ';
      } else {
        result += board[y][x] === 1 ? '🚢 ' : '🌊 ';
      }
    }
    result += '\n';
  }
  return `<pre>${result}</pre>`;
}

// Отображение поля
function renderBoard(board) {
  let result = '  1 2 3 4 5 6 7 8 9 10\n';
  for (let y = 0; y < 10; y++) {
    result += LETTERS[y] + ' ';
    for (let x = 0; x < 10; x++) {
      result += board[y][x] === 1 ? '🚢 ' : '🌊 ';
    }
    result += '\n';
  }
  return `<pre>${result}</pre>`;
}

// Вебхук
app.use(bot.webhookCallback('/webhook'));
bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);

app.get('/', (req, res) => {
  res.send('ShipWreker Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
