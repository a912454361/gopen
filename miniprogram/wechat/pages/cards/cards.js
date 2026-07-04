/**
 * 卡牌收藏页面
 */
const app = getApp();

Page({
  data: {
    cards: [],
    activeFaction: '',
    loading: true
  },

  onLoad() {
    this.loadCards();
  },

  onShow() {
    this.loadCards();
  },

  async loadCards() {
    try {
      const playerId = wx.getStorageSync('playerId');
      
      const res = await app.request({
        url: `/player/${playerId}`
      });

      const cards = (res.cards || []).map(card => ({
        ...card,
        factionColor: this.getFactionColor(card.faction),
        rarityClass: this.getRarityClass(card.rarity)
      }));

      this.setData({
        cards,
        loading: false
      });
    } catch (error) {
      console.error('加载卡牌失败:', error);
      this.setData({ loading: false });
    }
  },

  getFactionColor(faction) {
    const colors = {
      '幽冥': '#8B5CF6',
      '昆仑': '#3B82F6',
      '蓬莱': '#EC4899',
      '蛮荒': '#F97316',
      '万古': '#D4AF37'
    };
    return colors[faction] || '#6B7280';
  },

  getRarityClass(rarity) {
    const classes = {
      '凡品': 'fan',
      '灵品': 'ling',
      '仙品': 'xian',
      '圣品': 'sheng',
      '万古品': 'wangu'
    };
    return classes[rarity] || 'fan';
  },

  filterFaction(e) {
    const faction = e.currentTarget.dataset.faction;
    this.setData({ activeFaction: faction });
    // 重新加载筛选后的卡牌
    this.loadCards();
  },

  viewCard(e) {
    const card = e.currentTarget.dataset.card;
    wx.navigateTo({
      url: `/pages/cards/detail?id=${card.id}`
    });
  },

  onShareAppMessage() {
    return app.getShareInfo('card');
  }
});
