/**
 * 公共工具函数
 * 跨平台小程序共用
 */

// 阵营配置
export const FACTIONS = {
  '幽冥': { name: '幽冥', color: '#8B5CF6', icon: '👻' },
  '昆仑': { name: '昆仑', color: '#3B82F6', icon: '🏔️' },
  '蓬莱': { name: '蓬莱', color: '#EC4899', icon: '🌸' },
  '蛮荒': { name: '蛮荒', color: '#F97316', icon: '🔥' },
  '万古': { name: '万古', color: '#D4AF37', icon: '⭐' }
};

// 品级配置
export const RARITIES = {
  '凡品': { name: '凡品', stars: 1, color: '#9CA3AF', rate: 0.5 },
  '灵品': { name: '灵品', stars: 2, color: '#10B981', rate: 0.3 },
  '仙品': { name: '仙品', stars: 3, color: '#3B82F6', rate: 0.15 },
  '圣品': { name: '圣品', stars: 4, color: '#A855F7', rate: 0.04 },
  '万古品': { name: '万古品', stars: 5, color: '#D4AF37', rate: 0.01 }
};

// 卡牌类型
export const CARD_TYPES = {
  '角色': { name: '角色卡', baseStats: { attack: 10, defense: 5, hp: 100 } },
  '技能': { name: '技能卡', baseStats: { attack: 15, defense: 0, hp: 0 } },
  '场景': { name: '场景卡', baseStats: { attack: 0, defense: 10, hp: 50 } }
};

/**
 * 格式化时间
 */
export function formatTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 计算胜率
 */
export function calculateWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * 获取阵营颜色
 */
export function getFactionColor(faction) {
  return FACTIONS[faction]?.color || '#6B7280';
}

/**
 * 获取品级颜色
 */
export function getRarityColor(rarity) {
  return RARITIES[rarity]?.color || '#6B7280';
}

/**
 * 抽卡概率计算
 */
export function drawRarity() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [key, value] of Object.entries(RARITIES)) {
    cumulative += value.rate;
    if (rand < cumulative) {
      return key;
    }
  }
  
  return '凡品';
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle(fn, delay = 300) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 存储封装
 */
export const storage = {
  get(key) {
    try {
      // 微信
      if (typeof wx !== 'undefined') {
        return wx.getStorageSync(key);
      }
      // 支付宝
      if (typeof my !== 'undefined') {
        return my.getStorageSync({ key })?.data;
      }
      // 抖音
      if (typeof tt !== 'undefined') {
        return tt.getStorageSync(key);
      }
      return null;
    } catch (e) {
      return null;
    }
  },
  
  set(key, value) {
    try {
      if (typeof wx !== 'undefined') {
        wx.setStorageSync(key, value);
      } else if (typeof my !== 'undefined') {
        my.setStorageSync({ key, data: value });
      } else if (typeof tt !== 'undefined') {
        tt.setStorageSync(key, value);
      }
    } catch (e) {
      console.error('存储失败:', e);
    }
  },
  
  remove(key) {
    try {
      if (typeof wx !== 'undefined') {
        wx.removeStorageSync(key);
      } else if (typeof my !== 'undefined') {
        my.removeStorageSync({ key });
      } else if (typeof tt !== 'undefined') {
        tt.removeStorageSync(key);
      }
    } catch (e) {
      console.error('删除失败:', e);
    }
  }
};

/**
 * 平台检测
 */
export const platform = {
  isWechat: typeof wx !== 'undefined',
  isAlipay: typeof my !== 'undefined',
  isDouyin: typeof tt !== 'undefined',
  
  getName() {
    if (this.isWechat) return 'wechat';
    if (this.isAlipay) return 'alipay';
    if (this.isDouyin) return 'douyin';
    return 'unknown';
  }
};
