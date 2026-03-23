// 宠物页面
const app = getApp();

Page({
  data: {
    pets: [],
    currentPet: null,
    showFeed: false,
    foodTypes: [
      { type: 'common', name: '普通饲料', hunger: 20, mood: 5, cost: 100 },
      { type: 'rare', name: '高级饲料', hunger: 50, mood: 20, cost: 500 },
      { type: 'epic', name: '精品饲料', hunger: 100, mood: 50, cost: 2000 },
      { type: 'legendary', name: '传说饲料', hunger: 200, mood: 100, cost: 10000 }
    ]
  },

  onLoad() {
    this.loadPets();
  },

  // 加载宠物列表
  async loadPets() {
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/pets/${uid}`,
        method: 'GET'
      });
      
      if (res.data && res.data.success) {
        const pets = res.data.pets || [];
        // 添加模拟宠物数据
        if (pets.length === 0) {
          pets.push({
            pet_id: 'dragon_gold',
            name: '金龙',
            level: 1,
            exp: 0,
            hunger: 100,
            mood: 100,
            power: 100,
            skills: ['龙息', '龙爪'],
            avatar: '/images/pet-dragon.png'
          });
        }
        this.setData({ 
          pets,
          currentPet: pets[0] 
        });
      }
    } catch (err) {
      console.error('加载宠物失败', err);
      // 使用模拟数据
      const mockPets = [
        {
          pet_id: 'dragon_gold',
          name: '金龙',
          level: 5,
          exp: 50,
          hunger: 80,
          mood: 90,
          power: 500,
          skills: ['龙息', '龙爪'],
          avatar: '/images/pet-dragon.png'
        }
      ];
      this.setData({ pets: mockPets, currentPet: mockPets[0] });
    }
  },

  // 选择宠物
  selectPet(e) {
    const petId = e.currentTarget.dataset.id;
    const pet = this.data.pets.find(p => p.pet_id === petId);
    this.setData({ currentPet: pet });
  },

  // 显示喂养弹窗
  showFeedModal() {
    this.setData({ showFeed: true });
  },

  // 隐藏喂养弹窗
  hideFeedModal() {
    this.setData({ showFeed: false });
  },

  // 喂养宠物
  async feedPet(e) {
    const foodType = e.currentTarget.dataset.type;
    const food = this.data.foodTypes.find(f => f.type === foodType);
    
    if (!food) return;
    
    try {
      const uid = wx.getStorageSync('gameUid') || 10000001;
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/game/pets/feed`,
        method: 'POST',
        data: {
          uid,
          petId: this.data.currentPet.pet_id,
          foodType
        }
      });
      
      if (res.data && res.data.success) {
        const result = res.data;
        
        // 更新宠物数据
        const pets = this.data.pets.map(p => {
          if (p.pet_id === this.data.currentPet.pet_id) {
            return {
              ...p,
              hunger: result.hunger,
              mood: result.mood,
              exp: result.levelUp ? 0 : result.expGain,
              level: result.newLevel
            };
          }
          return p;
        });
        
        this.setData({ 
          pets,
          currentPet: pets.find(p => p.pet_id === this.data.currentPet.pet_id),
          showFeed: false
        });
        
        let msg = `喂养成功！\n饱食度+${food.hunger} 心情+${food.mood}`;
        if (result.levelUp) {
          msg += `\n🎉 升级到 Lv.${result.newLevel}！`;
        }
        
        wx.showToast({
          title: result.levelUp ? '升级了！' : '喂养成功',
          icon: result.levelUp ? 'none' : 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: res.data?.error || '喂养失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('喂养失败', err);
      wx.showToast({
        title: '喂养失败',
        icon: 'none'
      });
    }
  },

  // 洗澡（恢复心情）
  async bath() {
    wx.showLoading({ title: '洗澡中...' });
    
    setTimeout(() => {
      wx.hideLoading();
      
      const currentPet = { ...this.data.currentPet, mood: Math.min(200, this.data.currentPet.mood + 30) };
      const pets = this.data.pets.map(p => 
        p.pet_id === currentPet.pet_id ? currentPet : p
      );
      
      this.setData({ currentPet, pets });
      
      wx.showToast({
        title: '心情+30',
        icon: 'success'
      });
    }, 1000);
  },

  // 出战（设置为主宠）
  setAsMain() {
    wx.showToast({
      title: '已设置为主宠',
      icon: 'success'
    });
  },

  // 进化
  evolve() {
    wx.showModal({
      title: '宠物进化',
      content: '进化需要宠物达到20级，是否确认进化？',
      success: (res) => {
        if (res.confirm) {
          if (this.data.currentPet.level >= 20) {
            const currentPet = { 
              ...this.data.currentPet, 
              level: 1, 
              power: this.data.currentPet.power + 500,
              name: '金龙王'
            };
            this.setData({ currentPet });
            wx.showToast({
              title: '进化成功！',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '等级不足',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 技能详情
  showSkill(e) {
    const skill = e.currentTarget.dataset.skill;
    wx.showModal({
      title: skill,
      content: `${skill}是${this.data.currentPet.name}的专属技能，可造成大量伤害`,
      showCancel: false
    });
  }
});
