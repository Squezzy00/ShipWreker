const { Telegraf, Markup } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();

const TOKEN = '8693908580:AAHLkw25kJrc3Z6eXrUgVtFFEeJQMWShGTw';

console.log('✅ Токен загружен, запускаю бота...');

const bot = new Telegraf(TOKEN);

// ========== РОЛИ АДМИНОВ (7 УРОВНЕЙ) ==========
const ADMIN_ROLES = {
    owner: { name: '👑 Владелец', level: 7, permissions: ['all'], users: [5005387093] },
    vice_owner: { name: '⚜️ Зам. Владельца', level: 6, permissions: ['all'], users: [] },
    developer: { name: '💻 Разработчик', level: 5, permissions: ['all'], users: [] },
    head_admin: { name: '🔱 Главный Админ', level: 4, permissions: ['ban', 'unban', 'give_money', 'announce', 'set_admin', 'set_vip', 'set_role', 'edit_profile'], users: [] },
    vice_admin: { name: '📌 Зам. Гл. Админа', level: 3, permissions: ['ban', 'unban', 'give_money', 'announce', 'warn'], users: [] },
    moderator: { name: '🛡️ Модератор', level: 2, permissions: ['ban', 'unban', 'warn', 'mute'], users: [] },
    event_manager: { name: '🎉 Ивентовод', level: 1, permissions: ['announce', 'event'], users: [] }
};

// ========== БИЗНЕСЫ ==========
const BUSINESSES = {
    1: { name: '🏪 Ларёк', income: 50, upgradeCost: 500, emoji: '🏪', defense: 5, attack: 3 },
    2: { name: '🏬 Магазин', income: 150, upgradeCost: 2000, emoji: '🏬', defense: 10, attack: 6 },
    3: { name: '🏢 Супермаркет', income: 400, upgradeCost: 8000, emoji: '🏢', defense: 15, attack: 10 },
    4: { name: '🏙️ ТЦ', income: 1000, upgradeCost: 30000, emoji: '🏙️', defense: 20, attack: 15 },
    5: { name: '🌆 Корпорация', income: 2500, upgradeCost: 100000, emoji: '🌆', defense: 30, attack: 22 },
    6: { name: '🌍 Империя', income: 6000, upgradeCost: 500000, emoji: '🌍', defense: 40, attack: 30 },
    7: { name: '🚀 Космическая', income: 15000, upgradeCost: 2000000, emoji: '🚀', defense: 55, attack: 40 },
    8: { name: '✨ Божественная', income: 50000, upgradeCost: 5000000, emoji: '✨', defense: 75, attack: 55 },
    9: { name: '👑 Легендарная', income: 150000, upgradeCost: 15000000, emoji: '👑', defense: 100, attack: 75 },
    10: { name: '💎 Абсолют', income: 500000, upgradeCost: null, emoji: '💎', defense: 150, attack: 100 }
};

// ========== VIP СТАТУСЫ ==========
const VIP_STATUSES = {
    bronze: { name: '🥉 Бронза', price: 50000, bonusIncome: 5, bonusDefense: 10, bonusAttack: 5, gpuMultiplier: 2, emoji: '🥉' },
    silver: { name: '🥈 Серебро', price: 150000, bonusIncome: 10, bonusDefense: 20, bonusAttack: 10, gpuMultiplier: 4, emoji: '🥈' },
    gold: { name: '🥇 Золото', price: 500000, bonusIncome: 20, bonusDefense: 35, bonusAttack: 20, gpuMultiplier: 8, emoji: '🥇' },
    platinum: { name: '💎 Платина', price: 1500000, bonusIncome: 35, bonusDefense: 50, bonusAttack: 35, gpuMultiplier: 16, emoji: '💎' },
    diamond: { name: '✨ Алмаз', price: 5000000, bonusIncome: 50, bonusDefense: 75, bonusAttack: 50, gpuMultiplier: 32, emoji: '✨' }
};

// ========== ДОНАТ (REAL MONEY) ==========
const DONATE_ITEMS = {
    1: { name: '💎 1000 монет', priceUSD: 1, coins: 1000 },
    2: { name: '💎 10000 монет', priceUSD: 8, coins: 10000 },
    3: { name: '💎 100000 монет', priceUSD: 70, coins: 100000 },
    4: { name: '🥉 VIP Бронза', priceUSD: 5, vip: 'bronze' },
    5: { name: '🥈 VIP Серебро', priceUSD: 15, vip: 'silver' },
    6: { name: '🥇 VIP Золото', priceUSD: 50, vip: 'gold' },
    7: { name: '💎 VIP Платина', priceUSD: 150, vip: 'platinum' },
    8: { name: '✨ VIP Алмаз', priceUSD: 500, vip: 'diamond' },
    9: { name: '🦀 Эксклюзивная клешня', priceUSD: 100, exclusiveClaw: true },
    10: { name: '🚗 Эксклюзивная машина', priceUSD: 200, exclusiveCar: true }
};

// ========== МАШИНЫ И ГОНКИ ==========
const CARS = {
    1: { name: '🚗 Жигуль', price: 5000, speed: 20, engineLevel: 1, emoji: '🚗' },
    2: { name: '🏎️ Спорткар', price: 50000, speed: 50, engineLevel: 2, emoji: '🏎️' },
    3: { name: '🏎️ Суперкар', price: 500000, speed: 100, engineLevel: 3, emoji: '🏎️' },
    4: { name: '🦇 Бэтмобиль', price: 5000000, speed: 200, engineLevel: 4, emoji: '🦇' },
    5: { name: '🚀 Ракетомобиль', price: 50000000, speed: 500, engineLevel: 5, emoji: '🚀' }
};

