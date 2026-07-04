const app = getApp();

Page({
  data: {
    gameUrl: ''
  },

  onLoad() {
    const token = my.getStorageSync({ key: 'token' })?.data;
    const playerId = my.getStorageSync({ key: 'playerId' })?.data;
    
    this.setData({
      gameUrl: `${app.globalData.gameWebUrl}?token=${token}&playerId=${playerId}&platform=alipay`
    });
  },

  onMessage(e) {
    console.log('[WebView] 收到消息:', e.detail);
  }
});
