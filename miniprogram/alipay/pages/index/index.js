/**
 * 支付宝小程序首页
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
      const playerId = my.getStorageSync({ key: 'playerId' })?.data;
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
    my.navigateTo({ url: '/pages/battle/battle' });
  },

  goToCards() {
    my.switchTab({ url: '/pages/cards/cards' });
  },

  goToRank() {
    my.navigateTo({ url: '/pages/rank/rank' });
  },

  drawCard() {
    my.confirm({
      title: '神秘抽卡',
      content: '消耗 100 金币进行一次抽卡？',
      success: async (res) => {
        if (res.confirm) {
          // 抽卡逻辑
        }
      }
    });
  },

  openWebView() {
    my.navigateTo({ url: '/pages/game/game' });
  },

  onShareAppMessage() {
    return {
      title: '万古长夜 - 国风粒子卡牌游戏',
      desc: '来和我一起战斗吧！',
      path: '/pages/index/index'
    };
  }
});
