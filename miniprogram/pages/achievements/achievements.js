/**
 * 成就页面
 */

const app = getApp()

Page({
  data: {
    achievements: [],
    unlockedCount: 0,
    totalCount: 0
  },

  onLoad() {
    this.loadAchievements()
  },

  onShow() {
    this.loadAchievements()
  },

  loadAchievements() {
    const storyData = require('../../data/story.js')
    const allAchievements = storyData.achievements
    const playerAchievements = app.globalData.player.achievements

    const achievements = Object.keys(allAchievements).map(key => {
      const ach = allAchievements[key]
      return {
        ...ach,
        unlocked: playerAchievements.includes(ach.id)
      }
    })

    const unlockedCount = achievements.filter(a => a.unlocked).length

    this.setData({
      achievements,
      unlockedCount,
      totalCount: achievements.length
    })
  }
})
