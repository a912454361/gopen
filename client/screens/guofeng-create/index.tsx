import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 粒子特效类型
const PARTICLE_TYPES = [
  { id: 'fire', name: '烈焰', icon: 'fire', color: '#FF6B35', gradient: ['#FF6B35', '#F7931E'] },
  { id: 'lightning', name: '雷电', icon: 'bolt', color: '#00D4FF', gradient: ['#00D4FF', '#7B68EE'] },
  { id: 'ice', name: '冰霜', icon: 'snowflake', color: '#87CEEB', gradient: ['#87CEEB', '#4169E1'] },
  { id: 'spirit', name: '灵气', icon: 'sparkles', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
  { id: 'dark', name: '暗黑', icon: 'moon', color: '#9932CC', gradient: ['#9932CC', '#4B0082'] },
];

// 协作模型配置
const CREATIVE_MODELS = [
  { id: 'kimi', name: 'Kimi K2', task: '剧本创作', icon: 'wand-magic-sparkles', color: '#8B5CF6', status: 'ready' },
  { id: 'deepseek', name: 'DeepSeek V3', task: '角色设定', icon: 'user-pen', color: '#06B6D4', status: 'ready' },
  { id: 'qwen', name: '通义千问 VL', task: '场景描述', icon: 'mountain-sun', color: '#F59E0B', status: 'ready' },
  { id: 'doubao', name: '豆包 Pro', task: '对话创作', icon: 'comments', color: '#10B981', status: 'ready' },
];

// 粒子动画组件
function ParticleEffect({ type, active, intensity = 50 }: { type: string; active: boolean; intensity?: number }) {
  const particles = useRef<Array<{
    x: Animated.Value;
    y: Animated.Value;
    opacity: Animated.Value;
    scale: Animated.Value;
    delay: number;
  }>>([]).current;

  const particleConfig = PARTICLE_TYPES.find(p => p.id === type) || PARTICLE_TYPES[0];
  
  // 初始化粒子
  useEffect(() => {
    particles.length = 0;
    for (let i = 0; i < intensity; i++) {
      particles.push({
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(SCREEN_HEIGHT + 50),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        delay: Math.random() * 2000,
      });
    }
  }, [intensity, type]);

  // 运行动画
  useEffect(() => {
    if (!active) return;

    particles.forEach((particle, index) => {
      const animate = () => {
        particle.x.setValue(Math.random() * SCREEN_WIDTH);
        particle.y.setValue(SCREEN_HEIGHT + 50);
        particle.opacity.setValue(0);
        particle.scale.setValue(0);

        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.parallel([
            Animated.timing(particle.y, {
              toValue: -50,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 500,
                delay: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 1 + Math.random(),
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          if (active) animate();
        });
      };
      animate();
    });
  }, [active, particles]);

  if (!active) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: particleConfig.color,
            shadowColor: particleConfig.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
            ],
            opacity: particle.opacity,
          }}
        />
      ))}
    </View>
  );
}

