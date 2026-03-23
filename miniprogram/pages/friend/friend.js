// 好友页面
const app = getApp();

Page({
  data: {
    friends: [],
    requests: [],
    showAdd: false,
    searchUid: '',
    currentTab: 'friends'
  },

  onLoad() {
    this.loadFriends();
  },

  onShow() {
    this.loadFriends();
  },

  // 加载好友列表
  async loadFriends() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/friends/${uid}`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        const friends = res.data.friends || [];
        // 添加模拟数据
        if (friends.length === 0) {
          friends.push(
            { friend_uid: 10000002, nickname: '剑客', level: 80, power: 30000, intimacy: 50, is_online: true },
            { friend_uid: 10000003, nickname: '剑痴', level: 70, power: 20000, intimacy: 30, is_online: false }
          );
        }
        this.setData({ friends });
      }
    } catch (err) {
      console.error('加载好友失败', err);
      // 模拟数据
      this.setData({
        friends: [
          { friend_uid: 10000002, nickname: '剑客', level: 80, power: 30000, intimacy: 50, is_online: true },
          { friend_uid: 10000003, nickname: '剑痴', level: 70, power: 20000, intimacy: 30, is_online: false }
        ]
      });
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 显示添加好友
  showAddModal() {
    this.setData({ showAdd: true });
  },

  // 隐藏添加好友
  hideAddModal() {
    this.setData({ showAdd: false, searchUid: '' });
  },

  // 输入UID
  onUidInput(e) {
    this.setData({ searchUid: e.detail.value });
  },

  // 搜索并添加好友
  async addFriend() {
    const friendUid = parseInt(this.data.searchUid);
    
    if (!friendUid || friendUid < 10000000) {
      wx.showToast({
        title: '请输入正确的UID',
        icon: 'none'
      });
      return;
    }
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/friends/add`,
        method: 'POST',
        data: {
          uid,
          friendUid
        }
      });
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        this.hideAddModal();
        this.loadFriends();
      } else {
        wx.showToast({
          title: res.data?.error || '添加失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('添加好友失败', err);
    }
  },

  // 赠送体力
  async giftEnergy(e) {
    const friendUid = e.currentTarget.dataset.uid;
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/friends/gift`,
        method: 'POST',
        data: {
          uid,
          friendUid
        }
      });
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '赠送成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.data?.error || '赠送失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('赠送失败', err);
    }
  },

  // 聊天
  chat(e) {
    const friendUid = e.currentTarget.dataset.uid;
    wx.navigateTo({
      url: `/pages/chat/chat?uid=${friendUid}`
    });
  },

  // 查看资料
  viewProfile(e) {
    const friendUid = e.currentTarget.dataset.uid;
    wx.showModal({
      title: '玩家资料',
      content: `UID: ${friendUid}`,
      showCancel: false
    });
  },

  // 删除好友
  deleteFriend(e) {
    const friendUid = e.currentTarget.dataset.uid;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该好友吗？',
      success: (res) => {
        if (res.confirm) {
          const friends = this.data.friends.filter(f => f.friend_uid !== friendUid);
          this.setData({ friends });
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 邀请组队
  inviteTeam(e) {
    wx.showToast({
      title: '邀请已发送',
      icon: 'success'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadFriends().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
