/**
 * 对战页面
 */
const app = getApp();

Page({
  data: {
    battle: null,
    handCards: [],
    logs: [],
    battleFinished: false
  },

  /**
   * 开始对战
   */
  async startBattle() {
    wx.showLoading({ title: '匹配中...' });

    try {
      const playerId = wx.getStorageSync('playerId');
      
      const res = await app.request({
        url: '/battle/create',
        method: 'POST',
        data: { playerId, isAi: true }
      });

      wx.hideLoading();

      if (res.battle) {
        this.setData({
          battle: {
            id: res.battle.id,
            playerHp: 100,
            enemyHp: 100,
            turn: 1,
            mana: 5
          },
          handCards: res.playerDeck.slice(0, 5),
          logs: ['对战开始！'],
          battleFinished: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '匹配失败', icon: 'none' });
    }
  },

  /**
   * 出牌
   */
  async playCard(e) {
    const card = e.currentTarget.dataset.card;
    const { battle, handCards, logs } = this.data;

    if (battle.mana < card.cost) {
      wx.showToast({ title: '法力不足', icon: 'none' });
      return;
    }

    try {
      const res = await app.request({
        url: '/battle/action',
        method: 'POST',
        data: {
          battleId: battle.id,
          playerId: wx.getStorageSync('playerId'),
          action: 'skill',
          cardId: card.id
        }
      });

      if (res.success) {
        this.setData({
          battle: {
            ...battle,
            enemyHp: res.battle.battle_log.player2_hp,
            mana: res.battle.battle_log.player1_mana
          },
          logs: [...logs, res.action.log],
          handCards: handCards.filter(c => c.id !== card.id)
        });

        if (res.battle.winner_id) {
          this.endBattle(res.battle.winner_id);
        }
      }
    } catch (error) {
      wx.showToast({ title: '出牌失败', icon: 'none' });
    }
  },

  /**
   * 攻击
   */
  async attack() {
    const { battle, logs } = this.data;

    try {
      const res = await app.request({
        url: '/battle/action',
        method: 'POST',
        data: {
          battleId: battle.id,
          playerId: wx.getStorageSync('playerId'),
          action: 'attack',
          cardId: this.data.handCards[0]?.id
        }
      });

      if (res.success) {
        this.setData({
          battle: {
            ...battle,
            enemyHp: res.battle.battle_log.player2_hp
          },
          logs: [...logs, res.action.log]
        });

        if (res.battle.winner_id) {
          this.endBattle(res.battle.winner_id);
        }
      }
    } catch (error) {
      wx.showToast({ title: '攻击失败', icon: 'none' });
    }
  },

  /**
   * 结束回合
   */
  endTurn() {
    const { battle, logs } = this.data;
    
    this.setData({
      battle: {
        ...battle,
        turn: battle.turn + 1,
        mana: Math.min(10, battle.mana + 1)
      },
      logs: [...logs, `回合 ${battle.turn} 结束`]
    });
  },

  /**
   * 对战结束
   */
  endBattle(winnerId) {
    const isWin = winnerId === wx.getStorageSync('playerId');
    
    this.setData({ battleFinished: true });

    wx.showModal({
      title: isWin ? '胜利！' : '失败',
      content: isWin ? '恭喜你赢得了这场战斗！' : '很遗憾，下次再接再厉！',
      showCancel: false,
      success: () => {
        this.setData({
          battle: null,
          handCards: [],
          logs: []
        });
      }
    });
  },

  onShareAppMessage() {
    return app.getShareInfo('battle');
  }
});
