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

// ========== КЛЕШНИ ==========
const CLAWS = {
    1: { name: '🦀 Клешня новичка', rarity: 'common', price: 1000, attackBonus: 5, defenseBonus: 5 },
    2: { name: '🦞 Стальная клешня', rarity: 'rare', price: 5000, attackBonus: 15, defenseBonus: 10 },
    3: { name: '🦂 Золотая клешня', rarity: 'epic', price: 25000, attackBonus: 30, defenseBonus: 25 },
    4: { name: '🐉 Драконья клешня', rarity: 'legendary', price: 100000, attackBonus: 60, defenseBonus: 50 },
    5: { name: '👑 Королевская клешня', rarity: 'mythic', price: 500000, attackBonus: 120, defenseBonus: 100 },
    6: { name: '✨ Божественная клешня', rarity: 'divine', price: 2500000, attackBonus: 250, defenseBonus: 200 }
};

const RARITY_COLORS = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠', mythic: '🔴', divine: '🌈' };

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
const GPU_PRICE = 35000; // цена одной видеокарты
const CRYPTO_NAME = '💰 Биткоин';

// ========== НОВАЯ СИСТЕМА: АМУЛЕТЫ ФЕРМЫ ==========
const FARM_AMULETS = {
    1: { name: '📀 Амулет скорости', price: 50000, bonus: 10, type: 'speed' },
    2: { name: '📀 Амулет удачи', price: 75000, bonus: 15, type: 'luck' },
    3: { name: '📀 Амулет богатства', price: 100000, bonus: 20, type: 'wealth' },
    4: { name: '📀 Амулет майнинга', price: 150000, bonus: 30, type: 'mining' }
};