const ENGINE_UPGRADES = {
    1: { name: '⚙️ Двигатель 1 ур.', cost: 10000, speedBonus: 10 },
    2: { name: '⚙️ Двигатель 2 ур.', cost: 50000, speedBonus: 25 },
    3: { name: '⚙️ Двигатель 3 ур.', cost: 250000, speedBonus: 50 },
    4: { name: '⚙️ Двигатель 4 ур.', cost: 1000000, speedBonus: 100 },
    5: { name: '⚙️ Двигатель 5 ур.', cost: 5000000, speedBonus: 200 }
};

// ========== КРИПТОФЕРМА ==========
const BASE_GPU_COUNT = 2500;

// ========== БАЗА ДАННЫХ ==========
const db = new sqlite3.Database('business.db');

db.serialize(() => {
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
        rating INTEGER DEFAULT 1000,
        business_battles_won INTEGER DEFAULT 0,
        gpu_count INTEGER DEFAULT 2500,
        crypto_earned INTEGER DEFAULT 0,
        car_id INTEGER DEFAULT 0,
        car_engine_level INTEGER DEFAULT 0,
        races_won INTEGER DEFAULT 0,
        races_lost INTEGER DEFAULT 0,
        exclusive_claw INTEGER DEFAULT 0,
        exclusive_car INTEGER DEFAULT 0,
        referrer_id INTEGER DEFAULT 0,
        referral_count INTEGER DEFAULT 0,
        referral_earned INTEGER DEFAULT 0,
        race_waiting INTEGER DEFAULT 0,
        race_opponent INTEGER DEFAULT 0
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS user_claws (
        user_id INTEGER,
        claw_id INTEGER,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, claw_id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        user_id INTEGER PRIMARY KEY,
        role TEXT DEFAULT 'helper',
        appointed_by INTEGER,
        appointed_at TEXT
    )`);
    
    // Добавляем владельца
    for (const [role, data] of Object.entries(ADMIN_ROLES)) {
        for (const userId of data.users) {
            db.run(`INSERT OR IGNORE INTO admins (user_id, role, appointed_by, appointed_at) 
                    VALUES (?, ?, ?, datetime('now'))`, [userId, role, 5005387093]);
        }
    }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
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

async function registerUser(userId, referrerId = null) {
    const existing = await getUser(userId);
    if (existing) return existing.id;
    
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        db.run(`INSERT INTO users (user_id, last_collect, last_daily, register_date, referrer_id, gpu_count) 
                VALUES (?, ?, ?, ?, ?, ?)`, [userId, now, now, now, referrerId, BASE_GPU_COUNT], function(err) {
            if (err) reject(err);
            else {
                if (this.lastID === 1) {
                    db.run('UPDATE users SET balance = 1000000 WHERE user_id = ?', [userId]);
                }
                if (referrerId) {
                    db.run('UPDATE users SET referral_count = referral_count + 1, referral_earned = referral_earned + 5000 WHERE user_id = ?', [referrerId]);
                    updateBalance(referrerId, 5000);
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

async function updateRating(userId, delta) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET rating = rating + ? WHERE user_id = ?', [delta, userId], (err) => {
            if (err) reject(err);
            else resolve();
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
    const roleData = ADMIN_ROLES[role];
    if (!roleData) return false;
    return roleData.permissions.includes('all') || roleData.permissions.includes(permission);
}

async function setUserField(userId, field, value) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE users SET ${field} = ? WHERE user_id = ?`, [value, userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
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

function calculateAttack(user) {
    let attack = BUSINESSES[user.business_level].attack + Math.floor(user.rating / 100);
    if (user.hacker) attack += 30;
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        attack += CLAWS[user.equipped_claw].attackBonus;
    }
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        attack += VIP_STATUSES[user.vip_level].bonusAttack;
    }
    if (user.exclusive_claw) attack += 100;
    return attack;
}

function calculateDefense(user) {
    let defense = BUSINESSES[user.business_level].defense;
    if (user.manager) defense += 5;
    if (user.security) defense += 20;
    if (user.armored) defense += 40;
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        defense += CLAWS[user.equipped_claw].defenseBonus;
    }
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        defense += VIP_STATUSES[user.vip_level].bonusDefense;
    }
    return defense;
}

function getGPUCount(user) {
    let multiplier = 1;
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        multiplier = VIP_STATUSES[user.vip_level].gpuMultiplier;
    }
    return BASE_GPU_COUNT * multiplier;
}

function calculateCryptoIncome(user) {
    const gpuCount = getGPUCount(user);
    return Math.floor(gpuCount * 0.5); // 0.5 монеты за видеокарту в час
}

function getCarSpeed(user) {
    if (user.car_id === 0) return 0;
    let speed = CARS[user.car_id]?.speed || 0;
    if (user.car_engine_level > 0 && ENGINE_UPGRADES[user.car_engine_level]) {
        speed += ENGINE_UPGRADES[user.car_engine_level].speedBonus;
    }
    if (user.exclusive_car) speed += 200;
    return speed;
}

// ========== ГОНКИ ==========
let waitingRacers = {};

