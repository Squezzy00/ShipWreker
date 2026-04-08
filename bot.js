require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();
const schedule = require('node-schedule');

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
    console.error('❌ BOT_TOKEN не найден!');
    console.log('📝 Создай файл .env с содержимым: BOT_TOKEN=твой_токен');
    process.exit(1);
}

const bot = new Telegraf(TOKEN);

// ========== КОНФИГУРАЦИЯ ==========
const ADMINS = {
    owner: {
        name: '👑 Владелец',
        level: 5,
        permissions: ['all'],
        users: [5005387093]
    },
    admin: {
        name: '⚙️ Администратор',
        level: 4,
        permissions: ['ban', 'unban', 'give_money', 'announce', 'set_admin', 'set_vip'],
        users: []
    },
    moderator: {
        name: '🛡️ Модератор',
        level: 3,
        permissions: ['ban', 'unban', 'warn'],
        users: []
    },
    support: {
        name: '🎧 Поддержка',
        level: 2,
        permissions: ['help_users'],
        users: []
    }
};

const BUSINESSES = {
    1: { name: '🏪 Ларёк', income: 50, upgradeCost: 500, emoji: '🏪', defense: 5 },
    2: { name: '🏬 Магазин', income: 150, upgradeCost: 2000, emoji: '🏬', defense: 10 },
    3: { name: '🏢 Супермаркет', income: 400, upgradeCost: 8000, emoji: '🏢', defense: 15 },
    4: { name: '🏙️ ТЦ', income: 1000, upgradeCost: 30000, emoji: '🏙️', defense: 20 },
    5: { name: '🌆 Корпорация', income: 2500, upgradeCost: 100000, emoji: '🌆', defense: 30 },
    6: { name: '🌍 Империя', income: 6000, upgradeCost: 500000, emoji: '🌍', defense: 40 },
    7: { name: '🚀 Космическая', income: 15000, upgradeCost: 2000000, emoji: '🚀', defense: 50 },
    8: { name: '✨ Божественная', income: 50000, upgradeCost: 5000000, emoji: '✨', defense: 70 },
    9: { name: '👑 Легендарная', income: 150000, upgradeCost: 15000000, emoji: '👑', defense: 100 },
    10: { name: '💎 Абсолют', income: 500000, upgradeCost: null, emoji: '💎', defense: 150 }
};

const UPGRADES = {
    manager: { name: '👔 Менеджер', cost: 2000, incomeBonus: 0.20, defenseBonus: 5 },
    advertising: { name: '📢 Реклама', cost: 1500, incomeBonus: 0.15, defenseBonus: 0 },
    security: { name: '🛡️ Охрана', cost: 3000, incomeBonus: 0, defenseBonus: 20 },
    marketing: { name: '📊 Маркетинг', cost: 5000, incomeBonus: 0.25, defenseBonus: 0 },
    armored: { name: '🚛 Бронированный', cost: 10000, incomeBonus: 0, defenseBonus: 40 },
    hacker: { name: '💻 Хакер', cost: 15000, incomeBonus: 0, attackBonus: 30 }
};

const VIP_STATUSES = {
    bronze: { name: '🥉 Бронза', price: 50000, bonusIncome: 5, bonusDefense: 10, emoji: '🥉' },
    silver: { name: '🥈 Серебро', price: 150000, bonusIncome: 10, bonusDefense: 20, emoji: '🥈' },
    gold: { name: '🥇 Золото', price: 500000, bonusIncome: 20, bonusDefense: 35, emoji: '🥇' },
    platinum: { name: '💎 Платина', price: 1500000, bonusIncome: 35, bonusDefense: 50, emoji: '💎' },
    diamond: { name: '✨ Алмаз', price: 5000000, bonusIncome: 50, bonusDefense: 75, emoji: '✨' }
};

// ========== КЛЕШНИ (NFT) ==========
const CLAWS = {
    1: { name: '🦀 Клешня новичка', rarity: 'common', price: 1000, attackBonus: 5, defenseBonus: 5, emoji: '🦀' },
    2: { name: '🦞 Стальная клешня', rarity: 'rare', price: 5000, attackBonus: 15, defenseBonus: 10, emoji: '🦞' },
    3: { name: '🦂 Золотая клешня', rarity: 'epic', price: 25000, attackBonus: 30, defenseBonus: 25, emoji: '🦂' },
    4: { name: '🐉 Драконья клешня', rarity: 'legendary', price: 100000, attackBonus: 60, defenseBonus: 50, emoji: '🐉' },
    5: { name: '👑 Королевская клешня', rarity: 'mythic', price: 500000, attackBonus: 120, defenseBonus: 100, emoji: '👑' },
    6: { name: '✨ Божественная клешня', rarity: 'divine', price: 2500000, attackBonus: 250, defenseBonus: 200, emoji: '✨' }
};

const RARITY_COLORS = {
    common: '⚪',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠',
    mythic: '🔴',
    divine: '🌈'
};

