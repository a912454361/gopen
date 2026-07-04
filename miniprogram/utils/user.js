/**
 * 用户数据管理
 * 精简数据结构，只存核心数据
 */

const DEFAULT_USER_DATA = {
  // === 核心数据 ===
  uid: 0,              // 用户唯一ID
  nickname: '剑客',     // 昵称
  avatar: '',          // 头像URL
  level: 1,            // 等级
  exp: 0,              // 经验
  vip: 0,              // VIP等级
  vipExp: 0,           // VIP经验

  // === 货币 ===
  gold: 1000,          // 元宝
  gem: 100,            // 灵石
  energy: 100,         // 体力

  // === 战斗属性 ===
  power: 100,          // 战力
  hp: 1000,            // 生命
  atk: 100,            // 攻击
  def: 50,             // 防御

  // === 游戏进度 ===
  chapter: 1,          // 当前章节
  stage: 1,            // 当前关卡

  // === 时间戳 ===
  createTime: 0,       // 创建时间
  lastLogin: 0,        // 最后登录
  energyRecoverTime: 0 // 体力恢复时间
};

class UserDataManager {
  constructor() {
    this.data = null;
    this.initialized = false;
  }

  // 初始化用户数据
  async init() {
    if (this.initialized) return;

    try {
      // 从本地存储加载
      const savedData = wx.getStorageSync('userData');
      if (savedData) {
        this.data = { ...DEFAULT_USER_DATA, ...JSON.parse(savedData) };
      } else {
        // 新用户
        this.data = { ...DEFAULT_USER_DATA };
        this.data.createTime = Date.now();
        this.data.uid = this.generateUID();
      }

      // 更新登录时间
      this.data.lastLogin = Date.now();

      // 体力恢复计算
      this.recoverEnergy();

      this.initialized = true;
      this.save();
    } catch (e) {
      console.error('UserData init error:', e);
      this.data = { ...DEFAULT_USER_DATA };
    }
  }

  // 生成唯一UID
  generateUID() {
    return parseInt(Date.now().toString().slice(-8) + Math.floor(Math.random() * 10000));
  }

  // 保存数据
  save() {
    if (!this.data) return;
    wx.setStorageSync('userData', JSON.stringify(this.data));
  }

  // 获取数据
  getData() {
    return this.data;
  }

  // 更新数据
  update(key, value) {
    if (this.data && key in this.data) {
      this.data[key] = value;
      this.save();
    }
  }

  // 增加数值
  add(key, amount) {
    if (this.data && key in this.data) {
      this.data[key] = Math.max(0, this.data[key] + amount);
      this.save();
      return this.data[key];
    }
    return 0;
  }

  // 减少数值
  reduce(key, amount) {
    return this.add(key, -amount);
  }

  // 货币增加（带动画提示）
  addCurrency(type, amount) {
    const key = type; // gold, gem, energy
    const oldValue = this.data[key];
    const newValue = this.add(key, amount);
    
    // 触发事件通知UI更新
    this.emit('currencyChange', { type, oldValue, newValue, change: amount });
    
    return newValue;
  }

  // 货币消耗检查
  canAfford(costs) {
    for (let cost of costs) {
      if (this.data[cost.type] < cost.amount) {
        return false;
      }
    }
    return true;
  }

  // 消耗货币
  spendCurrency(costs) {
    if (!this.canAfford(costs)) return false;
    
    for (let cost of costs) {
      this.reduce(cost.type, cost.amount);
    }
    
    this.save();
    return true;
  }

  // 体力恢复
  recoverEnergy() {
    const now = Date.now();
    const lastRecover = this.data.energyRecoverTime || now;
    const recoverRate = 5 * 60 * 1000; // 5分钟恢复1点
    const maxEnergy = 100 + this.data.vip * 20; // VIP增加上限
    
    const recovered = Math.floor((now - lastRecover) / recoverRate);
    if (recovered > 0) {
      this.data.energy = Math.min(maxEnergy, this.data.energy + recovered);
      this.data.energyRecoverTime = now;
    }
  }

  // 增加经验
  addExp(amount) {
    this.data.exp += amount;
    
    // 检查升级
    const expNeeded = this.getExpNeeded(this.data.level);
    while (this.data.exp >= expNeeded) {
      this.data.exp -= expNeeded;
      this.data.level++;
      this.onLevelUp();
    }
    
    this.save();
  }

  // 升级所需经验
  getExpNeeded(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // 升级处理
  onLevelUp() {
    // 属性提升
    this.data.hp += 100;
    this.data.atk += 10;
    this.data.def += 5;
    this.data.power = this.calculatePower();
    
    this.emit('levelUp', { level: this.data.level });
  }

  // 计算战力
  calculatePower() {
    return Math.floor(
      this.data.hp * 1 + 
      this.data.atk * 5 + 
      this.data.def * 3 +
      this.data.level * 100
    );
  }

  // 增加VIP经验
  addVipExp(amount) {
    this.data.vipExp += amount;
    
    // 检查VIP升级
    const vipConfig = require('../config/shop.js').vipLevels;
    const nextVip = vipConfig.find(v => v.level === this.data.vip + 1);
    
    if (nextVip && this.data.vipExp >= nextVip.required) {
      this.data.vip++;
      this.emit('vipUp', { level: this.data.vip });
    }
    
    this.save();
  }

  // 处理充值奖励
  processRecharge(packageId) {
    const shopConfig = require('../config/shop.js');
    const pkg = shopConfig.rechargePackages.find(p => p.id === packageId);
    
    if (!pkg) return null;
    
    // 发放奖励
    pkg.items.forEach(item => {
      if (item.type === 'vip') {
        this.addVipExp(pkg.price * 10); // 充值金额 * 10 = VIP经验
      } else {
        this.addCurrency(item.type, item.amount || item.count);
      }
    });
    
    // 重新计算战力
    this.data.power = this.calculatePower();
    this.save();
    
    return pkg;
  }

  // 事件系统
  events = {};
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  // 重置数据（调试用）
  reset() {
    this.data = { ...DEFAULT_USER_DATA };
    this.data.createTime = Date.now();
    this.data.uid = this.generateUID();
    wx.removeStorageSync('userData');
  }

  // 获取用户简要信息（用于展示）
  getSummary() {
    return {
      uid: this.data.uid,
      nickname: this.data.nickname,
      level: this.data.level,
      vip: this.data.vip,
      power: this.data.power,
      gold: this.data.gold,
      gem: this.data.gem,
      energy: this.data.energy
    };
  }
}

// 单例
const userManager = new UserDataManager();
module.exports = userManager;
