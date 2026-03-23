/**
 * 结局页面
 */

const app = getApp()

Page({
  data: {
    type: 'good',
    title: '',
    description: '',
    endingClass: 'good',
    stats: null
  },

  onLoad(options) {
    const { type, title, desc } = options
    
    const typeConfig = {
      good: { text: '✨ 完美结局', class: 'good' },
      normal: { text: '🌙 普通结局', class: 'normal' },
      bad: { text: '💔 悲剧结局', class: 'bad' },
      perfect: { text: '👑 隐藏结局', class: 'perfect' }
    }

    this.setData({
      type: type || 'good',
      title: decodeURIComponent(title || ''),
      description: decodeURIComponent(desc || ''),
      endingClass: typeConfig[type]?.class || 'good',
      endingText: typeConfig[type]?.text || '结局',
      stats: app.globalData.player.stats
    })
  },

  // 返回首页
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 重新开始
  restart() {
    wx.showModal({
      title: '重新开始',
      content: '确定要重新开始游戏吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          app.resetGame()
          wx.redirectTo({
            url: '/pages/game/game?node=start'
          })
        }
      }
    })
  },

  // 分享结局
  onShareAppMessage() {
    return {
      title: `我在《剑破苍穹》达成了${this.data.endingText}！`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share.png'
    }
  }
})