// ========== КОЛЛЕКЦИИ ==========
const COLLECTIONS = {
    pirate: {
        name: '🏴‍☠️ ПИРАТСКАЯ КОЛЛЕКЦИЯ',
        items: ['🗡️ Пиратский меч', '🏴‍☠️ Череп', '⚓ Якорь', '📜 Карта сокровищ'],
        reward: 50000,
        bonus: 'Пиратская удача +15% к доходу'
    },
    magic: {
        name: '🔮 МАГИЧЕСКАЯ КОЛЛЕКЦИЯ',
        items: ['🔮 Хрустальный шар', '⚡ Волшебная палочка', '📖 Книга заклинаний', '🧪 Зелье мудрости'],
        reward: 75000,
        bonus: 'Магическая защита +20% к защите'
    },
    space: {
        name: '🚀 КОСМИЧЕСКАЯ КОЛЛЕКЦИЯ',
        items: ['🛸 Летающая тарелка', '⭐ Звезда', '🌙 Лунный камень', '☄️ Метеорит'],
        reward: 100000,
        bonus: 'Космическая атака +25% к атаке'
    }
};

// ========== НОВАЯ СИСТЕМА 3: ПОДЗЕМЕЛЬЯ (DUNGEONS) ==========
const DUNGEONS = {
    1: {
        name: '🏚️ Заброшенная шахта',
        level: 1,
        minLevel: 1,
        enemies: ['Крыса', 'Гоблин', 'Скелет'],
        rewards: [500, 1000, 1500],
        expReward: 10,
        cooldown: 30
    },
    2: {
        name: '🌲 Тёмный лес',
        level: 2,
        minLevel: 3,
        enemies: ['Волк', 'Тролль', 'Лесной дух'],
        rewards: [2000, 4000, 6000],
        expReward: 25,
        cooldown: 45
    },
    3: {
        name: '🏰 Замок вампира',
        level: 3,
        minLevel: 5,
        enemies: ['Вампир', 'Призрак', 'Оборотень'],
        rewards: [8000, 15000, 25000],
        expReward: 50,
        cooldown: 60
    },
    4: {
        name: '🐉 Логово дракона',
        level: 4,
        minLevel: 8,
        enemies: ['Малый дракон', 'Огненный дракон', 'Древний дракон'],
        rewards: [30000, 60000, 100000],
        expReward: 100,
        cooldown: 120
    }
};

// ========== НОВАЯ СИСТЕМА 4: КОСМИЧЕСКИЕ БИТВЫ ==========
const SPACE_ZONES = {
    1: {
        name: '🌍 Околоземная орбита',
        level: 1,
        enemies: ['Космический мусор', 'Спутник-шпион'],
        rewards: [1000, 2000],
        expReward: 5
    },
    2: {
        name: '🌕 Лунная база',
        level: 2,
        enemies: ['Лунный робот', 'Инопланетный разведчик'],
        rewards: [5000, 10000],
        expReward: 15
    },
    3: {
        name: '🪐 Пояс астероидов',
        level: 3,
        enemies: ['Космический пират', 'Астероид-убийца'],
        rewards: [20000, 40000],
        expReward: 35
    },
    4: {
        name: '👽 Зона 51',
        level: 4,
        enemies: ['Серый пришелец', 'Инопланетный корабль'],
        rewards: [75000, 150000],
        expReward: 75
    },
    5: {
        name: '🌌 Центр галактики',
        level: 5,
        enemies: ['Чёрная дыра', 'Звёздный разрушитель'],
        rewards: [250000, 500000],
        expReward: 150
    }
};

// ========== БАЗА ДАННЫХ ==========
const db = new sqlite3.Database('business.db');

db.serialize(() => {
    // Пользователи
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        balance INTEGER DEFAULT 1000,
        business_level INTEGER DEFAULT 1,
        last_collect TEXT,
        total_earned INTEGER DEFAULT 0,
        total_collects INTEGER DEFAULT 0,
        manager INTEGER DEFAULT 0,
        advertising INTEGER DEFAULT 0,
        security INTEGER DEFAULT 0,
        marketing INTEGER DEFAULT 0,
        armored INTEGER DEFAULT 0,
        hacker INTEGER DEFAULT 0,
        last_daily TEXT,
        streak INTEGER DEFAULT 0,
        attacks_won INTEGER DEFAULT 0,
        defenses_won INTEGER DEFAULT 0,
        vip_level TEXT DEFAULT 'none',
        banned INTEGER DEFAULT 0,
        warn_count INTEGER DEFAULT 0,
        register_date TEXT,
        equipped_claw INTEGER DEFAULT 0,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_dungeon TEXT,
        last_space TEXT
    )`);
    
    // Клешни
    db.run(`CREATE TABLE IF NOT EXISTS user_claws (
        user_id INTEGER,
        claw_id INTEGER,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, claw_id)
    )`);
    
    // Коллекции
    db.run(`CREATE TABLE IF NOT EXISTS user_collections (
        user_id INTEGER,
        collection_id TEXT,
        items_collected INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, collection_id)
    )`);
    
    // Админы
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        user_id INTEGER PRIMARY KEY,
        role TEXT DEFAULT 'helper',
        appointed_by INTEGER,
        appointed_at TEXT
    )`);
    
    // Добавляем владельца
    db.run(`INSERT OR IGNORE INTO admins (user_id, role, appointed_by, appointed_at) 
            VALUES (5005387093, 'owner', 5005387093, datetime('now'))`);
});

