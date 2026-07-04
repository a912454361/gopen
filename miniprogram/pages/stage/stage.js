// 关卡选择页面
const app = getApp();

Page({
  data: {
    currentChapter: 1,
    chapters: [],
    stages: [],
    selectedStage: null,
    showBattle: false,
    battleType: 'normal', // normal, sweep, instant
    playerPower: 0,
    playerEnergy: 0
  },

  onLoad(options) {
    const chapter = parseInt(options.chapter) || 1;
    this.setData({ currentChapter: chapter });
    this.loadPlayerData();
    this.loadStages();
  },

  // 加载玩家数据
  async loadPlayerData() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/user/${uid}`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        const user = res.data.user;
        this.setData({
          playerPower: user.power || 1000,
          playerEnergy: user.energy || 100
        });
      }
    } catch (err) {
      console.error('加载玩家数据失败', err);
      this.setData({
        playerPower: 5000,
        playerEnergy: 100
      });
    }
  },

  // 加载关卡数据
  async loadStages() {
    // 生成章节关卡数据
    const stages = [];
    for (let i = 1; i <= 10; i++) {
      const stageId = `${this.data.currentChapter}-${i}`;
      stages.push({
        id: stageId,
        chapter: this.data.currentChapter,
        stage: i,
        name: `第${i}关`,
        requiredPower: this.data.currentChapter * 1000 + i * 100,
        rewards: {
          gold: this.data.currentChapter * 100 + i * 50,
          exp: this.data.currentChapter * 20 + i * 10,
          drop: this.getDropName(this.data.currentChapter, i)
        },
        cleared: i <= 3, // 模拟已通关前3关
        stars: i <= 3 ? Math.min(3, Math.floor(Math.random() * 3) + 1) : 0
      });
    }
    
    this.setData({ stages });
  },

  // 获取掉落名称
  getDropName(chapter, stage) {
    const drops = ['普通装备', '稀有装备', '传说装备', '强化石', '技能书'];
    const index = Math.min(drops.length - 1, Math.floor(chapter / 2));
    return drops[index];
  },

  // 选择关卡
  selectStage(e) {
    const stage = e.currentTarget.dataset.stage;
    this.setData({ selectedStage: stage });
  },

  // 开始战斗
  startBattle() {
    const stage = this.data.selectedStage;
    if (!stage) return;
    
    // 检查体力
    if (this.data.playerEnergy < 6) {
      wx.showToast({
        title: '体力不足',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到战斗页面
    wx.navigateTo({
      url: `/pages/battle/battle?chapter=${stage.chapter}&stage=${stage.stage}`
    });
  },

  // 扫荡关卡
  async sweepStage() {
    const stage = this.data.selectedStage;
    if (!stage) return;
    
    // 检查是否已通关
    if (!stage.cleared) {
      // 未通关，检查是否可以战力碾压
      const requiredPower = stage.requiredPower * 3;
      if (this.data.playerPower < requiredPower) {
        wx.showToast({
          title: `战力不足，需要${requiredPower}`,
          icon: 'none'
        });
        return;
      }
      
      // 战力碾压确认
      wx.showModal({
        title: '战力碾压',
        content: `你的战力(${this.data.playerPower})远超关卡要求(${stage.requiredPower})，是否直接碾压通关？`,
        success: (res) => {
          if (res.confirm) {
            this.doInstantClear(stage);
          }
        }
      });
      return;
    }
    
    // 已通关，执行扫荡
    wx.showModal({
      title: '扫荡确认',
      content: `消耗6体力扫荡第${stage.stage}关，获得:\n金币 x${stage.rewards.gold}\n经验 x${stage.rewards.exp}`,
      success: async (res) => {
        if (res.confirm) {
          await this.doSweep(stage);
        }
      }
    });
  },

  // 执行扫荡
  async doSweep(stage) {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/stage/sweep`,
        method: 'POST',
        data: {
          uid,
          chapter: stage.chapter,
          stage: stage.stage
        }
      });
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '扫荡成功',
          icon: 'success'
        });
        
        // 更新体力
        this.setData({
          playerEnergy: res.data.energyLeft
        });
      } else {
        wx.showToast({
          title: res.data?.error || '扫荡失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('扫荡失败', err);
    }
  },

  // 战力碾压通关
  async doInstantClear(stage) {
    wx.showLoading({ title: '碾压中...' });
    
    setTimeout(async () => {
      wx.hideLoading();
      
      // 模拟通关
      const stages = this.data.stages.map(s => {
        if (s.id === stage.id) {
          return { ...s, cleared: true, stars: 3 };
        }
        return s;
      });
      
      this.setData({ 
        stages,
        selectedStage: null,
        playerEnergy: this.data.playerEnergy - 6
      });
      
      wx.showModal({
        title: '🎉 碾压成功！',
        content: `战力碾压，三星通关！\n获得:\n金币 x${stage.rewards.gold * 2}\n经验 x${stage.rewards.exp * 2}`,
        showCancel: false
      });
    }, 1000);
  },

  // 批量扫荡
  batchSweep() {
    wx.showActionSheet({
      itemList: ['扫荡1次', '扫荡5次', '扫荡10次'],
      success: async (res) => {
        const counts = [1, 5, 10];
        const count = counts[res.tapIndex];
        await this.doBatchSweep(count);
      }
    });
  },

  // 执行批量扫荡
  async doBatchSweep(count) {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/stage/sweep-batch`,
        method: 'POST',
        data: {
          uid,
          chapter: this.data.currentChapter,
          count
        }
      });
      
      if (res.data && res.data.success) {
        wx.showModal({
          title: '批量扫荡完成',
          content: `扫荡${res.data.sweepCount}次\n获得:\n金币 x${res.data.rewards.gold}\n经验 x${res.data.rewards.exp}`,
          showCancel: false
        });
        
        this.setData({
          playerEnergy: res.data.energyLeft
        });
      } else {
        wx.showToast({
          title: res.data?.error || '扫荡失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('批量扫荡失败', err);
    }
  },

  // 切换章节
  changeChapter(e) {
    const direction = e.currentTarget.dataset.dir;
    let newChapter = this.data.currentChapter + direction;
    newChapter = Math.max(1, Math.min(newChapter, 10));
    
    this.setData({ currentChapter: newChapter });
    this.loadStages();
  },

  // 关闭选择框
  closeSelect() {
    this.setData({ selectedStage: null });
  }
});
