// 竞技场页面
const app = getApp();

Page({
  data: {
    arenaInfo: null,
    opponents: [],
    battling: false,
    battleResult: null,
    season: null
  },

  onLoad() {
    this.loadArenaInfo();
    this.loadOpponents();
  },

  onShow() {
    // 每次显示刷新数据
    this.loadArenaInfo();
  },

  // 加载竞技场信息
  async loadArenaInfo() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/arena/${uid}`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        this.setData({ arenaInfo: res.data.arena });
      }
    } catch (err) {
      console.error('加载竞技场信息失败', err);
    }
  },

  // 加载匹配对手
  async loadOpponents() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/arena/${uid}/match`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        this.setData({ opponents: res.data.opponents });
      }
    } catch (err) {
      console.error('加载对手失败', err);
    }
  },

  // 开始战斗
  async startBattle(e) {
    const opponentUid = e.currentTarget.dataset.uid;
    
    this.setData({ battling: true });
    
    // 显示战斗动画
    await this.showBattleAnimation();
    
    // 模拟战斗结果（实际应根据双方战力计算）
    const isWin = Math.random() > 0.4;
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/arena/battle`,
        method: 'POST',
        data: {
          uid,
          opponentUid,
          isWin
        }
      });
      
      if (res.data && res.data.success) {
        this.setData({
          battleResult: res.data,
          battling: false
        });
        
        // 显示结果
        this.showBattleResult(res.data);
        
        // 刷新数据
        this.loadArenaInfo();
        this.loadOpponents();
      }
    } catch (err) {
      console.error('战斗失败', err);
      this.setData({ battling: false });
    }
  },

  // 战斗动画
  showBattleAnimation() {
    return new Promise(resolve => {
      wx.showLoading({
        title: '战斗中...',
        mask: true
      });
      
      setTimeout(() => {
        wx.hideLoading();
        resolve();
      }, 1500);
    });
  },

  // 显示战斗结果
  showBattleResult(result) {
    const title = result.isWin ? '🎉 胜利！' : '💔 失败';
    const content = `积分变化: ${result.rankChange > 0 ? '+' : ''}${result.rankChange}\n` +
                    `当前积分: ${result.newRank}\n` +
                    `获得: ${result.rewards.gold}金币 ${result.rewards.exp}经验` +
                    (result.streak > 1 ? `\n连胜: ${result.streak}场` : '');
    
    wx.showModal({
      title,
      content,
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 领取奖励
  claimRewards() {
    wx.showModal({
      title: '领取奖励',
      content: '竞技场赛季奖励将在赛季结束时发放',
      showCancel: false
    });
  },

  // 刷新对手
  refreshOpponents() {
    this.loadOpponents();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  }
});