// ========== ФУНКЦИИ ==========
async function getUser(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function getGameId(userId) {
    const user = await getUser(userId);
    return user ? user.id : null;
}

async function registerUser(userId) {
    const existing = await getUser(userId);
    if (existing) return existing.id;
    
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        db.run(`INSERT INTO users (user_id, last_collect, last_daily, register_date) 
                VALUES (?, ?, ?, ?)`, [userId, now, now, now], function(err) {
            if (err) reject(err);
            else {
                if (this.lastID === 1) {
                    db.run('UPDATE users SET balance = 1000000 WHERE user_id = ?', [userId]);
                }
                resolve(this.lastID);
            }
        });
    });
}

async function updateBalance(userId, amount) {
    const user = await getUser(userId);
    if (!user) return;
    
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
            [amount, Math.max(amount, 0), userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function addExp(userId, exp) {
    const user = await getUser(userId);
    if (!user) return;
    
    let newExp = user.exp + exp;
    let newLevel = user.level;
    let expNeeded = newLevel * 100;
    
    while (newExp >= expNeeded) {
        newExp -= expNeeded;
        newLevel++;
        expNeeded = newLevel * 100;
        await updateBalance(userId, newLevel * 1000);
    }
    
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET exp = ?, level = ? WHERE user_id = ?', [newExp, newLevel, userId], (err) => {
            if (err) reject(err);
            else resolve({ newExp, newLevel, leveledUp: newLevel > user.level });
        });
    });
}

async function addClaw(userId, clawId, quantity = 1) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO user_claws (user_id, claw_id, quantity) 
                VALUES (?, ?, COALESCE((SELECT quantity FROM user_claws WHERE user_id = ? AND claw_id = ?), 0) + ?)`,
                [userId, clawId, userId, clawId, quantity], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getUserClaws(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT claw_id, quantity FROM user_claws WHERE user_id = ?', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function equipClaw(userId, clawId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET equipped_claw = ? WHERE user_id = ?', [clawId, userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getAdminRole(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT role FROM admins WHERE user_id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.role : null);
        });
    });
}

async function hasPermission(userId, permission) {
    const role = await getAdminRole(userId);
    if (!role) return false;
    const roleData = ADMINS[role];
    if (!roleData) return false;
    return roleData.permissions.includes('all') || roleData.permissions.includes(permission);
}

function calculateIncome(user) {
    const level = user.business_level;
    const business = BUSINESSES[level];
    let multiplier = 1.0;
    
    if (user.manager) multiplier += 0.20;
    if (user.advertising) multiplier += 0.15;
    if (user.marketing) multiplier += 0.25;
    
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        multiplier += VIP_STATUSES[user.vip_level].bonusIncome / 100;
    }
    
    return Math.floor(business.income * multiplier);
}

function calculateDefense(user) {
    const level = user.business_level;
    let defense = BUSINESSES[level].defense;
    
    if (user.manager) defense += 5;
    if (user.security) defense += 20;
    if (user.armored) defense += 40;
    
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        defense += VIP_STATUSES[user.vip_level].bonusDefense;
    }
    
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        defense += CLAWS[user.equipped_claw].defenseBonus;
    }
    
    return defense;
}

function calculateAttack(user) {
    let attack = 10 + (user.business_level * 3);
    if (user.hacker) attack += 30;
    
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        attack += CLAWS[user.equipped_claw].attackBonus;
    }
    
    return attack;
}

function calculatePlayerLevel(user) {
    return user.level;
}

// ========== КЛАВИАТУРА ==========
function mainKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 Баланс', 'balance'), Markup.button.callback('🏪 Бизнес', 'business')],
        [Markup.button.callback('💼 Собрать', 'collect'), Markup.button.callback('📈 Магазин', 'upgrades')],
        [Markup.button.callback('⚔️ Атака', 'attack'), Markup.button.callback('🛡️ Защита', 'protect')],
        [Markup.button.callback('🎁 Бонус', 'daily'), Markup.button.callback('👑 VIP', 'vip')],
        [Markup.button.callback('🦀 Клешни', 'claws'), Markup.button.callback('📦 Коллекции', 'collections')],
        [Markup.button.callback('🏰 Подземелье', 'dungeons'), Markup.button.callback('🚀 Космос', 'space')],
        [Markup.button.callback('📊 Топ', 'top'), Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== КОМАНДЫ ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const gameId = await registerUser(userId);
    const user = await getUser(userId);
    
    const text = `🦀 *CRYPTO EMPIRE: БИТВА КЛЕШНЕЙ* 🦀\n\n` +
                 `✨ *Твой ID:* #${gameId}\n` +
                 `🎚️ *Уровень:* ${user.level}\n` +
                 `💰 *Баланс:* ${user.balance.toLocaleString()} монет\n\n` +
                 `📌 *Любую команду можно вводить без /*\n` +
                 `🔥 *Доступные команды:*\n` +
                 `• баланс, б - баланс\n` +
                 `• бизнес, биз - бизнес\n` +
                 `• собрать - доход\n` +
                 `• атака @ник - атаковать\n` +
                 `• защита 24 - купить защиту\n` +
                 `• клешни - твои клешни\n` +
                 `• коллекции - коллекции\n` +
                 `• подземелье - пройти подземелье\n` +
                 `• космос - космические битвы\n` +
                 `• топ - топ игроков\n` +
                 `• гет @ник - информация\n` +
                 `• админ - админ панель\n\n` +
                 `👇 *Используй кнопки!*`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// ========== ПОДЗЕМЕЛЬЯ ==========
