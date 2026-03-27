/**
 * 抖音小程序首页
 */
const app = getApp();

Page({
  data: {
    player: null
  },

  onLoad() {
    this.loadPlayerData();
  },

  onShow() {
    this.loadPlayerData();
  },

  async loadPlayerData() {
    try {
      const playerId = tt.getStorageSync('playerId');
      if (!playerId) return;

      const res = await app.request({
        url: `/player/${playerId}`
      });

      if (res.player) {
        this.setData({ player: res.player });
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
  },

  goToBattle() {
    tt.navigateTo({ url: '/pages/battle/battle' });
  },

  goToCards() {
    tt.switchTab({ url: '/pages/cards/cards' });
  },

  drawCard() {
    tt.showModal({
      title: '神秘抽卡',
      content: '消耗 100 金币进行一次抽卡？',
      success: async (res) => {
        if (res.confirm) {
          // 抽卡逻辑
        }
      }
    });
  },

  /**
   * 看广告领金币（抖音特色）
   */
  async watchAd() {
    try {
      await app.showRewardedVideo();
      // 发放奖励
      tt.showToast({ title: '获得 50 金币', icon: 'success' });
      this.loadPlayerData();
    } catch (error) {
      tt.showToast({ title: '广告加载失败', icon: 'fail' });
    }
  },

  openWebView() {
    tt.navigateTo({ url: '/pages/game/game' });
  },

  onShareAppMessage() {
    return {
      title: '万古长夜 - 国风粒子卡牌游戏',
      path: '/pages/index/index',
      imageUrl: '/assets/share/default.png'
    };
  }
});
