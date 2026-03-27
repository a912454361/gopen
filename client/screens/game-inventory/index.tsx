/**
 * 道具背包系统
 * 
 * 功能：
 * 1. 查看背包道具
 * 2. 使用道具
 * 3. 精确数量控制
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 道具类型图标映射
const ITEM_ICONS: Record<string, string> = {
  'item_energy_potion': 'battery-full',
  'item_gold_pack_s': 'sack-dollar',
  'item_gold_pack_m': 'sack-dollar',
  'item_gold_pack_l': 'sack-dollar',
  'item_card_fragment': 'puzzle-piece',
  'item_equip_scroll': 'scroll',
};

// 道具类型颜色映射
const TYPE_COLORS: Record<string, string> = {
  'consumable': '#4CAF50',
  'material': '#2196F3',
  'equipment': '#FF9800',
  'fragment': '#9C27B0',
};

interface InventoryItem {
  id: number;
  uid: string;
  item_id: string;
  item_name: string;
  item_type: 'consumable' | 'material' | 'equipment' | 'fragment';
  quantity: number;
  max_stack: number;
}

export default function GameInventoryScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uid, setUid] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [useQuantity, setUseQuantity] = useState('1');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      // 获取用户ID
      let playerId = await AsyncStorage.getItem('ink_player_id');
      if (!playerId) {
        playerId = `ink_${Date.now()}`;
        await AsyncStorage.setItem('ink_player_id', playerId);
      }
      setUid(playerId);

      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：GET /api/v1/game-recharge/inventory/:uid
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/inventory/${playerId}`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('加载背包失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const handleUseItem = async () => {
    if (!selectedItem || processing) return;

    const qty = parseInt(useQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('提示', '请输入有效数量');
      return;
    }

    if (qty > selectedItem.quantity) {
      Alert.alert('提示', `道具数量不足，当前拥有${selectedItem.quantity}个`);
      return;
    }

    setProcessing(true);
    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/use-item
       * Body 参数：uid: string, itemId: string, quantity: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/use-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          itemId: selectedItem.item_id,
          quantity: qty,
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('使用成功', `使用了${qty}个${selectedItem.item_name}\n${data.effect?.energyRestored ? `恢复${data.effect.energyRestored}体力` : data.effect?.goldGained ? `获得${data.effect.goldGained}金币` : ''}`);
        await loadInventory();
        setModalVisible(false);
        setSelectedItem(null);
        setUseQuantity('1');
      } else {
        Alert.alert('使用失败', data.error);
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const openItemModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setUseQuantity('1');
    setModalVisible(true);
  };

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.md }}>加载背包...</ThemedText>
        </View>
      </Screen>
    );
  }

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 背包头部 */}
        <View style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            道具背包
          </ThemedText>
          <View style={styles.capacityInfo}>
            <FontAwesome6 name="box" size={14} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted}>
              {inventory.length} 种 / {totalItems} 个道具
            </ThemedText>
          </View>
        </View>

        {/* 道具列表 */}
        {inventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="box-open" size={48} color={theme.textMuted} style={styles.emptyIcon} />
            <ThemedText color={theme.textMuted}>背包空空如也</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>
              充值或完成任务获取道具
            </ThemedText>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {inventory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => openItemModal(item)}
                activeOpacity={0.8}
              >
                <View style={styles.itemIcon}>
                  <FontAwesome6
                    name={ITEM_ICONS[item.item_id] as any || 'cube'}
                    size={24}
                    color={TYPE_COLORS[item.item_type] || theme.textMuted}
                  />
                </View>
                
                <View style={styles.itemInfo}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.itemName}>
                    {item.item_name}
                  </ThemedText>
                  <ThemedText variant="h4" style={styles.itemQuantity}>
                    x {item.quantity}
                  </ThemedText>
                  <ThemedText variant="tiny" color={TYPE_COLORS[item.item_type] || theme.textMuted} style={styles.itemType}>
                    {item.item_type === 'consumable' ? '消耗品' : 
                     item.item_type === 'material' ? '材料' : 
                     item.item_type === 'equipment' ? '装备' : '碎片'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 道具详情弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView level="default" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome6
                name={ITEM_ICONS[selectedItem?.item_id || ''] as any || 'cube'}
                size={24}
                color={TYPE_COLORS[selectedItem?.item_type || ''] || theme.textMuted}
              />
              <ThemedText variant="label" color={theme.textPrimary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                {selectedItem?.item_name}
              </ThemedText>
              <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
              当前数量: {selectedItem?.quantity} 个
            </ThemedText>

            {selectedItem?.item_type === 'consumable' && (
              <>
                <View style={{ marginBottom: Spacing.md }}>
                  <ThemedText variant="small" color={theme.textPrimary}>使用数量</ThemedText>
                  <View style={styles.batchContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={useQuantity}
                      onChangeText={setUseQuantity}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => setUseQuantity(String(selectedItem?.quantity || 1))}
                      style={{ padding: Spacing.sm }}
                    >
                      <ThemedText variant="tiny" color={theme.primary}>全部</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.useButton, processing && styles.useButtonDisabled]}
                  onPress={handleUseItem}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                      使用道具
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}

            {selectedItem?.item_type !== 'consumable' && (
              <ThemedText variant="small" color={theme.textMuted} style={{ textAlign: 'center', marginTop: Spacing.md }}>
                该道具暂不支持直接使用
              </ThemedText>
            )}
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}