async function dungeonFight(userId, dungeonId) {
    const user = await getUser(userId);
    const dungeon = DUNGEONS[dungeonId];
    
    if (!dungeon) return null;
    if (user.level < dungeon.minLevel) {
        return { error: `❌ Требуется ${dungeon.minLevel} уровень! У тебя ${user.level}` };
    }
    
    const lastDungeon = user.last_dungeon ? new Date(user.last_dungeon) : new Date(0);
    const cooldownRemaining = (lastDungeon.getTime() + dungeon.cooldown * 60000) - Date.now();
    if (cooldownRemaining > 0) {
        const minutes = Math.ceil(cooldownRemaining / 60000);
        return { error: `⏳ Подожди ${minutes} минут перед следующим заходом!` };
    }
    
    const enemyIndex = Math.floor(Math.random() * dungeon.enemies.length);
    const enemy = dungeon.enemies[enemyIndex];
    const reward = dungeon.rewards[Math.floor(Math.random() * dungeon.rewards.length)];
    const expReward = dungeon.expReward;
    
    const win = Math.random() > 0.3;
    
    if (win) {
        await updateBalance(userId, reward);
        const expResult = await addExp(userId, expReward);
        
        db.run('UPDATE users SET last_dungeon = ? WHERE user_id = ?', [new Date().toISOString(), userId]);
        
        let text = `🏆 *ПОБЕДА!* 🏆\n\n`;
        text += `⚔️ Ты победил ${enemy}!\n`;
        text += `💰 Награда: +${reward.toLocaleString()} монет\n`;
        text += `✨ Опыт: +${expReward}\n`;
        
        if (expResult.leveledUp) {
            text += `\n🎉 *УРОВЕНЬ ПОВЫШЕН!* Теперь ${expResult.newLevel} уровень! 🎉\n`;
            text += `💰 +${expResult.newLevel * 1000} монет за повышение!`;
        }
        
        return { success: true, text };
    } else {
        const penalty = Math.floor(reward * 0.3);
        await updateBalance(userId, -penalty);
        db.run('UPDATE users SET last_dungeon = ? WHERE user_id = ?', [new Date().toISOString(), userId]);
        
        return { success: false, text: `💀 *ПОРАЖЕНИЕ!* 💀\n\nТы проиграл ${enemy}!\n💔 Потеряно: ${penalty.toLocaleString()} монет` };
    }
}

// ========== КОСМИЧЕСКИЕ БИТВЫ ==========
async function spaceBattle(userId, zoneId) {
    const user = await getUser(userId);
    const zone = SPACE_ZONES[zoneId];
    
    if (!zone) return null;
    if (user.level < zone.level) {
        return { error: `❌ Требуется ${zone.level} уровень для этой зоны!` };
    }
    
    const lastSpace = user.last_space ? new Date(user.last_space) : new Date(0);
    if ((Date.now() - lastSpace.getTime()) < 600000) {
        const minutes = Math.ceil((600000 - (Date.now() - lastSpace.getTime())) / 60000);
        return { error: `⏳ Отдыхай ${minutes} минут перед следующим боем!` };
    }
    
    const enemyIndex = Math.floor(Math.random() * zone.enemies.length);
    const enemy = zone.enemies[enemyIndex];
    const reward = zone.rewards[Math.floor(Math.random() * zone.rewards.length)];
    
    const attack = calculateAttack(user);
    const win = attack + Math.random() * 50 > 50 + Math.random() * 50;
    
    if (win) {
        await updateBalance(userId, reward);
        const expResult = await addExp(userId, zone.expReward);
        
        db.run('UPDATE users SET last_space = ? WHERE user_id = ?', [new Date().toISOString(), userId]);
        
        let text = `🚀 *КОСМИЧЕСКАЯ ПОБЕДА!* 🚀\n\n`;
        text += `🛸 Ты уничтожил ${enemy}!\n`;
        text += `💰 Награда: +${reward.toLocaleString()} монет\n`;
        text += `✨ Опыт: +${zone.expReward}\n`;
        
        if (expResult.leveledUp) {
            text += `\n🎉 *УРОВЕНЬ ПОВЫШЕН!* Теперь ${expResult.newLevel} уровень! 🎉`;
        }
        
        return { success: true, text };
    } else {
        const penalty = Math.floor(reward * 0.2);
        await updateBalance(userId, -penalty);
        db.run('UPDATE users SET last_space = ? WHERE user_id = ?', [new Date().toISOString(), userId]);
        
        return { success: false, text: `💥 *КОСМИЧЕСКОЕ ПОРАЖЕНИЕ!* 💥\n\n👽 Ты проиграл ${enemy}!\n💔 Потеряно: ${penalty.toLocaleString()} монет` };
    }
}