// ========== НОВАЯ СИСТЕМА: КОСМИЧЕСКАЯ БИРЖА ==========
const EXCHANGE_RATES = {
    btc: { name: '₿ Биткоин', price: 50000, volatility: 0.1 },
    eth: { name: 'Ξ Эфириум', price: 3000, volatility: 0.15 },
    doge: { name: '🐶 Догикоин', price: 0.1, volatility: 0.3 }
};

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
        crypto_balance INTEGER DEFAULT 0,
        car_id INTEGER DEFAULT 0,
        car_engine_level INTEGER DEFAULT 0,
        races_won INTEGER DEFAULT 0,
        races_lost INTEGER DEFAULT 0,
        exclusive_claw INTEGER DEFAULT 0,
        exclusive_car INTEGER DEFAULT 0,
        referrer_id INTEGER DEFAULT 0,
        referral_count INTEGER DEFAULT 0,
        referral_earned INTEGER DEFAULT 0,
        farm_amulets TEXT DEFAULT '[]',
        last_crypto_collect TEXT,
        btc_balance INTEGER DEFAULT 0,
        eth_balance INTEGER DEFAULT 0,
        doge_balance INTEGER DEFAULT 0
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
        db.run(`INSERT INTO users (user_id, last_collect, last_daily, register_date, referrer_id, gpu_count, last_crypto_collect) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, now, now, now, referrerId, BASE_GPU_COUNT, now], function(err) {
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

async function updateCryptoBalance(userId, cryptoType, amount) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE users SET ${cryptoType}_balance = ${cryptoType}_balance + ? WHERE user_id = ?`, [amount, userId], (err) => {
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

async function addFarmAmulet(userId, amuletId) {
    const user = await getUser(userId);
    let amulets = JSON.parse(user.farm_amulets || '[]');
    amulets.push(amuletId);
    await setUserField(userId, 'farm_amulets', JSON.stringify(amulets));
    
    // Пересчитываем доход фермы
    const gpuCount = getGPUCount(user);
    const amuletBonus = amulets.length * FARM_AMULETS[amuletId]?.bonus || 0;
    return amuletBonus;
}

function getFarmAmulets(user) {
    return JSON.parse(user.farm_amulets || '[]');
}

function getGPUCount(user) {
    let multiplier = 1;
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        multiplier = VIP_STATUSES[user.vip_level].gpuMultiplier;
    }
    return (user.gpu_count || BASE_GPU_COUNT) * multiplier;
}

function calculateCryptoIncome(user) {
    const gpuCount = getGPUCount(user);
    const amulets = getFarmAmulets(user);
    const amuletBonus = amulets.length * 10; // +10% за каждый амулет
    const baseIncome = gpuCount * 1; // 1 биткоин за видеокарту в час
    return Math.floor(baseIncome * (1 + amuletBonus / 100));
}

async function collectCrypto(userId) {
    const user = await getUser(userId);
    const lastCollect = user.last_crypto_collect ? new Date(user.last_crypto_collect) : new Date(0);
    const now = new Date();
    const hoursPassed = Math.floor((now - lastCollect) / 3600000);
    
    if (hoursPassed < 1) {
        const minutesLeft = 60 - Math.floor((now - lastCollect) / 60000);
        return { error: `⏳ До следующего сбора ${minutesLeft} минут!` };
    }
    
    const hourlyIncome = calculateCryptoIncome(user);
    const totalIncome = hourlyIncome * hoursPassed;
    
    await updateCryptoBalance(userId, 'btc', totalIncome);
    await setUserField(userId, 'last_crypto_collect', now.toISOString());
    
    return { success: true, income: totalIncome, hours: hoursPassed };
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

// ========== КРАСИВЫЙ ПРОФИЛЬ ==========
async function getProfileText(userId) {
    const user = await getUser(userId);
    const gameId = await getGameId(userId);
    const role = await getAdminRole(userId);
    const roleName = role ? ADMIN_ROLES[role]?.name || '👤 Игрок' : '👤 Игрок';
    const car = user.car_id ? CARS[user.car_id] : null;
    const gpuCount = getGPUCount(user);
    const hourlyIncome = calculateCryptoIncome(user);
    const amulets = getFarmAmulets(user);
    
    let text = `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n`;
    text += `             👑 *CRYPTO EMPIRE* 👑\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${gameId}\n`;
    text += `│ ${BUSINESSES[user.business_level].emoji} Бизнес: ${BUSINESSES[user.business_level].name}\n`;
    text += `│ 📊 Уровень: ${user.business_level}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()} ₽\n`;
    text += `│ ₿ Биткоин: ${user.btc_balance?.toLocaleString() || 0}\n`;
    text += `│ 🎚️ Ур. игрока: ${user.level}\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${gpuCount.toLocaleString()}\n`;
    text += `│ 💰 Криптодоход/час: ${hourlyIncome.toLocaleString()} ₿\n`;
    text += `│ 📀 Амулетов: ${amulets.length}/10\n`;
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
        [Markup.button.callback('🪙 Биржа', 'exchange'), Markup.button.callback('🎁 Бонус', 'daily')],
        [Markup.button.callback('📊 Топы', 'top_menu'), Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== АЛИАСЫ И ОСНОВНЫЕ КОМАНДЫ ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const referrerId = args[1] ? parseInt(args[1]) : null;
    
    await registerUser(userId, referrerId);
    const text = await getProfileText(userId);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// АЛИАСЫ — БЕЗ СЛЭША, СРАЗУ ПОКАЗЫВАЮТ РЕЗУЛЬТАТ!
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().trim();
    const userId = ctx.from.id;
    
    // Прямые алиасы
    if (text === 'б' || text === 'баланс' || text === 'профиль' || text === 'проф') {
        const profileText = await getProfileText(userId);
        await ctx.reply(profileText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'гонка' || text === 'race') {
        const user = await getUser(userId);
        if (!user.car_id || user.car_id === 0) {
            await ctx.reply('❌ У тебя нет машины! Купи в /магазин', { parse_mode: 'Markdown', ...mainKeyboard() });
            return;
        }
        await ctx.reply(`🏁 *ГОНКА*\n\nОжидай команду /race`, { parse_mode: 'Markdown', ...mainKeyboard() });
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
            topText += `${medal} #${cryptoTop[i].id} — ${cryptoTop[i].gpu_count?.toLocaleString() || 2500} видеокарт\n`;
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
        refText += `💰 Заработано: ${user.referral_earned?.toLocaleString() || 0}\n`;
        refText += `🎁 За друга: +5000 ₽\n\n`;
        refText += `✨ Твоя ссылка:\n`;
        refText += `\`https://t.me/${ctx.bot.botInfo.username}?start=${user.id}\``;
        await ctx.reply(refText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'помощь' || text === 'help') {
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
        helpText += `• гет @ник — инфо об игроке\n`;
        helpText += `• ферма — криптоферма\n`;
        helpText += `• собрать — собрать крипту\n`;
        helpText += `• купить ферма X — купить видеокарты\n`;
        helpText += `• купить амулет X — купить амулет\n\n`;
        helpText += `🚗 *ГОНКИ:*\n`;
        helpText += `• купить машину — /buycar 1-5\n`;
        helpText += `• улучшить двигатель — /upgradeengine\n\n`;
        helpText += `🪙 *БИРЖА:*\n`;
        helpText += `• купить BTC X — купить биткоины\n`;
        helpText += `• продать BTC X — продать биткоины\n`;
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
    
    // КРИПТОФЕРМА
    if (text === 'ферма') {
        const user = await getUser(userId);
        const gpuCount = getGPUCount(user);
        const hourlyIncome = calculateCryptoIncome(user);
        const amulets = getFarmAmulets(user);
        let farmText = `🇯🇵 *КРИПТОФЕРМА*\n\n`;
        farmText += `📈 Тип - Биткоин ферма 🌐\n`;
        farmText += `📝 Видеокарты: ${gpuCount.toLocaleString()} шт.\n`;
        farmText += `💹 Доход: ${hourlyIncome.toLocaleString()} ₿/час\n`;
        farmText += `💳 На счету: ${user.btc_balance?.toLocaleString() || 0} ₿\n`;
        farmText += `📀 Амулеты фермы: ${amulets.length}/10\n\n`;
        farmText += `✨ *Команды:*\n`;
        farmText += `• собрать — собрать крипту\n`;
        farmText += `• купить ферма X — купить X видеокарт (${GPU_PRICE.toLocaleString()}₽/шт)\n`;
        farmText += `• купить амулет X — купить амулет (от 50,000₽)`;
        await ctx.reply(farmText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'собрать') {
        const result = await collectCrypto(userId);
        if (result.error) {
            await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`🇯🇵 *СБОР КРИПТЫ*\n\n✅ Собрано ${result.income.toLocaleString()} ₿ за ${result.hours} час(ов)!\n💰 Баланс: ${(await getUser(userId)).btc_balance?.toLocaleString() || 0} ₿`, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        return;
    }
    
    if (text.startsWith('купить ферма ')) {
        const amount = parseInt(text.split(' ')[2]);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('❌ Введите количество видеокарт! Пример: купить ферма 10');
            return;
        }
        
        const user = await getUser(userId);
        const totalCost = amount * GPU_PRICE;
        
        if (user.balance >= totalCost) {
            await updateBalance(userId, -totalCost);
            const newGpuCount = (user.gpu_count || BASE_GPU_COUNT) + amount;
            await setUserField(userId, 'gpu_count', newGpuCount);
            await ctx.reply(`🇯🇵 *ПОКУПКА ВИДЕОКАРТ*\n\n✅ Вы успешно приобрели ${amount} видеокарт(ы) за ${totalCost.toLocaleString()}₽\n💻 Всего видеокарт: ${newGpuCount.toLocaleString()}`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`❌ Не хватает ${(totalCost - user.balance).toLocaleString()}₽!`, { parse_mode: 'Markdown' });
        }
        return;
    }
    
    if (text.startsWith('купить амулет ')) {
        const amuletId = parseInt(text.split(' ')[2]);
        const amulet = FARM_AMULETS[amuletId];
        
        if (!amulet) {
            await ctx.reply('❌ Амулет не найден! Доступны номера 1-4');
            return;
        }
        
        const user = await getUser(userId);
        const amulets = getFarmAmulets(user);
        
        if (amulets.length >= 10) {
            await ctx.reply('❌ У вас уже максимальное количество амулетов (10)!');
            return;
        }
        
        if (user.balance >= amulet.price) {
            await updateBalance(userId, -amulet.price);
            await addFarmAmulet(userId, amuletId);
            await ctx.reply(`📀 *ПОКУПКА АМУЛЕТА*\n\n✅ Вы купили ${amulet.name} за ${amulet.price.toLocaleString()}₽\n📈 Доход фермы увеличен!`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`❌ Не хватает ${(amulet.price - user.balance).toLocaleString()}₽!`, { parse_mode: 'Markdown' });
        }
        return;
    }
});

// ========== КОМАНДА GET ==========
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
    const gpuCount = getGPUCount(user);
    
    let text = `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n`;
    text += `         👤 *ИНФОРМАЦИЯ ОБ ИГРОКЕ* 👤\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${gameId}\n`;
    text += `│ ${BUSINESSES[user.business_level].emoji} Бизнес: ${BUSINESSES[user.business_level].name}\n`;
    text += `│ 📊 Уровень: ${user.business_level}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()} ₽\n`;
    text += `│ ₿ Биткоин: ${user.btc_balance?.toLocaleString() || 0}\n`;
    text += `│ 🎚️ Уровень игрока: ${user.level}\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${gpuCount.toLocaleString()}\n`;
    text += `│ 💰 Криптодоход/час: ${calculateCryptoIncome(user).toLocaleString()} ₿\n`;
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

// ========== КОМАНДА AGET ==========
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
    const amulets = getFarmAmulets(user);
    
    let text = `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n`;
    text += `       *АДМИН-ИНФОРМАЦИЯ*       \n`;
    text += `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${user.id}\n`;
    text += `│ 🆔 Telegram: ${user.user_id}\n`;
    text += `│ 💰 Баланс: ${user.balance.toLocaleString()}\n`;
    text += `│ ₿ Биткоин: ${user.btc_balance?.toLocaleString() || 0}\n`;
    text += `│ 🏪 Бизнес: ${user.business_level}/10\n`;
    text += `│ 📊 Рейтинг: ${user.rating}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${user.gpu_count?.toLocaleString() || 2500}\n`;
    text += `│ 📀 Амулетов: ${amulets.length}/10\n`;
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

// ========== БИТВА БИЗНЕСОВ ==========
bot.command(['battle', 'битва'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('⚔️ *БИТВА БИЗНЕСОВ*\n\nИспользование: /битва @username', { parse_mode: 'Markdown' });
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
        
        const attackPower = calculateAttack(attacker);
        const defensePower = calculateDefense(defender);
        const winChance = attackPower / (attackPower + defensePower) * 100;
        const win = Math.random() * 100 < winChance;
        
        if (win) {
            const stolenMoney = Math.floor(defender.balance * 0.15);
            await updateBalance(userId, stolenMoney);
            await updateBalance(targetId, -stolenMoney);
            await updateRating(userId, 15);
            await updateRating(targetId, -10);
            
            await ctx.reply(`🏆 *ПОБЕДА!* 🏆\n\n💰 Украдено: ${stolenMoney.toLocaleString()} ₽\n📊 Рейтинг: +15`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            const lostMoney = Math.floor(attacker.balance * 0.1);
            await updateBalance(userId, -lostMoney);
            await updateRating(userId, -10);
            await updateRating(targetId, 5);
            
            await ctx.reply(`💀 *ПОРАЖЕНИЕ!* 💀\n\n💔 Потеряно: ${lostMoney.toLocaleString()} ₽\n📊 Рейтинг: -10`, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== ПОКУПКА МАШИНЫ ==========
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
        await ctx.reply('❌ У тебя уже есть машина!');
        return;
    }
    
    if (user.balance >= car.price) {
        await updateBalance(userId, -car.price);
        await setUserField(userId, 'car_id', carId);
        await ctx.reply(`✅ *Куплено!* ${car.emoji} ${car.name}\n💰 Остаток: ${(user.balance - car.price).toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.reply(`❌ Не хватает ${(car.price - user.balance).toLocaleString()} ₽!`, { parse_mode: 'Markdown' });
    }
});

// ========== УЛУЧШЕНИЕ ДВИГАТЕЛЯ ==========
bot.command(['upgradeengine', 'улучшитьдвигатель'], async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    
    if (!user.car_id || user.car_id === 0) {
        await ctx.reply('❌ У тебя нет машины!');
        return;
    }
    
    const currentLevel = user.car_engine_level || 0;
    const nextLevel = currentLevel + 1;
    const upgrade = ENGINE_UPGRADES[nextLevel];
    
    if (!upgrade) {
        await ctx.reply('❌ Максимальный уровень!');
        return;
    }
    
    if (user.balance >= upgrade.cost) {
        await updateBalance(userId, -upgrade.cost);
        await setUserField(userId, 'car_engine_level', nextLevel);
        await ctx.reply(`⚙️ *ДВИГАТЕЛЬ УЛУЧШЕН!*\n\n🔧 ${upgrade.name}\n💰 Стоимость: ${upgrade.cost.toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.reply(`❌ Не хватает ${(upgrade.cost - user.balance).toLocaleString()} ₽!`, { parse_mode: 'Markdown' });
    }
});

// ========== АДМИН КОМАНДЫ ==========
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
        await ctx.reply('❌ Сумма должна быть числом!');
        return;
    }
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        await updateBalance(targetId, amount);
        await ctx.reply(`✅ Выдано ${amount.toLocaleString()} монет @${username}!`);
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

bot.command(['ban', 'забанить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'ban')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /забанить @username');
        return;
    }
    
    const username = args[1].replace('@', '');
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        await setUserField(targetId, 'banned', 1);
        await ctx.reply(`✅ Игрок @${username} забанен!`);
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

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
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

bot.command(['announce', 'объявить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'announce')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
        await ctx.reply('❌ Использование: /объявить текст');
        return;
    }
    
    const users = await new Promise((resolve) => {
        db.all('SELECT user_id FROM users', (err, rows) => resolve(rows || []));
    });
    
    let sent = 0;
    for (const user of users) {
        try {
            await ctx.telegram.sendMessage(user.user_id, `📢 *ОБЪЯВЛЕНИЕ*\n\n${text}`, { parse_mode: 'Markdown' });
            sent++;
        } catch (e) {}
    }
    
    await ctx.reply(`✅ Объявление отправлено ${sent} игрокам!`);
});

bot.command(['setadmin', 'назначить'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'set_admin')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        await ctx.reply('❌ Использование: /назначить @username роль');
        return;
    }
    
    const username = args[1].replace('@', '');
    const role = args[2];
    
    if (!ADMIN_ROLES[role]) {
        await ctx.reply('❌ Неверная роль!');
        return;
    }
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        db.run('INSERT OR REPLACE INTO admins (user_id, role, appointed_by, appointed_at) VALUES (?, ?, ?, datetime("now"))', [targetId, role, userId]);
        await ctx.reply(`✅ @${username} назначен на роль ${ADMIN_ROLES[role].name}!`);
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

bot.command(['edit', 'редактировать'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'edit_profile')) {
        await ctx.reply('❌ Нет прав!');
        return;
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 4) {
        await ctx.reply('❌ Использование: /редактировать @ник поле значение\nДоступные поля: balance, business_level, gpu_count, btc_balance, car_id, vip_level');
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
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
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

function calculateAttack(user) {
    let attack = BUSINESSES[user.business_level].attack + Math.floor(user.rating / 100);
    if (user.hacker) attack += 30;
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        attack += CLAWS[user.equipped_claw].attackBonus;
    }
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        attack += VIP_STATUSES[user.vip_level].bonusAttack;
    }
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

// ========== КНОПКИ ==========
bot.action('profile', async (ctx) => {
    const text = await getProfileText(ctx.from.id);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('business', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const business = BUSINESSES[user.business_level];
    await ctx.editMessageText(`${business.emoji} *${business.name}* (ур.${user.business_level}/10)\n💵 Доход: ${calculateIncome(user).toLocaleString()}`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('crypto', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const gpuCount = getGPUCount(user);
    const hourlyIncome = calculateCryptoIncome(user);
    const amulets = getFarmAmulets(user);
    let text = `🇯🇵 *КРИПТОФЕРМА*\n\n`;
    text += `📝 Видеокарты: ${gpuCount.toLocaleString()} шт.\n`;
    text += `💹 Доход: ${hourlyIncome.toLocaleString()} ₿/час\n`;
    text += `💳 На счету: ${user.btc_balance?.toLocaleString() || 0} ₿\n`;
    text += `📀 Амулеты: ${amulets.length}/10\n\n`;
    text += `✨ /собрать — собрать крипту\n`;
    text += `✨ /купить ферма X — купить видеокарты`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('car_shop', async (ctx) => {
    let text = `🚗 *МАГАЗИН МАШИН*\n\n`;
    for (const [id, car] of Object.entries(CARS)) {
        text += `${car.emoji} ${car.name} — ${car.price.toLocaleString()}💰\n`;
    }
    text += `\n📝 /buycar 1-5`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('referrals', async (ctx) => {
    const user = await getUser(ctx.from.id);
    let text = `👥 *ПАРТНЁРКА*\n\n`;
    text += `👤 Приглашено: ${user.referral_count}\n`;
    text += `💰 Заработано: ${user.referral_earned?.toLocaleString() || 0}\n\n`;
    text += `✨ Твоя ссылка:\n`;
    text += `\`https://t.me/${ctx.bot.botInfo.username}?start=${user.id}\``;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('exchange', async (ctx) => {
    let text = `🪙 *КОСМИЧЕСКАЯ БИРЖА*\n\n`;
    text += `₿ Биткоин: ${EXCHANGE_RATES.btc.price.toLocaleString()} ₽\n`;
    text += `Ξ Эфириум: ${EXCHANGE_RATES.eth.price.toLocaleString()} ₽\n`;
    text += `🐶 Догикоин: ${EXCHANGE_RATES.doge.price.toLocaleString()} ₽\n\n`;
    text += `📝 Команды:\n`;
    text += `• купить BTC 10 — купить 10 BTC\n`;
    text += `• продать BTC 10 — продать 10 BTC`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('daily', async (ctx) => {
    await ctx.editMessageText(`🎁 /бонус — ежедневная награда`, { parse_mode: 'Markdown', ...mainKeyboard() });
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
        text += `${medal} #${cryptoTop[i].id} — ${cryptoTop[i].gpu_count?.toLocaleString() || 2500} видеокарт\n`;
    }
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('help', async (ctx) => {
    await ctx.editMessageText(`📚 /помощь — все команды`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('battle_menu', async (ctx) => {
    await ctx.editMessageText(`⚔️ *БИТВА БИЗНЕСОВ*\n\n/битва @username`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('race', async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (!user.car_id || user.car_id === 0) {
        await ctx.editMessageText(`❌ У тебя нет машины! Купи в /магазин`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.editMessageText(`🏁 *ГОНКА*\n\nОжидай команду /race`, { parse_mode: 'Markdown', ...mainKeyboard() });
    }
    await ctx.answerCbQuery();
});

bot.action('claws', async (ctx) => {
    const claws = await getUserClaws(ctx.from.id);
    let text = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
    if (claws.length === 0) text += `Нет клешней`;
    else for (const claw of claws) text += `${CLAWS[claw.claw_id].name} x${claw.quantity}\n`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

// ========== ЗАПУСК ==========
bot.launch().then(() => {
    console.log('🌟 CRYPTO EMPIRE ЗАПУЩЕН!');
    console.log('✅ Все системы активны: Криптоферма, Амулеты, Биржа');
    console.log('👑 Админ-команды работают');
    console.log('🚗 Гонки и машины готовы');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
