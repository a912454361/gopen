// ==================== 多语言配置系统 ====================

export type LanguageCode = 'zh' | 'en';

export interface Language {
  code: LanguageCode;
  name: string; // 本地语言名称
  nativeName: string; // 原生名称
  flag: string; // 语言代码标识（如 CN、EN）
}

// 支持的语言列表
export const Languages: Record<LanguageCode, Language> = {
  zh: {
    code: 'zh',
    name: '中文',
    nativeName: '简体中文',
    flag: 'CN',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'EN',
  },
};

// 翻译文本类型
export type TranslationKey = keyof typeof translations.zh;

// 翻译文本
export const translations = {
  zh: {
    // 通用
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      loading: '加载中...',
      noData: '暂无数据',
      success: '操作成功',
      error: '操作失败',
      retry: '重试',
      back: '返回',
      next: '下一步',
      done: '完成',
      close: '关闭',
    },
    // 底部导航
    tabs: {
      home: '首页',
      models: '模型',
      projects: '项目',
      membership: '会员',
      settings: '设置',
    },
    // 设置页面
    settings: {
      title: '设置',
      subtitle: '系统配置',
      general: '常规设置',
      theme: '主题设置',
      themeSubtitle: '外观主题配置',
      language: '语言',
      languageSubtitle: '界面语言设置',
      notification: '通知设置',
      notificationSubtitle: '推送通知配置',
      aiConfig: 'AI 配置',
      account: '账户管理',
      share: '分享推荐',
      createFeatures: '创作功能',
    },
    // 主题设置
    theme: {
      title: '主题设置',
      subtitle: '选择你喜欢的主题风格，让应用更符合你的个性',
      available: '可用主题',
      cyber: '暗黑科技',
      cyberDesc: '硬核科技风，霓虹色彩',
      aesthetic: '唯美',
      aestheticDesc: '柔和梦幻，唯美浪漫',
      dynamic: '动感',
      dynamicDesc: '活力四射，运动青春',
      fashion: '时尚',
      fashionDesc: '现代简约，高级质感',
      ancient: '古风',
      ancientDesc: '古典雅致，书卷气息',
      chinese: '国风',
      chineseDesc: '传统喜庆，中国风情',
    },
    // 语言设置
    language: {
      title: '语言设置',
      subtitle: '选择应用显示语言',
      current: '当前语言',
    },
    // 会员
    membership: {
      title: '会员中心',
      free: '免费用户',
      member: '会员',
      upgrade: '升级解锁更多功能',
      expireDate: '到期',
      renew: '续费',
      activate: '开通',
    },
    // 钱包
    wallet: {
      title: '钱包',
      balance: '余额',
      recharge: '充值',
      withdraw: '提现',
      records: '交易记录',
    },
    // 模型市场
    models: {
      title: '模型市场',
      recommend: '推荐模型',
      all: '全部模型',
      search: '搜索模型',
      price: '价格',
      select: '选择',
    },
    // 创作
    create: {
      title: 'AI创作中心',
      image: '图像创作',
      video: '视频创作',
      audio: '音频创作',
      text: '文本创作',
    },
    // 推广
    promotion: {
      title: '推广中心',
      invite: '邀请好友',
      inviteSubtitle: '邀请好友，双方各得奖励',
      share: '分享应用',
      shareSubtitle: '分享给朋友下载',
      qrcode: '推广二维码',
      link: '推广链接',
      earnings: '收益明细',
    },
    // 登录
    login: {
      title: '账号登录',
      phone: '手机号登录',
      wechat: '微信登录',
      apple: 'Apple 登录',
      google: 'Google 登录',
      guest: '游客模式',
    },
    // 账单
    bill: {
      title: '账单明细',
      all: '全部',
      income: '收入',
      expense: '支出',
      date: '日期',
      amount: '金额',
      type: '类型',
    },
    // 版本
    version: '版本',
  },
  en: {
    // Common
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      noData: 'No data',
      success: 'Success',
      error: 'Error',
      retry: 'Retry',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      close: 'Close',
    },
    // Tabs
    tabs: {
      home: 'Home',
      models: 'Models',
      projects: 'Projects',
      membership: 'Membership',
      settings: 'Settings',
    },
    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'System Configuration',
      general: 'General',
      theme: 'Theme',
      themeSubtitle: 'Appearance settings',
      language: 'Language',
      languageSubtitle: 'Interface language',
      notification: 'Notifications',
      notificationSubtitle: 'Push notification settings',
      aiConfig: 'AI Configuration',
      account: 'Account',
      share: 'Share & Invite',
      createFeatures: 'Creation Features',
    },
    // Theme
    theme: {
      title: 'Theme Settings',
      subtitle: 'Choose your favorite theme style',
      available: 'Available Themes',
      cyber: 'Cyber',
      cyberDesc: 'Hardcore tech style, neon colors',
      aesthetic: 'Aesthetic',
      aestheticDesc: 'Soft and dreamy, romantic vibes',
      dynamic: 'Dynamic',
      dynamicDesc: 'Energetic, sports and youth',
      fashion: 'Fashion',
      fashionDesc: 'Modern minimal, premium texture',
      ancient: 'Ancient',
      ancientDesc: 'Classical elegance, scholarly feel',
      chinese: 'Chinese',
      chineseDesc: 'Traditional festive, Chinese style',
    },
    // Language
    language: {
      title: 'Language Settings',
      subtitle: 'Choose your display language',
      current: 'Current Language',
    },
    // Membership
    membership: {
      title: 'Membership Center',
      free: 'Free User',
      member: 'Member',
      upgrade: 'Upgrade to unlock more features',
      expireDate: 'Expires',
      renew: 'Renew',
      activate: 'Activate',
    },
    // Wallet
    wallet: {
      title: 'Wallet',
      balance: 'Balance',
      recharge: 'Recharge',
      withdraw: 'Withdraw',
      records: 'Transaction Records',
    },
    // Models
    models: {
      title: 'Model Market',
      recommend: 'Recommended',
      all: 'All Models',
      search: 'Search models',
      price: 'Price',
      select: 'Select',
    },
    // Create
    create: {
      title: 'AI Creation Center',
      image: 'Image Creation',
      video: 'Video Creation',
      audio: 'Audio Creation',
      text: 'Text Creation',
    },
    // Promotion
    promotion: {
      title: 'Promotion Center',
      invite: 'Invite Friends',
      inviteSubtitle: 'Invite friends, both get rewards',
      share: 'Share App',
      shareSubtitle: 'Share with friends to download',
      qrcode: 'Promotion QR Code',
      link: 'Promotion Link',
      earnings: 'Earnings Details',
    },
    // Login
    login: {
      title: 'Account Login',
      phone: 'Phone Login',
      wechat: 'WeChat Login',
      apple: 'Sign in with Apple',
      google: 'Sign in with Google',
      guest: 'Guest Mode',
    },
    // Bill
    bill: {
      title: 'Bill Details',
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      date: 'Date',
      amount: 'Amount',
      type: 'Type',
    },
    // Version
    version: 'Version',
  },
};

// 获取翻译文本的辅助函数
export function getTranslation(lang: LanguageCode, key: string): string {
  const keys = key.split('.');
  let result: any = translations[lang];
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // 找不到时返回key
    }
  }
  
  return typeof result === 'string' ? result : key;
}
