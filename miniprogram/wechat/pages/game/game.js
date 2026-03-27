/**
 * 游戏 WebView 页面
 */
const app = getApp();

Page({
  data: {
    gameUrl: ''
  },

  onLoad(options) {
    const token = wx.getStorageSync('token');
    const playerId = wx.getStorageSync('playerId');
    
    // 构建带认证参数的游戏 URL
    const baseUrl = app.globalData.gameWebUrl;
    this.setData({
      gameUrl: `${baseUrl}?token=${token}&playerId=${playerId}&platform=wechat`
    });
  },

  /**
   * 接收 WebView 消息
   */
  onMessage(e) {
    console.log('[WebView] 收到消息:', e.detail.data);
    
    const data = e.detail.data[e.detail.data.length - 1];
    
    if (data.type === 'share') {
      // 分享
      wx.showShareMenu();
    } else if (data.type === 'pay') {
      // 支付
      app.wxPay(data.orderData);
    } else if (data.type === 'navigate') {
      // 导航
      wx.navigateTo({ url: data.url });
    }
  },

  /**
   * WebView 加载错误
   */
  onError(e) {
    console.error('[WebView] 加载错误:', e.detail);
    wx.showToast({
      title: '游戏加载失败',
      icon: 'none'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return app.getShareInfo('default');
  }
});
