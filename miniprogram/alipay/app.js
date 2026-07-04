/**
 * 万古长夜 - 支付宝小程序入口
 */
App({
  globalData: {
    apiBaseUrl: 'https://api.gopen.com/api/v1/ink',
    gameWebUrl: 'https://game.gopen.com/game',
    userInfo: null,
    playerInfo: null,
    isLoggedIn: false
  },

  onLaunch() {
    console.log('[万古长夜] 支付宝小程序启动');
    this.autoLogin();
  },

  async autoLogin() {
    try {
      // 获取支付宝用户授权
      const authRes = await my.getAuthCode({
        scopes: ['auth_base']
      });

      if (authRes.authCode) {
        const res = await this.request({
          url: '/auth/alipay',
          method: 'POST',
          data: { authCode: authRes.authCode }
        });

        if (res.success) {
          this.globalData.isLoggedIn = true;
          this.globalData.userInfo = res.user;
          this.globalData.playerInfo = res.player;

          my.setStorageSync({
            key: 'token',
            data: res.token
          });
          my.setStorageSync({
            key: 'playerId',
            data: res.player.player_id
          });
        }
      }
    } catch (error) {
      console.error('[登录] 自动登录失败:', error);
    }
  },

  request(options) {
    return new Promise((resolve, reject) => {
      const token = my.getStorageSync({ key: 'token' })?.data;

      my.request({
        url: this.globalData.apiBaseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.status === 200) {
            resolve(res.data);
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
   * 支付宝支付
   */
  async aliPay(orderData) {
    try {
      const order = await this.request({
        url: '/pay/alipay/create',
        method: 'POST',
        data: orderData
      });

      await my.tradePay({
        tradeNO: order.tradeNo
      });

      my.showToast({ content: '支付成功', type: 'success' });
      return { success: true };
    } catch (error) {
      console.error('[支付] 失败:', error);
      my.showToast({ content: '支付失败', type: 'fail' });
      return { success: false, error };
    }
  }
});
