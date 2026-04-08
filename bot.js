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
        factories TEXT DEFAULT '[]',
        resources TEXT DEFAULT '{}',
        last_resource_collect TEXT,
        married_to INTEGER DEFAULT 0,
        dark_coins INTEGER DEFAULT 0
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

// ========== ФУНКЦИИ ЗАВОДОВ ==========
async function buyFactory(userId, factoryId) {
    const user = await getUser(userId);
    const factory = FACTORIES[factoryId];
    
    if (!factory) return { error: '❌ Завод не найден!' };
    
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    
    if (factories.includes(factoryId)) {
        return { error: `❌ У вас уже есть ${factory.name}!` };
    }
    
    if (user.balance < factory.price) {
        return { error: `❌ Не хватает ${(factory.price - user.balance).toLocaleString()} монет!` };
    }
    
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
        const price = resourcePrices[resId]?.price || RESOURCES[resId].basePrice;
        const value = amount * price;
        totalValue += value;
        soldText += `\n${RESOURCES[resId].emoji} ${RESOURCES[resId].name}: ${amount} шт. x ${price.toLocaleString()} = ${value.toLocaleString()} ₽`;
        resources[resId] = 0;
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
    
    if (factories.length === 0) {
        text += `У вас нет заводов.\n/buyfactory 1 — купить лесопилку\n`;
    } else {
        for (const factoryId of factories) {
            const factory = FACTORIES[factoryId];
            text += `${factory.emoji} ${factory.name}\n`;
            text += `📦 Производит: ${RESOURCES[factory.resourceId].name} (${factory.production}/час)\n\n`;
        }
    }
    
    text += `📦 *ВАШИ РЕСУРСЫ:*\n`;
    let hasResources = false;
    for (const [id, resource] of Object.entries(RESOURCES)) {
        const amount = resources[id] || 0;
        if (amount > 0) {
            hasResources = true;
            text += `${resource.emoji} ${resource.name}: ${amount} шт.\n`;
        }
    }
    if (!hasResources) text += `Нет ресурсов. /collectresources — собрать\n`;
    
    text += `\n💡 /collectresources — собрать ресурсы\n`;
    text += `💰 /sellresources — продать ресурсы\n`;
    text += `📊 /resourceprices — цены на ресурсы`;
    
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
        [Markup.button.callback('💻 Ферма', 'crypto'), Markup.button.callback('🏭 Заводы', 'factory')],
        [Markup.button.callback('🚗 Машины', 'car_shop'), Markup.button.callback('🎁 Бонус', 'daily')],
        [Markup.button.callback('📊 Топы', 'top_menu'), Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== КОМАНДЫ БОТА ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const referrerId = args[1] ? parseInt(args[1]) : null;
    
    await registerUser(userId, referrerId);
    const text = await getProfileText(userId);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// АЛИАСЫ
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().trim();
    const userId = ctx.from.id;
    
    if (text === 'б' || text === 'баланс' || text === 'профиль' || text === 'проф') {
        const profileText = await getProfileText(userId);
        await ctx.reply(profileText, { parse_mode: 'Markdown', ...mainKeyboard() });
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
        await setUserField(userId, 'last_daily', now.toISOString());
        await setUserField(userId, 'streak', streak);
        await ctx.reply(`🎁 *БОНУС!*\n🔥 Серия: ${streak}\n💰 +${bonus.toLocaleString()} ₽`, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'ферма') {
        const user = await getUser(userId);
        const gpuCount = getGPUCount(user);
        const hourlyIncome = calculateCryptoIncome(user);
        let amulets = [];
        try { amulets = JSON.parse(user.farm_amulets || '[]'); } catch(e) { amulets = []; }
        let farmText = `💻 *КРИПТОФЕРМА*\n\n`;
        farmText += `📝 Видеокарты: ${gpuCount.toLocaleString()} шт.\n`;
        farmText += `💹 Доход: ${hourlyIncome.toLocaleString()} ₽/час\n`;
        farmText += `📀 Амулеты: ${amulets.length}/10\n`;
        if (user.married_to) farmText += `💍 Свадебный бонус: +25% к доходу!\n`;
        farmText += `\n✨ /собрать — собрать доход\n`;
        farmText += `✨ /купить ферма X — купить видеокарты`;
        await ctx.reply(farmText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'собрать') {
        const result = await collectCrypto(userId);
        if (result.error) {
            await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(`✅ *СОБРАНО!*\n\n💰 +${result.income.toLocaleString()} ₽ за ${result.hours} час(ов)`, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        return;
    }
    
    if (text.startsWith('купить ферма ')) {
        const amount = parseInt(text.split(' ')[2]);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('❌ Пример: купить ферма 10');
            return;
        }
        
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
    
    if (text === 'заводы' || text === 'factory') {
        const status = await getResourcesStatus(userId);
        await ctx.reply(status, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'собратьресурсы' || text === 'collectresources') {
        const result = await collectResources(userId);
        if (result.error) {
            await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        return;
    }
    
    if (text === 'продатьресурсы' || text === 'sellresources') {
        const result = await sellResources(userId);
        if (result.error) {
            await ctx.reply(result.error, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        }
        return;
    }
    
    if (text === 'цены' || text === 'resourceprices') {
        const text = await getResourcePrices();
        await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'бонусстатус' || text === 'bonus') {
        const bonus = await getBonusStatus();
        await ctx.reply(bonus.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'топ') {
        const topUsers = await new Promise((resolve) => {
            db.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT 10', (err, rows) => resolve(rows || []));
        });
        let topText = `🏆 *ТОП 10 БОГАЧЕЙ* 🏆\n\n`;
        for (let i = 0; i < topUsers.length; i++) {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            topText += `${medal} #${topUsers[i].id} — ${topUsers[i].balance.toLocaleString()} ₽\n`;
        }
        await ctx.reply(topText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    if (text === 'помощь' || text === 'help') {
        let helpText = `📚 *ПОМОЩЬ*\n\n`;
        helpText += `👤 *ОСНОВНЫЕ:*\n`;
        helpText += `• б, профиль — профиль\n`;
        helpText += `• бонус — ежедневная награда\n`;
        helpText += `• топ — топ богачей\n`;
        helpText += `• ферма — криптоферма\n`;
        helpText += `• собрать — собрать крипту\n`;
        helpText += `• купить ферма X — купить видеокарты\n\n`;
        helpText += `🏭 *ЗАВОДЫ:*\n`;
        helpText += `• заводы — мои заводы\n`;
        helpText += `• buyfactory 1-5 — купить завод\n`;
        helpText += `• собратьресурсы — собрать ресурсы\n`;
        helpText += `• продатьресурсы — продать ресурсы\n`;
        helpText += `• цены — цены на ресурсы\n\n`;
        helpText += `🎁 *БОНУСЫ:*\n`;
        helpText += `• бонусстатус — статус щедрого дня\n\n`;
        helpText += `🚗 *ГОНКИ:*\n`;
        helpText += `• buycar 1-5 — купить машину\n`;
        helpText += `• upgradeengine — улучшить двигатель\n\n`;
        helpText += `🛡️ *АДМИН:*\n`;
        helpText += `• aget ID — полная инфо\n`;
        helpText += `• give @ник сумма\n`;
        helpText += `• ban @ник\n`;
        helpText += `• unban @ник\n`;
        helpText += `• announce текст\n`;
        helpText += `• setadmin @ник роль\n`;
        await ctx.reply(helpText, { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
});

// ========== КОМАНДЫ ЗАВОДОВ ==========
bot.command(['buyfactory', 'купитьзавод'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        let text = `🏭 *ДОСТУПНЫЕ ЗАВОДЫ*\n\n`;
        for (const [id, factory] of Object.entries(FACTORIES)) {
            text += `${factory.emoji} ${factory.name}\n`;
            text += `💰 Цена: ${factory.price.toLocaleString()} ₽\n`;
            text += `📦 Производит: ${RESOURCES[factory.resourceId].name} (${factory.production}/час)\n\n`;
        }
        text += `📝 /buyfactory 1-5`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
        return;
    }
    
    const factoryId = parseInt(args[1]);
    const result = await buyFactory(ctx.from.id, factoryId);
    
    if (result.error) {
        await ctx.reply(result.error, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    }
});

bot.command(['collectresources', 'собратьресурсы'], async (ctx) => {
    const result = await collectResources(ctx.from.id);
    if (result.error) {
        await ctx.reply(result.error, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    }
});

bot.command(['sellresources', 'продатьресурсы'], async (ctx) => {
    const result = await sellResources(ctx.from.id);
    if (result.error) {
        await ctx.reply(result.error, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
    }
});

bot.command(['resourceprices', 'цены'], async (ctx) => {
    const text = await getResourcePrices();
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.command(['bonus', 'бонусстатус'], async (ctx) => {
    const bonus = await getBonusStatus();
    await ctx.reply(bonus.text, { parse_mode: 'Markdown', ...mainKeyboard() });
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
        await ctx.reply('❌ Использование: /give @username сумма');
        return;
    }
    
    const username = args[1].replace('@', '');
    const amount = parseInt(args[2]);
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        await updateBalance(targetId, amount);
        await ctx.reply(`✅ Выдано ${amount.toLocaleString()} монет @${username}!`);
    } catch(e) {
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
        await ctx.reply('❌ Использование: /ban @username');
        return;
    }
    
    const username = args[1].replace('@', '');
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        await setUserField(targetId, 'banned', 1);
        await ctx.reply(`✅ Игрок @${username} забанен!`);
    } catch(e) {
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
        await ctx.reply('❌ Использование: /unban @username');
        return;
    }
    
    const username = args[1].replace('@', '');
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        await setUserField(targetId, 'banned', 0);
        await ctx.reply(`✅ Игрок @${username} разбанен!`);
    } catch(e) {
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
        await ctx.reply('❌ Использование: /announce текст');
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
        } catch(e) {}
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
        await ctx.reply('❌ Использование: /setadmin @username роль');
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
    } catch(e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

bot.command(['aget', 'агет'], async (ctx) => {
    const userId = ctx.from.id;
    if (!await hasPermission(userId, 'help_users')) {
        await ctx.reply('❌ Нет прав!');
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
    let factories = [];
    try { factories = JSON.parse(user.factories || '[]'); } catch(e) { factories = []; }
    
    let text = `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n`;
    text += `       *АДМИН-ИНФОРМАЦИЯ*       \n`;
    text += `🔒━━━━━━━━━━━━━━━━━━━━━━🔒\n\n`;
    text += `┌─────────────────────────┐\n`;
    text += `│ 🆔 ID: #${user.id}\n`;
    text += `│ 🆔 Telegram: ${user.user_id}\n`;
    text += `│ 💰 Баланс: ${(user.balance || 0).toLocaleString()}\n`;
    text += `│ 🏪 Бизнес: ${user.business_level}/10\n`;
    text += `│ 📊 Рейтинг: ${user.rating || 1000}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 💻 Видеокарт: ${user.gpu_count?.toLocaleString() || 2500}\n`;
    text += `│ 🏭 Заводов: ${factories.length}/5\n`;
    text += `│ 💍 В браке: ${user.married_to ? '✅' : '❌'}\n`;
    text += `│ 🚫 Бан: ${user.banned ? '✅' : '❌'}\n`;
    text += `│ 👔 Роль: ${role || 'Игрок'}\n`;
    text += `│ ${user.vip_level !== 'none' ? '👑 VIP: ' + user.vip_level : '✨ VIP: Нет'}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 👥 Рефералов: ${user.referral_count || 0}\n`;
    text += `│ 💰 Реф. заработок: ${(user.referral_earned || 0).toLocaleString()}\n`;
    text += `├─────────────────────────┤\n`;
    text += `│ 📅 Регистрация: ${user.register_date?.slice(0, 19) || 'Неизвестно'}\n`;
    text += `└─────────────────────────┘\n\n`;
    text += `🔒━━━━━━━━━━━━━━━━━━━━━━🔒`;
    
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ========== КНОПКИ ==========
bot.action('profile', async (ctx) => {
    const text = await getProfileText(ctx.from.id);
    try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('business', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const business = BUSINESSES[user.business_level];
    const income = business.income * (1 + (user.manager ? 0.2 : 0) + (user.advertising ? 0.15 : 0) + (user.marketing ? 0.25 : 0));
    try {
        await ctx.editMessageText(`${business.emoji} *${business.name}* (ур.${user.business_level}/10)\n💵 Доход: ${Math.floor(income).toLocaleString()} ₽\n⬆️ Апгрейд: ${business.upgradeCost?.toLocaleString() || 'MAX'}`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('crypto', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const gpuCount = getGPUCount(user);
    const hourlyIncome = calculateCryptoIncome(user);
    let amulets = [];
    try { amulets = JSON.parse(user.farm_amulets || '[]'); } catch(e) { amulets = []; }
    let text = `💻 *КРИПТОФЕРМА*\n\n📝 Видеокарты: ${gpuCount.toLocaleString()} шт.\n💹 Доход: ${hourlyIncome.toLocaleString()} ₽/час\n📀 Амулеты: ${amulets.length}/10\n`;
    if (user.married_to) text += `💍 Свадебный бонус: +25%!\n`;
    text += `\n✨ /собрать — собрать доход\n✨ /купить ферма X — купить видеокарты`;
    try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('factory', async (ctx) => {
    const status = await getResourcesStatus(ctx.from.id);
    try {
        await ctx.editMessageText(status, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('car_shop', async (ctx) => {
    let text = `🚗 *МАГАЗИН МАШИН*\n\n`;
    for (const [id, car] of Object.entries(CARS)) {
        text += `${car.emoji} ${car.name} — ${car.price.toLocaleString()} ₽\n`;
    }
    text += `\n📝 /buycar 1-5`;
    try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('daily', async (ctx) => {
    try {
        await ctx.editMessageText(`🎁 /бонус — ежедневная награда!\n\n🔥 Чем дольше серия, тем больше бонус!`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('top_menu', async (ctx) => {
    const topUsers = await new Promise((resolve) => {
        db.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT 10', (err, rows) => resolve(rows || []));
    });
    let text = `🏆 *ТОП 10 БОГАЧЕЙ* 🏆\n\n`;
    for (let i = 0; i < topUsers.length; i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
        text += `${medal} #${topUsers[i].id} — ${topUsers[i].balance.toLocaleString()} ₽\n`;
    }
    try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

bot.action('help', async (ctx) => {
    try {
        await ctx.editMessageText(`📚 /помощь — все команды бота`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } catch(e) {}
    try { await ctx.answerCbQuery(); } catch(e) {}
});

// ========== ЗАПУСК БОТА ==========
bot.launch().then(() => {
    console.log('🌟 CRYPTO EMPIRE ЗАПУЩЕН!');
    console.log('🏭 Система заводов активна!');
    console.log('🎁 Щедрый день активен!');
    console.log('💻 Криптоферма работает!');
    console.log('👑 Админ-команды готовы!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
