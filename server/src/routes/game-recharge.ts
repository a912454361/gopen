/**
 * 游戏充值系统 API
 * 
 * 功能：
 * 1. 代金券系统 - 上线送10000代金券，诱导消费
 * 2. 充值折扣 - 一律0.05折
 * 3. 道具背包 - 精确数量控制
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const supabase = getSupabaseClient();

// ==================== 配置 ====================

// 折扣率：0.05折 = 0.0005
const DISCOUNT_RATE = 0.0005;

// 新用户代金券金额
const NEW_USER_COUPON_AMOUNT = 10000;

// 充值套餐配置
const RECHARGE_PACKAGES = [
  {
    id: 'pack_6',
    name: '微光礼包',
    originalPrice: 6,
    baseRewards: { gold: 600, gems: 30 },
    bonusRewards: { gold: 60 }, // 额外赠送
    icon: '🌟',
  },
  {
    id: 'pack_30',
    name: '星辉礼包',
    originalPrice: 30,
    baseRewards: { gold: 3000, gems: 150 },
    bonusRewards: { gold: 300 },
    icon: '✨',
  },
  {
    id: 'pack_68',
    name: '月光礼包',
    originalPrice: 68,
    baseRewards: { gold: 6800, gems: 340 },
    bonusRewards: { gold: 680 },
    icon: '🌙',
  },
  {
    id: 'pack_128',
    name: '烈阳礼包',
    originalPrice: 128,
    baseRewards: { gold: 12800, gems: 640 },
    bonusRewards: { gold: 2560 },
    icon: '☀️',
  },
  {
    id: 'pack_328',
    name: '天穹礼包',
    originalPrice: 328,
    baseRewards: { gold: 32800, gems: 1640 },
    bonusRewards: { gold: 9840 },
    icon: '💎',
  },
  {
    id: 'pack_648',
    name: '至尊礼包',
    originalPrice: 648,
    baseRewards: { gold: 64800, gems: 3240 },
    bonusRewards: { gold: 25920 },
    icon: '👑',
  },
];

// 道具配置
const ITEM_CONFIG: Record<string, {
  name: string;
  type: 'consumable' | 'material' | 'equipment' | 'fragment';
  maxStack: number;
  description: string;
}> = {
  'item_energy_potion': {
    name: '体力药水',
    type: 'consumable',
    maxStack: 999,
    description: '恢复50点体力',
  },
  'item_gold_pack_s': {
    name: '金币礼包(小)',
    type: 'consumable',
    maxStack: 999,
    description: '打开获得500金币',
  },
  'item_gold_pack_m': {
    name: '金币礼包(中)',
    type: 'consumable',
    maxStack: 999,
    description: '打开获得2000金币',
  },
  'item_gold_pack_l': {
    name: '金币礼包(大)',
    type: 'consumable',
    maxStack: 999,
    description: '打开获得10000金币',
  },
  'item_card_fragment': {
    name: '卡牌碎片',
    type: 'fragment',
    maxStack: 999,
    description: '用于卡牌升星',
  },
  'item_equip_scroll': {
    name: '装备卷轴',
    type: 'material',
    maxStack: 999,
    description: '用于装备强化',
  },
};

// ==================== 用户初始化 ====================

/**
 * 初始化游戏用户（新用户送10000代金券）
 * POST /api/v1/game-recharge/init-user
 */