async function startRace(userId) {
    const user = await getUser(userId);
    if (!user.car_id || user.car_id === 0) {
        return { error: '❌ У тебя нет машины! Купи в /магазин' };
    }
    
    if (waitingRacers[userId]) {
        return { error: '❌ Ты уже в очереди на гонку!' };
    }
    
    // Ищем соперника
    for (const [racerId, racerData] of Object.entries(waitingRacers)) {
        if (racerId != userId && !racerData.found) {
            waitingRacers[racerId].found = true;
            waitingRacers[userId] = { found: true, opponent: racerId, startTime: Date.now() };
            
            const opponent = await getUser(parseInt(racerId));
            const userSpeed = getCarSpeed(user);
            const opponentSpeed = getCarSpeed(opponent);
            
            const userWinChance = userSpeed / (userSpeed + opponentSpeed) * 100;
            const win = Math.random() * 100 < userWinChance;
            
            const prize = 10000;
            
            if (win) {
                await updateBalance(userId, prize);
                await updateBalance(parseInt(racerId), -prize);
                await setUserField(userId, 'races_won', user.races_won + 1);
                await setUserField(parseInt(racerId), 'races_lost', (opponent.races_lost || 0) + 1);
                
                delete waitingRacers[userId];
                delete waitingRacers[racerId];
                
                return { 
                    success: true, 
                    text: `🏁 *ГОНКА ЗАВЕРШЕНА!* 🏁\n\n` +
                          `🏎️ Твоя скорость: ${userSpeed}\n` +
                          `🏎️ Скорость соперника: ${opponentSpeed}\n` +
                          `🎉 *ПОБЕДА!* +${prize.toLocaleString()} монет`
                };
            } else {
                await updateBalance(userId, -prize);
                await updateBalance(parseInt(racerId), prize);
                await setUserField(userId, 'races_lost', (user.races_lost || 0) + 1);
                await setUserField(parseInt(racerId), 'races_won', opponent.races_won + 1);
                
                delete waitingRacers[userId];
                delete waitingRacers[racerId];
                
                return { 
                    success: false, 
                    text: `🏁 *ГОНКА ЗАВЕРШЕНА!* 🏁\n\n` +
                          `🏎️ Твоя скорость: ${userSpeed}\n` +
                          `🏎️ Скорость соперника: ${opponentSpeed}\n` +
                          `💀 *ПОРАЖЕНИЕ!* -${prize.toLocaleString()} монет`
                };
            }
        }
    }
    
    // Если соперник не найден, ставим в очередь
    waitingRacers[userId] = { found: false, startTime: Date.now() };
    
    // Таймер на 100 секунд
    setTimeout(async () => {
        const racer = waitingRacers[userId];
        if (racer && !racer.found) {
            delete waitingRacers[userId];
            
            const userData = await getUser(userId);
            const userSpeed = getCarSpeed(userData);
            
            // Гонка с ботом
            const botSpeed = 50 + Math.random() * 100;
            const win = userSpeed > botSpeed;
            const prize = 5000;
            
            if (win) {
                await updateBalance(userId, prize);
                await setUserField(userId, 'races_won', userData.races_won + 1);
                await bot.telegram.sendMessage(userId, 
                    `🏁 *ГОНКА С БОТОМ!* 🏁\n\n` +
                    `🏎️ Твоя скорость: ${userSpeed}\n` +
                    `🤖 Скорость бота: ${Math.floor(botSpeed)}\n` +
                    `🎉 *ПОБЕДА!* +${prize.toLocaleString()} монет`, 
                    { parse_mode: 'Markdown' });
            } else {
                await updateBalance(userId, -prize);
                await setUserField(userId, 'races_lost', (userData.races_lost || 0) + 1);
                await bot.telegram.sendMessage(userId, 
                    `🏁 *ГОНКА С БОТОМ!* 🏁\n\n` +
                    `🏎️ Твоя скорость: ${userSpeed}\n` +
                    `🤖 Скорость бота: ${Math.floor(botSpeed)}\n` +
                    `💀 *ПОРАЖЕНИЕ!* -${prize.toLocaleString()} монет`, 
                    { parse_mode: 'Markdown' });
            }
        }
    }, 100000);
    
    return { text: `🏁 *ТЫ В ОЧЕРЕДИ НА ГОНКУ!* 🏁\n\nОжидаем соперника... (до 100 сек)\n💰 Ставка: 10,000 монет\n🏆 Победитель забирает всё!` };
}

// ========== КРАСИВЫЙ ПРОФИЛЬ ==========
async function getProfileKeyboard(userId) {
    const user = await getUser(userId);
    const gameId = await getGameId(userId);
    const role = await getAdminRole(userId);
    const roleName = role ? ADMIN_ROLES[role]?.name || '👤 Игрок' : '👤 Игрок';
    const car = user.car_id ? CARS[user.car_id] : null;
    const gpuCount = getGPUCount(user);
    
    let text = `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n`;
    text += `             👑 *CRYPTO EMPIRE* 👑\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${gameId}\n`;
    text += `│ ${BUSINESSES[user.business_level].emoji} Бизнес: ${BUSINESSES[user.business_level].name}\n`;
    text += `│ 📊 Уровень: ${user.business_level}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()} ₽\n`;
    text += `│ 📈 Всего: ${user.total_earned.toLocaleString()} ₽\n`;
    text += `│ 🎚️ Ур. игрока: ${user.level}\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ⚔️ Атака: ${calculateAttack(user)}\n`;
    text += `│ 🛡️ Защита: ${calculateDefense(user)}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${gpuCount.toLocaleString()}\n`;
    text += `│ 💰 Криптодоход/час: ${calculateCryptoIncome(user).toLocaleString()}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ${car ? `${car.emoji} Машина: ${car.name}` : '🚗 Машины нет'}\n`;
    text += `│ 🏁 Побед в гонках: ${user.races_won || 0}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ${user.vip_level !== 'none' ? VIP_STATUSES[user.vip_level].emoji + ' VIP: ' + VIP_STATUSES[user.vip_level].name : '✨ VIP: Нет'}\n`;
    text += `│ 👔 Роль: ${roleName}\n`;
    text += `│ 🔥 Серия: ${user.streak} дней\n`;
    text += `└─────────────────────────┘\n\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟`;
    
    return text;
}

