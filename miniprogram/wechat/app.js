/**
 * 万古长夜 - 微信小程序入口
 */
App({
  globalData: {
    // 后端 API 地址
    apiBaseUrl: 'https://api.gopen.com/api/v1/ink',
    // H5 游戏地址（WebView 加载）
    gameWebUrl: 'https://game.gopen.com/game',
    // 用户信息
    userInfo: null,
    // 玩家信息
    playerInfo: null,
    // 登录状态
    isLoggedIn: false,
  },

  onLaunch() {
    console.log('[万古长夜] 小程序启动');
    
    // 检查更新
    this.checkUpdate();
    
    // 自动登录
    this.autoLogin();
  },

  onShow() {
    console.log('[万古长夜] 小程序显示');
  },

  onHide() {
    console.log('[万古长夜] 小程序隐藏');
  },

  /**
   * 检查小程序更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('[更新] 检测到新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败，请稍后重试',
          icon: 'none'
        });
      });
    }
  },

  /**
   * 自动登录
   */
  async autoLogin() {
    try {
      // 获取微信登录凭证
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 发送到后端换取用户信息
        const res = await this.request({
          url: '/auth/wechat',
          method: 'POST',
          data: { code: loginRes.code }
        });

        if (res.success) {
          this.globalData.isLoggedIn = true;
          this.globalData.userInfo = res.user;
          this.globalData.playerInfo = res.player;
          
          // 存储到本地
          wx.setStorageSync('token', res.token);
          wx.setStorageSync('playerId', res.player.player_id);
        }
      }
    } catch (error) {
      console.error('[登录] 自动登录失败:', error);
    }
  },

  /**
   * 统一请求封装
   */
  request(options) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      
      wx.request({
        url: this.globalData.apiBaseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // Token 过期，重新登录
            this.autoLogin();
            reject(new Error('未授权'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  /**
   * 微信支付
   */
  async wxPay(orderData) {
    try {
      // 1. 创建订单
      const order = await this.request({
        url: '/pay/create',
        method: 'POST',
        data: orderData
      });

      // 2. 调起微信支付
      await wx.requestPayment({
        timeStamp: order.timeStamp,
        nonceStr: order.nonceStr,
        package: order.package,
        signType: order.signType,
        paySign: order.paySign
      });

      // 3. 支付成功，更新玩家信息
      wx.showToast({ title: '支付成功', icon: 'success' });
      
      return { success: true };
    } catch (error) {
      console.error('[支付] 失败:', error);
      wx.showToast({ title: '支付失败', icon: 'none' });
      return { success: false, error };
    }
  },

  /**
   * 分享功能
   */
  getShareInfo(type = 'default') {
    const shareConfig = {
      default: {
        title: '万古长夜 - 国风粒子卡牌游戏',
        path: '/pages/index/index',
        imageUrl: '/assets/share/default.png'
      },
      card: {
        title: '我在万古长夜获得了一张稀有卡牌！',
        path: '/pages/cards/cards',
        imageUrl: '/assets/share/card.png'
      },
      battle: {
        title: '我在万古长夜赢得了一场胜利！',
        path: '/pages/battle/battle',
        imageUrl: '/assets/share/battle.png'
      }
    };
    
    return shareConfig[type] || shareConfig.default;
  }
});
