/**
 * 剑破苍穹 - 完整剧情数据
 * 包含：多章节、战斗节点、多结局
 */

module.exports = {
  // 故事元信息
  meta: {
    id: 'jianpo',
    title: '剑破苍穹',
    subtitle: '国风燃爆互动剧情',
    author: 'G open 智能创作',
    version: '1.0.0',
    totalChapters: 10,
    description: '一个关于剑道、命运与成长的传奇故事。少年云澈获得剑魂传承，踏上修仙之路，面对重重考验，最终成为一代剑圣。'
  },

  // 所有剧情节点
  nodes: {
    // ==================== 第一章：剑魂觉醒 ====================
    start: {
      id: 'start',
      chapter: 1,
      title: '云端剑影',
      description: '苍穹之上，云海翻涌。一道金色剑光划破长空，剑气纵横三万里，天地为之变色。',
      videoPrompt: '国风玄幻，云海翻涌，一道金色剑光从天而降，剑气纵横，粒子特效，电影级画质，4K',
      video: 'https://picsum.photos/seed/sword-cloud/800/450',
      bgMusic: 'epic_start.mp3',
      type: 'story',
      choices: [
        { text: '追随剑光降落的方向', next: 'follow_light', effects: { courage: 5 } },
        { text: '在远处静静观察', next: 'observe', effects: { wisdom: 5 } }
      ]
    },

    follow_light: {
      id: 'follow_light',
      chapter: 1,
      title: '少年云澈',
      description: '剑光落处，一位黑发少年缓缓睁开双眼。他的眼眸中似乎蕴含着无尽的星辰，他就是云澈，天选之人。',
      videoPrompt: '国风少年，黑发飘逸，眼神坚毅，身穿白色古装，周围环绕金色剑气粒子，电影级画质',
      video: 'https://picsum.photos/seed/young-hero/800/450',
      type: 'story',
      choices: [
        { text: '检查手中的神秘玉佩', next: 'check_jade', effects: { curiosity: 5 } },
        { text: '环顾四周寻找线索', next: 'look_around', effects: { caution: 5 } }
      ]
    },

    observe: {
      id: 'observe',
      chapter: 1,
      title: '神秘观察者',
      description: '你在远处观察，发现剑光中似乎有某种古老的力量在觉醒。那股力量让你的心跳不由自主地加速。',
      videoPrompt: '国风玄幻场景，远处山巅，一道金色剑光，神秘的能量波动，粒子特效，电影级',
      video: 'https://picsum.photos/seed/mysterious/800/450',
      type: 'story',
      choices: [
        { text: '决定前往一探究竟', next: 'follow_light_late', effects: { decision: 5 } }
      ]
    },

    check_jade: {
      id: 'check_jade',
      chapter: 1,
      title: '剑魂降临',
      description: '玉佩突然光芒大盛，一柄虚幻的古剑从玉佩中缓缓浮现。剑身流转着古老符文，这是传说中的剑魂！',
      videoPrompt: '国风特效，玉佩发光，一柄古剑虚影浮现，金色光芒四射，粒子特效爆发，电影级',
      video: 'https://picsum.photos/seed/sword-soul/800/450',
      type: 'story',
      choices: [
        { text: '尝试触碰剑魂', next: 'touch_sword', effects: { courage: 10 } },
        { text: '询问剑魂的来历', next: 'ask_origin', effects: { wisdom: 10 } }
      ]
    },

    touch_sword: {
      id: 'touch_sword',
      chapter: 1,
      title: '剑魂融合',
      description: '你的指尖触碰到剑魂的瞬间，它化作金色流光，融入你的身体！一股强大的力量在体内觉醒，灵魂与剑魂完美融合。',
      videoPrompt: '国风特效，金色剑魂化作流光融入少年身体，能量爆发，粒子特效，电影级',
      video: 'https://picsum.photos/seed/sword-merge/800/450',
      type: 'story',
      choices: [
        { text: '感受体内涌动的力量', next: 'power_awaken', effects: { power: 15 } }
      ]
    },

    power_awaken: {
      id: 'power_awaken',
      chapter: 1,
      title: '力量觉醒',
      description: '云澈感受到前所未有的力量！剑魂的力量与他的灵魂完美融合，一种与天地相连的感觉油然而生。',
      videoPrompt: '国风少年，周身环绕金色剑气，双目发光，力量觉醒，粒子特效，电影级',
      video: 'https://picsum.photos/seed/power-awaken/800/450',
      type: 'story',
      isEnding: false,
      choices: [
        { text: '继续前进', next: 'chapter2_start', effects: {} }
      ]
    },

    // ==================== 第二章：初入江湖 ====================
    chapter2_start: {
      id: 'chapter2_start',
      chapter: 2,
      title: '初入江湖',
      description: '获得剑魂之力后，云澈踏上了修炼之路。江湖险恶，人心难测，前方等待他的是什么？',
      videoPrompt: '国风江湖，少年背影，前方是繁华的古镇，炊烟袅袅，电影级画质',
      video: 'https://picsum.photos/seed/jianghu/800/450',
      type: 'story',
      choices: [
        { text: '前往最近的城镇', next: 'enter_town', effects: {} },
        { text: '先在山中修炼', next: 'mountain_training', effects: { power: 5 } }
      ]
    },

    enter_town: {
      id: 'enter_town',
      chapter: 2,
      title: '青云镇',
      description: '青云镇，一个平静的小镇。街道上人来人往，忽然，一群黑衣人从天而降，拦住了你的去路。',
      videoPrompt: '国风古镇街道，黑衣人从天而降，紧张氛围，电影级',
      video: 'https://picsum.photos/seed/town-ambush/800/450',
      type: 'story',
      choices: [
        { text: '拔剑迎战', next: 'battle_thugs', effects: { courage: 5 }, isBattle: true },
        { text: '试图交涉', next: 'negotiate', effects: { wisdom: 5 } }
      ]
    },

    battle_thugs: {
      id: 'battle_thugs',
      chapter: 2,
      title: '激战黑衣人',
      description: '黑衣人首领冷笑：'交出剑魂，饶你不死！' 云澈拔出体内剑魂，金色剑芒照亮整个街道！',
      videoPrompt: '国风战斗，少年拔剑，金色剑芒，黑衣人围攻，特效满屏，电影级',
      video: 'https://picsum.photos/seed/battle-street/800/450',
      type: 'battle',
      enemy: {
        name: '黑衣首领',
        hp: 100,
        attack: 15,
        defense: 5,
        skills: ['暗影斩', '闪避']
      },
      rewards: {
        win: { exp: 50, gold: 100, next: 'battle_victory' },
        lose: { next: 'battle_defeat' }
      }
    },

    battle_victory: {
      id: 'battle_victory',
      chapter: 2,
      title: '首战告捷',
      description: '金色剑气纵横，黑衣人溃不成军。首领临死前透露：'魔宗...不会放过你...' 江湖的阴谋正在逼近。',
      videoPrompt: '国风战斗胜利，少年持剑而立，黑衣人倒地，金色剑芒收敛，电影级',
      video: 'https://picsum.photos/seed/victory/800/450',
      type: 'story',
      choices: [
        { text: '继续探索城镇', next: 'explore_town', effects: { courage: 5 } },
        { text: '追问魔宗信息', next: 'ask_mozong', effects: { wisdom: 5 } }
      ]
    },

    // ==================== 第三章：妖魔现身 ====================
    chapter3_start: {
      id: 'chapter3_start',
      chapter: 3,
      title: '妖魔现身',
      description: '月黑风高之夜，一股邪恶的气息笼罩了青云镇。天空中传来凄厉的嘶吼，一只三头妖蛇从云端降临！',
      videoPrompt: '国风妖魔，三头巨蛇，月黑风高，邪恶气息，电影级特效',
      video: 'https://picsum.photos/seed/demon-snake/800/450',
      type: 'story',
      choices: [
        { text: '独自迎战妖蛇', next: 'battle_snake', effects: { courage: 15 }, isBattle: true },
        { text: '寻找镇中修士帮助', next: 'seek_help', effects: { wisdom: 10 } }
      ]
    },

    battle_snake: {
      id: 'battle_snake',
      chapter: 3,
      title: '决战妖蛇',
      description: '妖蛇三个头颅同时攻击，毒雾弥漫！云澈运起剑魂之力，金色剑芒划破毒雾，直斩妖蛇要害！',
      videoPrompt: '国风史诗战斗，少年对战三头巨蛇，剑气纵横，特效炸裂，电影级',
      video: 'https://picsum.photos/seed/epic-battle/800/450',
      type: 'battle',
      enemy: {
        name: '三头妖蛇',
        hp: 300,
        attack: 25,
        defense: 10,
        skills: ['毒雾', '三头撕咬', '缠绕']
      },
      rewards: {
        win: { exp: 200, gold: 500, next: 'demon_defeated', dropItem: '蛇胆' },
        lose: { next: 'demon_escape' }
      }
    },

    demon_defeated: {
      id: 'demon_defeated',
      chapter: 3,
      title: '斩妖除魔',
      description: '金色剑芒贯穿妖蛇心脏，巨大的蛇躯轰然倒地。云澈感到体内的剑魂又强大了几分，似乎吸收了妖蛇的精华。',
      videoPrompt: '国风胜利场景，巨蛇倒地，少年沐浴金光，力量提升，电影级',
      video: 'https://picsum.photos/seed/demon-victory/800/450',
      type: 'story',
      effects: { power: 20, karma: 10 },
      choices: [
        { text: '继续修炼之旅', next: 'chapter4_start', effects: {} }
      ]
    },

    // ==================== 第四章：剑道争锋 ====================
    chapter4_start: {
      id: 'chapter4_start',
      chapter: 4,
      title: '剑道争锋',
      description: '云澈来到剑圣山，这里是天下剑修的圣地。今日，剑圣山举办剑道大会，各路高手云集。',
      videoPrompt: '国风仙山，剑圣山，云雾缭绕，剑气冲天，众多剑客，电影级',
      video: 'https://picsum.photos/seed/sword-mountain/800/450',
      type: 'story',
      choices: [
        { text: '报名参加剑道大会', next: 'join_tournament', effects: { courage: 10 } },
        { text: '旁观学习', next: 'watch_tournament', effects: { wisdom: 10 } }
      ]
    },

    join_tournament: {
      id: 'join_tournament',
      chapter: 4,
      title: '剑道大会',
      description: '剑道大会开始，云澈连胜数场。决赛对手是剑圣之女——柳如烟，一位剑道天赋极高的少女。',
      videoPrompt: '国风比武，剑台之上，少年对少女，剑气交织，电影级',
      video: 'https://picsum.photos/seed/tournament/800/450',
      type: 'battle',
      enemy: {
        name: '柳如烟',
        hp: 200,
        attack: 30,
        defense: 15,
        skills: ['流云剑法', '烟雨迷蒙', '剑心通明']
      },
      rewards: {
        win: { exp: 300, gold: 1000, next: 'tournament_win', dropItem: '流云剑谱' },
        lose: { next: 'tournament_lose' }
      }
    },

    tournament_win: {
      id: 'tournament_win',
      chapter: 4,
      title: '剑道魁首',
      description: '云澈以一招险胜柳如烟。剑圣亲自颁奖，并邀请云澈成为剑圣山弟子。柳如烟向云澈投来复杂的眼神——是欣赏还是爱慕？',
      videoPrompt: '国风颁奖，剑圣授予金牌，少女注视少年，暧昧氛围，电影级',
      video: 'https://picsum.photos/seed/tournament-win/800/450',
      type: 'story',
      effects: { power: 15, karma: 5 },
      choices: [
        { text: '接受邀请，成为剑圣山弟子', next: 'join_sect', effects: { karma: 10 } },
        { text: '婉拒，继续独自修炼', next: 'refuse_sect', effects: { courage: 10 } }
      ]
    },

    // ==================== 第五章：情劫难渡 ====================
    chapter5_start: {
      id: 'chapter5_start',
      chapter: 5,
      title: '情劫难渡',
      description: '在剑圣山修炼期间，云澈与柳如烟渐生情愫。然而，魔宗公主姬无双突然出现，她要夺取剑魂！',
      videoPrompt: '国风三角关系，少年居中，两位少女左右，情愫暗生，电影级',
      video: 'https://picsum.photos/seed/love-triangle/800/450',
      type: 'story',
      choices: [
        { text: '保护柳如烟', next: 'protect_liu', effects: { karma: 15 } },
        { text: '与姬无双谈判', next: 'negotiate_princess', effects: { wisdom: 10 } }
      ]
    },

    protect_liu: {
      id: 'protect_liu',
      chapter: 5,
      title: '守护之心',
      description: '云澈挡在柳如烟身前，金色剑芒护住两人。姬无双眼中闪过一丝嫉妒：'为了她，你愿与整个魔宗为敌？'',
      videoPrompt: '国风守护，少年护住少女，魔女站在对立面，剑拔弩张，电影级',
      video: 'https://picsum.photos/seed/protect/800/450',
      type: 'battle',
      enemy: {
        name: '姬无双',
        hp: 250,
        attack: 35,
        defense: 12,
        skills: ['魔焰焚天', '暗影束缚', '诱惑之瞳']
      },
      rewards: {
        win: { exp: 400, gold: 2000, next: 'defeat_princess' },
        lose: { next: 'captured_princess' }
      }
    },

    defeat_princess: {
      id: 'defeat_princess',
      chapter: 5,
      title: '魔女退走',
      description: '姬无双战败离去，但临走前留下一句话：'我会回来的，剑魂...终将属于魔宗。' 柳如烟握住云澈的手，轻声说：'谢谢你。'',
      videoPrompt: '国风浪漫，少女握住少年之手，夕阳西下，温馨氛围，电影级',
      video: 'https://picsum.photos/seed/romantic/800/450',
      type: 'story',
      choices: [
        { text: '继续前进', next: 'chapter6_start', effects: {} }
      ]
    },

    // ==================== 第六章：魔宗阴谋 ====================
    chapter6_start: {
      id: 'chapter6_start',
      chapter: 6,
      title: '魔宗阴谋',
      description: '调查魔宗时，云澈发现了一个惊天秘密——魔宗宗主正在准备复活上古魔帝，而剑魂是关键！',
      videoPrompt: '国风阴谋，暗黑祭坛，魔宗仪式，诡异氛围，电影级',
      video: 'https://picsum.photos/seed/demon-ritual/800/450',
      type: 'story',
      choices: [
        { text: '潜入魔宗总部', next: 'infiltrate', effects: { courage: 15, agility: 10 } },
        { text: '召集正道盟友', next: 'gather_allies', effects: { wisdom: 15 } }
      ]
    },

    infiltrate: {
      id: 'infiltrate',
      chapter: 6,
      title: '潜入魔宫',
      description: '云澈独自潜入魔宫深处，发现魔宗宗主正在进行复活仪式。突然，姬无双出现在身后...',
      videoPrompt: '国风潜入，阴暗走廊，魔女背影，紧张氛围，电影级',
      video: 'https://picsum.photos/seed/infiltrate/800/450',
      type: 'story',
      choices: [
        { text: '与姬无双合作阻止魔帝复活', next: 'ally_princess', effects: { karma: 20 } },
        { text: '独自行动破坏仪式', next: 'solo_action', effects: { courage: 20 } }
      ]
    },

    // ==================== 第七章：命运抉择 ====================
    chapter7_start: {
      id: 'chapter7_start',
      chapter: 7,
      title: '命运抉择',
      description: '魔帝复活已成定局，唯一的封印方法是将剑魂与持有者的灵魂一同献祭。云澈面临着最艰难的抉择...',
      videoPrompt: '国风抉择，少年站在光暗之间，两个选择在前，史诗氛围，电影级',
      video: 'https://picsum.photos/seed/choice/800/450',
      type: 'story',
      choices: [
        { text: '献祭自己，封印魔帝', next: 'ending_sacrifice', effects: { karma: 100 } },
        { text: '寻找其他方法', next: 'find_another_way', effects: {} },
        { text: '与魔帝决一死战', next: 'final_battle', effects: { courage: 50 } }
      ]
    },

    // ==================== 最终战斗 ====================
    final_battle: {
      id: 'final_battle',
      chapter: 10,
      title: '决战魔帝',
      description: '云澈汇聚全身剑魂之力，与魔帝展开最后的决战！天地变色，山河震动，这一战将决定世界命运！',
      videoPrompt: '国风史诗决战，少年对战魔王，天地崩塌，特效满屏，电影级',
      video: 'https://picsum.photos/seed/final-battle/800/450',
      type: 'battle',
    enemy: {
        name: '上古魔帝',
        hp: 1000,
        attack: 50,
        defense: 30,
        skills: ['灭世魔焰', '虚空破碎', '永夜降临', '魔帝降临']
      },
      rewards: {
        win: { exp: 1000, gold: 10000, next: 'ending_hero' },
        lose: { next: 'ending_dark' }
      }
    },

    // ==================== 结局 ====================
    ending_hero: {
      id: 'ending_hero',
      chapter: 10,
      title: '剑圣传说',
      description: '云澈击败魔帝，成为传说中的一代剑圣。他与柳如烟携手归隐，而剑魂之力则化作守护世间的屏障。\n\n【完美结局】',
      videoPrompt: '国风完美结局，少年与少女携手，夕阳西下，剑圣传说，电影级',
      video: 'https://picsum.photos/seed/happy-ending/800/450',
      type: 'ending',
      endingType: 'good',
      achievements: ['good_ending', 'hero_of_world']
    },

    ending_sacrifice: {
      id: 'ending_sacrifice',
      chapter: 10,
      title: '舍身成仁',
      description: '云澈献出自己的灵魂与剑魂，封印了魔帝。世人永远铭记这位舍身救世的英雄。柳如烟在剑圣山立碑纪念，每年都有无数人来此祭拜。\n\n【悲剧结局】',
      videoPrompt: '国风悲壮结局，少年化作光芒消散，少女跪地哭泣，史诗感，电影级',
      video: 'https://picsum.photos/seed/sad-ending/800/450',
      type: 'ending',
      endingType: 'bad',
      achievements: ['bad_ending', 'true_hero']
    },

    ending_dark: {
      id: 'ending_dark',
      chapter: 10,
      title: '黑暗降临',
      description: '魔帝的力量太过强大，云澈战败。世界陷入永夜，人类沦为魔族的奴仆。但在黑暗的最深处，仍有希望的火种在燃烧...\n\n【黑暗结局】',
      videoPrompt: '国风黑暗结局，魔王站在废墟之上，世界陷入黑暗，电影级',
      video: 'https://picsum.photos/seed/dark-ending/800/450',
      type: 'ending',
      endingType: 'bad',
      achievements: ['dark_ending']
    },

    // 隐藏结局 - 需要特定条件
    ending_transcend: {
      id: 'ending_transcend',
      chapter: 10,
      title: '超脱轮回',
      description: '云澈领悟了剑道的真谛，超越生死轮回。他成为守护者，永恒守护这片天地。而他的传说，将永远流传...\n\n【隐藏结局 - 超脱】',
      videoPrompt: '国风升华，少年化作光芒飞升，成为守护神，神圣感，电影级',
      video: 'https://picsum.photos/seed/transcend/800/450',
      type: 'ending',
      endingType: 'perfect',
      achievements: ['perfect_ending', 'transcended'],
      requirements: {
        stats: { karma: 100, wisdom: 80, power: 100 },
        choices: ['ally_princess', 'protect_liu']
      }
    }
  },

  // 成就定义
  achievements: {
    first_choice: { id: 'first_choice', name: '初出茅庐', desc: '做出第一个选择', icon: '🌟' },
    brave_warrior: { id: 'brave_warrior', name: '勇者无畏', desc: '勇气达到50', icon: '⚔️' },
    wise_sage: { id: 'wise_sage', name: '智者千虑', desc: '智慧达到50', icon: '📚' },
    power_awaken: { id: 'power_awaken', name: '力量觉醒', desc: '力量达到50', icon: '💪' },
    good_ending: { id: 'good_ending', name: '完美结局', desc: '达成完美结局', icon: '✨' },
    bad_ending: { id: 'bad_ending', name: '悲剧英雄', desc: '达成悲剧结局', icon: '💔' },
    battle_master: { id: 'battle_master', name: '战无不胜', desc: '战斗胜利10次', icon: '🏆' },
    explorer: { id: 'explorer', name: '探索者', desc: '解锁所有分支', icon: '🗺️' },
    speedrun: { id: 'speedrun', name: '速通大师', desc: '30分钟内通关', icon: '⚡' },
    collector: { id: 'collector', name: '收集控', desc: '解锁10个成就', icon: '💎' },
    hero_of_world: { id: 'hero_of_world', name: '救世英雄', desc: '击败魔帝', icon: '🗡️' },
    true_hero: { id: 'true_hero', name: '真英雄', desc: '舍身救世', icon: '😇' },
    dark_ending: { id: 'dark_ending', name: '黑暗降临', desc: '达成黑暗结局', icon: '🌑' },
    perfect_ending: { id: 'perfect_ending', name: '超脱轮回', desc: '达成隐藏结局', icon: '👑' },
    transcended: { id: 'transcended', name: '剑道至尊', desc: '领悟剑道真谛', icon: '🌟' },
    love_achieved: { id: 'love_achieved', name: '情有所归', desc: '与柳如烟修成正果', icon: '💕' },
    demon_slayer: { id: 'demon_slayer', name: '斩妖除魔', desc: '击败三头妖蛇', icon: '🐍' },
    tournament_champion: { id: 'tournament_champion', name: '剑道魁首', desc: '赢得剑道大会', icon: '🏅' }
  },

  // 战斗技能定义
  skills: {
    basic_slash: { name: '基础斩击', damage: 20, cost: 0, type: 'attack' },
    sword_qi: { name: '剑气纵横', damage: 40, cost: 10, type: 'attack' },
    soul_blade: { name: '剑魂觉醒', damage: 80, cost: 30, type: 'ultimate' },
    defense: { name: '剑幕防御', damage: 0, cost: 5, type: 'defense', effect: 'reduce_damage' },
    heal: { name: '剑气疗伤', damage: 0, cost: 15, type: 'heal', effect: 'restore_hp' }
  }
};