export default function GuofengCreateScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [title, setTitle] = useState('剑破苍穹');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [phase, setPhase] = useState('');
  const [particleType, setParticleType] = useState('spirit');
  const [result, setResult] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取用户ID
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  // 进度动画值
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 进度动画
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // 脉冲动画
  useEffect(() => {
    if (isCreating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCreating, pulseAnim]);

  // 开始创作
  const handleCreate = async () => {
    if (!userId) {
      alert('请先登录');
      return;
    }

    setIsCreating(true);
    setProgress(0);
    setProgressMessage('🚀 启动多模型协作系统...');
    setResult(null);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 5;
        });
      }, 1000);

      /**
       * 服务端文件：server/src/routes/guofeng-anime.ts
       * 接口：POST /api/v1/guofeng-anime/create
       * Body 参数：user_id: string, title: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/guofeng-anime/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            title,
          }),
        }
      );

      clearInterval(progressInterval);
      const data = await response.json();

      if (data.success) {
        setProgress(100);
        setProgressMessage('✅ 创作完成！');
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Create error:', error);
      setProgressMessage(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            🎬 26集国风燃爆动漫
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            多模型协作 · 粒子特效 · 高清视频
          </ThemedText>
        </View>

        {/* 粒子特效展示区 */}
        <View style={styles.particleContainer}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            style={{ flex: 1 }}
          >
            <ParticleEffect type={particleType} active={isCreating} intensity={80} />
            <View style={styles.particleOverlay}>
              <Animated.Text
                style={[
                  styles.particleText,
                  {
                    color: PARTICLE_TYPES.find(p => p.id === particleType)?.color || '#FFD700',
                    transform: [{ scale: isCreating ? pulseAnim : 1 }],
                  },
                ]}
              >
                {isCreating ? `${Math.round(progress)}%` : '✨'}
              </Animated.Text>
            </View>
          </LinearGradient>
        </View>

        {/* 粒子特效类型选择 */}
        <View style={styles.particleTypes}>
          {PARTICLE_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.id}
              style={[
                styles.particleTypeButton,
                {
                  backgroundColor: particleType === pt.id ? pt.gradient[0] : theme.backgroundTertiary,
                },
              ]}
              onPress={() => setParticleType(pt.id)}
            >
              <FontAwesome6
                name={pt.icon}
                size={14}
                color={particleType === pt.id ? '#fff' : theme.textSecondary}
              />
              <ThemedText
                variant="small"
                color={particleType === pt.id ? '#fff' : theme.textSecondary}
                style={styles.particleTypeText}
              >
                {pt.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 进度区域 */}
        {isCreating && (
          <ThemedView level="default" style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                {phase || '创作进度'}
              </ThemedText>
              <ThemedText variant="bodyMedium" color={theme.primary}>
                {Math.round(progress)}%
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>
            <ThemedText variant="small" color={theme.textSecondary} style={styles.progressMessage}>
              {progressMessage}
            </ThemedText>
          </ThemedView>
        )}

        {/* 协作模型展示 */}
        <View style={styles.modelsSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            🤖 多模型协作
          </ThemedText>
          {CREATIVE_MODELS.map((model) => (
            <ThemedView key={model.id} level="default" style={styles.modelCard}>
              <View style={[styles.modelIcon, { backgroundColor: model.color + '20' }]}>
                <FontAwesome6 name={model.icon} size={18} color={model.color} />
              </View>
              <View style={styles.modelInfo}>
                <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.modelName}>
                  {model.name}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.modelTask}>
                  {model.task}
                </ThemedText>
              </View>
              <View style={[styles.modelStatus, { backgroundColor: '#10B98120' }]}>
                <ThemedText variant="caption" color="#10B981">
                  {isCreating ? '运行中' : '就绪'}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>

        {/* 动漫标题输入 */}
        <View style={styles.inputSection}>
          <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.inputLabel}>
            动漫标题
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
            value={title}
            onChangeText={setTitle}
            placeholder="输入动漫标题..."
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* 创建按钮 */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: isCreating ? theme.textMuted : theme.primary }]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          <ThemedText variant="h4" color={theme.buttonPrimaryText}>
            {isCreating ? '🔥 创作中...' : '🚀 开始创作'}
          </ThemedText>
        </TouchableOpacity>

        {/* 创作结果 */}
        {result && (
          <View style={styles.resultSection}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
              🎉 创作完成
            </ThemedText>
            
            <ThemedView level="default" style={styles.resultCard}>
              <ThemedText variant="h4" color={theme.primary} style={styles.resultTitle}>
                {result.title}
              </ThemedText>
              <View style={styles.resultItem}>
                <View style={[styles.resultDot, { backgroundColor: '#8B5CF6' }]} />
                <ThemedText variant="body" color={theme.textSecondary}>
                  {result.episodes?.length || 26} 集剧本
                </ThemedText>
              </View>
              <View style={styles.resultItem}>
                <View style={[styles.resultDot, { backgroundColor: '#06B6D4' }]} />
                <ThemedText variant="body" color={theme.textSecondary}>
                  {result.characters?.length || 5} 个角色
                </ThemedText>
              </View>
              <View style={styles.resultItem}>
                <View style={[styles.resultDot, { backgroundColor: '#F59E0B' }]} />
                <ThemedText variant="body" color={theme.textSecondary}>
                  {result.scenes?.length || 6} 个场景
                </ThemedText>
              </View>
              <View style={styles.resultItem}>
                <View style={[styles.resultDot, { backgroundColor: '#FFD700' }]} />
                <ThemedText variant="body" color={theme.textSecondary}>
                  粒子特效: {result.particles || 100}%
                </ThemedText>
              </View>
            </ThemedView>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/anime-detail', { projectId: result.projectId })}
            >
              <ThemedText variant="bodyMedium" color="#fff">
                📖 查看详情
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
