require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();

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

const VIP_STATUSES = {
    bronze: { name: '🥉 Бронза', price: 50000, bonusIncome: 5, bonusDefense: 10, emoji: '🥉' },
    silver: { name: '🥈 Серебро', price: 150000, bonusIncome: 10, bonusDefense: 20, emoji: '🥈' },
    gold: { name: '🥇 Золото', price: 500000, bonusIncome: 20, bonusDefense: 35, emoji: '🥇' },
    platinum: { name: '💎 Платина', price: 1500000, bonusIncome: 35, bonusDefense: 50, emoji: '💎' },
    diamond: { name: '✨ Алмаз', price: 5000000, bonusIncome: 50, bonusDefense: 75, emoji: '✨' }
};

// ========== КЛЕШНИ ==========
const CLAWS = {
    1: { name: '🦀 Клешня новичка', rarity: 'common', price: 1000, attackBonus: 5, defenseBonus: 5, emoji: '🦀' },
    2: { name: '🦞 Стальная клешня', rarity: 'rare', price: 5000, attackBonus: 15, defenseBonus: 10, emoji: '🦞' },
    3: { name: '🦂 Золотая клешня', rarity: 'epic', price: 25000, attackBonus: 30, defenseBonus: 25, emoji: '🦂' },
    4: { name: '🐉 Драконья клешня', rarity: 'legendary', price: 100000, attackBonus: 60, defenseBonus: 50, emoji: '🐉' },
    5: { name: '👑 Королевская клешня', rarity: 'mythic', price: 500000, attackBonus: 120, defenseBonus: 100, emoji: '👑' },
    6: { name: '✨ Божественная клешня', rarity: 'divine', price: 2500000, attackBonus: 250, defenseBonus: 200, emoji: '✨' }
};

const RARITY_COLORS = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠', mythic: '🔴', divine: '🌈' };

// ========== НОВАЯ СИСТЕМА 5: ТУРНИРЫ ==========
const TOURNAMENTS = {
    daily: {
        name: '🏆 ЕЖЕДНЕВНЫЙ ТУРНИР',
        duration: 86400000,
        rewardPool: 500000,
        topRewards: [100000, 50000, 25000, 10000, 5000],
        startTime: null,
        participants: {}
    },
    weekly: {
        name: '⭐ НЕДЕЛЬНЫЙ ТУРНИР',
        duration: 604800000,
        rewardPool: 5000000,
        topRewards: [1000000, 500000, 250000, 100000, 50000],
        startTime: null,
        participants: {}
    }
};