// ========== ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ЛЮБЫХ КОМАНД ==========
async function handleAnyCommand(ctx, commandName, args) {
    const userId = ctx.from.id;
    
    switch(commandName) {
        case 'баланс': case 'б': case 'деньги': case 'balance':
            const user = await getUser(userId);
            if (!user) { await ctx.reply('❌ Напиши /start'); return; }
            const gameId = await getGameId(userId);
            await ctx.reply(`💰 *БАЛАНС*\n\n🆔 #${gameId}\n🎚️ Уровень: ${user.level}\n💵 ${user.balance.toLocaleString()} монет\n⚔️ Атак: ${user.attacks_won}\n🛡️ Защит: ${user.defenses_won}`, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'бизнес': case 'биз': case 'business':
            const userBiz = await getUser(userId);
            if (!userBiz) { await ctx.reply('❌ Напиши /start'); return; }
            const business = BUSINESSES[userBiz.business_level];
            const income = calculateIncome(userBiz);
            await ctx.reply(`${business.emoji} *${business.name}* (ур.${userBiz.business_level}/10)\n💵 Доход: ${income.toLocaleString()}\n⬆️ Апгрейд: ${business.upgradeCost?.toLocaleString() || 'MAX'}`, { parse_mode: 'Markdown' });
            break;
            
        case 'собрать': case 'collect':
            await ctx.reply('💼 Сбор дохода (скоро появится!)', { ...mainKeyboard() });
            break;
            
        case 'атака': case 'attack':
            if (args.length > 0) {
                await ctx.reply(`⚔️ Атака на ${args[0]} (в разработке)`);
            } else {
                await ctx.reply('❌ Использование: атака @username');
            }
            break;
            
        case 'защита': case 'protect':
            if (args.length > 0 && !isNaN(parseInt(args[0]))) {
                await ctx.reply(`🛡️ Защита куплена на ${args[0]} часов! (в разработке)`);
            } else {
                await ctx.reply('❌ Использование: защита 24');
            }
            break;
            
        case 'клешни': case 'claws':
            const userClaws = await getUser(userId);
            const claws = await getUserClaws(userId);
            let clawsText = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
            if (claws.length === 0) {
                clawsText += `У тебя пока нет клешней!\nКупи в магазине: магазин\n`;
            } else {
                for (const claw of claws) {
                    const clawData = CLAWS[claw.claw_id];
                    clawsText += `${RARITY_COLORS[clawData.rarity]} ${clawData.name} x${claw.quantity}\n`;
                }
                if (userClaws.equipped_claw) {
                    const equipped = CLAWS[userClaws.equipped_claw];
                    clawsText += `\n✨ *Экипировано:* ${equipped.name}`;
                }
            }
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🎒 Магазин клешней', 'shop_claws')],
                [Markup.button.callback('⚔️ Экипировать', 'equip_menu')],
                [Markup.button.callback('🔙 Назад', 'back')]
            ]);
            await ctx.reply(clawsText, { parse_mode: 'Markdown', ...keyboard });
            break;
            
        case 'коллекции': case 'collections':
            let collectionsText = `📦 *КОЛЛЕКЦИИ*\n\nСобирай предметы и получай бонусы!\n\n`;
            for (const [id, col] of Object.entries(COLLECTIONS)) {
                collectionsText += `${col.name}\n`;
                collectionsText += `📜 Предметы: ${col.items.join(', ')}\n`;
                collectionsText += `🏆 Награда: ${col.reward.toLocaleString()} монет\n`;
                collectionsText += `✨ Бонус: ${col.bonus}\n\n`;
            }
            await ctx.reply(collectionsText, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'подземелье': case 'dungeon': case 'данжен':
            const userDungeon = await getUser(userId);
            if (!userDungeon) { await ctx.reply('❌ Напиши /start'); return; }
            
            let dungeonText = `🏰 *ПОДЗЕМЕЛЬЯ*\n\n`;
            for (const [id, dng] of Object.entries(DUNGEONS)) {
                const unlocked = userDungeon.level >= dng.minLevel;
                dungeonText += `${unlocked ? '✅' : '🔒'} *${dng.name}*\n`;
                dungeonText += `   🎚️ Требуемый уровень: ${dng.minLevel}\n`;
                dungeonText += `   💰 Награда: до ${Math.max(...dng.rewards).toLocaleString()} монет\n`;
                if (unlocked) {
                    dungeonText += `   🎮 *Пройти: подземелье ${id}*\n`;
                }
                dungeonText += `\n`;
            }
            const dungeonKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🏚️ Шахта (ур.1)', 'dungeon_1')],
                [Markup.button.callback('🌲 Тёмный лес (ур.3)', 'dungeon_2')],
                [Markup.button.callback('🏰 Замок (ур.5)', 'dungeon_3')],
                [Markup.button.callback('🐉 Логово (ур.8)', 'dungeon_4')],
                [Markup.button.callback('🔙 Назад', 'back')]
            ]);
            await ctx.reply(dungeonText, { parse_mode: 'Markdown', ...dungeonKeyboard });
            break;
            
        case 'подземелье1': case 'dungeon_1':
            const result1 = await dungeonFight(userId, 1);
            await ctx.reply(result1.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'подземелье2': case 'dungeon_2':
            const result2 = await dungeonFight(userId, 2);
            await ctx.reply(result2.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'подземелье3': case 'dungeon_3':
            const result3 = await dungeonFight(userId, 3);
            await ctx.reply(result3.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'подземелье4': case 'dungeon_4':
            const result4 = await dungeonFight(userId, 4);
            await ctx.reply(result4.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'космос': case 'space':
            const userSpace = await getUser(userId);
            if (!userSpace) { await ctx.reply('❌ Напиши /start'); return; }
            
            let spaceText = `🚀 *КОСМИЧЕСКИЕ БИТВЫ*\n\n`;
            for (const [id, zone] of Object.entries(SPACE_ZONES)) {
                const unlocked = userSpace.level >= zone.level;
                spaceText += `${unlocked ? '✅' : '🔒'} *${zone.name}*\n`;
                spaceText += `   🎚️ Требуемый уровень: ${zone.level}\n`;
                spaceText += `   💰 Награда: до ${Math.max(...zone.rewards).toLocaleString()} монет\n`;
                if (unlocked) {
                    spaceText += `   🎮 *Битва: космос ${id}*\n`;
                }
                spaceText += `\n`;
            }
            const spaceKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🌍 Орбита (ур.1)', 'space_1')],
                [Markup.button.callback('🌕 Луна (ур.2)', 'space_2')],
                [Markup.button.callback('🪐 Астероиды (ур.3)', 'space_3')],
                [Markup.button.callback('👽 Зона 51 (ур.4)', 'space_4')],
                [Markup.button.callback('🌌 Центр (ур.5)', 'space_5')],
                [Markup.button.callback('🔙 Назад', 'back')]
            ]);
            await ctx.reply(spaceText, { parse_mode: 'Markdown', ...spaceKeyboard });
            break;
            
        case 'космос1': case 'space_1':
            const battle1 = await spaceBattle(userId, 1);
            await ctx.reply(battle1.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'космос2': case 'space_2':
            const battle2 = await spaceBattle(userId, 2);
            await ctx.reply(battle2.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'космос3': case 'space_3':
            const battle3 = await spaceBattle(userId, 3);
            await ctx.reply(battle3.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'космос4': case 'space_4':
            const battle4 = await spaceBattle(userId, 4);
            await ctx.reply(battle4.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'космос5': case 'space_5':
            const battle5 = await spaceBattle(userId, 5);
            await ctx.reply(battle5.text, { parse_mode: 'Markdown', ...mainKeyboard() });
            break;
            
        case 'топ': case 'top':
            db.all('SELECT id, balance, level FROM users ORDER BY balance DESC LIMIT 10', (err, rows) => {
                if (err) return;
                let text = '🏆 *ТОП 10 БОГАЧЕЙ* 🏆\n\n';
                rows.forEach((row, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
                    text += `${medal} #${row.id} | Ур.${row.level} | ${row.balance.toLocaleString()} монет\n`;
                });
                ctx.reply(text, { parse_mode: 'Markdown' });
            });
            break;
            
        case 'гет': case 'get': case 'info':
            if (args.length > 0) {
                const target = args[0];
                if (target.startsWith('@')) {
                    try {
                        const chat = await ctx.telegram.getChat(target);
                        const userInfo = await getUser(chat.id);
                        if (userInfo) {
                            const gid = await getGameId(chat.id);
                            await ctx.reply(`📊 *ИНФО*\n🆔 #${gid}\n🎚️ Уровень: ${userInfo.level}\n💰 Баланс: ${userInfo.balance.toLocaleString()}\n🏪 Уровень бизнеса: ${userInfo.business_level}/10`, { parse_mode: 'Markdown' });
                        } else {
                            await ctx.reply('❌ Игрок не найден');
                        }
                    } catch(e) { await ctx.reply('❌ Пользователь не найден'); }
                } else if (/^\d+$/.test(target)) {
                    const userInfo = await getUserById(parseInt(target));
                    if (userInfo) {
                        await ctx.reply(`📊 *ИНФО*\n🆔 #${target}\n🎚️ Уровень: ${userInfo.level}\n💰 Баланс: ${userInfo.balance.toLocaleString()}\n🏪 Уровень бизнеса: ${userInfo.business_level}/10`, { parse_mode: 'Markdown' });
                    } else {
                        await ctx.reply('❌ Игрок не найден');
                    }
                }
            } else {
                await ctx.reply('❌ Использование: гет @username или гет 15');
            }
            break;
            
        case 'админ': case 'ahelp': case 'ахелп': case 'акмд':
            const role = await getAdminRole(userId);
            if (!role) {
                await ctx.reply('❌ Нет прав!');
                return;
            }
            const roleData = ADMINS[role];
            let adminText = `🛡️ *АДМИН ПАНЕЛЬ*\n👑 Роль: ${roleData.name}\n\n📋 Команды:\n`;
            if (roleData.permissions.includes('all') || roleData.permissions.includes('ban')) adminText += `• забанить @ник - бан\n`;
            if (roleData.permissions.includes('all') || roleData.permissions.includes('give_money')) adminText += `• выдать @ник сумма - выдать монеты\n`;
            if (roleData.permissions.includes('all') || roleData.permissions.includes('announce')) adminText += `• объявить текст - объявление\n`;
            if (roleData.permissions.includes('all') || roleData.permissions.includes('set_admin')) adminText += `• назначить @ник роль - назначить админа\n`;
            await ctx.reply(adminText, { parse_mode: 'Markdown' });
            break;
            
        case 'забанить': case 'ban':
            if (!await hasPermission(userId, 'ban')) { await ctx.reply('❌ Нет прав'); return; }
            if (args.length > 0) {
                await ctx.reply(`✅ Игрок ${args[0]} забанен (демо)`);
            } else {
                await ctx.reply('❌ Использование: забанить @ник');
            }
            break;
            
        case 'выдать': case 'give':
            if (!await hasPermission(userId, 'give_money')) { await ctx.reply('❌ Нет прав'); return; }
            if (args.length >= 2) {
                await ctx.reply(`✅ Выдано ${args[1]} монет игроку ${args[0]} (демо)`);
            } else {
                await ctx.reply('❌ Использование: выдать @ник сумма');
            }
            break;
            
        case 'объявить': case 'announce':
            if (!await hasPermission(userId, 'announce')) { await ctx.reply('❌ Нет прав'); return; }
            if (args.length > 0) {
                const msg = args.join(' ');
                await ctx.reply(`📢 ОБЪЯВЛЕНИЕ: ${msg}`);
            } else {
                await ctx.reply('❌ Использование: объявить текст');
            }
            break;
            
        case 'назначить': case 'setadmin':
            if (!await hasPermission(userId, 'set_admin')) { await ctx.reply('❌ Нет прав'); return; }
            if (args.length >= 2) {
                await ctx.reply(`✅ Игрок ${args[0]} назначен на роль ${args[1]} (демо)`);
            } else {
                await ctx.reply('❌ Использование: назначить @ник роль');
            }
            break;
            
        case 'магазин': case 'shop':
            let shopText = `🎒 *МАГАЗИН КЛЕШНЕЙ*\n\n`;
            for (const [id, claw] of Object.entries(CLAWS)) {
                const rarityColor = RARITY_COLORS[claw.rarity];
                shopText += `${rarityColor} *${claw.name}*\n`;
                shopText += `💰 Цена: ${claw.price.toLocaleString()} монет\n`;
                shopText += `⚔️ +${claw.attackBonus} атаки | 🛡️ +${claw.defenseBonus} защиты\n`;
                shopText += `📦 Редкость: ${claw.rarity}\n\n`;
            }
            const shopKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🛒 Купить клешню 1', 'buy_claw_1')],
                [Markup.button.callback('🛒 Купить клешню 2', 'buy_claw_2')],
                [Markup.button.callback('🛒 Купить клешню 3', 'buy_claw_3')],
                [Markup.button.callback('🛒 Купить клешню 4', 'buy_claw_4')],
                [Markup.button.callback('🛒 Купить клешню 5', 'buy_claw_5')],
                [Markup.button.callback('🛒 Купить клешню 6', 'buy_claw_6')],
                [Markup.button.callback('🔙 Назад', 'back')]
            ]);
            await ctx.reply(shopText, { parse_mode: 'Markdown', ...shopKeyboard });
            break;
            
        case 'помощь': case 'help': case 'хелп':
            await ctx.reply(`📚 *ПОМОЩЬ*\n\n` +
                `💰 баланс, б - баланс\n` +
                `🏪 бизнес, биз - бизнес\n` +
                `💼 собрать - доход\n` +
                `⚔️ атака @ник - атака\n` +
                `🛡️ защита 24 - защита\n` +
                `🦀 клешни - твои клешни\n` +
                `📦 коллекции - коллекции\n` +
                `🏰 подземелье - подземелья (опыт, монеты)\n` +
                `🚀 космос - космические битвы\n` +
                `📊 топ - топ игроков\n` +
                `🔍 гет @ник - информация\n` +
                `🛡️ админ - админ панель\n` +
                `🎁 магазин - магазин клешней\n\n` +
                `*Любую команду можно вводить без /*`, { parse_mode: 'Markdown' });
            break;
            
        default:
            break;
    }
}

// ========== КНОПКИ ==========
bot.action('balance', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const gameId = await getGameId(userId);
    await ctx.editMessageText(`💰 *БАЛАНС*\n\n🆔 #${gameId}\n🎚️ Уровень: ${user?.level || 1}\n💵 ${user?.balance.toLocaleString() || 0} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('claws', async (ctx) => {
    const userId = ctx.from.id;
    const claws = await getUserClaws(userId);
    const user = await getUser(userId);
    let text = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
    if (claws.length === 0) {
        text += `У тебя пока нет клешней!\nКупи в магазине: магазин`;
    } else {
        for (const claw of claws) {
            const clawData = CLAWS[claw.claw_id];
            text += `${RARITY_COLORS[clawData.rarity]} ${clawData.name} x${claw.quantity}\n`;
        }
        if (user?.equipped_claw) {
            const equipped = CLAWS[user.equipped_claw];
            text += `\n✨ *Экипировано:* ${equipped.name}`;
        }
    }
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🎒 Магазин', 'shop_menu')],
        [Markup.button.callback('🔙 Назад', 'back')]
    ]);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    await ctx.answerCbQuery();
});

bot.action('shop_menu', async (ctx) => {
    let text = `🎒 *МАГАЗИН КЛЕШНЕЙ*\n\n`;
    for (const [id, claw] of Object.entries(CLAWS)) {
        text += `${RARITY_COLORS[claw.rarity]} *${claw.name}*\n💰 ${claw.price.toLocaleString()} монет\n⚔️ +${claw.attackBonus} | 🛡️ +${claw.defenseBonus}\n\n`;
    }
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🛒 1', 'buy_claw_1'), Markup.button.callback('🛒 2', 'buy_claw_2'), Markup.button.callback('🛒 3', 'buy_claw_3')],
        [Markup.button.callback('🛒 4', 'buy_claw_4'), Markup.button.callback('🛒 5', 'buy_claw_5'), Markup.button.callback('🛒 6', 'buy_claw_6')],
        [Markup.button.callback('🔙 Назад', 'claws')]
    ]);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    await ctx.answerCbQuery();
});

for (let i = 1; i <= 6; i++) {
    bot.action(`buy_claw_${i}`, async (ctx) => {
        const userId = ctx.from.id;
        const claw = CLAWS[i];
        const user = await getUser(userId);
        
        if (user.balance >= claw.price) {
            await updateBalance(userId, -claw.price);
            await addClaw(userId, i);
            await ctx.answerCbQuery(`✅ Куплено! +${claw.name}`);
            await ctx.editMessageText(`✅ *Покупка успешна!*\n\n${claw.name} добавлен в инвентарь!\n💰 Остаток: ${(user.balance - claw.price).toLocaleString()} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.answerCbQuery(`❌ Не хватает ${(claw.price - user.balance).toLocaleString()} монет!`);
        }
    });
}

