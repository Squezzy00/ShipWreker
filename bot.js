const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 10000;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const games = new Map();

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

// Создание клавиатуры для стрельбы (полноценное 10x10)
function getShootingKeyboard(shots = {}) {
  const keyboard = [];
  
  // Верхняя строка с цифрами (1-10)
  const headerRow = [{ text: ' ', callback_data: 'header' }];
  for (let i = 1; i <= 10; i++) {
    headerRow.push({ 
      text: i.toString(), 
      callback_data: 'header',
      width: 1
    });
  }
  keyboard.push(headerRow);
  
  // Основные строки с буквами и кнопками
  for (let y = 0; y < 10; y++) {
    const row = [{ 
      text: LETTERS[y], 
      callback_data: 'row_header',
      width: 1
    }];
    
    for (let x = 1; x <= 10; x++) {
      const coord = `${LETTERS[y]}${x}`;
      row.push({
        text: shots[coord] === 'hit' ? '💥' : 
              shots[coord] === 'miss' ? '🌊' : '·',
        callback_data: `shoot_${coord}`,
        width: 1
      });
    }
    keyboard.push(row);
  }
  
  // Кнопка сдачи
  keyboard.push([{ 
    text: '🏳️ Сдаться', 
    callback_data: 'surrender',
    width: 12
  }]);
  
  return Markup.inlineKeyboard(keyboard, { columns: 11 });
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
    const userId = ctx.from.id;
    const coord = ctx.match[0].replace('shoot_', '');
    const game = games.get(userId);
    
    if (!game) {
      return ctx.answerCbQuery('❌ Игра не найдена');
    }
    
    if (game.shots[coord]) {
      return ctx.answerCbQuery('❌ Вы уже стреляли сюда');
    }
    
    // Обработка выстрела
    const letter = coord[0];
    const x = parseInt(coord.slice(1)) - 1;
    const y = LETTERS.indexOf(letter);
    const isHit = game.botBoard[y][x] === 1;
    game.shots[coord] = isHit ? 'hit' : 'miss';
    
    // Обновление клавиатуры
    await ctx.editMessageReplyMarkup(
      getShootingKeyboard(game.shots).reply_markup
    );
    await ctx.answerCbQuery(isHit ? '💥 Попадание!' : '🌊 Мимо!');
    
    // Проверка победы
    if (checkWin(game.shots, game.botBoard)) {
      await ctx.reply('🎉 Вы победили! Все корабли противника потоплены!');
      games.delete(userId);
      return;
    }
    
    // Ход бота
    await botMove(ctx, game, userId);
    
  } catch (err) {
    console.error('Shoot error:', err);
    ctx.answerCbQuery('❌ Ошибка обработки выстрела');
  }
});

// Ход бота
async function botMove(ctx, game, userId) {
  let x, y, coord;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
    coord = `${LETTERS[y]}${x+1}`;
  } while (game.botShots[coord]);
  
  const isHit = game.playerBoard[y][x] === 1;
  game.botShots[coord] = isHit ? 'hit' : 'miss';
  
  // Проверка победы бота
  if (checkWin(game.botShots, game.playerBoard)) {
    await ctx.reply('😢 Бот победил! Все ваши корабли потоплены!');
    games.delete(userId);
    return;
  }
  
  // Отчет о ходе бота
  await ctx.reply(
    `🤖 Бот выстрелил в ${coord} - ` +
    `${isHit ? '💥 Попадание!' : '🌊 Мимо!'}\n` +
    `Ваше поле:\n${renderBoardHit(game.playerBoard, game.botShots)}`
  );
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

// Вебхук
app.use(bot.webhookCallback('/webhook'));
bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);

app.get('/', (req, res) => {
  res.send('ShipWreker Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
