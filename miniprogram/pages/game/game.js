/**
 * 游戏主页面 - 剧情展示、选择、战斗
 */

const app = getApp()

Page({
  data: {
    node: null,
    chapterTitle: '',
    videoUrl: '',
    showVideo: false,
    videoContext: null,
    loading: true,
    animating: false,
    
    // 战斗状态
    inBattle: false,
    battleState: null,
    playerHP: 100,
    enemyHP: 100,
    battleLog: [],
    
    // 技能
    skills: [
      { id: 'basic_slash', name: '基础斩击', damage: 20, cost: 0, icon: '⚔️' },
      { id: 'sword_qi', name: '剑气纵横', damage: 40, cost: 10, icon: '💨' },
      { id: 'soul_blade', name: '剑魂觉醒', damage: 80, cost: 30, icon: '✨' },
      { id: 'defense', name: '剑幕防御', damage: 0, cost: 5, icon: '🛡️', isDefense: true },
      { id: 'heal', name: '剑气疗伤', damage: -30, cost: 15, icon: '💚', isHeal: true }
    ],
    
    // 玩家战斗属性
    playerMP: 100,
    maxPlayerMP: 100,
    maxPlayerHP: 100,
    maxEnemyHP: 100
  },

  onLoad(options) {
    const nodeId = options.node || 'start'
    this.loadNode(nodeId)
  },

  onReady() {
    this.videoContext = wx.createVideoContext('storyVideo')
  },

  // 加载剧情节点
  loadNode(nodeId) {
    const storyData = require('../../data/story.js')
    const node = storyData.nodes[nodeId]
    
    if (!node) {
      wx.showToast({
        title: '节点不存在',
        icon: 'error'
      })
      return
    }

    // 更新玩家当前节点
    app.globalData.player.currentNode = nodeId
    app.globalData.player.chapter = node.chapter
    app.saveGame()

    // 构建章节标题
    const chapterTitle = `第${this.numberToChinese(node.chapter)}章`

    this.setData({
      node,
      chapterTitle,
      videoUrl: node.video || '',
      showVideo: !!node.video,
      loading: false,
      inBattle: false
    })

    // 检查是否是结局
    if (node.type === 'ending') {
      this.handleEnding(node)
    }
    
    // 检查是否是战斗节点
    if (node.type === 'battle') {
      this.initBattle(node)
    }
  },

  // 数字转中文
  numberToChinese(num) {
    const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    if (num <= 10) return chinese[num]
    if (num < 20) return '十' + chinese[num - 10]
    return num.toString()
  },

  // 处理选择
  handleChoice(e) {
    const { index } = e.currentTarget.dataset
    const choice = this.data.node.choices[index]
    
    if (!choice) return

    // 播放音效
    wx.vibrateShort()

    // 记录选择
    app.globalData.player.choices.push({
      from: this.data.node.id,
      to: choice.next,
      choice: choice.text,
      timestamp: Date.now()
    })

    // 应用效果
    if (choice.effects) {
      for (let key in choice.effects) {
        app.globalData.player.stats[key] = (app.globalData.player.stats[key] || 0) + choice.effects[key]
      }
    }

    // 检查成就
    const newAchievements = app.checkAchievements()
    if (newAchievements.length > 0) {
      wx.showToast({
        title: `解锁成就: ${newAchievements[0].name}`,
        icon: 'none'
      })
    }

    app.saveGame()

    // 动画效果
    this.setData({ animating: true })
    
    setTimeout(() => {
      // 检查是否是战斗选择
      if (choice.isBattle) {
        this.loadNode(choice.next)
      } else {
        this.loadNode(choice.next)
      }
      this.setData({ animating: false })
    }, 300)
  },

  // 初始化战斗
  initBattle(node) {
    const enemy = node.enemy
    
    this.setData({
      inBattle: true,
      battleState: {
        enemy: enemy,
        round: 1,
        playerTurn: true
      },
      playerHP: 100,
      enemyHP: enemy.hp,
      maxEnemyHP: enemy.hp,
      playerMP: 100,
      battleLog: [`⚔️ 战斗开始！${enemy.name}出现了！`]
    })
  },

  // 使用技能
  useSkill(e) {
    const { skill } = e.currentTarget.dataset
    const state = this.data.battleState
    
    if (!state || !this.data.playerTurn) return
    
    // 检查MP
    if (this.data.playerMP < skill.cost) {
      wx.showToast({
        title: 'MP不足',
        icon: 'none'
      })
      return
    }

    // 扣除MP
    this.setData({
      playerMP: this.data.playerMP - skill.cost
    })

    // 计算伤害
    let newEnemyHP = this.data.enemyHP
    let newPlayerHP = this.data.playerHP
    let logs = [...this.data.battleLog]

    if (skill.isHeal) {
      // 治疗
      newPlayerHP = Math.min(this.data.maxPlayerHP, this.data.playerHP - skill.damage)
      logs.push(`💚 你使用了${skill.name}，恢复了${-skill.damage}点生命！`)
    } else if (skill.isDefense) {
      // 防御（下回合减伤）
      logs.push(`🛡️ 你进入了防御姿态！`)
    } else {
      // 攻击
      const damage = Math.floor(skill.damage * (0.8 + Math.random() * 0.4))
      newEnemyHP = Math.max(0, this.data.enemyHP - damage)
      logs.push(`⚔️ 你使用了${skill.name}，造成${damage}点伤害！`)
    }

    this.setData({
      enemyHP: newEnemyHP,
      playerHP: newPlayerHP,
      battleLog: logs.slice(-5),
      playerTurn: false
    })

    // 检查战斗结果
    if (newEnemyHP <= 0) {
      this.handleBattleWin()
      return
    }

    // 敌人回合
    setTimeout(() => {
      this.enemyTurn()
    }, 1000)
  },

  // 敌人回合
  enemyTurn() {
    const state = this.data.battleState
    const enemy = state.enemy
    
    // 敌人攻击
    const skills = enemy.skills || ['攻击']
    const skillName = skills[Math.floor(Math.random() * skills.length)]
    const damage = Math.floor(enemy.attack * (0.8 + Math.random() * 0.4))
    
    let newPlayerHP = Math.max(0, this.data.playerHP - damage)
    let logs = [...this.data.battleLog]
    logs.push(`🔥 ${enemy.name}使用了${skillName}，造成${damage}点伤害！`)
    
    this.setData({
      playerHP: newPlayerHP,
      battleLog: logs.slice(-5),
      playerTurn: true
    })

    // 检查战斗结果
    if (newPlayerHP <= 0) {
      this.handleBattleLose()
    }
  },

  // 战斗胜利
  handleBattleWin() {
    const node = this.data.node
    const rewards = node.rewards?.win || {}
    
    app.globalData.player.battles.wins++
    
    let logs = [...this.data.battleLog]
    logs.push(`🎉 战斗胜利！获得 ${rewards.exp || 0} 经验，${rewards.gold || 0} 金币`)
    
    this.setData({
      battleLog: logs
    })

    wx.showToast({
      title: '战斗胜利！',
      icon: 'success'
    })

    setTimeout(() => {
      if (rewards.next) {
        this.loadNode(rewards.next)
      }
    }, 2000)
  },

  // 战斗失败
  handleBattleLose() {
    const node = this.data.node
    const rewards = node.rewards?.lose || {}
    
    app.globalData.player.battles.losses++
    
    wx.showModal({
      title: '战斗失败',
      content: '你被击败了，是否重试？',
      confirmText: '重试',
      cancelText: '逃跑',
      success: (res) => {
        if (res.confirm) {
          // 重试战斗
          this.initBattle(node)
        } else {
          // 逃跑
          if (rewards.next) {
            this.loadNode(rewards.next)
          } else {
            wx.navigateBack()
          }
        }
      }
    })
  },

  // 处理结局
  handleEnding(node) {
    // 记录结局
    if (!app.globalData.player.endings.includes(node.id)) {
      app.globalData.player.endings.push(node.id)
    }

    // 解锁成就
    if (node.achievements) {
      node.achievements.forEach(achId => {
        if (!app.globalData.player.achievements.includes(achId)) {
          app.globalData.player.achievements.push(achId)
        }
      })
    }

    app.saveGame()

    // 跳转到结局页面
    wx.redirectTo({
      url: `/pages/ending/ending?type=${node.endingType}&title=${encodeURIComponent(node.title)}&desc=${encodeURIComponent(node.description)}`
    })
  },

  // 视频错误处理
  onVideoError() {
    this.setData({
      showVideo: false
    })
  }
})
