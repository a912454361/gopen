/**
 * 万古长夜 - 抖音小程序入口
 */
App({
  globalData: {
    apiBaseUrl: 'https://api.gopen.com/api/v1/ink',
    gameWebUrl: 'https://game.gopen.com/game',
    userInfo: null,
    playerInfo: null
  },

  onLaunch(options) {
    console.log('[万古长夜] 抖音小程序启动', options);
    this.autoLogin();
  },

  async autoLogin() {
    try {
      // 抖音登录
      const loginRes = await tt.login();
      
      if (loginRes.code) {
        const res = await this.request({
          url: '/auth/douyin',
          method: 'POST',
          data: { code: loginRes.code }
        });

        if (res.success) {
          this.globalData.userInfo = res.user;
          this.globalData.playerInfo = res.player;
          
          tt.setStorageSync('token', res.token);
          tt.setStorageSync('playerId', res.player.player_id);
        }
      }
    } catch (error) {
      console.error('[登录] 失败:', error);
    }
  },

  request(options) {
    return new Promise((resolve, reject) => {
      const token = tt.getStorageSync('token');
      
      tt.request({
        url: this.globalData.apiBaseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    });
  },

  /**
   * 抖音支付
   */
  async douyinPay(orderData) {
    try {
      const order = await this.request({
        url: '/pay/douyin/create',
        method: 'POST',
        data: orderData
      });

      await tt.pay({
        orderInfo: order.orderInfo,
        success: () => {
          tt.showToast({ title: '支付成功', icon: 'success' });
        }
      });

      return { success: true };
    } catch (error) {
      tt.showToast({ title: '支付失败', icon: 'fail' });
      return { success: false, error };
    }
  },

  /**
   * 视频广告激励
   */
  showRewardedVideo() {
    return new Promise((resolve, reject) => {
      tt.createRewardedVideoAd({
        adUnitId: 'your-ad-unit-id',
        success: () => {
          tt.showRewardedVideoAd({
            success: resolve,
            fail: reject
          });
        },
        fail: reject
      });
    });
  }
});
