const { Telegraf, Markup } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();

const TOKEN = '8693908580:AAHLkw25kJrc3Z6eXrUgVtFFEeJQMWShGTw';

console.log('✅ Токен загружен, запускаю бота...');

const bot = new Telegraf(TOKEN);

// ========== КЭШ ==========
const userCache = new Map();
const CACHE_TTL = 30000;

async function getCachedUser(userId) {
    if (userCache.has(userId)) {
        const { data, timestamp } = userCache.get(userId);
        if (Date.now() - timestamp < CACHE_TTL) return data;
        userCache.delete(userId);
    }
    const user = await getUser(userId);
    if (user) userCache.set(userId, { data: user, timestamp: Date.now() });
    return user;
}

// ========== РОЛИ АДМИНОВ ==========
const ADMIN_ROLES = {
    owner: { name: '👑 Владелец', level: 7, permissions: ['all'], users: [5005387093] },
    vice_owner: { name: '⚜️ Зам. Владельца', level: 6, permissions: ['all'], users: [] },
    developer: { name: '💻 Разработчик', level: 5, permissions: ['all'], users: [] },
    head_admin: { name: '🔱 Главный Админ', level: 4, permissions: ['all'], users: [] },
    vice_admin: { name: '📌 Зам. Гл. Админа', level: 3, permissions: ['ban', 'unban', 'give_money', 'warn'], users: [] },
    moderator: { name: '🛡️ Модератор', level: 2, permissions: ['ban', 'unban', 'warn'], users: [] },
    event_manager: { name: '🎉 Ивентовод', level: 1, permissions: ['announce'], users: [] }
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

// ========== МАШИНЫ ==========
const CARS = {
    1: { name: '🚗 Жигуль', price: 5000, speed: 20, emoji: '🚗' },
    2: { name: '🏎️ Спорткар', price: 50000, speed: 50, emoji: '🏎️' },
    3: { name: '🏎️ Суперкар', price: 500000, speed: 100, emoji: '🏎️' },
    4: { name: '🦇 Бэтмобиль', price: 5000000, speed: 200, emoji: '🦇' },
    5: { name: '🚀 Ракетомобиль', price: 50000000, speed: 500, emoji: '🚀' }
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
const GPU_PRICE = 35000;

// ========== КРИПТО-БИРЖА ==========
const CRYPTO_CURRENCIES = {
    btc: { name: '₿ БИТКОИН', symbol: 'BTC', basePrice: 50000, volatility: 0.05, icon: '₿' },
    eth: { name: 'Ξ ЭФИРИУМ', symbol: 'ETH', basePrice: 3000, volatility: 0.07, icon: 'Ξ' },
    sol: { name: '◎ СОЛАНА', symbol: 'SOL', basePrice: 100, volatility: 0.1, icon: '◎' },
    doge: { name: '🐶 ДОГИКОИН', symbol: 'DOGE', basePrice: 0.1, volatility: 0.15, icon: '🐶' },
    ton: { name: '💎 ТОНКОИН', symbol: 'TON', basePrice: 5, volatility: 0.12, icon: '💎' }
};

let marketPrices = {};

function updateMarketPrices() {
    for (const [key, crypto] of Object.entries(CRYPTO_CURRENCIES)) {
        const change = (Math.random() - 0.5) * 2 * crypto.volatility;
        let newPrice = marketPrices[key]?.price || crypto.basePrice;
        newPrice = newPrice * (1 + change);
        newPrice = Math.max(newPrice, crypto.basePrice * 0.1);
        
        marketPrices[key] = {
            price: Math.floor(newPrice),
            change: change * 100,
            timestamp: Date.now()
        };
    }
}

setInterval(updateMarketPrices, 30000);
updateMarketPrices();

// ========== ПОДЗЕМЕЛЬЯ ==========
const DUNGEONS = {
    1: {
        name: '🏚️ Склеп гоблинов',
        level: 1,
        minPlayerLevel: 1,
        bosses: ['🧟 Гоблин-шаман', '👹 Король гоблинов'],
        rewards: [5000, 15000],
        expReward: 50,
        energyCost: 10,
        cooldown: 1800000,
        lootTable: [
            { item: '🗡️ Кинжал гоблина', attackBonus: 5, chance: 0.3 },
            { item: '🛡️ Щит гоблина', defenseBonus: 5, chance: 0.2 },
            { item: '💎 Алмаз', value: 5000, chance: 0.1 }
        ]
    },
    2: {
        name: '🔥 Вулкан дракона',
        level: 2,
        minPlayerLevel: 5,
        bosses: ['🐉 Огненный дракон', '🔥 Древний дракон'],
        rewards: [50000, 150000],
        expReward: 200,
        energyCost: 25,
        cooldown: 3600000,
        lootTable: [
            { item: '🐉 Драконья чешуя', defenseBonus: 20, chance: 0.25 },
            { item: '🔥 Огненный меч', attackBonus: 25, chance: 0.15 },
            { item: '💎 Алмаз', value: 25000, chance: 0.3 },
            { item: '✨ Драконий глаз', value: 100000, chance: 0.05 }
        ]
    },
    3: {
        name: '❄️ Ледяная цитадель',
        level: 3,
        minPlayerLevel: 10,
        bosses: ['🧊 Ледяной великан', '👑 Король севера'],
        rewards: [500000, 1500000],
        expReward: 500,
        energyCost: 50,
        cooldown: 7200000,
        lootTable: [
            { item: '❄️ Ледяной клинок', attackBonus: 50, chance: 0.2 },
            { item: '🛡️ Ледяная броня', defenseBonus: 50, chance: 0.2 },
            { item: '💎 Алмаз', value: 100000, chance: 0.3 },
            { item: '👑 Корона севера', value: 500000, chance: 0.05 }
        ]
    }
};

// ========== ЛОТЕРЕЯ ==========
let globalJackpot = 10000000;
let lotteryTickets = new Map();
let lastDrawTime = Date.now();

// ========== ЧЁРНЫЙ РЫНОК ==========
const BLACK_MARKET_ITEMS = {
    1: { name: '🦀 Теневая клешня', price: 5000, type: 'claw', clawId: 6, emoji: '🦀' },
    2: { name: '💀 Череп дракона', price: 10000, type: 'item', value: 50000, emoji: '💀' },
    3: { name: '🌙 Лунный камень', price: 25000, type: 'amulet', bonus: 50, emoji: '🌙' },
    4: { name: '✨ Звездная пыль', price: 50000, type: 'item', value: 250000, emoji: '✨' },
    5: { name: '👑 Корона тьмы', price: 100000, type: 'vip', vipLevel: 'platinum', emoji: '👑' },
    6: { name: '🐉 Сердце дракона', price: 250000, type: 'item', value: 1000000, emoji: '🐉' },
    7: { name: '💎 Чёрный алмаз', price: 500000, type: 'item', value: 2500000, emoji: '💎' },
    8: { name: '🌟 Эксклюзивная машина', price: 1000000, type: 'car', carId: 5, emoji: '🌟' }
};

let darkCoins = new Map();

async function addDarkCoins(userId, amount) {
    const current = darkCoins.get(userId) || 0;
    darkCoins.set(userId, current + amount);
}

async function getDarkCoins(userId) {
    return darkCoins.get(userId) || 0;
}

async function spendDarkCoins(userId, amount) {
    const current = await getDarkCoins(userId);
    if (current < amount) return false;
    darkCoins.set(userId, current - amount);
    return true;
}

// ========== РЕСУРСЫ И ЗАВОДЫ ==========
const RESOURCES = {
    1: { name: '🪵 Древесина', basePrice: 10, emoji: '🪵' },
    2: { name: '🪨 Камень', basePrice: 15, emoji: '🪨' },
    3: { name: '⚙️ Железо', basePrice: 25, emoji: '⚙️' },
    4: { name: '🥇 Золото', basePrice: 100, emoji: '🥇' },
    5: { name: '💎 Алмаз', basePrice: 500, emoji: '💎' }
};

const FACTORIES = {
    1: { name: '🏭 Лесопилка', price: 100000, resourceId: 1, production: 100, emoji: '🏭' },
    2: { name: '🏭 Каменоломня', price: 150000, resourceId: 2, production: 80, emoji: '🏭' },
    3: { name: '🏭 Шахта', price: 250000, resourceId: 3, production: 60, emoji: '🏭' },
    4: { name: '🏭 Золотая шахта', price: 500000, resourceId: 4, production: 30, emoji: '🏭' },
    5: { name: '🏭 Алмазный рудник', price: 1000000, resourceId: 5, production: 10, emoji: '🏭' }
};

let resourcePrices = {};

function updateResourcePrices() {
    for (const [id, resource] of Object.entries(RESOURCES)) {
        const change = (Math.random() - 0.5) * 0.2;
        let newPrice = resourcePrices[id]?.price || resource.basePrice;
        newPrice = newPrice * (1 + change);
        newPrice = Math.max(newPrice, resource.basePrice * 0.5);
        newPrice = Math.min(newPrice, resource.basePrice * 2);
        
        resourcePrices[id] = {
            price: Math.floor(newPrice),
            change: change * 100,
            timestamp: Date.now()
        };
    }
}

setInterval(updateResourcePrices, 60000);
updateResourcePrices();

// ========== ЩЕДРЫЙ ДЕНЬ ==========
let activeBonus = {
    active: false,
    type: null,
    multiplier: 1,
    endTime: null
};

const BONUS_TYPES = {
    farm: { name: 'Ферма', emoji: '💻', multiplier: 2 },
    battle: { name: 'Битвы', emoji: '⚔️', multiplier: 3 },
    dungeon: { name: 'Подземелья', emoji: '🏚️', multiplier: 4 },
    all: { name: 'ВСЁ', emoji: '🌟', multiplier: 2.5 }
};

function startRandomBonus() {
    const types = Object.keys(BONUS_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const bonus = BONUS_TYPES[randomType];
    
    activeBonus = {
        active: true,
        type: randomType,
        multiplier: bonus.multiplier,
        endTime: Date.now() + 15 * 60 * 1000
    };
    
    db.all('SELECT user_id FROM users', (err, rows) => {
        if (rows) {
            const text = `🎉 *ЩЕДРЫЙ ДЕНЬ!* 🎉\n\n${bonus.emoji} *${bonus.name}*\n✨ Доход увеличен в ${bonus.multiplier} раза!\n⏰ Длительность: 15 минут\n🏃‍♂️ Успей заработать!`;
            for (const user of rows) {
                try {
                    bot.telegram.sendMessage(user.user_id, text, { parse_mode: 'Markdown' });
                } catch(e) {}
            }
        }
    });
    
    setTimeout(() => {
        activeBonus.active = false;
        db.all('SELECT user_id FROM users', (err, rows) => {
            if (rows) {
                for (const user of rows) {
                    try {
                        bot.telegram.sendMessage(user.user_id, '⏰ *Щедрый день закончился!* Ждите следующий бонус через час!', { parse_mode: 'Markdown' });
                    } catch(e) {}
                }
            }
        });
    }, 15 * 60 * 1000);
}

setInterval(startRandomBonus, 60 * 60 * 1000);
setTimeout(startRandomBonus, 5000);

function getBonusMultiplier(type) {
    if (!activeBonus.active) return 1;
    if (activeBonus.type === 'all') return activeBonus.multiplier;
    if (activeBonus.type === type) return activeBonus.multiplier;
    return 1;
}

async function getBonusStatus() {
    if (!activeBonus.active) {
        return { active: false, text: '⏳ Щедрый день не активен. Ждите следующего часа!' };
    }
    
    const bonus = BONUS_TYPES[activeBonus.type];
    const minutesLeft = Math.ceil((activeBonus.endTime - Date.now()) / 60000);
    
    return {
        active: true,
        text: `🎉 *ЩЕДРЫЙ ДЕНЬ АКТИВЕН!* 🎉\n\n${bonus.emoji} *${bonus.name}*\n✨ Множитель: x${bonus.multiplier}\n⏰ Осталось: ${minutesLeft} минут\n🏃‍♂️ Зарабатывай больше!`
    };
}

// ========== СВАТОВСТВО ==========
let marriageProposals = new Map();

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
        register_date TEXT,
        equipped_claw INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rating INTEGER DEFAULT 1000,
        gpu_count INTEGER DEFAULT 2500,
        car_id INTEGER DEFAULT 0,
        car_engine_level INTEGER DEFAULT 0,
        races_won INTEGER DEFAULT 0,
        referrer_id INTEGER DEFAULT 0,
        referral_count INTEGER DEFAULT 0,
        referral_earned INTEGER DEFAULT 0,
        farm_amulets TEXT DEFAULT '[]',
        last_crypto_collect TEXT,
        crypto_portfolio TEXT DEFAULT '[]',
        dungeon_energy INTEGER DEFAULT 100,
        last_dungeon TEXT,
        married_to INTEGER DEFAULT 0,
        factories TEXT DEFAULT '[]',
        resources TEXT DEFAULT '{}',
        last_resource_collect TEXT
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
    
    for (const [role, data] of Object.entries(ADMIN_ROLES)) {
        for (const userId of data.users) {
            db.run(`INSERT OR IGNORE INTO admins (user_id, role, appointed_by, appointed_at) 
                    VALUES (?, ?, ?, datetime('now'))`, [userId, role, 5005387093]);
        }
    }
});

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
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
        db.run(`INSERT INTO users (user_id, last_collect, last_daily, register_date, referrer_id, gpu_count, last_crypto_collect, last_resource_collect) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [userId, now, now, now, referrerId, BASE_GPU_COUNT, now, now], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    getUser(userId).then(user => resolve(user.id)).catch(reject);
                } else {
                    reject(err);
                }
            } else {
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
            else {
                userCache.delete(userId);
                resolve();
            }
        });
    });
}

async function setUserField(userId, field, value) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE users SET ${field} = ? WHERE user_id = ?`, [value, userId], (err) => {
            if (err) reject(err);
            else {
                userCache.delete(userId);
                resolve();
            }
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

function getGPUCount(user) {
    let multiplier = 1;
    if (user.vip_level !== 'none' && VIP_STATUSES[user.vip_level]) {
        multiplier = VIP_STATUSES[user.vip_level].gpuMultiplier;
    }
    return (user.gpu_count || BASE_GPU_COUNT) * multiplier;
}

function calculateCryptoIncome(user) {
    const gpuCount = getGPUCount(user);
    let amulets = [];
    try { amulets = JSON.parse(user.farm_amulets || '[]'); } catch(e) { amulets = []; }
    const amuletBonus = amulets.length * 10;
    let marriageBonus = 0;
    if (user.married_to) marriageBonus = 25;
    const bonusMultiplier = getBonusMultiplier('farm');
    return Math.floor(gpuCount * (1 + (amuletBonus + marriageBonus) / 100) * bonusMultiplier);
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
    
    await updateBalance(userId, totalIncome);
    await setUserField(userId, 'last_crypto_collect', now.toISOString());
    
    return { success: true, income: totalIncome, hours: hoursPassed };
}

function getCarSpeed(user) {
    if (!user || !user.car_id || user.car_id === 0) return 0;
    let speed = CARS[user.car_id]?.speed || 0;
    if (user.car_engine_level > 0 && ENGINE_UPGRADES[user.car_engine_level]) {
        speed += ENGINE_UPGRADES[user.car_engine_level].speedBonus;
    }
    return speed;
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
    if (user.married_to) attack += 20;
    const bonusMultiplier = getBonusMultiplier('battle');
    return Math.floor(attack * bonusMultiplier);
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
    if (user.married_to) defense += 20;
    return defense;
}

// ========== КРИПТО-БИРЖА ФУНКЦИИ ==========
async function buyCrypto(userId, cryptoKey, amount, leverage = 1) {
    const user = await getUser(userId);
    const crypto = CRYPTO_CURRENCIES[cryptoKey];
    const market = marketPrices[cryptoKey];
    
    if (!crypto || !market) return { error: '❌ Криптовалюта не найдена!' };
    if (leverage < 1 || leverage > 10) return { error: '❌ Плечо от 1 до 10!' };
    if (amount <= 0) return { error: '❌ Количество должно быть положительным!' };
    
    const totalCost = market.price * amount * leverage;
    
    if (user.balance < totalCost) {
        return { error: `❌ Не хватает ${(totalCost - user.balance).toLocaleString()} монет!` };
    }
    
    await updateBalance(userId, -totalCost);
    
    let portfolio = [];
    try { portfolio = JSON.parse(user.crypto_portfolio || '[]'); } catch(e) { portfolio = []; }
    
    portfolio.push({
        crypto: cryptoKey,
        amount,
        buyPrice: market.price,
        leverage,
        timestamp: Date.now()
    });
    
    await setUserField(userId, 'crypto_portfolio', JSON.stringify(portfolio));
    
    return {
        success: true,
        text: `📈 *ПОКУПКА ${crypto.name}*\n\n💰 Цена: ${market.price.toLocaleString()} ₽\n📊 Количество: ${amount}\n⚡ Плечо: x${leverage}\n💸 Итого: ${totalCost.toLocaleString()} ₽`
    };
}

async function sellCrypto(userId, cryptoKey, positionIndex) {
    const user = await getUser(userId);
    const crypto = CRYPTO_CURRENCIES[cryptoKey];
    const market = marketPrices[cryptoKey];
    
    let portfolio = [];
    try { portfolio = JSON.parse(user.crypto_portfolio || '[]'); } catch(e) { portfolio = []; }
    
    if (positionIndex >= portfolio.length) return { error: '❌ Позиция не найдена!' };
    
    const position = portfolio[positionIndex];
    if (position.crypto !== cryptoKey) return { error: '❌ Криптовалюта не совпадает!' };
    
    const currentValue = position.amount * market.price * position.leverage;
    const buyValue = position.amount * position.buyPrice * position.leverage;
    const profit = currentValue - buyValue;
    const profitPercent = (profit / buyValue) * 100;
    
    await updateBalance(userId, currentValue);
    
    portfolio.splice(positionIndex, 1);
    await setUserField(userId, 'crypto_portfolio', JSON.stringify(portfolio));
    
    const emoji = profit >= 0 ? '📈' : '📉';
    
    return {
        success: true,
        text: `💰 *ПРОДАЖА ${crypto.name}*\n\n📈 Цена покупки: ${position.buyPrice.toLocaleString()} ₽\n📉 Цена продажи: ${market.price.toLocaleString()} ₽\n📊 Изменение: ${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(2)}%\n⚡ Плечо: x${position.leverage}\n${emoji} *${profit >= 0 ? 'ПРИБЫЛЬ' : 'УБЫТОК'}:* ${Math.abs(profit).toLocaleString()} ₽`
    };
}

async function getCryptoPortfolio(userId) {
    const user = await getUser(userId);
    let portfolio = [];
    try { portfolio = JSON.parse(user.crypto_portfolio || '[]'); } catch(e) { portfolio = []; }
    
    if (portfolio.length === 0) {
        return { text: '📊 *КРИПТО-ПОРТФЕЛЬ ПУСТ*\n\nКупи криптовалюту: /buycrypto BTC 1' };
    }
    
    let totalProfit = 0;
    let text = `📊 *КРИПТО-ПОРТФЕЛЬ*\n\n`;
    
    for (let i = 0; i < portfolio.length; i++) {
        const pos = portfolio[i];
        const crypto = CRYPTO_CURRENCIES[pos.crypto];
        const market = marketPrices[pos.crypto];
        const currentValue = pos.amount * market.price * pos.leverage;
        const buyValue = pos.amount * pos.buyPrice * pos.leverage;
        const profit = currentValue - buyValue;
        totalProfit += profit;
        
        const profitPercent = (profit / buyValue) * 100;
        const profitEmoji = profit >= 0 ? '📈' : '📉';
        
        text += `${crypto.icon} *${crypto.name}* x${pos.leverage}\n`;
        text += `   📊 ${pos.amount} шт. по ${pos.buyPrice.toLocaleString()}\n`;
        text += `   ${profitEmoji} ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} (${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(2)}%)\n`;
        text += `   🆔 Позиция #${i}\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Общий P&L:* ${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()} ₽\n\n`;
    text += `📝 *Команды:*\n• /buycrypto BTC 5 — купить 5 BTC\n• /sellcrypto BTC 0 — продать позицию #0\n• /market — текущие курсы`;
    
    return { text, totalProfit };
}

async function getMarketRates() {
    let text = `📈 *КРИПТО-БИРЖА* 📉\n\n`;
    for (const [key, crypto] of Object.entries(CRYPTO_CURRENCIES)) {
        const market = marketPrices[key];
        const changeEmoji = market.change >= 0 ? '📈' : '📉';
        text += `${crypto.icon} *${crypto.name}* (${crypto.symbol})\n`;
        text += `   💰 ${market.price.toLocaleString()} ₽\n`;
        text += `   ${changeEmoji} ${market.change > 0 ? '+' : ''}${market.change.toFixed(2)}%\n\n`;
    }
    text += `⚡ *Кредитное плечо:* x1 - x10\n💡 *Совет:* Покупай дёшево, продавай дорого!\n\n📝 *Команды:*\n• /buycrypto BTC 5 — купить 5 BTC\n• /portfolio — мой портфель`;
    return text;
}

// ========== ПОДЗЕМЕЛЬЯ ФУНКЦИИ ==========
async function enterDungeon(userId, dungeonId) {
    const user = await getUser(userId);
    const dungeon = DUNGEONS[dungeonId];
    
    if (!dungeon) return { error: '❌ Подземелье не найдено!' };
    if (user.level < dungeon.minPlayerLevel) {
        return { error: `❌ Требуется ${dungeon.minPlayerLevel} уровень игрока! У тебя ${user.level}` };
    }
    if (user.dungeon_energy < dungeon.energyCost) {
        return { error: `❌ Не хватает энергии! Нужно ${dungeon.energyCost}, у тебя ${user.dungeon_energy}` };
    }
    
    const lastDungeon = user.last_dungeon ? new Date(user.last_dungeon) : new Date(0);
    if (Date.now() - lastDungeon < dungeon.cooldown) {
        const minutes = Math.ceil((dungeon.cooldown - (Date.now() - lastDungeon)) / 60000);
        return { error: `⏳ Отдыхай ${minutes} минут перед следующим заходом!` };
    }
    
    const bossIndex = Math.floor(Math.random() * dungeon.bosses.length);
    const boss = dungeon.bosses[bossIndex];
    let reward = dungeon.rewards[bossIndex];
    const bonusMultiplier = getBonusMultiplier('dungeon');
    reward = Math.floor(reward * bonusMultiplier);
    
    const attack = calculateAttack(user);
    const winChance = attack / (attack + dungeon.level * 50) * 100;
    const win = Math.random() * 100 < winChance;
    
    await setUserField(userId, 'dungeon_energy', user.dungeon_energy - dungeon.energyCost);
    await setUserField(userId, 'last_dungeon', new Date().toISOString());
    
    if (win) {
        await updateBalance(userId, reward);
        
        let lootText = '';
        for (const loot of dungeon.lootTable) {
            if (Math.random() < loot.chance) {
                if (loot.attackBonus) {
                    await addClaw(userId, 1);
                    lootText += `\n🗡️ +${loot.item} (${loot.attackBonus} атаки)`;
                } else if (loot.defenseBonus) {
                    await setUserField(userId, 'armored', 1);
                    lootText += `\n🛡️ +${loot.item} (${loot.defenseBonus} защиты)`;
                } else if (loot.value) {
                    await updateBalance(userId, loot.value);
                    lootText += `\n💎 +${loot.item} (${loot.value.toLocaleString()} ₽)`;
                }
            }
        }
        
        if (Math.random() < 0.3) {
            const darkCoinsReward = Math.floor(Math.random() * 500) + 100;
            await addDarkCoins(userId, darkCoinsReward);
            lootText += `\n🪙 +${darkCoinsReward} тёмных монет`;
        }
        
        let text = `🏆 *ПОБЕДА В ПОДЗЕМЕЛЬЕ!* 🏆\n\n🏚️ ${dungeon.name}\n👹 Босс: ${boss}\n💰 Награда: ${reward.toLocaleString()} ₽\n${lootText ? `🎁 Лут:${lootText}\n` : ''}⚡ Энергии осталось: ${user.dungeon_energy - dungeon.energyCost}`;
        if (bonusMultiplier > 1) text += `\n✨ *Щедрый день! x${bonusMultiplier}*`;
        
        return { success: true, text };
    } else {
        const penalty = Math.floor(reward * 0.3);
        await updateBalance(userId, -penalty);
        
        let text = `💀 *ПОРАЖЕНИЕ В ПОДЗЕМЕЛЬЕ!* 💀\n\n🏚️ ${dungeon.name}\n👹 Босс: ${boss}\n💔 Потеряно: ${penalty.toLocaleString()} ₽\n⚡ Энергии осталось: ${user.dungeon_energy - dungeon.energyCost}`;
        
        return { success: false, text };
    }
}

async function restoreEnergy(userId) {
    const user = await getUser(userId);
    const lastRestore = user.last_energy_restore ? new Date(user.last_energy_restore) : new Date(0);
    
    if (Date.now() - lastRestore < 3600000) {
        const minutes = Math.ceil((3600000 - (Date.now() - lastRestore)) / 60000);
        return { error: `⏳ Энергия восстановится через ${minutes} минут!` };
    }
    
    await setUserField(userId, 'dungeon_energy', 100);
    await setUserField(userId, 'last_energy_restore', new Date().toISOString());
    
    return { success: true, text: '⚡ Энергия восстановлена до 100!' };
}

// ========== ЛОТЕРЕЯ ФУНКЦИИ ==========
async function buyLotteryTicket(userId, numbers) {
    const user = await getUser(userId);
    if (user.balance < 10000) return { error: `❌ Не хватает ${(10000 - user.balance).toLocaleString()} монет!` };
    if (!numbers || numbers.length !== 6) return { error: '❌ Выбери 6 чисел от 1 до 49! Пример: /лотерея 5 12 23 34 41 48' };
    for (const num of numbers) if (num < 1 || num > 49) return { error: '❌ Числа должны быть от 1 до 49!' };
    
    await updateBalance(userId, -10000);
    globalJackpot += 10000;
    lotteryTickets.set(userId, { numbers, timestamp: Date.now() });
    
    return { success: true, text: `🎫 *БИЛЕТ КУПЛЕН!*\n\nТвои числа: ${numbers.join(', ')}\n💰 Джекпот: ${globalJackpot.toLocaleString()} монет\n⏰ Розыгрыш каждый час!` };
}

async function drawLottery() {
    const now = Date.now();
    if (now - lastDrawTime < 3600000) return;
    lastDrawTime = now;
    
    const winningNumbers = [];
    for (let i = 0; i < 6; i++) winningNumbers.push(Math.floor(Math.random() * 49) + 1);
    
    let winners = [];
    for (const [userId, ticket] of lotteryTickets.entries()) {
        let matches = 0;
        for (const num of ticket.numbers) if (winningNumbers.includes(num)) matches++;
        
        let prize = 0;
        if (matches === 3) prize = 50000;
        else if (matches === 4) prize = 500000;
        else if (matches === 5) prize = 5000000;
        else if (matches === 6) prize = globalJackpot;
        
        if (prize > 0) {
            await updateBalance(userId, prize);
            await addDarkCoins(userId, Math.floor(prize / 1000));
            winners.push({ userId, matches, prize });
        }
    }
    
    if (winners.length === 0) globalJackpot = Math.floor(globalJackpot * 1.1);
    else globalJackpot = 10000000;
    lotteryTickets.clear();
    
    const allUsers = await new Promise((resolve) => db.all('SELECT user_id FROM users', (err, rows) => resolve(rows || [])));
    let resultText = `🎰 *РЕЗУЛЬТАТЫ ЛОТЕРЕИ!* 🎰\n\n🎲 Выигрышные числа: ${winningNumbers.join(', ')}\n💰 Новый джекпот: ${globalJackpot.toLocaleString()} монет\n\n`;
    if (winners.length > 0) {
        resultText += `🏆 *ПОБЕДИТЕЛИ:*\n`;
        for (const w of winners) resultText += `• Игрок #${w.userId} — ${w.matches} совпадений! +${w.prize.toLocaleString()} монет\n`;
    } else resultText += `😢 В этом тираже победителей нет! Джекпот увеличен!`;
    
    for (const user of allUsers) try { await bot.telegram.sendMessage(user.user_id, resultText, { parse_mode: 'Markdown' }); } catch(e) {}
}

setInterval(drawLottery, 60000);

// ========== ЧЁРНЫЙ РЫНОК ФУНКЦИИ ==========
async function buyBlackMarketItem(userId, itemId) {
    const item = BLACK_MARKET_ITEMS[itemId];
    if (!item) return { error: '❌ Товар не найден!' };
    
    const userCoins = await getDarkCoins(userId);
    if (userCoins < item.price) return { error: `❌ Не хватает тёмных монет! Нужно ${item.price}, у тебя ${userCoins}` };
    
    await spendDarkCoins(userId, item.price);
    
    if (item.type === 'claw') await addClaw(userId, item.clawId);
    else if (item.type === 'item') await updateBalance(userId, item.value);
    else if (item.type === 'amulet') {
        let amulets = [];
        try { amulets = JSON.parse((await getUser(userId)).farm_amulets || '[]'); } catch(e) { amulets = []; }
        amulets.push('🌙 Лунный камень');
        await setUserField(userId, 'farm_amulets', JSON.stringify(amulets));
    } else if (item.type === 'vip') {
        await setUserField(userId, 'vip_level', item.vipLevel);
        const user = await getUser(userId);
        const newGpuCount = (user.gpu_count || BASE_GPU_COUNT) * VIP_STATUSES[item.vipLevel].gpuMultiplier;
        await setUserField(userId, 'gpu_count', newGpuCount);
    } else if (item.type === 'car') await setUserField(userId, 'car_id', item.carId);
    
    return { success: true, text: `✅ *КУПЛЕНО НА ЧЁРНОМ РЫНКЕ!*\n\n${item.emoji} ${item.name}\n💰 Цена: ${item.price} тёмных монет` };
}

async function getBlackMarketText(userId) {
    const userCoins = await getDarkCoins(userId);
    let text = `🏪 *ЧЁРНЫЙ РЫНОК* 🏪\n\n🪙 Твои тёмные монеты: ${userCoins}\n\n📦 *ДОСТУПНЫЕ ТОВАРЫ:*\n\n`;
    for (const [id, item] of Object.entries(BLACK_MARKET_ITEMS)) {
        text += `${item.emoji} *${item.name}*\n💰 Цена: ${item.price} тёмных монет\n📝 /blackmarket ${id} — купить\n\n`;
    }
    text += `✨ *Как получить тёмные монеты:*\n• Прохождение подземелий (30% шанс)\n• Выигрыш в лотерее\n• Ежедневный бонус (10% шанс)`;
    return text;
}

// ========== ЗАВОДЫ ФУНКЦИИ ==========
async function buyFactory(userId, factoryId) {
    const user = await getUser(userId);
    const factory = FACTORIES[factoryId];
    if (!factory) return { error: '❌ Завод не найден!' };
    
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    if (factories.includes(factoryId)) return { error: `❌ У вас уже есть ${factory.name}!` };
    if (user.balance < factory.price) return { error: `❌ Не хватает ${(factory.price - user.balance).toLocaleString()} монет!` };
    
    await updateBalance(userId, -factory.price);
    factories.push(factoryId);
    await setUserField(userId, 'factories', JSON.stringify(factories));
    
    return { success: true, text: `✅ *КУПЛЕН ЗАВОД!*\n\n${factory.emoji} ${factory.name}\n💰 Цена: ${factory.price.toLocaleString()} ₽\n📦 Производит: ${RESOURCES[factory.resourceId].name} (${factory.production}/час)` };
}

async function collectResources(userId) {
    const user = await getUser(userId);
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    if (factories.length === 0) return { error: '❌ У вас нет заводов! Купите: /buyfactory 1' };
    
    const lastCollect = user.last_resource_collect ? new Date(user.last_resource_collect) : new Date(0);
    const now = new Date();
    const hoursPassed = Math.floor((now - lastCollect) / 3600000);
    if (hoursPassed < 1) {
        const minutesLeft = 60 - Math.floor((now - lastCollect) / 60000);
        return { error: `⏳ Ресурсы будут готовы через ${minutesLeft} минут!` };
    }
    
    let resources = {};
    try { resources = JSON.parse(user.resources || '{}'); } catch(e) { resources = {}; }
    let totalValue = 0;
    let collectedText = '';
    
    for (const factoryId of factories) {
        const factory = FACTORIES[factoryId];
        const amount = factory.production * hoursPassed;
        resources[factory.resourceId] = (resources[factory.resourceId] || 0) + amount;
        const price = resourcePrices[factory.resourceId]?.price || RESOURCES[factory.resourceId].basePrice;
        const value = amount * price;
        totalValue += value;
        collectedText += `\n${RESOURCES[factory.resourceId].emoji} ${RESOURCES[factory.resourceId].name}: +${amount} шт. (${value.toLocaleString()} ₽)`;
    }
    
    await setUserField(userId, 'resources', JSON.stringify(resources));
    await setUserField(userId, 'last_resource_collect', now.toISOString());
    
    return { success: true, text: `🏭 *СБОР РЕСУРСОВ*\n\n📦 Произведено за ${hoursPassed} час(ов):${collectedText}\n💰 Общая стоимость: ${totalValue.toLocaleString()} ₽\n💡 /sellresources — продать ресурсы`, totalValue };
}

async function sellResources(userId) {
    const user = await getUser(userId);
    let resources = {};
    try { resources = JSON.parse(user.resources || '{}'); } catch(e) { resources = {}; }
    
    let totalValue = 0;
    let soldText = '';
    for (const [resId, amount] of Object.entries(resources)) {
        if (amount > 0) {
            const price = resourcePrices[resId]?.price || RESOURCES[resId].basePrice;
            const value = amount * price;
            totalValue += value;
            soldText += `\n${RESOURCES[resId].emoji} ${RESOURCES[resId].name}: ${amount} шт. x ${price.toLocaleString()} = ${value.toLocaleString()} ₽`;
            resources[resId] = 0;
        }
    }
    
    if (totalValue === 0) return { error: '❌ У вас нет ресурсов для продажи!' };
    
    await updateBalance(userId, totalValue);
    await setUserField(userId, 'resources', JSON.stringify({}));
    
    return { success: true, text: `💰 *ПРОДАЖА РЕСУРСОВ*\n\n📦 Продано:${soldText}\n💵 Итого: +${totalValue.toLocaleString()} ₽` };
}

async function getResourcesStatus(userId) {
    const user = await getUser(userId);
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    let resources = {};
    try { resources = JSON.parse(user.resources || '{}'); } catch(e) { resources = {}; }
    
    let text = `🏭 *ВАШИ ЗАВОДЫ*\n\n`;
    if (factories.length === 0) text += `У вас нет заводов.\n/buyfactory 1 — купить лесопилку\n`;
    else for (const factoryId of factories) {
        const factory = FACTORIES[factoryId];
        text += `${factory.emoji} ${factory.name}\n📦 Производит: ${RESOURCES[factory.resourceId].name} (${factory.production}/час)\n\n`;
    }
    
    text += `📦 *ВАШИ РЕСУРСЫ:*\n`;
    let hasResources = false;
    for (const [id, resource] of Object.entries(RESOURCES)) {
        const amount = resources[id] || 0;
        if (amount > 0) { hasResources = true; text += `${resource.emoji} ${resource.name}: ${amount} шт.\n`; }
    }
    if (!hasResources) text += `Нет ресурсов. /collectresources — собрать\n`;
    
    text += `\n💡 /collectresources — собрать ресурсы\n💰 /sellresources — продать ресурсы\n📊 /resourceprices — цены на ресурсы`;
    return text;
}

async function getResourcePrices() {
    let text = `📊 *ЦЕНЫ НА РЕСУРСЫ*\n\n`;
    for (const [id, resource] of Object.entries(RESOURCES)) {
        const price = resourcePrices[id]?.price || resource.basePrice;
        const change = resourcePrices[id]?.change || 0;
        const changeEmoji = change >= 0 ? '📈' : '📉';
        text += `${resource.emoji} ${resource.name}: ${price.toLocaleString()} ₽ ${changeEmoji} ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n`;
    }
    text += `\n⏰ Цены обновляются каждый час!`;
    return text;
}

// ========== СВАТОВСТВО ФУНКЦИИ ==========
async function proposeMarriage(userId, targetId) {
    const user = await getUser(userId);
    const target = await getUser(targetId);
    if (!target) return { error: '❌ Игрок не найден!' };
    if (user.married_to) return { error: '❌ Вы уже состоите в браке!' };
    if (target.married_to) return { error: '❌ Игрок уже в браке!' };
    if (user.balance < 500000) return { error: '❌ Свадьба стоит 500,000 монет!' };
    
    await updateBalance(userId, -500000);
    marriageProposals.set(target.user_id, { from: userId, timestamp: Date.now() });
    await bot.telegram.sendMessage(target.user_id, `💍 *ПРЕДЛОЖЕНИЕ!*\n\nИгрок #${user.id} делает вам предложение!\n\nПринять: /marry yes\nОтказать: /marry no`, { parse_mode: 'Markdown' });
    
    return { success: true, text: `💍 Предложение отправлено игроку #${target.id}!` };
}

async function acceptMarriage(userId) {
    const proposal = marriageProposals.get(userId);
    if (!proposal) return { error: '❌ Нет активных предложений!' };
    if (Date.now() - proposal.timestamp > 300000) {
        marriageProposals.delete(userId);
        return { error: '❌ Предложение устарело!' };
    }
    
    const user = await getUser(userId);
    const proposer = await getUser(proposal.from);
    if (user.married_to || proposer.married_to) return { error: '❌ Кто-то уже в браке!' };
    
    await setUserField(userId, 'married_to', proposer.id);
    await setUserField(proposer.user_id, 'married_to', user.id);
    
    const totalGpu = (user.gpu_count || 0) + (proposer.gpu_count || 0);
    await setUserField(userId, 'gpu_count', totalGpu);
    await setUserField(proposer.user_id, 'gpu_count', totalGpu);
    marriageProposals.delete(userId);
    
    return { success: true, text: `💍 *ПОЗДРАВЛЯЕМ!*\n\nИгроки #${user.id} и #${proposer.id} теперь в браке!\n💻 Общая ферма: ${totalGpu.toLocaleString()} видеокарт\n❤️ Совместный доход увеличен на 25%!\n⚔️ Атака и защита +20!` };
}

// ========== ПРОФИЛЬ ==========
async function getProfileText(userId) {
    const user = await getCachedUser(userId);
    if (!user) return '❌ Ошибка загрузки профиля';
    
    const gameId = await getGameId(userId);
    const role = await getAdminRole(userId);
    const roleName = role ? ADMIN_ROLES[role]?.name || '👤 Игрок' : '👤 Игрок';
    const car = (user.car_id && user.car_id !== 0) ? CARS[user.car_id] : null;
    const gpuCount = getGPUCount(user);
    const hourlyIncome = calculateCryptoIncome(user);
    let amulets = [];
    try { amulets = JSON.parse(user.farm_amulets || '[]'); } catch(e) { amulets = []; }
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    const darkCoinsAmount = await getDarkCoins(userId);
    
    let text = `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n`;
    text += `             👑 *CRYPTO EMPIRE* 👑\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${gameId}\n`;
    text += `│ 👔 Роль: ${roleName}\n`;
    text += `│ ${BUSINESSES[user.business_level].emoji} Бизнес: ${BUSINESSES[user.business_level].name}\n`;
    text += `│ 📊 Уровень: ${user.business_level}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💰 Баланс: ${(user.balance || 0).toLocaleString()} ₽\n`;
    text += `│ 🎚️ Ур. игрока: ${user.level || 1}\n`;
    text += `│ 📊 Рейтинг: ${user.rating || 1000}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${gpuCount.toLocaleString()}\n`;
    text += `│ 💰 Криптодоход/час: ${hourlyIncome.toLocaleString()} ₽\n`;
    text += `│ 📀 Амулетов: ${amulets.length}/10\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 🏪 Тёмных монет: ${darkCoinsAmount}\n`;
    text += `│ 🏭 Заводов: ${factories.length}/5\n`;
    text += `│ ${car ? `${car.emoji} Машина: ${car.name}` : '🚗 Машины нет'}\n`;
    text += `│ 🏁 Побед в гонках: ${user.races_won || 0}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ ${user.married_to ? `💍 В браке с #${user.married_to}` : '💔 Не женат'}\n`;
    text += `│ ${user.vip_level !== 'none' ? VIP_STATUSES[user.vip_level].emoji + ' VIP: ' + VIP_STATUSES[user.vip_level].name : '✨ VIP: Нет'}\n`;
    text += `│ 🔥 Серия: ${user.streak || 0} дней\n`;
    text += `└─────────────────────────┘\n\n`;
    text += `🌟━━━━━━━━━━━━━━━━━━━━━━🌟`;
    
    return text;
}

// ========== КЛАВИАТУРА ==========
function mainKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 Профиль', 'profile'), Markup.button.callback('🏪 Бизнес', 'business')],
        [Markup.button.callback('💻 Ферма', 'crypto'), Markup.button.callback('📈 Биржа', 'exchange')],
        [Markup.button.callback('🏭 Заводы', 'factory'), Markup.button.callback('🏚️ Подземелье', 'dungeon')],
        [Markup.button.callback('🎰 Лотерея', 'lottery'), Markup.button.callback('🏪 Чёрный рынок', 'blackmarket')],
        [Markup.button.callback('💍 Свадьба', 'marriage'), Markup.button.callback('🚗 Машины', 'car_shop')],
        [Markup.button.callback('🎁 Бонус', 'daily'), Markup.button.callback('📊 Топы', 'top_menu')],
        [Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== КОМАНДЫ БОТА ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const referrerId = args[1] ? parseInt(args[1]) : null;
    await registerUser(userId, referrerId);
    await ctx.reply(await getProfileText(userId), { parse_mode: 'Markdown', ...mainKeyboard() });
});

// АЛИАСЫ
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().trim();
    const userId = ctx.from.id;
    
    if (text === 'б' || text === 'баланс' || text === 'профиль' || text === 'проф') {
        await ctx.reply(await getProfileText(userId), { parse_mode: 'Markdown', ...mainKeyboard() });
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
        const streak = (user.streak || 0) + 1;
        const bonus = 1000 + (streak * 500);
        await updateBalance(userId, bonus);
        if (Math.random() < 0.1) {
            const darkReward = Math.floor(Math.random() * 100) + 50;
            await addDarkCoins(userId, darkReward);
            await ctx.reply(`🎁 *БОНУС!*\n🔥 Серия: ${streak}\n💰 +${bonus.toLocaleString()} ₽\n🪙 +${darkReward} тёмных монет!`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`🎁 *БОНУС!*\n🔥 Серия: ${streak}\n💰 +${bonus.toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        await setUserField(userId, 'last_daily', now.toISOString());
        await setUserField(userId, 'streak', streak);
        return;
    }
    
    if (text === 'ферма') {
        const user = await getUser(userId);
        const gpuCount = getGPUCount(user);
        const hourlyIncome = calculateCryptoIncome(user);
        let amulets = [];
        try { amulets = JSON.parse(user.farm_amulets || '[]'); } catch(e) { amulets = []; }
        let farmText = `💻 *КРИПТОФЕРМА*\n\n📝 Видеокарты: ${gpuCount.toLocaleString()} шт.\n💹 Доход: ${hourlyIncome.toLocaleString()} ₽/час\n📀 Амулеты: ${amulets.length}/10\n`;
        if (user.married_to) farmText += `💍 Свадебный бонус: +25% к доходу!\n`;
        farmText += `\n✨ /собрать — собрать доход\n✨ /купить ферма X — купить видеокарты`;
        await ctx.reply(farmText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'собрать') {
        const result = await collectCrypto(userId);
        if (result.error) await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        else await ctx.reply(`✅ *СОБРАНО!*\n\n💰 +${result.income.toLocaleString()} ₽ за ${result.hours} час(ов)`, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text.startsWith('купить ферма ')) {
        const amount = parseInt(text.split(' ')[2]);
        if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ Пример: купить ферма 10'); return; }
        const user = await getUser(userId);
        const totalCost = amount * GPU_PRICE;
        if (user.balance >= totalCost) {
            await updateBalance(userId, -totalCost);
            const newGpuCount = (user.gpu_count || BASE_GPU_COUNT) + amount;
            await setUserField(userId, 'gpu_count', newGpuCount);
            await ctx.reply(`✅ *КУПЛЕНО ${amount} ВИДЕОКАРТ!*\n\n💻 Всего: ${newGpuCount.toLocaleString()}\n💰 Остаток: ${(user.balance - totalCost).toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`❌ Не хватает ${(totalCost - user.balance).toLocaleString()} ₽!`, { parse_mode: 'Markdown' });
        }
        return;
    }
    
    if (text === 'топ') {
        const topUsers = await new Promise((resolve) => db.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT 10', (err, rows) => resolve(rows || [])));
        let topText = `🏆 *ТОП 10 БОГАЧЕЙ* 🏆\n\n`;
        for (let i = 0; i < topUsers.length; i++) {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            topText += `${medal} #${topUsers[i].id} — ${topUsers[i].balance.toLocaleString()} ₽\n`;
        }
        await ctx.reply(topText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'бонусстатус' || text === 'bonusstatus') {
        const bonus = await getBonusStatus();
        await ctx.reply(bonus.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'помощь' || text === 'help') {
        let helpText = `📚 *ПОМОЩЬ*\n\n`;
        helpText += `👤 *ОСНОВНЫЕ:*\n• б, профиль — профиль\n• бонус — ежедневная награда\n• топ — топ богачей\n• ферма, собрать, купить ферма X\n\n`;
        helpText += `📈 *КРИПТО-БИРЖА:*\n• market — курсы валют\n• buycrypto BTC 5 — купить BTC\n• portfolio — портфель\n\n`;
        helpText += `🏭 *ЗАВОДЫ:*\n• buyfactory 1-5 — купить завод\n• collectresources — собрать ресурсы\n• sellresources — продать ресурсы\n• resourceprices — цены\n\n`;
        helpText += `🏚️ *ПОДЗЕМЕЛЬЯ:*\n• dungeon 1-3 — войти\n• energy — восстановить энергию\n\n`;
        helpText += `🎰 *ЛОТЕРЕЯ:*\n• lottery 1-6 — купить билет\n\n`;
        helpText += `🏪 *ЧЁРНЫЙ РЫНОК:*\n• blackmarket — товары\n\n`;
        helpText += `💍 *СВАДЬБА:*\n• propose ID — предложить\n• marry yes/no — ответ\n\n`;
        helpText += `🚗 *ГОНКИ:*\n• buycar 1-5 — купить машину\n\n`;
        helpText += `🛡️ *АДМИН:*\n• aget ID — инфо\n• give @ник сумма\n• ban/unban\n• announce текст\n• setadmin @ник роль`;
        await ctx.reply(helpText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
});

// ========== КОМАНДЫ ==========
bot.command(['market', 'курсы'], async (ctx) => { await ctx.reply(await getMarketRates(), { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['portfolio', 'портфель'], async (ctx) => { const r = await getCryptoPortfolio(ctx.from.id); await ctx.reply(r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['buycrypto', 'купитькрипту'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 3) { await ctx.reply('❌ /buycrypto BTC 5'); return; } const r = await buyCrypto(ctx.from.id, a[1].toLowerCase(), parseFloat(a[2]), a[3]?.startsWith('x') ? parseInt(a[3].slice(1)) : 1); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['sellcrypto', 'продатькрипту'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 3) { await ctx.reply('❌ /sellcrypto BTC 0'); return; } const r = await sellCrypto(ctx.from.id, a[1].toLowerCase(), parseInt(a[2])); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['dungeon', 'подземелье'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply(`🏚️ /dungeon 1-3`); return; } const r = await enterDungeon(ctx.from.id, parseInt(a[1])); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['energy', 'энергия'], async (ctx) => { const r = await restoreEnergy(ctx.from.id); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['lottery', 'лотерея'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 7) { await ctx.reply(`🎰 ДЖЕКПОТ: ${globalJackpot.toLocaleString()} ₽\n/лотерея 5 12 23 34 41 48`); return; } const r = await buyLotteryTicket(ctx.from.id, a.slice(1, 7).map(Number)); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['blackmarket', 'черныйрынок'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply(await getBlackMarketText(ctx.from.id), { parse_mode: 'Markdown', ...mainKeyboard() }); return; } const r = await buyBlackMarketItem(ctx.from.id, parseInt(a[1])); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['buyfactory', 'купитьзавод'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { let t = '🏭 /buyfactory 1-5\n'; for (const [id, f] of Object.entries(FACTORIES)) t += `${f.emoji} ${f.name} — ${f.price.toLocaleString()} ₽\n`; await ctx.reply(t); return; } const r = await buyFactory(ctx.from.id, parseInt(a[1])); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['collectresources', 'собратьресурсы'], async (ctx) => { const r = await collectResources(ctx.from.id); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['sellresources', 'продатьресурсы'], async (ctx) => { const r = await sellResources(ctx.from.id); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['resourceprices', 'цены'], async (ctx) => { await ctx.reply(await getResourcePrices(), { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['bonus', 'бонусстатус'], async (ctx) => { const b = await getBonusStatus(); await ctx.reply(b.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['propose', 'предложить'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply('❌ /propose 15'); return; } const r = await proposeMarriage(ctx.from.id, parseInt(a[1])); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); });
bot.command(['marry', 'свадьба'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply('❌ /marry yes/no'); return; } if (a[1] === 'yes') { const r = await acceptMarriage(ctx.from.id); await ctx.reply(r.error || r.text, { parse_mode: 'Markdown', ...mainKeyboard() }); } else if (a[1] === 'no') { marriageProposals.delete(ctx.from.id); await ctx.reply('❌ Вы отказали.'); } });
bot.command(['buycar', 'купитьмашину'], async (ctx) => { const a = ctx.message.text.split(' '); if (a.length < 2) { let t = '🚗 /buycar 1-5\n'; for (const [id, c] of Object.entries(CARS)) t += `${c.emoji} ${c.name} — ${c.price.toLocaleString()} ₽\n`; await ctx.reply(t); return; } const carId = parseInt(a[1]); const car = CARS[carId]; if (!car) { await ctx.reply('❌ Машина не найдена!'); return; } const user = await getUser(ctx.from.id); if (user.car_id) { await ctx.reply('❌ У тебя уже есть машина!'); return; } if (user.balance >= car.price) { await updateBalance(ctx.from.id, -car.price); await setUserField(ctx.from.id, 'car_id', carId); await ctx.reply(`✅ Куплено ${car.emoji} ${car.name}!`); } else { await ctx.reply(`❌ Не хватает ${(car.price - user.balance).toLocaleString()} ₽!`); } });
bot.command(['upgradeengine', 'улучшитьдвигатель'], async (ctx) => { const user = await getUser(ctx.from.id); if (!user.car_id) { await ctx.reply('❌ Нет машины!'); return; } const current = user.car_engine_level || 0; const next = ENGINE_UPGRADES[current + 1]; if (!next) { await ctx.reply('❌ Максимальный уровень!'); return; } if (user.balance >= next.cost) { await updateBalance(ctx.from.id, -next.cost); await setUserField(ctx.from.id, 'car_engine_level', current + 1); await ctx.reply(`⚙️ Двигатель улучшен до ${current + 1} ур. +${next.speedBonus} скорости!`); } else { await ctx.reply(`❌ Нужно ${next.cost.toLocaleString()} ₽`); } });

// ========== АДМИН КОМАНДЫ ==========
bot.command(['give', 'выдать'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'give_money')) { await ctx.reply('❌ Нет прав!'); return; } const a = ctx.message.text.split(' '); if (a.length < 3) { await ctx.reply('❌ /give @ник сумма'); return; } try { const chat = await ctx.telegram.getChat(a[1].replace('@', '')); await updateBalance(chat.id, parseInt(a[2])); await ctx.reply(`✅ Выдано ${parseInt(a[2]).toLocaleString()} монет @${a[1].replace('@', '')}!`); } catch(e) { await ctx.reply('❌ Пользователь не найден!'); } });
bot.command(['ban', 'забанить'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'ban')) { await ctx.reply('❌ Нет прав!'); return; } const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply('❌ /ban @ник'); return; } try { const chat = await ctx.telegram.getChat(a[1].replace('@', '')); await setUserField(chat.id, 'banned', 1); await ctx.reply(`✅ @${a[1].replace('@', '')} забанен!`); } catch(e) { await ctx.reply('❌ Пользователь не найден!'); } });
bot.command(['unban', 'разбанить'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'unban')) { await ctx.reply('❌ Нет прав!'); return; } const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply('❌ /unban @ник'); return; } try { const chat = await ctx.telegram.getChat(a[1].replace('@', '')); await setUserField(chat.id, 'banned', 0); await ctx.reply(`✅ @${a[1].replace('@', '')} разбанен!`); } catch(e) { await ctx.reply('❌ Пользователь не найден!'); } });
bot.command(['announce', 'объявить'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'announce')) { await ctx.reply('❌ Нет прав!'); return; } const text = ctx.message.text.split(' ').slice(1).join(' '); if (!text) { await ctx.reply('❌ /announce текст'); return; } const users = await new Promise((resolve) => db.all('SELECT user_id FROM users', (err, rows) => resolve(rows || []))); let sent = 0; for (const u of users) try { await ctx.telegram.sendMessage(u.user_id, `📢 *ОБЪЯВЛЕНИЕ*\n\n${text}`, { parse_mode: 'Markdown' }); sent++; } catch(e) {} await ctx.reply(`✅ Отправлено ${sent} игрокам!`); });
bot.command(['setadmin', 'назначить'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'set_admin')) { await ctx.reply('❌ Нет прав!'); return; } const a = ctx.message.text.split(' '); if (a.length < 3) { await ctx.reply('❌ /setadmin @ник роль'); return; } try { const chat = await ctx.telegram.getChat(a[1].replace('@', '')); db.run('INSERT OR REPLACE INTO admins (user_id, role, appointed_by, appointed_at) VALUES (?, ?, ?, datetime("now"))', [chat.id, a[2], ctx.from.id]); await ctx.reply(`✅ @${a[1].replace('@', '')} назначен на роль ${a[2]}!`); } catch(e) { await ctx.reply('❌ Пользователь не найден!'); } });
bot.command(['aget', 'агет'], async (ctx) => { if (!await hasPermission(ctx.from.id, 'help_users')) { await ctx.reply('❌ Нет прав!'); return; } const a = ctx.message.text.split(' '); if (a.length < 2) { await ctx.reply('❌ /aget ID'); return; } const user = await getUserById(parseInt(a[1])); if (!user) { await ctx.reply('❌ Игрок не найден!'); return; } const role = await getAdminRole(user.user_id); let factories = []; try { factories = JSON.parse(user.factories || '[]'); } catch(e) {} let text = `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n*АДМИН-ИНФО*\n🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n\n┌─────────────────────────┐\n│ 🆔 ID: #${user.id}\n│ 🆔 TG: ${user.user_id}\n│ 💰 Баланс: ${(user.balance || 0).toLocaleString()}\n│ 🏪 Бизнес: ${user.business_level}/10\n│ 💻 Видеокарт: ${user.gpu_count?.toLocaleString() || 2500}\n│ 🏭 Заводов: ${factories.length}/5\n│ 💍 В браке: ${user.married_to ? '✅' : '❌'}\n│ 🚫 Бан: ${user.banned ? '✅' : '❌'}\n│ 👔 Роль: ${role || 'Игрок'}\n│ 👑 VIP: ${user.vip_level}\n├─────────────────────────┤\n│ 👥 Рефералов: ${user.referral_count || 0}\n│ 📅 Регистрация: ${user.register_date?.slice(0, 19) || 'Неизвестно'}\n└─────────────────────────┘\n🔒━━━━━━━━━━━━━━━━━━━━━━🔒`; await ctx.reply(text, { parse_mode: 'Markdown' }); });

// ========== КНОПКИ ==========
const actions = ['profile', 'business', 'crypto', 'exchange', 'factory', 'dungeon', 'lottery', 'blackmarket', 'marriage', 'car_shop', 'daily', 'top_menu', 'help'];
for (const a of actions) bot.action(a, async (ctx) => {
    if (a === 'profile') await ctx.editMessageText(await getProfileText(ctx.from.id), { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'business') { const u = await getUser(ctx.from.id); const b = BUSINESSES[u.business_level]; await ctx.editMessageText(`${b.emoji} *${b.name}* (ур.${u.business_level}/10)\n💵 Доход: ${Math.floor(b.income * (1 + (u.manager?0.2:0) + (u.advertising?0.15:0) + (u.marketing?0.25:0))).toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'crypto') { const u = await getUser(ctx.from.id); const gpu = getGPUCount(u); const income = calculateCryptoIncome(u); let am = []; try { am = JSON.parse(u.farm_amulets || '[]'); } catch(e) {} await ctx.editMessageText(`💻 *КРИПТОФЕРМА*\n\n📝 Видеокарты: ${gpu.toLocaleString()} шт.\n💹 Доход: ${income.toLocaleString()} ₽/час\n📀 Амулеты: ${am.length}/10\n\n✨ /собрать — собрать доход`, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'exchange') await ctx.editMessageText(await getMarketRates(), { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'factory') await ctx.editMessageText(await getResourcesStatus(ctx.from.id), { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'dungeon') { const u = await getUser(ctx.from.id); await ctx.editMessageText(`🏚️ *ПОДЗЕМЕЛЬЯ*\n⚡ Энергии: ${u.dungeon_energy}/100\n\n1. 🏚️ Склеп гоблинов (ур.1)\n2. 🔥 Вулкан дракона (ур.5)\n3. ❄️ Ледяная цитадель (ур.10)\n\n/dungeon 1-3`, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'lottery') await ctx.editMessageText(`🎰 *ЛОТЕРЕЯ*\n💰 Джекпот: ${globalJackpot.toLocaleString()} ₽\n/лотерея 1 2 3 4 5 6`, { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'blackmarket') await ctx.editMessageText(await getBlackMarketText(ctx.from.id), { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'marriage') { const u = await getUser(ctx.from.id); await ctx.editMessageText(`💍 *СВАДЬБА*\n💍 ${u.married_to ? `В браке с #${u.married_to}` : 'Не женат'}\n\n/propose ID — сделать предложение\n/marry yes/no — ответ`, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'car_shop') { let t = '🚗 *МАШИНЫ*\n'; for (const [id, c] of Object.entries(CARS)) t += `${c.emoji} ${c.name} — ${c.price.toLocaleString()} ₽\n`; t += `\n/buycar 1-5`; await ctx.editMessageText(t, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'daily') await ctx.editMessageText(`🎁 /бонус — ежедневная награда!`, { parse_mode: 'Markdown', ...mainKeyboard() });
    else if (a === 'top_menu') { const top = await new Promise((resolve) => db.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT 10', (err, rows) => resolve(rows || []))); let t = `🏆 *ТОП 10 БОГАЧЕЙ* 🏆\n\n`; for (let i=0; i<top.length; i++) t += `${i===0?'🥇':i===1?'🥈':i===2?'🥉':'📌'} #${top[i].id} — ${top[i].balance.toLocaleString()} ₽\n`; await ctx.editMessageText(t, { parse_mode: 'Markdown', ...mainKeyboard() }); }
    else if (a === 'help') await ctx.editMessageText(`📚 /помощь — все команды`, { parse_mode: 'Markdown', ...mainKeyboard() });
    try { await ctx.answerCbQuery(); } catch(e) {}
});

// ========== ЗАПУСК ==========
bot.launch().then(() => {
    console.log('🌟 CRYPTO EMPIRE ЗАПУЩЕН!');
    console.log('📈 Крипто-биржа активна!');
    console.log('🏭 Заводы активны!');
    console.log('🏚️ Подземелья готовы!');
    console.log('🎰 Лотерея запущена!');
    console.log('🏪 Чёрный рынок активен!');
    console.log('💍 Сватовство активно!');
    console.log('🎁 Щедрый день активен!');
    console.log('💻 Криптоферма работает!');
    console.log('👑 Админ-команды готовы!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
