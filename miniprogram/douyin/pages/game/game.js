const app = getApp();

Page({
  data: {
    gameUrl: ''
  },

  onLoad() {
    const token = tt.getStorageSync('token');
    const playerId = tt.getStorageSync('playerId');
    
    this.setData({
      gameUrl: `${app.globalData.gameWebUrl}?token=${token}&playerId=${playerId}&platform=douyin`
    });
  },

  onMessage(e) {
    console.log('[WebView] 收到消息:', e.detail);
  }
});