router.post('/init-user', async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('game_users')
      .select('uid')
      .eq('uid', uid)
      .single();

    if (existingUser) {
      // 用户已存在，返回当前数据
      const { data: user } = await supabase
        .from('game_users')
        .select('*')
        .eq('uid', uid)
        .single();

      return res.json({
        success: true,
        isNewUser: false,
        user,
      });
    }

    // 创建新用户并发送代金券
    // 使用事务（Supabase 不支持事务，需要分步操作）
    
    // 1. 创建用户
    const { error: createUserError } = await supabase
      .from('game_users')
      .insert({
        uid,
        nickname: `修士${uid.slice(-4)}`,
        level: 1,
        vip: 0,
        gold: 1000, // 初始金币
        gems: 100, // 初始灵石
        energy: 100,
        coupons: NEW_USER_COUPON_AMOUNT,
        coupons_total: NEW_USER_COUPON_AMOUNT,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      });

    if (createUserError) {
      return res.status(500).json({ error: createUserError.message });
    }

    // 2. 发放代金券记录
    await supabase
      .from('game_coupons')
      .insert({
        uid,
        amount: NEW_USER_COUPON_AMOUNT,
        remaining: NEW_USER_COUPON_AMOUNT,
        source: 'new_user_gift',
        source_id: 'init',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年有效
      });

    // 3. 发放初始道具
    const initialItems = [
      { item_id: 'item_energy_potion', quantity: 10 },
      { item_id: 'item_gold_pack_s', quantity: 5 },
    ];

    for (const item of initialItems) {
      const itemConfig = ITEM_CONFIG[item.item_id];
      if (itemConfig) {
        await supabase
          .from('game_inventory')
          .insert({
            uid,
            item_id: item.item_id,
            item_name: itemConfig.name,
            item_type: itemConfig.type,
            quantity: item.quantity,
            max_stack: itemConfig.maxStack,
          });

        // 记录道具流水
        await supabase
          .from('game_inventory_logs')
          .insert({
            uid,
            item_id: item.item_id,
            change: item.quantity,
            before_qty: 0,
            after_qty: item.quantity,
            reason: 'new_user_gift',
          });
      }
    }

    // 4. 获取完整用户数据
    const { data: user } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();

    res.json({
      success: true,
      isNewUser: true,
      user,
      message: `欢迎来到万古长夜！您已获得${NEW_USER_COUPON_AMOUNT}元代金券，立即充值享0.05折优惠！`,
    });
  } catch (err) {
    console.error('初始化用户失败:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 充值系统 ====================

/**
 * 获取充值套餐列表
 * GET /api/v1/game-recharge/packages
 */
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = RECHARGE_PACKAGES.map(pkg => ({
      ...pkg,
      discountRate: DISCOUNT_RATE,
      finalPrice: Math.max(0.01, Math.round(pkg.originalPrice * DISCOUNT_RATE * 100) / 100), // 最少0.01元
      totalRewards: {
        gold: pkg.baseRewards.gold + (pkg.bonusRewards.gold || 0),
        gems: pkg.baseRewards.gems,
      },
    }));

    res.json({
      success: true,
      packages,
      discountInfo: {
        rate: DISCOUNT_RATE,
        display: '0.05折',
        description: '限时特惠，所有充值一律0.05折！',
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 创建充值订单
 * POST /api/v1/game-recharge/create-order
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { uid, packageId, useCoupon = true } = req.body;

    if (!uid || !packageId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const pkg = RECHARGE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: '无效的套餐' });
    }

    // 获取用户信息
    const { data: user } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 计算价格
    const originalPrice = pkg.originalPrice;
    const discountedPrice = Math.max(0.01, Math.round(originalPrice * DISCOUNT_RATE * 100) / 100);
    
    // 使用代金券
    let couponUsed = 0;
    let finalPrice = discountedPrice;

    if (useCoupon && user.coupons > 0) {
      couponUsed = Math.min(user.coupons, discountedPrice);
      finalPrice = Math.max(0, discountedPrice - couponUsed);
    }

    // 生成订单号
    const orderId = `RC${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 创建订单
    const { error: orderError } = await supabase
      .from('game_recharge_orders')
      .insert({
        order_id: orderId,
        uid,
        package_id: packageId,
        original_price: originalPrice,
        discount_rate: DISCOUNT_RATE,
        final_price: finalPrice,
        coupon_used: couponUsed,
        status: 'pending',
        rewards: [
          { type: 'gold', amount: pkg.baseRewards.gold + (pkg.bonusRewards.gold || 0) },
          { type: 'gems', amount: pkg.baseRewards.gems },
        ],
        created_at: new Date().toISOString(),
      });

    if (orderError) {
      return res.status(500).json({ error: orderError.message });
    }

    res.json({
      success: true,
      orderId,
      orderInfo: {
        packageName: pkg.name,
        originalPrice,
        discountPrice: discountedPrice,
        couponUsed,
        finalPrice,
        rewards: {
          gold: pkg.baseRewards.gold + (pkg.bonusRewards.gold || 0),
          gems: pkg.baseRewards.gems,
        },
      },
      message: finalPrice === 0 
        ? '代金券已完全抵扣，支付0.01元即可完成充值！' 
        : `需支付${finalPrice.toFixed(2)}元`,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 完成充值（模拟支付成功）
 * POST /api/v1/game-recharge/complete-order
 */
router.post('/complete-order', async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMethod = 'mock' } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '缺少订单号' });
    }

    // 获取订单
    const { data: order } = await supabase
      .from('game_recharge_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态异常' });
    }

    // 获取用户
    const { data: user } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', order.uid)
      .single();

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 扣减代金券
    if (order.coupon_used > 0) {
      await supabase
        .from('game_users')
        .update({
          coupons: user.coupons - order.coupon_used,
          coupons_used: user.coupons_used + order.coupon_used,
        })
        .eq('uid', order.uid);

      // 标记代金券已使用
      await supabase
        .from('game_coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          remaining: 0,
        })
        .eq('uid', order.uid)
        .eq('source', 'new_user_gift');
    }

    // 发放奖励
    const updates: Record<string, number> = {
      total_recharge: (user.total_recharge || 0) + order.final_price,
    };

    for (const reward of order.rewards) {
      if (reward.type === 'gold') {
        updates.gold = (user.gold || 0) + reward.amount;
      } else if (reward.type === 'gems') {
        updates.gems = (user.gems || 0) + reward.amount;
      }
    }

    await supabase
      .from('game_users')
      .update(updates)
      .eq('uid', order.uid);

    // 更新订单状态
    await supabase
      .from('game_recharge_orders')
      .update({
        status: 'completed',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // 获取最新用户数据
    const { data: updatedUser } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', order.uid)
      .single();

    res.json({
      success: true,
      message: '充值成功！',
      rewards: order.rewards,
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 道具背包系统 ====================

/**
 * 获取用户背包
 * GET /api/v1/game-recharge/inventory/:uid
 */
router.get('/inventory/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    const { data: inventory, error } = await supabase
      .from('game_inventory')
      .select('*')
      .eq('uid', uid)
      .gt('quantity', 0);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      inventory: inventory || [],
      totalItems: inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 使用道具
 * POST /api/v1/game-recharge/use-item
 */
router.post('/use-item', async (req: Request, res: Response) => {
  try {
    const { uid, itemId, quantity = 1 } = req.body;

    if (!uid || !itemId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 获取道具信息
    const { data: item, error: itemError } = await supabase
      .from('game_inventory')
      .select('*')
      .eq('uid', uid)
      .eq('item_id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: '道具不存在' });
    }

    // 验证数量
    if (item.quantity < quantity) {
      return res.status(400).json({ 
        error: `道具数量不足，当前拥有${item.quantity}个`,
        currentQuantity: item.quantity,
        requestedQuantity: quantity,
      });
    }

    // 执行道具效果
    let effect: Record<string, any> = {};
    const newQuantity = item.quantity - quantity;

    // 根据道具类型执行效果
    if (itemId === 'item_energy_potion') {
      // 体力药水：恢复50体力
      const { data: user } = await supabase
        .from('game_users')
        .select('energy')
        .eq('uid', uid)
        .single();

      const newEnergy = Math.min(150, (user?.energy || 0) + 50 * quantity);
      await supabase
        .from('game_users')
        .update({ energy: newEnergy })
        .eq('uid', uid);

      effect = { energyRestored: 50 * quantity, newEnergy };
    } else if (itemId === 'item_gold_pack_s') {
      // 小金币礼包：获得500金币
      const { data: user } = await supabase
        .from('game_users')
        .select('gold')
        .eq('uid', uid)
        .single();

      const newGold = (user?.gold || 0) + 500 * quantity;
      await supabase
        .from('game_users')
        .update({ gold: newGold })
        .eq('uid', uid);

      effect = { goldGained: 500 * quantity, newGold };
    } else if (itemId === 'item_gold_pack_m') {
      // 中金币礼包：获得2000金币
      const { data: user } = await supabase
        .from('game_users')
        .select('gold')
        .eq('uid', uid)
        .single();

      const newGold = (user?.gold || 0) + 2000 * quantity;
      await supabase
        .from('game_users')
        .update({ gold: newGold })
        .eq('uid', uid);

      effect = { goldGained: 2000 * quantity, newGold };
    } else if (itemId === 'item_gold_pack_l') {
      // 大金币礼包：获得10000金币
      const { data: user } = await supabase
        .from('game_users')
        .select('gold')
        .eq('uid', uid)
        .single();

      const newGold = (user?.gold || 0) + 10000 * quantity;
      await supabase
        .from('game_users')
        .update({ gold: newGold })
        .eq('uid', uid);

      effect = { goldGained: 10000 * quantity, newGold };
    }

    // 更新道具数量
    await supabase
      .from('game_inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    // 记录道具流水
    await supabase
      .from('game_inventory_logs')
      .insert({
        uid,
        item_id: itemId,
        change: -quantity,
        before_qty: item.quantity,
        after_qty: newQuantity,
        reason: 'use_item',
      });

    res.json({
      success: true,
      message: `成功使用${quantity}个${item.item_name}`,
      effect,
      remainingQuantity: newQuantity,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GM添加/减少道具
 * POST /api/v1/game-recharge/gm/modify-item
 */
router.post('/gm/modify-item', async (req: Request, res: Response) => {
  try {
    const { uid, itemId, quantity, reason = 'gm_operation', gmToken } = req.body;

    // GM权限验证
    if (gmToken !== process.env.GM_SECRET && gmToken !== 'jianpo_gm_secret_2024') {
      return res.status(403).json({ error: 'GM权限验证失败' });
    }

    if (!uid || !itemId || quantity === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const itemConfig = ITEM_CONFIG[itemId];
    if (!itemConfig) {
      return res.status(400).json({ error: '无效的道具ID' });
    }

    // 获取当前道具数量
    const { data: existingItem } = await supabase
      .from('game_inventory')
      .select('*')
      .eq('uid', uid)
      .eq('item_id', itemId)
      .single();

    const beforeQty = existingItem?.quantity || 0;
    let afterQty = beforeQty + quantity;

    // 数量校验
    if (afterQty < 0) {
      return res.status(400).json({
        error: `道具数量不足，当前拥有${beforeQty}个，无法减少${Math.abs(quantity)}个`,
        currentQuantity: beforeQty,
        requestedChange: quantity,
      });
    }

    // 堆叠上限校验
    if (afterQty > itemConfig.maxStack) {
      afterQty = itemConfig.maxStack;
    }

    // 更新或创建道具记录
    if (existingItem) {
      await supabase
        .from('game_inventory')
        .update({
          quantity: afterQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('game_inventory')
        .insert({
          uid,
          item_id: itemId,
          item_name: itemConfig.name,
          item_type: itemConfig.type,
          quantity: afterQty,
          max_stack: itemConfig.maxStack,
        });
    }

    // 记录道具流水
    await supabase
      .from('game_inventory_logs')
      .insert({
        uid,
        item_id: itemId,
        change: quantity,
        before_qty: beforeQty,
        after_qty: afterQty,
        reason,
        related_id: 'gm_operation',
      });

    // 记录GM日志
    await supabase
      .from('gm_logs')
      .insert({
        action: 'modify_item',
        target_uid: uid,
        field: itemId,
        old_value: beforeQty,
        new_value: afterQty,
        operation: quantity > 0 ? 'add' : 'reduce',
        created_at: new Date().toISOString(),
      });

    res.json({
      success: true,
      message: `道具${itemId}数量已从${beforeQty}修改为${afterQty}`,
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      change: afterQty - beforeQty,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 验证道具数量（用于数据校验）
 * POST /api/v1/game-recharge/verify-inventory
 */
router.post('/verify-inventory', async (req: Request, res: Response) => {
  try {
    const { uid, itemId, expectedQuantity } = req.body;

    const { data: item } = await supabase
      .from('game_inventory')
      .select('quantity')
      .eq('uid', uid)
      .eq('item_id', itemId)
      .single();

    const actualQuantity = item?.quantity || 0;
    const isMatch = actualQuantity === expectedQuantity;

    res.json({
      success: true,
      itemId,
      expectedQuantity,
      actualQuantity,
      isMatch,
      message: isMatch 
        ? '数据验证通过' 
        : `数据不一致：期望${expectedQuantity}，实际${actualQuantity}`,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 用户信息 ====================

/**
 * 获取用户信息
 * GET /api/v1/game-recharge/user/:uid
 */
router.get('/user/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    const { data: user, error } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取背包道具数量
    const { data: inventory } = await supabase
      .from('game_inventory')
      .select('quantity')
      .eq('uid', uid);

    const totalItems = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    res.json({
      success: true,
      user: {
        ...user,
        totalInventoryItems: totalItems,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取充值记录
 * GET /api/v1/game-recharge/orders/:uid
 */
router.get('/orders/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { data: orders, error, count } = await supabase
      .from('game_recharge_orders')
      .select('*', { count: 'exact' })
      .eq('uid', uid)
      .order('created_at', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      orders: orders || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