bot.action('dungeons', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    let text = `🏰 *ПОДЗЕМЕЛЬЯ*\n\n`;
    for (const [id, dng] of Object.entries(DUNGEONS)) {
        const unlocked = user.level >= dng.minLevel;
        text += `${unlocked ? '✅' : '🔒'} *${dng.name}*\n`;
        text += `   🎚️ Уровень: ${dng.minLevel}\n`;
        text += `   💰 Награда: до ${Math.max(...dng.rewards).toLocaleString()} монет\n\n`;
    }
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏚️ Шахта', 'dungeon_1'), Markup.button.callback('🌲 Лес', 'dungeon_2')],
        [Markup.button.callback('🏰 Замок', 'dungeon_3'), Markup.button.callback('🐉 Логово', 'dungeon_4')],
        [Markup.button.callback('🔙 Назад', 'back')]
    ]);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    await ctx.answerCbQuery();
});

bot.action('space', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    let text = `🚀 *КОСМИЧЕСКИЕ БИТВЫ*\n\n`;
    for (const [id, zone] of Object.entries(SPACE_ZONES)) {
        const unlocked = user.level >= zone.level;
        text += `${unlocked ? '✅' : '🔒'} *${zone.name}*\n`;
        text += `   🎚️ Уровень: ${zone.level}\n`;
        text += `   💰 Награда: до ${Math.max(...zone.rewards).toLocaleString()} монет\n\n`;
    }
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🌍 Орбита', 'space_1'), Markup.button.callback('🌕 Луна', 'space_2')],
        [Markup.button.callback('🪐 Астероиды', 'space_3'), Markup.button.callback('👽 Зона 51', 'space_4')],
        [Markup.button.callback('🌌 Центр', 'space_5')],
        [Markup.button.callback('🔙 Назад', 'back')]
    ]);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    await ctx.answerCbQuery();
});

