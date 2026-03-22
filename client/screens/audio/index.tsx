import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useToast } from '@/components/Toast';
import { createFormDataFile } from '@/utils';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 音频模型接口
interface AudioModel {
  code: string;
  name: string;
  provider: string;
  providerName: string;
  pricing: { input: number; output: number; tier: string };
  type: 'audio_transcribe' | 'audio_tts';
}

// TTS语音选项
const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', desc: '中性' },
  { id: 'echo', name: 'Echo', desc: '男声' },
  { id: 'fable', name: 'Fable', desc: '英式' },
  { id: 'onyx', name: 'Onyx', desc: '低沉' },
  { id: 'nova', name: 'Nova', desc: '女声' },
  { id: 'shimmer', name: 'Shimmer', desc: '柔和' },
];

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  groq: '#F55036',
  zhipu: '#1A73E8',
};

type TabType = 'transcribe' | 'tts';

export default function AudioScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember } = useMembership();
  const router = useSafeRouter();
  const { showToast } = useToast();

  // Tab状态
  const [activeTab, setActiveTab] = useState<TabType>('transcribe');

  // 语音转文字状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 文字转语音状态
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 模型选择
  const [availableModels, setAvailableModels] = useState<AudioModel[]>([]);
  const [selectedTranscribeModel, setSelectedTranscribeModel] = useState<AudioModel | null>(null);
  const [selectedTTSModel, setSelectedTTSModel] = useState<AudioModel | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelPickerType, setModelPickerType] = useState<'transcribe' | 'tts'>('transcribe');
  const [userId, setUserId] = useState<string | null>(null);

  // 获取用户ID和模型列表
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
    fetchAudioModels();
    checkPermission();
    
    return () => {
      // 清理录音和播放
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 检查录音权限
  const checkPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  /**
   * 获取音频模型列表
   * 服务端文件：server/src/routes/ai-gateway.ts
   * 接口：GET /api/v1/ai/models?type=audio
   */
  const fetchAudioModels = async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/models?type=audio`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setAvailableModels(data.data);
        
        // 设置默认模型
        const transcribeModels = data.data.filter((m: AudioModel) => m.type === 'audio_transcribe');
        const ttsModels = data.data.filter((m: AudioModel) => m.type === 'audio_tts');
        
        if (transcribeModels.length > 0) {
          setSelectedTranscribeModel(transcribeModels[0]);
        }
        if (ttsModels.length > 0) {
          setSelectedTTSModel(ttsModels[0]);
        }
      }
    } catch (error) {
      console.error('Fetch audio models error:', error);
    }
  };

  // 开始录音
  const startRecording = async () => {
    if (!hasPermission) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请授予录音权限');
        return;
      }
      setHasPermission(true);
    }

    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true 
      });
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('录音失败', '无法开始录音');
    }
  };

  // 停止录音
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
    }
  };

  // 语音转文字
  const transcribeAudio = async (audioUri: string) => {
    if (!selectedTranscribeModel) {
      Alert.alert('提示', '请先选择语音识别模型');
      return;
    }

    setIsTranscribing(true);
    setTranscribedText('');

    try {
      // 1. 上传音频文件 - 使用跨平台兼容的文件上传
      const fileName = audioUri.split('/').pop() || 'audio.m4a';
      const fileType = fileName.endsWith('.m4a') ? 'audio/m4a' : 'audio/mp3';
      
      const formData = new FormData();
      const fileData = await createFormDataFile(audioUri, fileName, fileType);
      formData.append('file', fileData as any);

      /**
       * 服务端文件：server/src/routes/cloud-storage.ts
       * 接口：POST /api/v1/upload
       */
      const uploadRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || '上传失败');
      }

      const audioUrl = uploadData.url;

      // 2. 调用语音识别API
      /**
       * 服务端文件：server/src/routes/ai-gateway.ts
       * 接口：POST /api/v1/ai/audio/transcribe
       * Body 参数：userId: string, model: string, audioUrl: string, language?: string
       */
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/audio/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          model: selectedTranscribeModel.code,
          audioUrl,
        }),
      });

      const data = await res.json();
      
      if (data.success && data.data) {
        setTranscribedText(data.data.text || JSON.stringify(data.data));
      } else {
        throw new Error(data.error || '转写失败');
      }
    } catch (error) {
      console.error('Transcribe error:', error);
      Alert.alert('转写失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 文字转语音
  const synthesizeSpeech = async () => {
    if (!ttsText.trim()) {
      Alert.alert('提示', '请输入要转换的文字');
      return;
    }

    if (!selectedTTSModel) {
      Alert.alert('提示', '请先选择语音合成模型');
      return;
    }

    setIsSynthesizing(true);
    
    try {
      /**
       * 服务端文件：server/src/routes/ai-gateway.ts
       * 接口：POST /api/v1/ai/audio/synthesize
       * Body 参数：userId: string, model: string, text: string, voice: string
       */
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/audio/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          model: selectedTTSModel.code,
          text: ttsText.trim(),
          voice: selectedVoice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '合成失败');
      }

      // 获取音频数据
      const audioBlob = await res.blob();
      
      // 保存到本地
      const localUri = `${(FileSystem as any).documentDirectory}tts_${Date.now()}.mp3`;
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await (FileSystem as any).writeAsStringAsync(localUri, base64, {
          encoding: 'base64',
        });
        setAudioUri(localUri);
        setIsSynthesizing(false);
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('TTS error:', error);
      Alert.alert('合成失败', error instanceof Error ? error.message : '请稍后重试');
      setIsSynthesizing(false);
    }
  };

  // 播放/暂停音频
  const togglePlayback = async () => {
    if (!audioUri) return;

    try {
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: false, isLooping: false },
            (status) => {
              if (status.isLoaded) {
                setPlaybackPosition(status.positionMillis);
                setPlaybackDuration(status.durationMillis || 0);
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setPlaybackPosition(0);
                }
              }
            }
          );
          soundRef.current = sound;
        }
        
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.positionMillis >= (status.durationMillis || 0)) {
          await soundRef.current.setPositionAsync(0);
        }
        
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMillis = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    return formatTime(seconds);
  };

  // 保存转写文本到作品库
  const saveTranscribedText = async () => {
    if (!transcribedText || !userId) return;
    
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: '语音转文字',
          project_type: 'AI音频工具',
          service_type: 'audio-transcribe',
          service_name: selectedTranscribeModel?.name || '语音识别',
          content: transcribedText,
          content_type: 'text',
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        showToast('success', '已保存到作品库');
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save transcribed text error:', error);
      showToast('error', '保存失败');
    }
  };

  // 保存音频到相册
  const saveAudioToGallery = async () => {
    if (!audioUri) return;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请授予相册访问权限');
        return;
      }
      
      await MediaLibrary.saveToLibraryAsync(audioUri);
      showToast('success', '音频已保存到相册');
    } catch (error) {
      console.error('Save audio to gallery error:', error);
      showToast('error', '保存失败');
    }
  };

  // 保存音频到作品库
  const saveAudioToWorks = async () => {
    if (!audioUri || !userId) return;
    
    try {
      // 先上传音频文件 - 使用跨平台兼容的文件上传
      const fileName = `tts_${Date.now()}.mp3`;
      const formData = new FormData();
      const fileData = await createFormDataFile(audioUri, fileName, 'audio/mpeg');
      formData.append('file', fileData as any);
      
      const uploadRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || '上传失败');
      }
      
      // 保存到作品库
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: '文字转语音',
          project_type: 'AI音频工具',
          service_type: 'audio-tts',
          service_name: selectedTTSModel?.name || '语音合成',
          content: ttsText,
          content_type: 'audio',
          audio_url: uploadData.url,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        showToast('success', '已保存到作品库');
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save audio to works error:', error);
      showToast('error', '保存失败');
    }
  };

  // 打开模型选择器
  const openModelPicker = (type: 'transcribe' | 'tts') => {
    setModelPickerType(type);
    setShowModelPicker(true);
  };

  // 选择模型
  const handleSelectModel = (model: AudioModel) => {
    if (model.pricing.tier === 'premium' && !isMember) {
      Alert.alert('需要会员', '该模型需要会员才能使用', [
        { text: '取消', style: 'cancel' },
        { text: '升级会员', onPress: () => router.push('/membership') },
      ]);
      return;
    }

    if (modelPickerType === 'transcribe') {
      setSelectedTranscribeModel(model);
    } else {
      setSelectedTTSModel(model);
    }
    setShowModelPicker(false);
  };

  const currentModel = modelPickerType === 'transcribe' ? selectedTranscribeModel : selectedTTSModel;
  const providerColor = currentModel ? (PROVIDER_COLORS[currentModel.provider] || theme.primary) : theme.primary;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="h4" color={theme.textPrimary} style={styles.navTitle}>AI 音频工具</ThemedText>
      </View>
      
      {/* 模型选择Modal */}
      <Modal visible={showModelPicker} transparent animationType="slide" onRequestClose={() => setShowModelPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                选择{modelPickerType === 'transcribe' ? '语音识别' : '语音合成'}模型
              </ThemedText>
              <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {availableModels
                .filter(m => m.type === (modelPickerType === 'transcribe' ? 'audio_transcribe' : 'audio_tts'))
                .map((model) => {
                  const color = PROVIDER_COLORS[model.provider] || theme.primary;
                  const isSelected = (modelPickerType === 'transcribe' ? selectedTranscribeModel?.code : selectedTTSModel?.code) === model.code;
                  
                  return (
                    <TouchableOpacity
                      key={model.code}
                      style={[
                        styles.modelPickerItem,
                        { borderColor: isSelected ? color : theme.border, borderWidth: isSelected ? 2 : 1 },
                      ]}
                      onPress={() => handleSelectModel(model)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.modelPickerIcon, { backgroundColor: color + '20' }]}>
                          <FontAwesome6 
                            name={modelPickerType === 'transcribe' ? 'microphone' : 'volume-high'} 
                            size={16} 
                            color={color} 
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ThemedText variant="smallMedium" color={theme.textPrimary}>{model.name}</ThemedText>
                            {model.pricing.tier === 'free' && (
                              <View style={[styles.tierBadge, { backgroundColor: theme.success + '20' }]}>
                                <Text style={{ color: theme.success, fontSize: 10 }}>免费</Text>
                              </View>
                            )}
                          </View>
                          <ThemedText variant="caption" color={theme.textMuted}>{model.providerName}</ThemedText>
                        </View>
                        {isSelected && <FontAwesome6 name="check" size={16} color={color} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <FontAwesome6 name="wave-square" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText variant="h3" color={theme.textPrimary}>AI 音频工具</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                语音识别与语音合成
              </ThemedText>
            </View>
          </View>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Tab切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'transcribe' && styles.tabButtonActive]}
            onPress={() => setActiveTab('transcribe')}
          >
            <ThemedText 
              variant="smallMedium" 
              color={activeTab === 'transcribe' ? '#fff' : theme.textPrimary}
            >
              语音转文字
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tts')}
          >
            <ThemedText 
              variant="smallMedium" 
              color={activeTab === 'tts' ? '#fff' : theme.textPrimary}
            >
              文字转语音
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 语音转文字 */}
        {activeTab === 'transcribe' && (
          <>
            {/* 模型选择器 */}
            <TouchableOpacity 
              style={[styles.modelSelector, { borderColor: selectedTranscribeModel ? (PROVIDER_COLORS[selectedTranscribeModel.provider] || theme.primary) : theme.border }]}
              onPress={() => openModelPicker('transcribe')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.modelSelectorIcon, { backgroundColor: (selectedTranscribeModel ? PROVIDER_COLORS[selectedTranscribeModel.provider] : theme.primary) + '20' }]}>
                  <FontAwesome6 name="microphone" size={16} color={selectedTranscribeModel ? PROVIDER_COLORS[selectedTranscribeModel.provider] || theme.primary : theme.textMuted} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {selectedTranscribeModel?.name || '选择识别模型'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {selectedTranscribeModel?.providerName || '点击选择'}
                  </ThemedText>
                </View>
              </View>
              <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 录音区域 */}
            <View style={styles.recordSection}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
              >
                <LinearGradient
                  colors={isRecording ? ['#EF4444', '#DC2626'] : [theme.primary, theme.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.recordButton}
                >
                  {isRecording && <View style={[styles.recordWave, { opacity: 0.3 }]} />}
                  <View style={styles.recordButtonInner}>
                    {isTranscribing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <FontAwesome6 
                        name={isRecording ? 'stop' : 'microphone'} 
                        size={32} 
                        color="#fff" 
                      />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              <ThemedText variant="caption" color={theme.textMuted}>
                {isRecording ? '点击停止录音' : '点击开始录音'}
              </ThemedText>
              
              {isRecording && (
                <ThemedText variant="h4" color={theme.primary} style={styles.recordTime}>
                  {formatTime(recordTime)}
                </ThemedText>
              )}
            </View>

            {/* 转写结果 */}
            {(transcribedText || isTranscribing) && (
              <View style={styles.resultSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText variant="label" color={theme.textMuted}>转写结果</ThemedText>
                  {transcribedText && !isTranscribing && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => saveTranscribedText()}
                    >
                      <FontAwesome6 name="bookmark" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <ThemedText variant="captionMedium" color={theme.primary}>保存到作品库</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.resultCard, { borderColor: theme.primary }]}>
                  {isTranscribing ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator color={theme.primary} />
                      <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 8 }}>
                        正在识别中...
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText variant="body" color={theme.textPrimary}>
                      {transcribedText}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* 文字转语音 */}
        {activeTab === 'tts' && (
          <>
            {/* 模型选择器 */}
            <TouchableOpacity 
              style={[styles.modelSelector, { borderColor: selectedTTSModel ? (PROVIDER_COLORS[selectedTTSModel.provider] || theme.primary) : theme.border }]}
              onPress={() => openModelPicker('tts')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.modelSelectorIcon, { backgroundColor: (selectedTTSModel ? PROVIDER_COLORS[selectedTTSModel.provider] : theme.primary) + '20' }]}>
                  <FontAwesome6 name="volume-high" size={16} color={selectedTTSModel ? PROVIDER_COLORS[selectedTTSModel.provider] || theme.primary : theme.textMuted} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {selectedTTSModel?.name || '选择合成模型'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {selectedTTSModel?.providerName || '点击选择'}
                  </ThemedText>
                </View>
              </View>
              <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 文本输入 */}
            <View style={styles.inputSection}>
              <ThemedText variant="label" color={theme.textMuted}>输入文字</ThemedText>
              <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.backgroundTertiary }]}>
                <TextInput
                  style={styles.textInput}
                  value={ttsText}
                  onChangeText={setTtsText}
                  placeholder="输入要转换为语音的文字..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={4000}
                />
                <ThemedText variant="caption" color={theme.textMuted} style={styles.charCount}>
                  {ttsText.length}/4000
                </ThemedText>
              </View>
            </View>

            {/* 语音选择 */}
            <View style={styles.voiceSection}>
              <ThemedText variant="label" color={theme.textMuted}>选择语音</ThemedText>
              <View style={styles.voiceGrid}>
                {TTS_VOICES.map((voice) => (
                  <TouchableOpacity
                    key={voice.id}
                    style={[
                      styles.voiceOption,
                      selectedVoice === voice.id && styles.voiceOptionActive,
                    ]}
                    onPress={() => setSelectedVoice(voice.id)}
                  >
                    <ThemedText 
                      variant="small" 
                      color={selectedVoice === voice.id ? theme.primary : theme.textPrimary}
                    >
                      {voice.name}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>{voice.desc}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 生成按钮 */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={synthesizeSpeech}
              disabled={!ttsText.trim() || isSynthesizing || !selectedTTSModel}
            >
              <LinearGradient
                colors={ttsText.trim() && selectedTTSModel ? [theme.primary, theme.accent] : ['#374151', '#4B5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                {isSynthesizing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome6 name="volume-high" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <ThemedText variant="label" color="#fff">生成语音</ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* 播放器 */}
            {audioUri && (
              <View style={styles.playerSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText variant="label" color={theme.textMuted}>播放结果</ThemedText>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={saveAudioToGallery}
                    >
                      <FontAwesome6 name="download" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <ThemedText variant="captionMedium" color={theme.primary}>保存</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={saveAudioToWorks}
                    >
                      <FontAwesome6 name="bookmark" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <ThemedText variant="captionMedium" color={theme.primary}>保存到作品库</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.playerCard, { borderColor: theme.primary }]}>
                  <View style={styles.playerControls}>
                    <TouchableOpacity onPress={togglePlayback}>
                      <LinearGradient
                        colors={[theme.primary, theme.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.playButton}
                      >
                        <FontAwesome6 
                          name={isPlaying ? 'pause' : 'play'} 
                          size={24} 
                          color="#fff" 
                          style={{ marginLeft: isPlaying ? 0 : 4 }}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[theme.primary, theme.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill, 
                        { width: `${playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0}%` }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.timeRow}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {formatMillis(playbackPosition)}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {formatMillis(playbackDuration)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
