// 战盟页面
const app = getApp();

Page({
  data: {
    guild: null,
    members: [],
    myGuild: null,
    showCreate: false,
    showJoin: false,
    guildList: [],
    createForm: {
      name: '',
      icon: ''
    }
  },

  onLoad() {
    this.loadMyGuild();
    this.loadGuildList();
  },

  // 加载我的战盟
  async loadMyGuild() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      // 这里应该先查询用户所在的战盟
      // 暂时使用模拟数据
      const mockGuild = {
        guild_id: 'guild_001',
        name: '剑圣阁',
        level: 5,
        members_count: 15,
        max_members: 50,
        power: 150000,
        notice: '欢迎加入剑圣阁，团结就是力量！',
        leader_uid: 10000001,
        members: [
          { uid: 10000001, role: 'leader', nickname: '剑圣', level: 100, power: 50000 },
          { uid: 10000002, role: 'vice_leader', nickname: '剑客', level: 80, power: 30000 },
          { uid: 10000003, role: 'elder', nickname: '剑痴', level: 70, power: 20000 }
        ]
      };
      
      this.setData({ myGuild: mockGuild });
    } catch (err) {
      console.error('加载战盟失败', err);
    }
  },

  // 加载战盟列表
  async loadGuildList() {
    // 模拟数据
    const mockGuilds = [
      { guild_id: 'guild_001', name: '剑圣阁', level: 5, members_count: 15, power: 150000 },
      { guild_id: 'guild_002', name: '魔宗', level: 8, members_count: 20, power: 200000 },
      { guild_id: 'guild_003', name: '天剑门', level: 3, members_count: 10, power: 80000 }
    ];
    
    this.setData({ guildList: mockGuilds });
  },

  // 显示创建弹窗
  showCreateModal() {
    this.setData({ showCreate: true });
  },

  // 关闭创建弹窗
  hideCreateModal() {
    this.setData({ showCreate: false });
  },

  // 输入战盟名
  onNameInput(e) {
    this.setData({ 'createForm.name': e.detail.value });
  },

  // 创建战盟
  async createGuild() {
    const { name } = this.data.createForm;
    
    if (!name || name.length < 2) {
      wx.showToast({
        title: '战盟名至少2个字',
        icon: 'none'
      });
      return;
    }
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/guild/create`,
        method: 'POST',
        data: {
          uid,
          name,
          icon: '/images/guild-icon.png'
        }
      });
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        this.hideCreateModal();
        this.loadMyGuild();
      } else {
        wx.showToast({
          title: res.data?.error || '创建失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('创建战盟失败', err);
    }
  },

  // 显示加入弹窗
  showJoinModal() {
    this.setData({ showJoin: true });
  },

  // 关闭加入弹窗
  hideJoinModal() {
    this.setData({ showJoin: false });
  },

  // 加入战盟
  async joinGuild(e) {
    const guildId = e.currentTarget.dataset.id;
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/guild/join`,
        method: 'POST',
        data: {
          uid,
          guildId
        }
      });
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '加入成功',
          icon: 'success'
        });
        this.hideJoinModal();
        this.loadMyGuild();
      } else {
        wx.showToast({
          title: res.data?.error || '加入失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('加入战盟失败', err);
    }
  },

  // 查看战盟详情
  viewGuildDetail(e) {
    const guildId = e.currentTarget.dataset.id;
    // 跳转到战盟详情页
    wx.navigateTo({
      url: `/pages/guild-detail/guild-detail?id=${guildId}`
    });
  },

  // 退出战盟
  leaveGuild() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前战盟吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ myGuild: null });
          wx.showToast({
            title: '已退出战盟',
            icon: 'success'
          });
        }
      }
    });
  },

  // 捐献
  donate() {
    wx.showModal({
      title: '战盟捐献',
      content: '捐献100金币，获得10贡献点',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '捐献成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 战盟战
  guildWar() {
    wx.showModal({
      title: '战盟战',
      content: '战盟战将于每周六晚8点开启',
      showCancel: false
    });
  }
});
