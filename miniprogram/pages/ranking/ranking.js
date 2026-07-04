// pages/ranking/ranking.js
const RankingManager = require('../../utils/ranking');

Page({
  data: {
    currentTab: 'power',
    tabs: [
      { key: 'power', name: '战力榜' },
      { key: 'arena', name: '竞技榜' },
      { key: 'guild', name: '战盟榜' },
      { key: 'chapter', name: '进度榜' }
    ],
    rankings: [],
    myRank: null,
    loading: true
  },

  onLoad() {
    this.loadRanking('power');
  },

  onPullDownRefresh() {
    this.loadRanking(this.data.currentTab).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadRanking(type) {
    this.setData({ loading: true, currentTab: type });
    
    const res = await RankingManager.RankingManager.getRanking(type);
    
    if (res && res.success) {
      this.setData({
        rankings: res.rankings,
        loading: false
      });
    } else {
      this.setData({ loading: false });
    }
  },

  onTabChange(e) {
    const type = e.currentTarget.dataset.type;
    this.loadRanking(type);
  },

  // 获取排名样式
  getRankStyle(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'normal';
  },

  // 查看玩家详情
  viewPlayer(e) {
    const uid = e.currentTarget.dataset.uid;
    wx.showModal({
      title: '玩家信息',
      content: `UID: ${uid}`,
      showCancel: false
    });
  }
});
