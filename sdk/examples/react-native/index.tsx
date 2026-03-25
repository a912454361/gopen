/**
 * G open SDK - React Native 集成示例
 * 演示在 React Native 应用中使用 SDK
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { GopenSDK, UserInfo, TextGenerationResult, ImageGenerationResult } from '@gopen/sdk';

// ==================== Context ====================

interface GopenContextType {
  sdk: GopenSDK | null;
  user: UserInfo | null;
  isLoading: boolean;
  login: (account: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const GopenContext = createContext<GopenContextType>({
  sdk: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useGopen = () => useContext(GopenContext);

// ==================== Provider ====================

export const GopenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sdk, setSdk] = useState<GopenSDK | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化 SDK
    const gopenSdk = new GopenSDK({
      baseUrl: 'https://your-api-server.com',
      licenseKey: 'YOUR_LICENSE_KEY',
    });
    setSdk(gopenSdk);
    setIsLoading(false);
  }, []);

  const login = async (account: string, password: string) => {
    if (!sdk) return;
    const result = await sdk.auth.login({
      account,
      password,
      type: 'password',
    });
    setUser(result.user);
  };

  const logout = async () => {
    if (!sdk) return;
    await sdk.auth.logout();
    setUser(null);
  };

  return (
    <GopenContext.Provider value={{ sdk, user, isLoading, login, logout }}>
      {children}
    </GopenContext.Provider>
  );
};

// ==================== 登录页面 ====================

export const LoginScreen: React.FC = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useGopen();

  const handleLogin = async () => {
    if (!account || !password) {
      Alert.alert('提示', '请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      await login(account, password);
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>G open 登录</Text>
      
      <TextInput
        style={styles.input}
        placeholder="手机号/邮箱"
        value={account}
        onChangeText={setAccount}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>登录</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ==================== AI 创作页面 ====================

export const AICreatorScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [textResult, setTextResult] = useState<TextGenerationResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageGenerationResult | null>(null);
  const { sdk, user } = useGopen();

  const generateText = async () => {
    if (!sdk || !prompt) return;
    setLoading(true);
    try {
      const result = await sdk.ai.generateText({
        prompt,
        model: 'doubao',
        maxLength: 500,
      });
      setTextResult(result);
    } catch (error: any) {
      Alert.alert('生成失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!sdk || !prompt) return;
    setLoading(true);
    try {
      const result = await sdk.ai.generateImage({
        prompt,
        style: 'anime',
        width: 1024,
        height: 1024,
      });
      setImageResult(result);
    } catch (error: any) {
      Alert.alert('生成失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.userInfo}>
        用户: {user?.username} | G点: {user?.gpoints}
      </Text>
      
      <TextInput
        style={styles.inputLarge}
        placeholder="输入创作提示词..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.halfButton]}
          onPress={generateText}
          disabled={loading}
        >
          <Text style={styles.buttonText}>生成文本</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.halfButton]}
          onPress={generateImage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>生成图像</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      
      {textResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>生成的文本:</Text>
          <Text style={styles.resultText}>{textResult.text}</Text>
          <Text style={styles.costText}>消耗G点: {textResult.costGpoints}</Text>
        </View>
      )}
      
      {imageResult && imageResult.images[0] && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>生成的图像:</Text>
          <Image
            source={{ uri: imageResult.images[0] }}
            style={styles.generatedImage}
            resizeMode="cover"
          />
          <Text style={styles.costText}>消耗G点: {imageResult.costGpoints}</Text>
        </View>
      )}
    </View>
  );
};

// ==================== 粒子特效页面 ====================

export const ParticleEffectScreen: React.FC = () => {
  const [selectedEffect, setSelectedEffect] = useState<string>('sword_qi');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { sdk } = useGopen();

  const effects = [
    { id: 'sword_qi', name: '苍穹剑气', icon: '⚔️' },
    { id: 'ice_heart', name: '冰心诀', icon: '❄️' },
    { id: 'shadow', name: '暗影吞噬', icon: '🌙' },
    { id: 'flame', name: '烈焰焚天', icon: '🔥' },
    { id: 'thunder', name: '雷霆万钧', icon: '⚡' },
    { id: 'wind', name: '风云变幻', icon: '💨' },
    { id: 'starfall', name: '星辰陨落', icon: '🌟' },
    { id: 'sword_rain', name: '万剑归宗', icon: '🗡️' },
  ];

  const createEffect = async () => {
    if (!sdk) return;
    setLoading(true);
    setProgress(0);
    setVideoUrl(null);

    try {
      const result = await sdk.particles.createEffect({
        type: selectedEffect as any,
        resolution: '4K',
        fps: 60,
        duration: 3,
      });

      // 轮询状态
      let status = await sdk.tasks.getStatus(result.taskId);
      while (status.status === 'processing') {
        setProgress(status.progress);
        await new Promise(r => setTimeout(r, 2000));
        status = await sdk.tasks.getStatus(result.taskId);
      }

      if (status.status === 'completed') {
        setVideoUrl(status.result?.videoUrl);
      } else {
        Alert.alert('生成失败', status.error || '未知错误');
      }
    } catch (error: any) {
      Alert.alert('创建失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>8K 粒子特效</Text>
      
      <View style={styles.effectGrid}>
        {effects.map(effect => (
          <TouchableOpacity
            key={effect.id}
            style={[
              styles.effectCard,
              selectedEffect === effect.id && styles.effectCardSelected,
            ]}
            onPress={() => setSelectedEffect(effect.id)}
          >
            <Text style={styles.effectIcon}>{effect.icon}</Text>
            <Text style={styles.effectName}>{effect.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={createEffect}
        disabled={loading}
      >
        {loading ? (
          <Text style={styles.buttonText}>生成中... {progress}%</Text>
        ) : (
          <Text style={styles.buttonText}>生成特效</Text>
        )}
      </TouchableOpacity>
      
      {loading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}
      
      {videoUrl && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>特效视频已生成</Text>
          <Text style={styles.resultText}>{videoUrl}</Text>
        </View>
      )}
    </View>
  );
};

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0a0a0f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f0ff',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    color: '#888',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    marginBottom: 15,
  },
  inputLarge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#00f0ff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
  resultBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  resultTitle: {
    color: '#00f0ff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    color: '#fff',
    lineHeight: 22,
  },
  costText: {
    color: '#bf00ff',
    marginTop: 10,
  },
  generatedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  effectCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  effectCardSelected: {
    borderColor: '#00f0ff',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  effectIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  effectName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00f0ff',
  },
});

export default GopenProvider;
