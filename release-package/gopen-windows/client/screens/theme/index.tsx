import React, { useMemo } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme, ThemeType, ThemeNames, Themes } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';

// 主题描述
const themeDescriptions: Record<ThemeType, string> = {
  cyber: '硬核科技风，霓虹色彩',
  aesthetic: '柔和梦幻，唯美浪漫',
  dynamic: '活力四射，运动青春',
  fashion: '现代简约，高级质感',
  ancient: '古典雅致，书卷气息',
  chinese: '传统喜庆，中国风情',
};

// 主题图标
const themeIcons: Record<ThemeType, string> = {
  cyber: 'microchip',
  aesthetic: 'heart',
  dynamic: 'fire',
  fashion: 'crown',
  ancient: 'scroll',
  chinese: 'dragon',
};

export default function ThemeScreen() {
  const { theme, themeType, isDark, changeTheme, availableThemes } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleThemeSelect = (type: ThemeType) => {
    changeTheme(type);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            主题设置
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.description}>
            选择你喜欢的主题风格，让应用更符合你的个性
          </ThemedText>
        </ThemedView>

        <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
          可用主题
        </ThemedText>

        <View style={styles.themeGrid}>
          {availableThemes.map((type) => {
            const isActive = themeType === type;
            const themeData = Themes[type];
            const isDarkTheme = type === 'cyber' || type === 'dynamic' || type === 'chinese';

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: themeData.backgroundDefault,
                    borderColor: isActive ? themeData.primary : themeData.borderLight,
                  },
                  isActive && styles.themeCardActive,
                ]}
                onPress={() => handleThemeSelect(type)}
                activeOpacity={0.8}
              >
                <View style={styles.themePreview}>
                  <LinearGradient
                    colors={[themeData.gradientStart || themeData.primary, themeData.gradientEnd || themeData.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themeGradient}
                  >
                    <View
                      style={[
                        styles.themeIconContainer,
                        {
                          backgroundColor: isDarkTheme
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.5)',
                        },
                      ]}
                    >
                      <FontAwesome6
                        name={themeIcons[type]}
                        size={18}
                        color={isDarkTheme ? '#FFFFFF' : themeData.primary}
                      />
                    </View>
                  </LinearGradient>

                  {isActive && (
                    <View
                      style={[
                        styles.checkMark,
                        { backgroundColor: themeData.primary },
                      ]}
                    >
                      <FontAwesome6 name="check" size={12} color={themeData.buttonPrimaryText} />
                    </View>
                  )}
                </View>

                <ThemedText
                  variant="bodyMedium"
                  color={themeData.textPrimary}
                  style={styles.themeName}
                >
                  {ThemeNames[type]}
                </ThemedText>

                <ThemedText
                  variant="caption"
                  color={themeData.textSecondary}
                  style={styles.themeDescription}
                >
                  {themeDescriptions[type]}
                </ThemedText>

                <View style={styles.colorPreview}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeData.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeData.accent },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeData.backgroundRoot },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
