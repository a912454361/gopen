/**
 * 首页 - 游戏入口
 */

const app = getApp()

Page({
  data: {
    player: null,
    hasSave: false,
    storyMeta: null
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const storyData = require('../../data/story.js')
    
    this.setData({
      player: app.globalData.player,
      hasSave: app.globalData.player.choices.length > 0,
      storyMeta: storyData.meta
    })
  },

  // 开始新游戏
  startNewGame() {
    if (this.data.hasSave) {
      wx.showModal({
        title: '提示',
        content: '已有存档，开始新游戏将覆盖旧存档',
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.doStartNew()
          }
        }
      })
    } else {
      this.doStartNew()
    }
  },

  doStartNew() {
    app.resetGame()
    wx.navigateTo({
      url: '/pages/game/game?node=start'
    })
  },

  // 继续游戏
  continueGame() {
    const currentNode = app.globalData.player.currentNode
    wx.navigateTo({
      url: `/pages/game/game?node=${currentNode}`
    })
  },

  // 跳转到成就页
  goToAchievements() {
    wx.switchTab({
      url: '/pages/achievements/achievements'
    })
  },

  // 跳转到统计页
  goToStats() {
    wx.switchTab({
      url: '/pages/stats/stats'
    })
  }
})
