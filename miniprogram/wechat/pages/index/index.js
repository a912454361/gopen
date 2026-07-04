/**
 * 首页逻辑
 */
const app = getApp();

Page({
  data: {
    player: null,
    loading: true
  },

  onLoad() {
    this.loadPlayerData();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPlayerData();
  },

  /**
   * 加载玩家数据
   */
  async loadPlayerData() {
    try {
      const playerId = wx.getStorageSync('playerId');
      
      if (!playerId) {
        // 未登录，显示引导
        this.setData({ loading: false });
        return;
      }

      const res = await app.request({
        url: `/player/${playerId}`
      });

      if (res.player) {
        this.setData({
          player: res.player,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载玩家数据失败:', error);
      this.setData({ loading: false });
    }
  },

  /**
   * 跳转到对战页面
   */
  goToBattle() {
    wx.navigateTo({
      url: '/pages/battle/battle'
    });
  },

  /**
   * 跳转到卡牌页面
   */
  goToCards() {
    wx.switchTab({
      url: '/pages/cards/cards'
    });
  },

  /**
   * 跳转到排行榜
   */
  goToRank() {
    wx.navigateTo({
      url: '/pages/rank/rank'
    });
  },

  /**
   * 抽卡
   */
  async drawCard() {
    const playerId = wx.getStorageSync('playerId');
    
    if (!playerId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '神秘抽卡',
      content: '消耗 100 金币进行一次抽卡？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '抽卡中...' });
          
          try {
            const result = await app.request({
              url: '/draw',
              method: 'POST',
              data: { playerId, count: 1 }
            });

            wx.hideLoading();

            if (result.success) {
              // 显示抽卡结果
              wx.showModal({
                title: '恭喜获得',
                content: result.cards.map(c => `${c.name} (${c.rarity})`).join('\n'),
                showCancel: false,
                success: () => {
                  this.loadPlayerData();
                }
              });
            } else {
              wx.showToast({ title: result.error || '金币不足', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            wx.showToast({ title: '抽卡失败', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 领取奖励
   */
  claimReward() {
    wx.showToast({ title: '奖励已发放', icon: 'success' });
  },

  /**
   * 打开 WebView 完整游戏
   */
  openWebView() {
    wx.navigateTo({
      url: '/pages/game/game'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return app.getShareInfo('default');
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '万古长夜 - 国风粒子卡牌游戏',
      query: '',
      imageUrl: '/assets/share/default.png'
    };
  }
});