// ========== КЛАВИАТУРА ==========
function mainKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 Профиль', 'profile'), Markup.button.callback('🏪 Бизнес', 'business')],
        [Markup.button.callback('⚔️ Битва', 'battle_menu'), Markup.button.callback('🏁 Гонка', 'race')],
        [Markup.button.callback('🦀 Клешни', 'claws'), Markup.button.callback('💻 Криптоферма', 'crypto')],
        [Markup.button.callback('🚗 Магазин', 'car_shop'), Markup.button.callback('👥 Рефералы', 'referrals')],
        [Markup.button.callback('💰 Донат', 'donate'), Markup.button.callback('🎁 Бонус', 'daily')],
        [Markup.button.callback('📊 Топы', 'top_menu'), Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== ОБРАБОТЧИКИ КОМАНД ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const referrerId = args[1] ? parseInt(args[1]) : null;
    
    await registerUser(userId, referrerId);
    const text = await getProfileKeyboard(userId);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// АЛИАСЫ — БЕЗ СЛЭША, СРАЗУ ПОКАЗЫВАЮТ РЕЗУЛЬТАТ!
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().trim();
    const userId = ctx.from.id;
    
    // Прямые алиасы (без отправки команд)
    if (text === 'б' || text === 'баланс' || text === 'профиль' || text === 'проф') {
        const profileText = await getProfileKeyboard(userId);
        await ctx.reply(profileText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'гонка' || text === 'race') {
        const result = await startRace(userId);
        if (result.error) {
            await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        return;
    }
    
    if (text === 'топ') {
        const ratingTop = await getRatingTop();
        const cryptoTop = await getCryptoTop();
        let topText = `🏆 *ТОП ИГРОКОВ*\n\n📊 *ТОП ПО РЕЙТИНГУ:*\n`;
        for (let i = 0; i < Math.min(5, ratingTop.length); i++) {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            topText += `${medal} #${ratingTop[i].id} — ${ratingTop[i].rating} 🏆\n`;
        }
        topText += `\n💻 *ТОП КРИПТОФЕРМ:*\n`;
        for (let i = 0; i < Math.min(5, cryptoTop.length); i++) {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            topText += `${medal} #${cryptoTop[i].id} — ${cryptoTop[i].gpu_count} видеокарт\n`;
        }
        await ctx.reply(topText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'бонус') {
        const user = await getUser(userId);
        const lastDaily = user.last_daily ? new Date(user.last_daily) : new Date(0);
        const now = new Date();
        
        if (now - lastDaily < 86400000) {
            const hours = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
            await ctx.reply(`⏳ Бонус доступен через ${hours} часов!`);
            return;
        }
        
        const streak = user.streak + 1;
        const bonus = 1000 + (streak * 500);
        await updateBalance(userId, bonus);
        db.run('UPDATE users SET last_daily = ?, streak = ? WHERE user_id = ?', [now.toISOString(), streak, userId]);
        await ctx.reply(`🎁 *БОНУС!*\n🔥 Серия: ${streak}\n💰 +${bonus.toLocaleString()}`, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'клешни') {
        const claws = await getUserClaws(userId);
        let clawsText = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
        if (claws.length === 0) clawsText += `Нет клешней. /магазин`;
        else for (const claw of claws) clawsText += `${CLAWS[claw.claw_id].name} x${claw.quantity}\n`;
        await ctx.reply(clawsText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'рефералы') {
        const user = await getUser(userId);
        let refText = `👥 *ПАРТНЁРКА*\n\n`;
        refText += `👤 Приглашено: ${user.referral_count}\n`;
        refText += `💰 Заработано: ${user.referral_earned.toLocaleString()}\n`;
        refText += `🎁 За друга: +5000 ₽\n\n`;
        refText += `✨ Твоя ссылка:\n`;
        refText += `\`https://t.me/${ctx.bot.botInfo.username}?start=${user.id}\``;
        await ctx.reply(refText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'помощь') {
        const isAdmin = await getAdminRole(userId);
        let helpText = `📚 *ПОМОЩЬ*\n\n`;
        helpText += `👤 *ОСНОВНЫЕ:*\n`;
        helpText += `• б, профиль — профиль\n`;
        helpText += `• гонка — участвовать в гонке\n`;
        helpText += `• битва @ник — битва бизнесов\n`;
        helpText += `• бонус — ежедневная награда\n`;
        helpText += `• топ — топы\n`;
        helpText += `• рефералы — партнёрка\n`;
        helpText += `• клешни — инвентарь\n`;
        helpText += `• гет @ник — инфо об игроке\n\n`;
        helpText += `🚗 *ГОНКИ:*\n`;
        helpText += `• купить машину — /buycar 1-5\n`;
        helpText += `• улучшить двигатель — /upgradeengine\n`;
        if (isAdmin) {
            helpText += `\n🛡️ *АДМИН:*\n`;
            helpText += `• агет ID — полная инфо\n`;
            helpText += `• выдать @ник сумма\n`;
            helpText += `• забанить @ник\n`;
            helpText += `• разбанить @ник\n`;
            helpText += `• редактировать @ник поле значение\n`;
            helpText += `• объявить текст\n`;
            helpText += `• назначить @ник роль\n`;
        }
        await ctx.reply(helpText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
});

// ========== АДМИН КОМАНДЫ ==========
bot.command(['edit', 'редактировать'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'edit_profile')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 4) {
        await ctx.reply('❌ Использование: /редактировать @ник поле значение\n\nДоступные поля: balance, business_level, gpu_count, car_id, vip_level, equipped_claw, exp, level, rating');
        return;
    }
    
    const username = args[1].replace('@', '');
    const field = args[2];
    const value = args[3];
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        await setUserField(targetId, field, value);
        await ctx.reply(`✅ Поле ${field} изменено на ${value} для @${username}`);
    } catch(e) {
        await ctx.reply('❌ Пользователь не найден');
    }
});

// Остальные команды (get, aget, battle и т.д.) добавлены ранее

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ТОПОВ ==========
async function getRatingTop() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, rating FROM users ORDER BY rating DESC LIMIT 10', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function getCryptoTop() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, gpu_count FROM users ORDER BY gpu_count DESC LIMIT 10', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Кнопки
bot.action('profile', async (ctx) => {
    const text = await getProfileKeyboard(ctx.from.id);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('race', async (ctx) => {
    const result = await startRace(ctx.from.id);
    if (result.error) {
        await ctx.editMessageText(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.editMessageText(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    }
    await ctx.answerCbQuery();
});

bot.action('crypto', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const gpuCount = getGPUCount(user);
    const hourlyIncome = calculateCryptoIncome(user);
    let text = `💻 *КРИПТОФЕРМА*\n\n`;
    text += `🖥️ Видеокарт: ${gpuCount.toLocaleString()}\n`;
    text += `💰 Доход в час: ${hourlyIncome.toLocaleString()} монет\n`;
    text += `📈 С каждым VIP статусом количество видеокарт УДВАИВАЕТСЯ!\n\n`;
    text += `✨ Твой множитель: x${user.vip_level !== 'none' ? VIP_STATUSES[user.vip_level].gpuMultiplier : 1}`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('car_shop', async (ctx) => {
    let text = `🚗 *МАГАЗИН МАШИН*\n\n`;
    for (const [id, car] of Object.entries(CARS)) {
        text += `${car.emoji} *${car.name}*\n`;
        text += `💰 Цена: ${car.price.toLocaleString()} монет\n`;
        text += `🏎️ Базовая скорость: ${car.speed}\n`;
        text += `📝 /buycar ${id}\n\n`;
    }
    text += `\n⚙️ *УЛУЧШЕНИЯ ДВИГАТЕЛЯ:*\n`;
    for (const [level, eng] of Object.entries(ENGINE_UPGRADES)) {
        text += `${eng.name} — +${eng.speedBonus} к скорости, ${eng.cost.toLocaleString()}💰\n`;
    }
    text += `\n📝 /upgradeengine — улучшить двигатель`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('donate', async (ctx) => {
    let text = `💰 *ДОНАТ СИСТЕМА*\n\n`;
    for (const [id, item] of Object.entries(DONATE_ITEMS)) {
        text += `${item.name} — ${item.priceUSD}$\n`;
        if (item.coins) text += `   🪙 +${item.coins.toLocaleString()} монет\n`;
        if (item.vip) text += `   👑 VIP статус\n`;
        if (item.exclusiveClaw) text += `   🦀 Эксклюзивная клешня (+100 к атаке/защите)\n`;
        if (item.exclusiveCar) text += `   🚗 Эксклюзивная машина (+200 к скорости)\n`;
    }
    text += `\n💳 *Для доната напишите:* @admin\n💰 Донат идёт на развитие проекта!`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('top_menu', async (ctx) => {
    const ratingTop = await getRatingTop();
    const cryptoTop = await getCryptoTop();
    let text = `🏆 *ТОП ИГРОКОВ*\n\n📊 *ТОП ПО РЕЙТИНГУ:*\n`;
    for (let i = 0; i < Math.min(5, ratingTop.length); i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
        text += `${medal} #${ratingTop[i].id} — ${ratingTop[i].rating} 🏆\n`;
    }
    text += `\n💻 *ТОП КРИПТОФЕРМ:*\n`;
    for (let i = 0; i < Math.min(5, cryptoTop.length); i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
        text += `${medal} #${cryptoTop[i].id} — ${cryptoTop[i].gpu_count.toLocaleString()} видеокарт\n`;
    }
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('referrals', async (ctx) => {
    const user = await getUser(ctx.from.id);
    let text = `👥 *ПАРТНЁРКА*\n\n`;
    text += `👤 Приглашено: ${user.referral_count}\n`;
    text += `💰 Заработано: ${user.referral_earned.toLocaleString()}\n\n`;
    text += `✨ Твоя ссылка:\n`;
    text += `\`https://t.me/${ctx.bot.botInfo.username}?start=${user.id}\``;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('daily', async (ctx) => {
    await ctx.editMessageText(`🎁 /бонус — ежедневная награда`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('help', async (ctx) => {
    await ctx.editMessageText(`📚 /помощь — все команды`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('business', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const business = BUSINESSES[user.business_level];
    await ctx.editMessageText(`${business.emoji} *${business.name}* (ур.${user.business_level}/10)\n💵 Доход: ${calculateIncome(user).toLocaleString()}\n⬆️ Апгрейд: ${business.upgradeCost?.toLocaleString() || 'MAX'}`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('battle_menu', async (ctx) => {
    await ctx.editMessageText(`⚔️ *БИТВА БИЗНЕСОВ*\n\n/битва @username\n\n⚔️ Атака: уровень + клешни + VIP\n🛡️ Защита: улучшения + VIP`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('claws', async (ctx) => {
    const claws = await getUserClaws(ctx.from.id);
    let text = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
    if (claws.length === 0) text += `Нет клешней. /магазин`;
    else for (const claw of claws) text += `${CLAWS[claw.claw_id].name} x${claw.quantity}\n`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

// Заглушки для команд, которые нужно добавить
bot.command(['battle', 'битва'], async (ctx) => {
    await ctx.reply('⚔️ Битва бизнесов (в разработке)');
});

bot.command(['buycar'], async (ctx) => {
    await ctx.reply('🚗 Покупка машины (в разработке)');
});

bot.command(['upgradeengine'], async (ctx) => {
    await ctx.reply('⚙️ Улучшение двигателя (в разработке)');
});

bot.command(['get', 'гет'], async (ctx) => {
    await ctx.reply('🔍 /get @username — информация об игроке (в разработке)');
});

bot.command(['aget', 'агет'], async (ctx) => {
    await ctx.reply('🔒 /aget ID — админ-информация (в разработке)');
});

// ========== КОМАНДА GET (КРАСИВАЯ ИНФОРМАЦИЯ ОБ ИГРОКЕ) ==========
bot.command(['get', 'гет'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /get @username или /get 15');
        return;
    }
    
    const target = args[1];
    let user;
    let gameId;
    
    if (target.startsWith('@')) {
        const username = target.slice(1);
        try {
            const chat = await ctx.telegram.getChat(username);
            user = await getUser(chat.id);
            if (!user) { await ctx.reply('❌ Игрок не найден'); return; }
            gameId = await getGameId(chat.id);
        } catch(e) { await ctx.reply('❌ Пользователь не найден'); return; }
    } else if (/^\d+$/.test(target)) {
        gameId = parseInt(target);
        user = await getUserById(gameId);
        if (!user) { await ctx.reply('❌ Игрок не найден'); return; }
    } else {
        await ctx.reply('❌ Использование: /get @username или /get 15');
        return;
    }
    
    const role = await getAdminRole(user.user_id);
    const roleName = role ? ADMIN_ROLES[role]?.name || '👤 Игрок' : '👤 Игрок';
    const car = user.car_id ? CARS[user.car_id] : null;
    
    let text = `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n`;
    text += `         👤 *ИНФОРМАЦИЯ ОБ ИГРОКЕ* 👤\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${gameId}\n`;
    text += `│ ${BUSINESSES[user.business_level].emoji} Бизнес: ${BUSINESSES[user.business_level].name}\n`;
    text += `│ 📊 Уровень: ${user.business_level}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()} ₽\n`;
    text += `│ 🎚️ Уровень игрока: ${user.level}\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ⚔️ Атака: ${calculateAttack(user)}\n`;
    text += `│ 🛡️ Защита: ${calculateDefense(user)}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ${car ? `${car.emoji} Машина: ${car.name}` : '🚗 Машины нет'}\n`;
    text += `│ 🏁 Побед в гонках: ${user.races_won || 0}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ${user.vip_level !== 'none' ? VIP_STATUSES[user.vip_level].emoji + ' VIP: ' + VIP_STATUSES[user.vip_level].name : '✨ VIP: Нет'}\n`;
    text += `│ 👔 Роль: ${roleName}\n`;
    text += `│ 🔥 Серия: ${user.streak} дней\n`;
    text += `└─────────────────────────┘\n\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟`;
    
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ========== КОМАНДА AGET (АДМИНСКАЯ ПОЛНАЯ ИНФОРМАЦИЯ) ==========
bot.command(['aget', 'агет'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'help_users')) {
        await ctx.reply('❌ У вас нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /aget 15 (по ID)');
        return;
    }
    
    const target = parseInt(args[1]);
    const user = await getUserById(target);
    
    if (!user) {
        await ctx.reply('❌ Игрок не найден!');
        return;
    }
    
    const role = await getAdminRole(user.user_id);
    const car = user.car_id ? CARS[user.car_id] : null;
    
    let text = `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n`;
    text += `       *АДМИН-ИНФОРМАЦИЯ*       \n`;
    text += `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${user.id}\n`;
    text += `│ 🆔 Telegram: ${user.user_id}\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()}\n`;
    text += `│ 🏪 Бизнес: ${user.business_level}/10\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${user.gpu_count?.toLocaleString() || 2500}\n`;
    text += `│ ${car ? `${car.emoji} Машина: ${car.name}` : '🚗 Машины нет'}\n`;
    text += `│ ⚙️ Уровень двигателя: ${user.car_engine_level || 0}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 🚫 Бан: ${user.banned ? '✅' : '❌'}\n`;
    text += `│ ⚠️ Варнов: ${user.warn_count}\n`;
    text += `│ 👔 Роль: ${role || 'Игрок'}\n`;
    text += `│ ${user.vip_level !== 'none' ? '👑 VIP: ' + user.vip_level : '✨ VIP: Нет'}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 👥 Рефералов: ${user.referral_count}\n`;
    text += `│ 💰 Реф. заработок: ${user.referral_earned?.toLocaleString() || 0}\n`;
    text += `│ 🏁 Побед в гонках: ${user.races_won || 0}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 📅 Регистрация: ${user.register_date?.slice(0, 19) || 'Неизвестно'}\n`;
    text += `│ 🔥 Последний бонус: ${user.last_daily?.slice(0, 10) || 'Никогда'}\n`;
    text += `└─────────────────────────┘\n\n`;
    text += `🔒━━━━━━━━━━━━━━━━━━━━━━🔒`;
    
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ========== КОМАНДА БИТВА БИЗНЕСОВ ==========
bot.command(['battle', 'битва'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('⚔️ *БИТВА БИЗНЕСОВ*\n\nПравила:\n• Атакуй бизнес соперника\n• Победа = кража денег + понижение уровня\n• Поражение = потеря денег\n• Рейтинг меняется\n\nИспользование: /битва @username', { parse_mode: 'Markdown' });
        return;
    }
    
    const username = args[1].replace('@', '');
    const userId = ctx.from.id;
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        if (targetId === userId) {
            await ctx.reply('❌ Нельзя атаковать себя!');
            return;
        }
        
        const attacker = await getUser(userId);
        const defender = await getUser(targetId);
        
        if (!defender) {
            await ctx.reply('❌ Игрок не найден');
            return;
        }
        
        if (defender.business_level < 3) {
            await ctx.reply('❌ У соперника слишком слабый бизнес для битвы!');
            return;
        }
        
        const attackPower = calculateAttack(attacker);
        const defensePower = calculateDefense(defender);
        
        const winChance = attackPower / (attackPower + defensePower) * 100;
        const win = Math.random() * 100 < winChance;
        
        if (win) {
            const stolenMoney = Math.floor(defender.balance * 0.15);
            const stolenBusiness = Math.floor(defender.business_level * 0.3);
            
            await updateBalance(userId, stolenMoney);
            await updateBalance(targetId, -stolenMoney);
            await updateRating(userId, 15);
            await updateRating(targetId, -10);
            
            if (stolenBusiness > 0 && defender.business_level > 1) {
                await setUserField(targetId, 'business_level', Math.max(1, defender.business_level - stolenBusiness));
                await setUserField(userId, 'business_battles_won', (attacker.business_battles_won || 0) + 1);
            }
            
            let text = `🏆 *БИТВА БИЗНЕСОВ: ПОБЕДА!* 🏆\n\n`;
            text += `💪 Ваша сила: ${attackPower} | 🛡️ Защита врага: ${defensePower}\n`;
            text += `💰 Украдено денег: ${stolenMoney.toLocaleString()}\n`;
            if (stolenBusiness > 0) text += `📉 Уровень врага понижен на ${stolenBusiness}\n`;
            text += `📊 Рейтинг: +15\n`;
            
            await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            const lostMoney = Math.floor(attacker.balance * 0.1);
            await updateBalance(userId, -lostMoney);
            await updateRating(userId, -10);
            await updateRating(targetId, 5);
            
            let text = `💀 *БИТВА БИЗНЕСОВ: ПОРАЖЕНИЕ!* 💀\n\n`;
            text += `💪 Ваша сила: ${attackPower} | 🛡️ Защита врага: ${defensePower}\n`;
            text += `💔 Потеряно денег: ${lostMoney.toLocaleString()}\n`;
            text += `📊 Рейтинг: -10\n`;
            
            await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА ПОКУПКИ МАШИНЫ ==========
bot.command(['buycar', 'купитьмашину'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        let text = `🚗 *ДОСТУПНЫЕ МАШИНЫ*\n\n`;
        for (const [id, car] of Object.entries(CARS)) {
            text += `${car.emoji} ${car.name} — ${car.price.toLocaleString()}💰\n`;
        }
        text += `\n📝 Использование: /buycar 1-5`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
        return;
    }
    
    const carId = parseInt(args[1]);
    const car = CARS[carId];
    
    if (!car) {
        await ctx.reply('❌ Машина не найдена! Доступны номера 1-5');
        return;
    }
    
    const userId = ctx.from.id;
    const user = await getUser(userId);
    
    if (user.car_id && user.car_id !== 0) {
        await ctx.reply('❌ У тебя уже есть машина! Продай старую перед покупкой новой.');
        return;
    }
    
    if (user.balance >= car.price) {
        await updateBalance(userId, -car.price);
        await setUserField(userId, 'car_id', carId);
        await ctx.reply(`✅ *Куплено!* ${car.emoji} ${car.name}\n💰 Остаток: ${(user.balance - car.price).toLocaleString()} монет\n🏎️ Скорость: ${car.speed}`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.reply(`❌ Не хватает ${(car.price - user.balance).toLocaleString()} монет!`, { parse_mode: 'Markdown' });
    }
});

// ========== КОМАНДА УЛУЧШЕНИЯ ДВИГАТЕЛЯ ==========
bot.command(['upgradeengine', 'улучшитьдвигатель'], async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    
    if (!user.car_id || user.car_id === 0) {
        await ctx.reply('❌ У тебя нет машины! Купи сначала: /buycar');
        return;
    }
    
    const currentLevel = user.car_engine_level || 0;
    const nextLevel = currentLevel + 1;
    const upgrade = ENGINE_UPGRADES[nextLevel];
    
    if (!upgrade) {
        await ctx.reply('❌ Максимальный уровень двигателя достигнут!');
        return;
    }
    
    if (user.balance >= upgrade.cost) {
        await updateBalance(userId, -upgrade.cost);
        await setUserField(userId, 'car_engine_level', nextLevel);
        
        const car = CARS[user.car_id];
        const newSpeed = car.speed + upgrade.speedBonus;
        
        await ctx.reply(`⚙️ *ДВИГАТЕЛЬ УЛУЧШЕН!*\n\n🔧 ${upgrade.name}\n🏎️ Скорость: ${car.speed} → ${newSpeed}\n💰 Стоимость: ${upgrade.cost.toLocaleString()} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.reply(`❌ Не хватает ${(upgrade.cost - user.balance).toLocaleString()} монет!`, { parse_mode: 'Markdown' });
    }
});

// ========== КОМАНДА ВЫДАТЬ МОНЕТЫ (АДМИН) ==========
bot.command(['give', 'выдать'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'give_money')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        await ctx.reply('❌ Использование: /выдать @username сумма');
        return;
    }
    
    const username = args[1].replace('@', '');
    const amount = parseInt(args[2]);
    
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Сумма должна быть положительным числом!');
        return;
    }
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        await updateBalance(targetId, amount);
        await ctx.reply(`✅ Выдано ${amount.toLocaleString()} монет игроку @${username}!`);
        await ctx.telegram.sendMessage(targetId, `🎁 *Вам выдали подарок!*\n💰 +${amount.toLocaleString()} монет`, { parse_mode: 'Markdown' });
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА ЗАБАНИТЬ (АДМИН) ==========
bot.command(['ban', 'забанить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'ban')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /забанить @username [причина]');
        return;
    }
    
    const username = args[1].replace('@', '');
    const reason = args.slice(2).join(' ') || 'Без причины';
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        await setUserField(targetId, 'banned', 1);
        await ctx.reply(`✅ Игрок @${username} забанен!\n📝 Причина: ${reason}`);
        await ctx.telegram.sendMessage(targetId, `⚠️ *ВЫ ЗАБАНЕНЫ!*\nПричина: ${reason}\nОбратитесь к администрации.`, { parse_mode: 'Markdown' });
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА РАЗБАНИТЬ (АДМИН) ==========
bot.command(['unban', 'разбанить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'unban')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /разбанить @username');
        return;
    }
    
    const username = args[1].replace('@', '');
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        await setUserField(targetId, 'banned', 0);
        await ctx.reply(`✅ Игрок @${username} разбанен!`);
        await ctx.telegram.sendMessage(targetId, `✅ *ВЫ РАЗБАНЕНЫ!*\nДобро пожаловать обратно!`, { parse_mode: 'Markdown' });
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА ОБЪЯВЛЕНИЕ (АДМИН) ==========
bot.command(['announce', 'объявить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'announce')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
        await ctx.reply('❌ Использование: /объявить текст объявления');
        return;
    }
    
    const admin = await getUser(userId);
    const gameId = await getGameId(userId);
    
    const announce = `📢 *ОБЪЯВЛЕНИЕ* 📢\n\n${text}\n\n— Админ #${gameId}`;
    
    const users = await new Promise((resolve) => {
        db.all('SELECT user_id FROM users', (err, rows) => resolve(rows || []));
    });
    
    let sent = 0;
    for (const user of users) {
        try {
            await ctx.telegram.sendMessage(user.user_id, announce, { parse_mode: 'Markdown' });
            sent++;
        } catch (e) {}
    }
    
    await ctx.reply(`✅ Объявление отправлено ${sent} игрокам!`);
});

// ========== КОМАНДА НАЗНАЧИТЬ АДМИНА (АДМИН) ==========
bot.command(['setadmin', 'назначить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'set_admin')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        await ctx.reply('❌ Использование: /назначить @username роль\n📌 Роли: owner, vice_owner, developer, head_admin, vice_admin, moderator, event_manager');
        return;
    }
    
    const username = args[1].replace('@', '');
    const role = args[2];
    
    if (!ADMIN_ROLES[role]) {
        await ctx.reply('❌ Неверная роль! Доступные: owner, vice_owner, developer, head_admin, vice_admin, moderator, event_manager');
        return;
    }
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        db.run('INSERT OR REPLACE INTO admins (user_id, role, appointed_by, appointed_at) VALUES (?, ?, ?, datetime("now"))',
            [targetId, role, userId]);
        
        await ctx.reply(`✅ Игрок @${username} назначен на роль ${ADMIN_ROLES[role].name}!`);
        await ctx.telegram.sendMessage(targetId, `👑 *Вам назначена роль!*\nВаша роль: ${ADMIN_ROLES[role].name}\nИспользуйте /помощь для просмотра команд.`, { parse_mode: 'Markdown' });
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА ВЫДАТЬ VIP (АДМИН) ==========
bot.command(['setvip', 'выдатьвип'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'set_vip')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        await ctx.reply('❌ Использование: /выдатьвип @username статус\n📌 Статусы: bronze, silver, gold, platinum, diamond');
        return;
    }
    
    const username = args[1].replace('@', '');
    const vipLevel = args[2];
    
    if (!VIP_STATUSES[vipLevel]) {
        await ctx.reply('❌ Неверный статус! Доступные: bronze, silver, gold, platinum, diamond');
        return;
    }
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        await setUserField(targetId, 'vip_level', vipLevel);
        
        // Обновляем количество видеокарт
        const user = await getUser(targetId);
        const newGpuCount = BASE_GPU_COUNT * VIP_STATUSES[vipLevel].gpuMultiplier;
        await setUserField(targetId, 'gpu_count', newGpuCount);
        
        await ctx.reply(`✅ Игроку @${username} выдан VIP статус ${VIP_STATUSES[vipLevel].name}!`);
        await ctx.telegram.sendMessage(targetId, `👑 *Вам выдан VIP статус!*\nСтатус: ${VIP_STATUSES[vipLevel].name}\n💻 Количество видеокарт увеличено до ${newGpuCount.toLocaleString()}!`, { parse_mode: 'Markdown' });
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== КОМАНДА АДМИНЫ (СПИСОК АДМИНОВ) ==========
bot.command(['admins', 'админы'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'help_users')) return;
    
    const admins = await new Promise((resolve) => {
        db.all('SELECT user_id, role FROM admins', (err, rows) => resolve(rows || []));
    });
    
    let text = `👥━━━━━━━━━━━━━━━━━━━━━━👥\n`;
    text += `        *СПИСОК АДМИНОВ*        \n`;
    text += `👥━━━━━━━━━━━━━━━━━━━━━━👥\n\n`;
    
    for (const admin of admins) {
        const roleData = ADMIN_ROLES[admin.role];
        text += `┌─────────────────────────┐\n`;
        text += `│ ${roleData?.name || admin.role}\n`;
        text += `│ 🆔 ${admin.user_id}\n`;
        text += `└─────────────────────────┘\n`;
    }
    
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ========== ЗАПУСК ==========
bot.launch().then(() => {
    console.log('🌟 CRYPTO EMPIRE ЗАПУЩЕН!');
    console.log('✅ Алиасы работают: "б" сразу показывает профиль');
    console.log('🏁 Гонки готовы!');
    console.log('💻 Криптоферма активна');
    console.log('💰 Донат система готова');
    console.log('👑 Редактирование профилей для админов');
    console.log('🚗 Машины и улучшения');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
