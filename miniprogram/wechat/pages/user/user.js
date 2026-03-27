/**
 * 用户页面
 */
const app = getApp();

Page({
  data: {
    player: {},
    winRate: 0
  },

  onLoad() {
    this.loadPlayer();
  },

  onShow() {
    this.loadPlayer();
  },

  async loadPlayer() {
    try {
      const playerId = wx.getStorageSync('playerId');
      
      if (!playerId) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }

      const res = await app.request({
        url: `/player/${playerId}`
      });

      if (res.player) {
        const wins = res.player.wins || 0;
        const losses = res.player.losses || 0;
        const winRate = wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0;

        this.setData({
          player: res.player,
          winRate
        });
      }
    } catch (error) {
      console.error('加载玩家数据失败:', error);
    }
  },

  goToCards() {
    wx.switchTab({ url: '/pages/cards/cards' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToRank() {
    wx.navigateTo({ url: '/pages/rank/rank' });
  },

  openWebView() {
    wx.navigateTo({ url: '/pages/game/game' });
  },

  recharge() {
    wx.navigateTo({ url: '/pages/recharge/recharge' });
  },

  onShareAppMessage() {
    return app.getShareInfo('default');
  }
});
