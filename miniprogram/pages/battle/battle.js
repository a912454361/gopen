// 横屏战斗页面
const app = getApp();

Page({
  data: {
    chapter: 1,
    stage: 1,
    // 玩家数据
    player: {
      name: '剑圣',
      level: 100,
      hp: 10000,
      maxHp: 10000,
      mp: 5000,
      maxMp: 5000,
      power: 50000
    },
    // 敌人数据
    enemy: {
      name: '魔将',
      level: 80,
      hp: 50000,
      maxHp: 50000,
      type: 'boss'
    },
    // 战斗状态
    battleState: 'ready', // ready, fighting, victory, defeat
    turn: 0,
    log: [],
    // 自动战斗
    autoMode: false,
    // 速度设置
    speed: 1
  },

  battleTimer: null,

  onLoad(options) {
    this.setData({
      chapter: parseInt(options.chapter) || 1,
      stage: parseInt(options.stage) || 1
    });
    
    this.initBattle();
  },

  onUnload() {
    if (this.battleTimer) {
      clearInterval(this.battleTimer);
    }
  },

  // 初始化战斗
  initBattle() {
    const requiredPower = this.data.chapter * 1000 + this.data.stage * 100;
    const enemyName = this.getEnemyName(this.data.chapter, this.data.stage);
    
    // 根据关卡调整敌人属性
    const enemy = {
      name: enemyName,
      level: this.data.chapter * 10 + this.data.stage,
      hp: requiredPower * 2,
      maxHp: requiredPower * 2,
      type: this.data.stage === 10 ? 'boss' : 'normal'
    };
    
    this.setData({ enemy });
    
    this.addLog(`⚔️ 战斗开始！`);
    this.addLog(`遭遇 ${enemy.name} (Lv.${enemy.level})`);
  },

  // 获取敌人名称
  getEnemyName(chapter, stage) {
    const enemies = {
      1: ['妖狼', '石魔', '毒蛇', '暗影刺客', '狂战士', '火元素', '冰巨人', '雷兽', '魔剑士', '剑魔'],
      2: ['魔兵', '幽灵', '吸血鬼', '死灵法师', '暗黑骑士', '炎魔', '冰龙', '雷神', '魔将', '魔王亲卫'],
      3: ['天魔', '修罗', '鬼王', '妖皇', '魔神', '堕落天使', '深渊领主', '混沌巨兽', '灭世魔龙', '剑神']
    };
    
    return enemies[chapter]?.[stage - 1] || '未知敌人';
  },

  // 添加战斗日志
  addLog(text) {
    const log = [...this.data.log, { text, time: Date.now() }];
    if (log.length > 20) log.shift();
    this.setData({ log });
  },

  // 开始战斗
  startBattle() {
    this.setData({ battleState: 'fighting' });
    
    if (this.data.autoMode) {
      this.startAutoBattle();
    }
  },

  // 普通攻击
  attack() {
    if (this.data.battleState !== 'fighting') return;
    
    this.performAttack('normal');
  },

  // 技能攻击
  skillAttack() {
    if (this.data.battleState !== 'fighting') return;
    
    if (this.data.player.mp < 100) {
      this.addLog('❌ 法力不足！');
      return;
    }
    
    this.setData({
      'player.mp': this.data.player.mp - 100
    });
    
    this.performAttack('skill');
  },

  // 执行攻击
  performAttack(type) {
    const player = this.data.player;
    const enemy = this.data.enemy;
    
    // 计算伤害
    let damage = Math.floor(player.power * 0.1 * (type === 'skill' ? 3 : 1) * (0.8 + Math.random() * 0.4));
    
    // 暴击判定
    const isCrit = Math.random() < 0.2;
    if (isCrit) {
      damage *= 2;
      this.addLog(`💥 暴击！造成 ${damage} 伤害！`);
    } else {
      this.addLog(`⚔️ ${type === 'skill' ? '技能攻击' : '普通攻击'}造成 ${damage} 伤害`);
    }
    
    // 更新敌人血量
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    this.setData({
      'enemy.hp': newEnemyHp,
      turn: this.data.turn + 1
    });
    
    // 检查胜利
    if (newEnemyHp <= 0) {
      this.onVictory();
      return;
    }
    
    // 敌人反击
    setTimeout(() => this.enemyAttack(), 500);
  },

  // 敌人攻击
  enemyAttack() {
    const enemy = this.data.enemy;
    const player = this.data.player;
    
    const damage = Math.floor(enemy.maxHp * 0.01 * (0.8 + Math.random() * 0.4));
    
    this.addLog(`👹 ${enemy.name}反击造成 ${damage} 伤害`);
    
    const newPlayerHp = Math.max(0, player.hp - damage);
    this.setData({ 'player.hp': newPlayerHp });
    
    // 检查失败
    if (newPlayerHp <= 0) {
      this.onDefeat();
    }
  },

  // 使用物品
  useItem() {
    wx.showActionSheet({
      itemList: ['生命药剂 (+1000HP)', '法力药剂 (+500MP)', '复活石'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.heal(1000, 0);
            break;
          case 1:
            this.heal(0, 500);
            break;
          case 2:
            this.addLog('复活石：战斗失败时自动复活');
            break;
        }
      }
    });
  },

  // 治疗
  heal(hp, mp) {
    const player = this.data.player;
    
    if (hp > 0) {
      const newHp = Math.min(player.maxHp, player.hp + hp);
      this.setData({ 'player.hp': newHp });
      this.addLog(`💚 恢复 ${hp} 生命`);
    }
    
    if (mp > 0) {
      const newMp = Math.min(player.maxMp, player.mp + mp);
      this.setData({ 'player.mp': newMp });
      this.addLog(`💙 恢复 ${mp} 法力`);
    }
  },

  // 自动战斗
  toggleAuto() {
    const autoMode = !this.data.autoMode;
    this.setData({ autoMode });
    
    if (autoMode && this.data.battleState === 'fighting') {
      this.startAutoBattle();
    } else {
      this.stopAutoBattle();
    }
  },

  // 开始自动战斗
  startAutoBattle() {
    this.battleTimer = setInterval(() => {
      if (this.data.battleState !== 'fighting') {
        this.stopAutoBattle();
        return;
      }
      
      // 智能选择攻击方式
      if (this.data.player.mp >= 100 && Math.random() > 0.5) {
        this.skillAttack();
      } else {
        this.attack();
      }
    }, 1000 / this.data.speed);
  },

  // 停止自动战斗
  stopAutoBattle() {
    if (this.battleTimer) {
      clearInterval(this.battleTimer);
      this.battleTimer = null;
    }
  },

  // 切换速度
  toggleSpeed() {
    const speeds = [1, 2, 4];
    const currentIndex = speeds.indexOf(this.data.speed);
    const newSpeed = speeds[(currentIndex + 1) % speeds.length];
    this.setData({ speed: newSpeed });
    
    if (this.data.autoMode) {
      this.stopAutoBattle();
      this.startAutoBattle();
    }
  },

  // 胜利
  onVictory() {
    this.stopAutoBattle();
    this.setData({ battleState: 'victory' });
    
    const rewards = this.calculateRewards();
    
    this.addLog('🎉 战斗胜利！');
    this.addLog(`获得: ${rewards.gold}金币 ${rewards.exp}经验`);
    
    wx.showModal({
      title: '🎉 胜利',
      content: `击败 ${this.data.enemy.name}！\n获得: ${rewards.gold}金币 ${rewards.exp}经验`,
      confirmText: '继续',
      success: () => {
        wx.navigateBack();
      }
    });
  },

  // 失败
  onDefeat() {
    this.stopAutoBattle();
    this.setData({ battleState: 'defeat' });
    
    this.addLog('💀 战斗失败...');
    
    wx.showModal({
      title: '💀 失败',
      content: '被击败了，是否重新挑战？',
      confirmText: '重新挑战',
      cancelText: '退出',
      success: (res) => {
        if (res.confirm) {
          this.retryBattle();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  // 重试战斗
  retryBattle() {
    this.setData({
      'player.hp': this.data.player.maxHp,
      'player.mp': this.data.player.maxMp,
      battleState: 'ready',
      turn: 0,
      log: []
    });
    
    this.initBattle();
  },

  // 计算奖励
  calculateRewards() {
    return {
      gold: this.data.chapter * 100 + this.data.stage * 50,
      exp: this.data.chapter * 20 + this.data.stage * 10
    };
  },

  // 逃跑
  flee() {
    wx.showModal({
      title: '逃跑',
      content: '确定要逃跑吗？本次战斗不会获得奖励',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
});
