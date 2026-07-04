/**
 * 对战页面
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

const EXPO_PUBLIC_GOPEN_API = process.env.EXPO_PUBLIC_GOPEN_API || 'https://gopen.com.cn/api/v1';

export default function BattleScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchTime, setMatchTime] = useState(0);

  const startMatch = async () => {
    setMatching(true);
    setMatchTime(0);
    
    // 模拟匹配
    const timer = setInterval(() => {
      setMatchTime(prev => prev + 1);
    }, 1000);
    
    // 调用匹配 API
    try {
      const response = await fetch(`${EXPO_PUBLIC_GOPEN_API}/ink/battle/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'home_player',
          isAi: true,
        }),
      });
      
      const data = await response.json();
      
      if (data.battle) {
        clearInterval(timer);
        setMatching(false);
        // 导航到战斗详情
        console.log('战斗创建成功:', data.battle.id);
      }
    } catch (error) {
      console.error('匹配失败:', error);
      clearInterval(timer);
      setMatching(false);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      <View style={styles.container}>
        {/* 标题 */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.gold}>
            即刻对战
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary}>
            匹配对手，争夺荣耀
          </ThemedText>
        </View>

        {/* 匹配区域 */}
        <View style={styles.matchArea}>
          {matching ? (
            <View style={styles.matchingContainer}>
              <ActivityIndicator size="large" color={theme.gold} />
              <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: 24 }}>
                匹配中...
              </ThemedText>
              <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 8 }}>
                {matchTime}秒
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.error }]}
                onPress={() => setMatching(false)}
              >
                <ThemedText variant="small" color={theme.error}>取消匹配</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.matchButton}
                onPress={startMatch}
              >
                <LinearGradient
                  colors={[theme.primary, theme.accent]}
                  style={styles.matchButtonGradient}
                >
                  <FontAwesome6 name="swords" size={32} color="#FFF" />
                  <ThemedText variant="h3" color="#FFF" style={{ marginTop: 12 }}>
                    开始匹配
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.quickMatchRow}>
                <TouchableOpacity style={[styles.quickButton, { backgroundColor: theme.backgroundCard }]}>
                  <FontAwesome6 name="robot" size={16} color={theme.primary} />
                  <ThemedText variant="small" color={theme.textPrimary} style={{ marginLeft: 8 }}>
                    AI 对战
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.quickButton, { backgroundColor: theme.backgroundCard }]}>
                  <FontAwesome6 name="user-group" size={16} color={theme.accent} />
                  <ThemedText variant="small" color={theme.textPrimary} style={{ marginLeft: 8 }}>
                    好友对战
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 战绩统计 */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundCard }]}>
            <FontAwesome6 name="trophy" size={20} color={theme.gold} />
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginTop: 8 }}>
              胜利
            </ThemedText>
            <ThemedText variant="h2" color={theme.gold}>
              0
            </ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.backgroundCard }]}>
            <FontAwesome6 name="skull" size={20} color={theme.error} />
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginTop: 8 }}>
              失败
            </ThemedText>
            <ThemedText variant="h2" color={theme.error}>
              0
            </ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.backgroundCard }]}>
            <FontAwesome6 name="star" size={20} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginTop: 8 }}>
              胜率
            </ThemedText>
            <ThemedText variant="h2" color={theme.primary}>
              0%
            </ThemedText>
          </View>
        </View>
      </View>
    </Screen>
  );
}