// ========== НОВАЯ СИСТЕМА 6: ДОСТИЖЕНИЯ (РАСШИРЕННЫЕ) ==========
const ACHIEVEMENTS = {
    1: { name: '🎯 ПЕРВЫЙ УРОВЕНЬ', desc: 'Достичь 5 уровня бизнеса', reward: 10000, check: (u) => u.business_level >= 5 },
    2: { name: '💪 СИЛАЧ', desc: 'Купить 10 улучшений', reward: 25000, check: (u) => (u.manager + u.advertising + u.security + u.marketing + u.armored + u.hacker) >= 10 },
    3: { name: '🦀 КОЛЛЕКЦИОНЕР', desc: 'Собрать 5 разных клешней', reward: 50000, check: (u) => false },
    4: { name: '💰 МИЛЛИАРДЕР', desc: 'Накопить 100,000,000 монет', reward: 1000000, check: (u) => u.balance >= 100000000 },
    5: { name: '⚔️ ВОИН', desc: 'Выиграть 50 атак', reward: 75000, check: (u) => u.attacks_won >= 50 },
    6: { name: '🏆 ПОБЕДИТЕЛЬ', desc: 'Выиграть турнир', reward: 250000, check: (u) => u.tournament_wins >= 1 }
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
        last_dungeon TEXT,
        last_space TEXT,
        tournament_score INTEGER DEFAULT 0,
        tournament_wins INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 1000
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS user_claws (
        user_id INTEGER,
        claw_id INTEGER,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, claw_id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS user_achievements (
        user_id INTEGER,
        achievement_id INTEGER,
        completed INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, achievement_id)
    )`);
    
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

async function updateRating(userId, delta) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET rating = rating + ? WHERE user_id = ?', [delta, userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function addTournamentScore(userId, score) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET tournament_score = tournament_score + ? WHERE user_id = ?', [score, userId], (err) => {
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

async function checkAndCompleteAchievement(userId, achievementId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT completed FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [userId, achievementId], (err, row) => {
            if (err) { reject(err); return; }
            if (row && row.completed) { resolve(false); return; }
            
            const achievement = ACHIEVEMENTS[achievementId];
            if (!achievement) { resolve(false); return; }
            
            db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err2, user) => {
                if (err2 || !user) { resolve(false); return; }
                
                if (achievement.check(user)) {
                    db.run('INSERT OR REPLACE INTO user_achievements (user_id, achievement_id, completed) VALUES (?, ?, 1)', [userId, achievementId], (err3) => {
                        if (!err3) {
                            updateBalance(userId, achievement.reward);
                            resolve(true);
                        } else { resolve(false); }
                    });
                } else { resolve(false); }
            });
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
    let attack = 10 + (user.business_level * 3) + Math.floor(user.rating / 100);
    if (user.hacker) attack += 30;
    if (user.equipped_claw && CLAWS[user.equipped_claw]) {
        attack += CLAWS[user.equipped_claw].attackBonus;
    }
    return attack;
}

// ========== РЕЙТИНГОВЫЕ БИТВЫ ==========
async function ratedBattle(attackerId, defenderId) {
    const attacker = await getUser(attackerId);
    const defender = await getUser(defenderId);
    
    if (!defender) return { error: 'Игрок не найден' };
    if (defender.banned) return { error: 'Игрок забанен' };
    
    const attackPower = calculateAttack(attacker);
    const defensePower = 10 + (defender.business_level * 3);
    
    const winChance = attackPower / (attackPower + defensePower) * 100;
    const win = Math.random() * 100 < winChance;
    
    const ratingChange = Math.floor(30 * (win ? 1 - winChance/100 : winChance/100));
    
    if (win) {
        const stolen = Math.floor(defender.balance * 0.1);
        await updateBalance(attackerId, stolen);
        await updateBalance(defenderId, -stolen);
        await updateRating(attackerId, ratingChange);
        await updateRating(defenderId, -ratingChange);
        await addTournamentScore(attackerId, 10);
        
        return { 
            success: true, 
            stolen, 
            ratingChange,
            text: `🏆 *ПОБЕДА!* 🏆\n\n💰 Украдено: ${stolen.toLocaleString()} монет\n📊 Рейтинг: +${ratingChange}\n🏅 Очков турнира: +10`
        };
    } else {
        const penalty = Math.floor(attacker.balance * 0.05);
        await updateBalance(attackerId, -penalty);
        await updateRating(attackerId, -ratingChange);
        await updateRating(defenderId, ratingChange);
        
        return { 
            success: false, 
            penalty, 
            ratingChange,
            text: `💀 *ПОРАЖЕНИЕ!* 💀\n\n💔 Потеряно: ${penalty.toLocaleString()} монет\n📊 Рейтинг: -${ratingChange}`
        };
    }
}

// ========== ТУРНИРНАЯ ТАБЛИЦА ==========
async function getTournamentTop() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, user_id, tournament_score FROM users ORDER BY tournament_score DESC LIMIT 10', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function getRatingTop() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, user_id, rating FROM users ORDER BY rating DESC LIMIT 10', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// ========== КЛАВИАТУРА ==========
function mainKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 Баланс', 'balance'), Markup.button.callback('🏪 Бизнес', 'business')],
        [Markup.button.callback('⚔️ Рейтинг бой', 'rated_battle'), Markup.button.callback('🏆 Турнир', 'tournament')],
        [Markup.button.callback('🦀 Клешни', 'claws'), Markup.button.callback('📊 Рейтинг топ', 'rating_top')],
        [Markup.button.callback('🎁 Бонус', 'daily'), Markup.button.callback('ℹ️ Помощь', 'help')]
    ]);
}

// ========== КОМАНДЫ ==========
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const gameId = await registerUser(userId);
    const user = await getUser(userId);
    
    const text = `⚔️ *CRYPTO EMPIRE: РЕЙТИНГОВЫЕ БИТВЫ* ⚔️\n\n` +
                 `✨ *Твой ID:* #${gameId}\n` +
                 `🎚️ *Уровень:* ${user.level}\n` +
                 `📊 *Рейтинг:* ${user.rating}\n` +
                 `💰 *Баланс:* ${user.balance.toLocaleString()} монет\n\n` +
                 `🔥 *Новые системы:*\n` +
                 `• ⚔️ Рейтинговые бои — меняй рейтинг\n` +
                 `• 🏆 Турниры — побеждай и получай награды\n` +
                 `• 🎯 Достижения — выполняй и получай бонусы\n\n` +
                 `👇 *Используй кнопки!*`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['balance', 'б', 'баланс'], async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const gameId = await getGameId(userId);
    
    if (!user) {
        await ctx.reply('❌ Напиши /start');
        return;
    }
    
    await ctx.reply(`💰 *БАЛАНС*\n\n🆔 #${gameId}\n🎚️ Ур.${user.level}\n📊 Рейтинг: ${user.rating}\n💵 ${user.balance.toLocaleString()} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['rated_battle', 'рб', 'рейтбой'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: рейтбой @username\n\nПравила:\n• Победа поднимает рейтинг\n• Поражение понижает рейтинг\n• Победитель крадёт 10% денег\n• Рейтинг влияет на силу атаки', { parse_mode: 'Markdown' });
        return;
    }
    
    const username = args[1].replace('@', '');
    const userId = ctx.from.id;
    
    try {
        const chat = await ctx.telegram.getChat(username);
        const targetId = chat.id;
        
        if (targetId === userId) {
            await ctx.reply('❌ Нельзя бить самого себя!');
            return;
        }
        
        const result = await ratedBattle(userId, targetId);
        await ctx.reply(result.text, { parse_mode: 'Markdown', ...mainKeyboard() });
        
    } catch (e) {
        await ctx.reply('❌ Пользователь не найден!');
    }
});

bot.command(['tournament', 'турнир'], async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const top = await getTournamentTop();
    
    let text = `🏆 *ТУРНИРНАЯ ТАБЛИЦА* 🏆\n\n`;
    text += `🎯 Твои очки: ${user.tournament_score}\n\n`;
    text += `📊 *ТОП 10:*\n`;
    
    for (let i = 0; i < top.length; i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        text += `${medal} #${top[i].id} — ${top[i].tournament_score} очков\n`;
    }
    
    text += `\n✨ *Как заработать очки:*\n`;
    text += `• Победа в рейтинг бое: +10 очков\n`;
    text += `• Выигрыш в турнире: +500 очков\n`;
    text += `• Ежедневный бонус: +5 очков\n\n`;
    text += `🏆 *Награды в конце недели:*\n`;
    text += `🥇 1 место: 100,000 монет\n`;
    text += `🥈 2 место: 50,000 монет\n`;
    text += `🥉 3 место: 25,000 монет`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['rating_top', 'rtop', 'рейтингтоп'], async (ctx) => {
    const top = await getRatingTop();
    
    let text = `📊 *ТОП РЕЙТИНГА* 📊\n\n`;
    for (let i = 0; i < top.length; i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        text += `${medal} #${top[i].id} — ${top[i].rating} рейтинга\n`;
    }
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['claws', 'клешни'], async (ctx) => {
    const userId = ctx.from.id;
    const claws = await getUserClaws(userId);
    const user = await getUser(userId);
    
    let text = `🦀 *ТВОИ КЛЕШНИ*\n\n`;
    if (claws.length === 0) {
        text += `У тебя пока нет клешней!\nКупи: /shop\n`;
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
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['shop', 'магазин'], async (ctx) => {
    let text = `🎒 *МАГАЗИН КЛЕШНЕЙ*\n\n`;
    for (const [id, claw] of Object.entries(CLAWS)) {
        text += `${RARITY_COLORS[claw.rarity]} *${claw.name}*\n`;
        text += `💰 ${claw.price.toLocaleString()} монет\n`;
        text += `⚔️ +${claw.attackBonus} атаки | 🛡️ +${claw.defenseBonus} защиты\n`;
        text += `📦 Редкость: ${claw.rarity}\n\n`;
    }
    text += `🛒 Купить: /buy 1 (номер клешни)`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['buy', 'купить'], async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Использование: /buy 1 (купить клешню №1)');
        return;
    }
    
    const clawId = parseInt(args[1]);
    const claw = CLAWS[clawId];
    
    if (!claw) {
        await ctx.reply('❌ Клешня не найдена! Доступны номера 1-6');
        return;
    }
    
    const userId = ctx.from.id;
    const user = await getUser(userId);
    
    if (user.balance >= claw.price) {
        await updateBalance(userId, -claw.price);
        await addClaw(userId, clawId);
        await ctx.reply(`✅ *Куплено!* ${claw.name}\n💰 Остаток: ${(user.balance - claw.price).toLocaleString()} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
    } else {
        await ctx.reply(`❌ Не хватает ${(claw.price - user.balance).toLocaleString()} монет!`, { parse_mode: 'Markdown' });
    }
});

bot.command(['daily', 'бонус'], async (ctx) => {
    const userId = ctx.from.id;
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
    await addTournamentScore(userId, 5);
    
    db.run('UPDATE users SET last_daily = ?, streak = ? WHERE user_id = ?', [now.toISOString(), streak, userId]);
    
    await ctx.reply(`🎁 *ЕЖЕДНЕВНЫЙ БОНУС!*\n\n🔥 Серия: ${streak} дней\n💰 +${bonus.toLocaleString()} монет\n🏅 +5 очков турнира`, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.command(['help', 'помощь'], async (ctx) => {
    const text = `📚 *ПОМОЩЬ*\n\n` +
                 `💰 *Баланс* — твои деньги\n` +
                 `⚔️ *Рейтбой @ник* — PvP битва с рейтингом\n` +
                 `🏆 *Турнир* — турнирная таблица\n` +
                 `📊 *Рейтингтоп* — топ рейтинга\n` +
                 `🦀 *Клешни* — твои клешни\n` +
                 `🎒 *Магазин* — купить клешню\n` +
                 `🎁 *Бонус* — ежедневный бонус\n\n` +
                 `⚡ *Алиасы (без /):*\n` +
                 `баланс, б, рейтбой, турнир, клешни, магазин, бонус`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// ========== КНОПКИ ==========
bot.action('balance', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const gameId = await getGameId(userId);
    await ctx.editMessageText(`💰 *БАЛАНС*\n\n🆔 #${gameId}\n📊 Рейтинг: ${user?.rating || 1000}\n💵 ${user?.balance.toLocaleString() || 0} монет`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('business', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    if (!user) return;
    const business = BUSINESSES[user.business_level];
    await ctx.editMessageText(`${business.emoji} *${business.name}* (ур.${user.business_level}/10)\n💵 Доход: ${calculateIncome(user).toLocaleString()}`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('rated_battle', async (ctx) => {
    await ctx.editMessageText(`⚔️ *РЕЙТИНГОВЫЙ БОЙ*\n\nВведи в чат:\n/рейтбой @username\n\n📊 Рейтинг влияет на силу атаки!`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('tournament', async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const top = await getTournamentTop();
    let text = `🏆 *ТУРНИР*\n\nТвои очки: ${user.tournament_score}\n\nТОП:\n`;
    for (let i = 0; i < Math.min(5, top.length); i++) {
        text += `${i+1}. #${top[i].id} — ${top[i].tournament_score}\n`;
    }
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('rating_top', async (ctx) => {
    const top = await getRatingTop();
    let text = `📊 *ТОП РЕЙТИНГА*\n\n`;
    for (let i = 0; i < Math.min(10, top.length); i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        text += `${medal} #${top[i].id} — ${top[i].rating} 🏆\n`;
    }
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('claws', async (ctx) => {
    const userId = ctx.from.id;
    const claws = await getUserClaws(userId);
    let text = `🦀 *КЛЕШНИ*\n\n`;
    if (claws.length === 0) text += `Нет клешней. /магазин\n`;
    else for (const claw of claws) text += `${CLAWS[claw.claw_id].name} x${claw.quantity}\n`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('daily', async (ctx) => {
    await ctx.editMessageText(`🎁 /бонус — получи ежедневную награду!`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

bot.action('help', async (ctx) => {
    await ctx.editMessageText(`📚 /помощь — список всех команд`, { parse_mode: 'Markdown', ...mainKeyboard() });
    await ctx.answerCbQuery();
});

// ========== ТЕКСТОВЫЕ АЛИАСЫ ==========
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    const userId = ctx.from.id;
    
    const aliases = {
        'баланс': () => bot.telegram.sendMessage(userId, '/balance'),
        'б': () => bot.telegram.sendMessage(userId, '/balance'),
        'рейтбой': (args) => bot.telegram.sendMessage(userId, `/rated_battle ${args}`),
        'рб': (args) => bot.telegram.sendMessage(userId, `/rated_battle ${args}`),
        'турнир': () => bot.telegram.sendMessage(userId, '/tournament'),
        'клешни': () => bot.telegram.sendMessage(userId, '/claws'),
        'магазин': () => bot.telegram.sendMessage(userId, '/shop'),
        'бонус': () => bot.telegram.sendMessage(userId, '/daily'),
        'помощь': () => bot.telegram.sendMessage(userId, '/help'),
        'рейтингтоп': () => bot.telegram.sendMessage(userId, '/rating_top'),
        'rtop': () => bot.telegram.sendMessage(userId, '/rating_top')
    };
    
    for (const [alias, handler] of Object.entries(aliases)) {
        if (text.startsWith(alias)) {
            const args = text.slice(alias.length).trim();
            await handler(args);
            return;
        }
    }
});

// ========== ЗАПУСК ==========
bot.launch().then(() => {
    console.log('⚔️ CRYPTO EMPIRE: РЕЙТИНГОВЫЕ БИТВЫ ЗАПУЩЕН!');
    console.log('📡 Новые системы: РЕЙТИНГ, ТУРНИРЫ, ДОСТИЖЕНИЯ');
    console.log('✨ Твой ID: #1');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
