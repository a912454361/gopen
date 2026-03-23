// 排行榜数据管理
const RankingManager = {
  // 排行榜类型
  types: {
    power: '战力榜',
    arena: '竞技榜',
    guild: '战盟榜',
    chapter: '进度榜'
  },

  // 获取排行榜
  async getRanking(type, limit = 50) {
    try {
      const res = await wx.request({
        url: `${getApp().globalData.apiBase}/api/v1/game/ranking/${type}`,
        data: { limit }
      });
      return res.data;
    } catch (err) {
      console.error('获取排行榜失败', err);
      return null;
    }
  }
};

module.exports = { RankingManager };
