/**
 * 游戏主页面 - 3D粒子效果
 */

const userManager = require('../../utils/user.js');
const { ParticleEngine } = require('../../utils/game3d.js');

Page({
  data: {
    user: null,
    particleCount: 0,
    showRecharge: false,
    showGM: false,
    quality: 'high',
    packages: []
  },

  canvas: null,
  ctx: null,
  engine: null,
  animationId: null,
  lastTime: 0,

  onLoad() {
    this.initUser();
    this.loadPackages();
  },

  onReady() {
    this.initCanvas();
  },

  onUnload() {
    this.stopAnimation();
  },

  // 初始化用户
  async initUser() {
    await userManager.init();
    
    userManager.on('currencyChange', (data) => {
      this.setData({ user: userManager.getSummary() });
    });
    
    userManager.on('levelUp', (data) => {
      wx.showToast({ title: `升级到 ${data.level} 级！`, icon: 'none' });
    });
    
    this.setData({ user: userManager.getSummary() });
  },

  // 加载充值包
  loadPackages() {
    const shopConfig = require('../../config/shop.js');
    this.setData({ packages: shopConfig.rechargePackages });
  },

  // 初始化Canvas
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        this.canvas = res[0].node;
        this.ctx = this.canvas.getContext('2d');
        
        // 设置高清屏
        const dpr = wx.getSystemInfoSync().pixelRatio;
        this.canvas.width = res[0].width * dpr;
        this.canvas.height = res[0].height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // 初始化粒子引擎
        this.engine = new ParticleEngine(this.canvas, this.ctx);
        this.engine.setQuality(this.data.quality);
        
        // 开始动画
        this.startAnimation();
      });
  },

  // 开始动画
  startAnimation() {
    const animate = (timestamp) => {
      if (!this.engine) return;
      
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      // 自动生成粒子效果
      if (Math.random() < 0.1) {
        this.createRandomEffect();
      }
      
      // 更新和渲染
      this.engine.update();
      this.engine.render();
      
      this.setData({
        particleCount: this.engine.getParticleCount()
      });
      
      this.animationId = this.canvas.requestAnimationFrame(animate);
    };
    
    this.animationId = this.canvas.requestAnimationFrame(animate);
  },

  // 停止动画
  stopAnimation() {
    if (this.animationId && this.canvas) {
      this.canvas.cancelAnimationFrame(this.animationId);
    }
  },

  // 创建随机特效
  createRandomEffect() {
    const x = (Math.random() - 0.5) * 400;
    const y = (Math.random() - 0.5) * 300;
    const z = Math.random() * 200;
    
    const effects = ['explosion', 'aura', 'fire'];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    switch (effect) {
      case 'explosion':
        this.engine.createExplosion(x, y, z, 30);
        break;
      case 'aura':
        this.engine.createAura(x, y, z);
        break;
      case 'fire':
        this.engine.createFire(x, y + 50, z);
        break;
    }
  },

  // 点击画布创建爆炸
  onCanvasTap(e) {
    if (!this.engine) return;
    
    const { x, y } = e.detail;
    const centerX = this.canvas.width / 2 / wx.getSystemInfoSync().pixelRatio;
    const centerY = this.canvas.height / 2 / wx.getSystemInfoSync().pixelRatio;
    
    const worldX = (x - centerX) * 2;
    const worldY = (y - centerY) * 2;
    
    this.engine.createExplosion(worldX, worldY, 0, 100);
    this.engine.createSwordSlash(worldX, worldY, 0, Math.random() > 0.5 ? 1 : -1);
  },

  // 设置画质
  setQuality(e) {
    const quality = e.currentTarget.dataset.quality;
    this.setData({ quality });
    if (this.engine) {
      this.engine.setQuality(quality);
    }
  },

  // 显示充值
  showRecharge() {
    this.setData({ showRecharge: true });
  },

  hideRecharge() {
    this.setData({ showRecharge: false });
  },

  // 处理充值
  async handleRecharge(e) {
    const { id } = e.currentTarget.dataset;
    const pkg = this.data.packages.find(p => p.id === id);
    
    if (!pkg) return;
    
    wx.showModal({
      title: '确认充值',
      content: `购买${pkg.name}，支付 ¥${pkg.price}？`,
      success: async (res) => {
        if (res.confirm) {
          // 模拟支付（实际应调用微信支付）
          wx.showLoading({ title: '处理中...' });
          
          // 调用后端API
          try {
            const response = await this.requestPayment(pkg);
            wx.hideLoading();
            
            if (response.success) {
              // 发放奖励
              pkg.items.forEach(item => {
                if (item.type === 'vip') {
                  userManager.addVipExp(pkg.price * 10);
                } else {
                  userManager.addCurrency(item.type, item.amount || item.count);
                }
              });
              
              // 刷新用户数据
              this.setData({ user: userManager.getSummary() });
              
              // 特效庆祝
              this.engine.createExplosion(0, 0, 0, 200);
              
              wx.showToast({ title: '充值成功！', icon: 'success' });
              this.hideRecharge();
            }
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '支付失败', icon: 'error' });
          }
        }
      }
    });
  },

  // 请求支付
  async requestPayment(pkg) {
    return new Promise((resolve, reject) => {
      // 实际应调用微信支付API
      // 这里模拟成功
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },

  // 显示GM面板（调试）
  showGMPanel() {
    this.setData({ showGM: true });
  },

  hideGM() {
    this.setData({ showGM: false });
  },

  // GM添加货币
  gmAddCurrency(e) {
    const { type } = e.currentTarget.dataset;
    userManager.addCurrency(type, 10000);
    this.engine.createExplosion(0, 0, 0, 150);
    this.setData({ user: userManager.getSummary() });
    wx.showToast({ title: '+10000', icon: 'none' });
  },

  // GM重置数据
  gmReset() {
    userManager.reset();
    this.setData({ user: userManager.getSummary() });
    wx.showToast({ title: '已重置', icon: 'success' });
  },

  // 跳转到关卡
  goToStage() {
    wx.navigateTo({
      url: '/pages/stage/stage'
    });
  },

  // 跳转到排行榜
  goToRanking() {
    wx.navigateTo({
      url: '/pages/ranking/ranking'
    });
  },

  // 跳转到竞技场
  goToArena() {
    wx.navigateTo({
      url: '/pages/arena/arena'
    });
  },

  // 跳转到战盟
  goToGuild() {
    wx.navigateTo({
      url: '/pages/guild/guild'
    });
  },

  // 跳转到宠物
  goToPet() {
    wx.navigateTo({
      url: '/pages/pet/pet'
    });
  },

  // 跳转到好友
  goToFriend() {
    wx.navigateTo({
      url: '/pages/friend/friend'
    });
  }
});
