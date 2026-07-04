// 充值商店页面
const app = getApp();

Page({
  data: {
    products: [],
    vipLevel: 0,
    balance: 0
  },

  onLoad() {
    this.loadProducts();
    this.loadUserInfo();
  },

  // 加载商品列表
  loadProducts() {
    const products = [
      { id: 1, amount: 60, bonus: 60, total: 120, price: 6, hot: false },
      { id: 2, amount: 180, bonus: 240, total: 420, price: 18, hot: false },
      { id: 3, amount: 300, bonus: 450, total: 750, price: 30, hot: true },
      { id: 4, amount: 680, bonus: 1088, total: 1768, price: 68, hot: false },
      { id: 5, amount: 1280, bonus: 2304, total: 3584, price: 128, hot: true },
      { id: 6, amount: 2580, bonus: 5160, total: 7740, price: 258, hot: false },
      { id: 7, amount: 3280, bonus: 7216, total: 10496, price: 328, hot: false },
      { id: 8, amount: 6480, bonus: 16200, total: 22680, price: 648, hot: true, best: true }
    ];
    
    this.setData({ products });
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/user/${uid}`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        this.setData({
          vipLevel: res.data.user.vip || 0,
          balance: res.data.user.gem || 0
        });
      }
    } catch (err) {
      console.error('加载用户信息失败', err);
    }
  },

  // 购买商品
  async buyProduct(e) {
    const product = e.currentTarget.dataset.product;
    
    wx.showModal({
      title: '确认购买',
      content: `支付¥${product.price}，获得${product.total}💎（含赠送${product.bonus}💎）`,
      success: async (res) => {
        if (res.confirm) {
          await this.doPurchase(product);
        }
      }
    });
  },

  // 执行购买
  async doPurchase(product) {
    wx.showLoading({ title: '支付中...' });
    
    try {
      // 调用微信支付
      const payRes = await this.requestPayment(product);
      
      if (payRes.success) {
        // 更新余额
        const newBalance = this.data.balance + product.total;
        this.setData({ balance: newBalance });
        
        wx.hideLoading();
        wx.showModal({
          title: '🎉 购买成功',
          content: `获得 ${product.total} 钻石\n当前余额: ${newBalance}💎`,
          showCancel: false
        });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '支付取消或失败',
        icon: 'none'
      });
    }
  },

  // 请求支付
  async requestPayment(product) {
    return new Promise((resolve, reject) => {
      // 模拟支付成功
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },

  // 查看VIP特权
  showVipPrivilege() {
    wx.showModal({
      title: 'VIP特权',
      content: `VIP 1: 每日领取50钻石\nVIP 5: 每日领取200钻石\nVIP 10: 每日领取500钻石\n\n更多特权等你解锁！`,
      showCancel: false
    });
  }
});
