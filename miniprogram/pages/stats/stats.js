/**
 * 统计页面
 */

const app = getApp()

Page({
  data: {
    player: null,
    playTimeText: ''
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const player = app.globalData.player
    const playTimeText = this.formatTime(player.playTime || 0)
    
    this.setData({
      player,
      playTimeText
    })
  },

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`
    }
    return `${secs}秒`
  },

  // 重置游戏
  resetGame() {
    wx.showModal({
      title: '重置游戏',
      content: '确定要重置所有游戏数据吗？此操作不可撤销。',
      confirmText: '确定',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          app.resetGame()
          this.loadData()
          wx.showToast({
            title: '已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})
