/**
 * 充值商品配置
 * 数值设计：充值送得多，用户爽感强
 */

module.exports = {
  // 货币配置
  currency: {
    primary: {
      id: 'gold',
      name: '元宝',
      icon: '💰',
      description: '游戏主要货币，用于购买道具、技能等'
    },
    secondary: {
      id: 'gem',
      name: '灵石',
      icon: '💎',
      description: '高级货币，用于购买稀有物品'
    },
    energy: {
      id: 'energy',
      name: '体力',
      icon: '⚡',
      description: '挑战副本消耗'
    }
  },

  // 充值档位
  rechargePackages: [
    {
      id: 'pack_1',
      name: '新手礼包',
      price: 6,
      originalPrice: 6,
      bonus: '首充双倍',
      items: [
        { type: 'gold', amount: 1200 },      // 原价600，双倍1200
        { type: 'gem', amount: 60 },
        { type: 'energy', amount: 100 },
        { type: 'item', id: 'sword_beginner', name: '新手剑', count: 1 }
      ],
      recommended: true,
      firstOnly: true
    },
    {
      id: 'pack_6',
      name: '小试牛刀',
      price: 6,
      originalPrice: 6,
      bonus: '赠送20%',
      items: [
        { type: 'gold', amount: 720 },       // 600 * 1.2
        { type: 'gem', amount: 30 },
        { type: 'energy', amount: 50 }
      ]
    },
    {
      id: 'pack_18',
      name: '修炼之路',
      price: 18,
      originalPrice: 18,
      bonus: '赠送50%',
      items: [
        { type: 'gold', amount: 2700 },      // 1800 * 1.5
        { type: 'gem', amount: 180 },
        { type: 'energy', amount: 200 },
        { type: 'item', id: 'pill_exp', name: '经验丹', count: 10 }
      ],
      recommended: true
    },
    {
      id: 'pack_30',
      name: '剑道精进',
      price: 30,
      originalPrice: 30,
      bonus: '赠送100%',
      items: [
        { type: 'gold', amount: 6000 },      // 3000 * 2
        { type: 'gem', amount: 300 },
        { type: 'energy', amount: 300 },
        { type: 'item', id: 'sword_rare', name: '精钢剑', count: 1 }
      ]
    },
    {
      id: 'pack_68',
      name: '剑圣之路',
      price: 68,
      originalPrice: 68,
      bonus: '赠送150%',
      items: [
        { type: 'gold', amount: 17000 },     // 6800 * 2.5
        { type: 'gem', amount: 1000 },
        { type: 'energy', amount: 500 },
        { type: 'item', id: 'sword_epic', name: '玄铁剑', count: 1 },
        { type: 'item', id: 'skill_book', name: '技能书', count: 5 }
      ],
      recommended: true
    },
    {
      id: 'pack_128',
      name: '称霸江湖',
      price: 128,
      originalPrice: 128,
      bonus: '赠送200%',
      items: [
        { type: 'gold', amount: 38400 },     // 12800 * 3
        { type: 'gem', amount: 2560 },
        { type: 'energy', amount: 1000 },
        { type: 'item', id: 'sword_legend', name: '传说神剑', count: 1 },
        { type: 'item', id: 'skill_book_adv', name: '高级技能书', count: 10 },
        { type: 'vip', level: 1 }            // VIP等级
      ]
    },
    {
      id: 'pack_328',
      name: '天下第一',
      price: 328,
      originalPrice: 328,
      bonus: '赠送300%',
      items: [
        { type: 'gold', amount: 131200 },    // 32800 * 4
        { type: 'gem', amount: 10000 },
        { type: 'energy', amount: 3000 },
        { type: 'item', id: 'sword_mythic', name: '神话之剑', count: 1 },
        { type: 'item', id: 'pet_legend', name: '传说宠物', count: 1 },
        { type: 'vip', level: 3 }
      ],
      hot: true
    },
    {
      id: 'pack_648',
      name: '至尊王者',
      price: 648,
      originalPrice: 648,
      bonus: '赠送500%',
      items: [
        { type: 'gold', amount: 388800 },    // 64800 * 6
        { type: 'gem', amount: 25000 },
        { type: 'energy', amount: 10000 },
        { type: 'item', id: 'sword_divine', name: '神圣之剑', count: 1 },
        { type: 'item', id: 'mount_legend', name: '传说坐骑', count: 1 },
        { type: 'item', id: 'title_legend', name: '传说称号', count: 1 },
        { type: 'vip', level: 5 }
      ],
      bestValue: true
    }
  ],

  // 月卡配置
  monthlyCard: {
    id: 'monthly_card',
    name: '至尊月卡',
    price: 30,
    duration: 30,
    dailyReward: [
      { type: 'gold', amount: 300 },
      { type: 'gem', amount: 30 },
      { type: 'energy', amount: 50 }
    ],
    instantReward: [
      { type: 'gold', amount: 3000 },
      { type: 'gem', amount: 300 },
      { type: 'item', id: 'vip_exp', name: 'VIP经验', count: 100 }
    ]
  },

  // 战斗通行证
  battlePass: {
    id: 'battle_pass',
    name: '剑圣通行证',
    price: 68,
    levels: 50,
    freeRewards: [
      { level: 5, items: [{ type: 'gold', amount: 500 }] },
      { level: 10, items: [{ type: 'gem', amount: 50 }] },
      { level: 20, items: [{ type: 'item', id: 'sword_rare', name: '精钢剑', count: 1 }] },
      { level: 30, items: [{ type: 'gem', amount: 200 }] },
      { level: 50, items: [{ type: 'item', id: 'sword_epic', name: '玄铁剑', count: 1 }] }
    ],
    premiumRewards: [
      { level: 5, items: [{ type: 'gold', amount: 2000 }, { type: 'gem', amount: 100 }] },
      { level: 10, items: [{ type: 'gold', amount: 2000 }, { type: 'gem', amount: 100 }] },
      { level: 20, items: [{ type: 'gold', amount: 5000 }, { type: 'item', id: 'sword_epic', name: '玄铁剑', count: 1 }] },
      { level: 30, items: [{ type: 'gold', amount: 5000 }, { type: 'gem', amount: 500 }] },
      { level: 40, items: [{ type: 'gold', amount: 10000 }, { type: 'item', id: 'sword_legend', name: '传说神剑', count: 1 }] },
      { level: 50, items: [{ type: 'gold', amount: 20000 }, { type: 'item', id: 'sword_mythic', name: '神话之剑', count: 1 }] }
    ]
  },

  // VIP等级特权
  vipLevels: [
    { level: 0, name: '普通', required: 0, perks: [] },
    { level: 1, name: '剑客', required: 100, perks: ['每日签到双倍', '体力恢复+10%'] },
    { level: 2, name: '剑师', required: 500, perks: ['每日签到双倍', '体力恢复+20%', '战斗经验+10%'] },
    { level: 3, name: '剑灵', required: 1500, perks: ['每日签到三倍', '体力恢复+30%', '战斗经验+20%', '专属称号'] },
    { level: 4, name: '剑王', required: 5000, perks: ['每日签到三倍', '体力恢复+40%', '战斗经验+30%', '专属称号', '专属头像框'] },
    { level: 5, name: '剑圣', required: 10000, perks: ['每日签到五倍', '体力恢复+50%', '战斗经验+50%', '专属称号', '专属头像框', '专属坐骑'] },
    { level: 6, name: '剑神', required: 30000, perks: ['每日签到十倍', '体力恢复+100%', '战斗经验+100%', '专属称号', '专属头像框', '专属坐骑', '专属皮肤'] }
  ]
};