bot.action(['dungeon_1', 'dungeon_2', 'dungeon_3', 'dungeon_4'], async (ctx) => {
    const userId = ctx.from.id;
    const dungeonId = parseInt(ctx.match[0].split('_')[1]);
    const result = await dungeonFight(userId, dungeonId);
    await ctx.editMessageText(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action(['space_1', 'space_2', 'space_3', 'space_4', 'space_5'], async (ctx) => {
    const userId = ctx.from.id;
    const zoneId = parseInt(ctx.match[0].split('_')[1]);
    const result = await spaceBattle(userId, zoneId);
    await ctx.editMessageText(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('back', async (ctx) => {
    await ctx.editMessageText('🏪 *ГЛАВНОЕ МЕНЮ*', { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action(['business', 'collect', 'upgrades', 'attack', 'protect', 'daily', 'vip', 'top', 'collections', 'help'], async (ctx) => {
    await ctx.answerCbQuery('🚧 В разработке!');
});

// ========== ОБРАБОТКА ЛЮБОГО ТЕКСТА БЕЗ / ==========
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim().toLowerCase();
    const userId = ctx.from.id;
    
    if (text.startsWith('/')) return;
    
    const parts = text.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    const commands = [
        'баланс', 'б', 'деньги', 'balance',
        'бизнес', 'биз', 'business',
        'собрать', 'collect',
        'атака', 'attack',
        'защита', 'protect',
        'клешни', 'claws',
        'коллекции', 'collections',
        'подземелье', 'dungeon', 'данжен',
        'подземелье1', 'подземелье2', 'подземелье3', 'подземелье4',
        'dungeon_1', 'dungeon_2', 'dungeon_3', 'dungeon_4',
        'космос', 'space',
        'космос1', 'космос2', 'космос3', 'космос4', 'космос5',
        'space_1', 'space_2', 'space_3', 'space_4', 'space_5',
        'топ', 'top',
        'гет', 'get', 'info',
        'админ', 'ahelp', 'ахелп', 'акмд',
        'забанить', 'ban',
        'выдать', 'give',
        'объявить', 'announce',
        'назначить', 'setadmin',
        'помощь', 'help', 'хелп',
        'магазин', 'shop'
    ];
    
    if (commands.includes(command)) {
        await handleAnyCommand(ctx, command, args);
    }
});

// ========== ЗАПУСК ==========
bot.launch().then(() => {
    console.log('🦀 CRYPTO EMPIRE: БИТВА КЛЕШНЕЙ ЗАПУЩЕН!');
    console.log('📡 Любую команду можно вводить без /');
    console.log('🎮 Добавлены системы: КЛЕШНИ, КОЛЛЕКЦИИ, ПОДЗЕМЕЛЬЯ, КОСМИЧЕСКИЕ БИТВЫ');
    console.log('✨ Твой ID в игре будет #1 (ты владелец)');
    console.log('💰 Стартовый бонус: 1,000,000 монет');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
