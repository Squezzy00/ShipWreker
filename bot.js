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

// Создание клавиатуры для стрельбы
function getShootingKeyboard() {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const keyboard = [];
  
  // Добавляем строку с цифрами
  const headerRow = [Markup.button.callback(' ', 'none')];
  for (let i = 1; i <= 10; i++) {
    headerRow.push(Markup.button.callback(i.toString(), 'none'));
  }
  keyboard.push(headerRow);
  
  // Добавляем строки с буквами и кнопками
  for (let y = 0; y < 10; y++) {
    const row = [Markup.button.callback(letters[y], 'none')];
    for (let x = 1; x <= 10; x++) {
      const coord = `${letters[y]}${x}`;
      row.push(Markup.button.callback('🌊', `shoot_${coord}`));
    }
    keyboard.push(row);
  }
  
  return Markup.inlineKeyboard(keyboard);
}

// Отображение поля с подписями
function formatBoard(board) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  let result = '  1 2 3 4 5 6 7 8 9 10\n';
  
  for (let y = 0; y < 10; y++) {
    result += letters[y] + ' ';
    for (let x = 0; x < 10; x++) {
      result += board[y][x] === 1 ? '🚢 ' : '🌊 ';
    }
    result += '\n';
  }
  
  return `<pre>${result}</pre>`;
}

// Команда /playbot
bot.command('playbot', async (ctx) => {
  try {
    const playerBoard = generateBoard();
    const botBoard = generateBoard();
    
    await ctx.replyWithHTML('🎮 <b>Игра началась!</b>\nВаше поле:');
    await ctx.replyWithHTML(formatBoard(playerBoard));
    await ctx.reply('Стреляйте по полю противника:', getShootingKeyboard());
  } catch (err) {
    console.error('Playbot error:', err);
    ctx.reply('❌ Ошибка начала игры');
  }
});

// Обработка выстрелов
bot.action(/^shoot_/, async (ctx) => {
  const coord = ctx.match[0].replace('shoot_', '');
  await ctx.answerCbQuery(`Выстрел в ${coord}`);
  // Здесь будет логика обработки выстрела
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
