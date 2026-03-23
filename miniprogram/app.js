/**
 * 剑破苍穹 - 国风互动剧情游戏
 * 微信小程序版本
 */

App({
  globalData: {
    // 游戏版本
    version: '1.0.0',
    
    // API基础URL
    apiBase: 'http://localhost:9091',
    
    // 玩家数据
    player: {
      id: '',
      name: '云澈',
      chapter: 1,
      currentNode: 'start',
      stats: {
        courage: 0,      // 勇气
        wisdom: 0,       // 智慧
        power: 0,        // 力量
        agility: 0,      // 敏捷
        luck: 0,         // 运气
        karma: 0         // 因果
      },
      choices: [],       // 选择历史
      achievements: [],  // 已解锁成就
      endings: [],       // 已达成的结局
      playTime: 0,       // 游戏时长(秒)
      battles: {         // 战斗统计
        wins: 0,
        losses: 0
      }
    },
    
    // 成就定义
    achievements: {
      first_choice: { name: '初出茅庐', desc: '做出第一个选择', icon: '🌟' },
      brave_warrior: { name: '勇者无畏', desc: '勇气达到50', icon: '⚔️' },
      wise_sage: { name: '智者千虑', desc: '智慧达到50', icon: '📚' },
      power_awaken: { name: '力量觉醒', desc: '力量达到50', icon: '💪' },
      good_ending: { name: '完美结局', desc: '达成完美结局', icon: '✨' },
      bad_ending: { name: '悲剧英雄', desc: '达成悲剧结局', icon: '💔' },
      battle_master: { name: '战无不胜', desc: '战斗胜利10次', icon: '🏆' },
      explorer: { name: '探索者', desc: '解锁所有分支', icon: '🗺️' },
      speedrun: { name: '速通大师', desc: '30分钟内通关', icon: '⚡' },
      collector: { name: '收集控', desc: '解锁10个成就', icon: '💎' }
    }
  },

  onLaunch() {
    // 生成玩家ID
    this.generatePlayerId();
    
    // 加载存档
    this.loadGame();
  },

  // 生成唯一玩家ID
  generatePlayerId() {
    let playerId = wx.getStorageSync('playerId');
    if (!playerId) {
      playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync('playerId', playerId);
    }
    this.globalData.player.id = playerId;
  },

  // 保存游戏
  saveGame() {
    const playerData = JSON.stringify(this.globalData.player);
    wx.setStorageSync('gameSave', playerData);
    
    // 同时保存到云端（如果已登录）
    if (wx.canIUse('getUserProfile')) {
      wx.cloud.callFunction({
        name: 'saveGame',
        data: {
          player: this.globalData.player
        }
      }).catch(err => {
        console.log('云端保存失败，仅本地保存', err);
      });
    }
  },

  // 加载游戏
  loadGame() {
    const savedData = wx.getStorageSync('gameSave');
    if (savedData) {
      try {
        const player = JSON.parse(savedData);
        this.globalData.player = { ...this.globalData.player, ...player };
      } catch (e) {
        console.error('加载存档失败', e);
      }
    }
  },

  // 重置游戏
  resetGame() {
    this.globalData.player = {
      id: this.globalData.player.id,
      name: '云澈',
      chapter: 1,
      currentNode: 'start',
      stats: {
        courage: 0,
        wisdom: 0,
        power: 0,
        agility: 0,
        luck: 0,
        karma: 0
      },
      choices: [],
      achievements: [],
      endings: [],
      playTime: 0,
      battles: { wins: 0, losses: 0 }
    };
    wx.removeStorageSync('gameSave');
  },

  // 检查成就
  checkAchievements() {
    const player = this.globalData.player;
    const achievements = this.globalData.achievements;
    const unlocked = player.achievements;
    
    // 检查各种成就条件
    const checks = {
      first_choice: player.choices.length >= 1,
      brave_warrior: player.stats.courage >= 50,
      wise_sage: player.stats.wisdom >= 50,
      power_awaken: player.stats.power >= 50,
      battle_master: player.battles.wins >= 10,
      collector: unlocked.length >= 10
    };
    
    let newAchievements = [];
    for (let key in checks) {
      if (checks[key] && !unlocked.includes(key)) {
        unlocked.push(key);
        newAchievements.push(achievements[key]);
      }
    }
    
    if (newAchievements.length > 0) {
      this.saveGame();
      return newAchievements;
    }
    return [];
  }
});
