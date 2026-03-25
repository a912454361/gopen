import React, { useMemo } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage, LanguageCode } from '@/hooks/useLanguage';
import { Languages } from '@/constants/i18n';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';

export default function LanguageScreen() {
  const { theme, isDark } = useTheme();
  const { language, changeLanguage, translate } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLanguageSelect = (langCode: LanguageCode) => {
    changeLanguage(langCode);
  };

  const currentLang = Languages[language];
  const availableLanguages = Object.values(Languages);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            {translate('language.title')}
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.description}>
            {translate('language.subtitle')}
          </ThemedText>
        </ThemedView>

        {/* Current Language */}
        <View style={styles.currentSection}>
          <ThemedText variant="label" color={theme.textMuted} style={styles.sectionTitle}>
            {translate('language.current')}
          </ThemedText>
          <ThemedView
            level="default"
            style={[
              styles.currentLanguageCard,
              { borderColor: theme.primary },
            ]}
          >
            <View
              style={[
                styles.flagContainer,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <ThemedText style={styles.flagText}>{currentLang.flag}</ThemedText>
            </View>
            <View style={styles.currentLanguageInfo}>
              <ThemedText variant="title" color={theme.textPrimary} style={styles.currentLanguageName}>
                {currentLang.name}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textSecondary} style={styles.currentLanguageNative}>
                {currentLang.nativeName}
              </ThemedText>
            </View>
            <View
              style={[
                styles.checkIcon,
                { backgroundColor: theme.primary },
              ]}
            >
              <FontAwesome6 name="check" size={14} color={theme.buttonPrimaryText} />
            </View>
          </ThemedView>
        </View>

        {/* Available Languages */}
        <ThemedText variant="label" color={theme.textMuted} style={styles.sectionTitle}>
          可选语言 / Available Languages
        </ThemedText>

        <View style={styles.languageList}>
          {availableLanguages.map((lang) => {
            const isSelected = language === lang.code;

            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.borderLight,
                  },
                  isSelected && styles.languageCardActive,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.flagContainer,
                    { backgroundColor: theme.backgroundTertiary },
                  ]}
                >
                  <ThemedText style={styles.flagText}>{lang.flag}</ThemedText>
                </View>
                <View style={styles.languageInfo}>
                  <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.languageName}>
                    {lang.name}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.languageNative}>
                    {lang.nativeName}
                  </ThemedText>
                </View>
                {isSelected && (
                  <View
                    style={[
                      styles.selectedBadge,
                      { backgroundColor: `${theme.primary}20` },
                    ]}
                  >
                    <FontAwesome6 name="circle-check" size={14} color={theme.primary} />
                    <ThemedText
                      variant="captionMedium"
                      color={theme.primary}
                      style={styles.selectedText}
                    >
                      {language === 'zh' ? '已选择' : 'Selected'}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
