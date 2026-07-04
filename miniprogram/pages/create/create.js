/**
 * 动漫创作页面
 */

const app = getApp();

Page({
  data: {
    // 输入
    prompt: '',
    selectedStyle: 'japanese',
    episodeCount: 2,
    generateImages: false,
    generateVideos: false,
    generateAudio: false,
    showAdvanced: false,
    
    // UI状态
    activeTab: 'concept',
    isGenerating: false,
    loadingText: '',
    
    // 创作结果
    concept: null,
    storyText: '',
    characters: [],
    mediaList: [],
  },

  onLoad() {
    // 初始化
  },

  // 输入主题
  onPromptInput(e) {
    this.setData({ prompt: e.detail.value });
  },

  // 选择风格
  selectStyle(e) {
    const style = e.currentTarget.dataset.style;
    this.setData({ selectedStyle: style });
  },

  // 切换高级选项
  toggleAdvanced() {
    this.setData({ showAdvanced: !this.data.showAdvanced });
  },

  // 剧集数变化
  onEpisodeChange(e) {
    this.setData({ episodeCount: e.detail.value });
  },

  // 选项变化
  onOptionChange(e) {
    const values = e.detail.value;
    this.setData({
      generateImages: values.includes('images'),
      generateVideos: values.includes('videos'),
      generateAudio: values.includes('audio'),
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 快速构思
  async quickConcept() {
    if (!this.data.prompt.trim()) {
      wx.showToast({ title: '请输入故事主题', icon: 'none' });
      return;
    }

    this.setData({ 
      isGenerating: true, 
      loadingText: '正在构思创意...',
      activeTab: 'concept' 
    });

    try {
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/free-anime/concept`,
        method: 'POST',
        data: {
          prompt: this.data.prompt,
          style: this.data.selectedStyle,
        },
      });

      if (res.data && res.data.success) {
        this.setData({ 
          concept: res.data.data,
          isGenerating: false 
        });
        wx.showToast({ title: '构思完成！', icon: 'success' });
      } else {
        throw new Error(res.data?.error || '生成失败');
      }
    } catch (err) {
      console.error('Quick concept error:', err);
      this.setData({ isGenerating: false });
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    }
  },

  // 流式生成故事
  async streamStory() {
    if (!this.data.prompt.trim()) {
      wx.showToast({ title: '请输入故事主题', icon: 'none' });
      return;
    }

    this.setData({ 
      isGenerating: true, 
      loadingText: '正在生成故事...',
      activeTab: 'story',
      storyText: '' 
    });

    try {
      // 微信小程序使用request请求，不支持真正的SSE
      // 这里使用普通请求模拟
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/free-anime/story/stream`,
        method: 'POST',
        data: {
          prompt: this.data.prompt,
          style: this.data.selectedStyle,
        },
        enableChunked: true,
      });

      if (res.data) {
        // 解析SSE数据
        const lines = res.data.split('\n');
        let storyText = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const json = JSON.parse(data);
              if (json.content) {
                storyText += json.content;
                this.setData({ storyText });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        this.setData({ isGenerating: false });
        wx.showToast({ title: '故事生成完成！', icon: 'success' });
      }
    } catch (err) {
      console.error('Stream story error:', err);
      
      // 降级到非流式请求
      try {
        const res = await wx.request({
          url: `${app.globalData.apiBase}/api/v1/chat`,
          method: 'POST',
          data: {
            message: `请创作一个动漫故事，主题：${this.data.prompt}，风格：${this.data.selectedStyle}`,
          },
        });

        if (res.data && res.data.content) {
          this.setData({ 
            storyText: res.data.content,
            isGenerating: false 
          });
          wx.showToast({ title: '故事生成完成！', icon: 'success' });
        }
      } catch (fallbackErr) {
        this.setData({ isGenerating: false });
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    }
  },

  // 完整创作
  async createFull() {
    if (!this.data.prompt.trim()) {
      wx.showToast({ title: '请输入故事主题', icon: 'none' });
      return;
    }

    this.setData({ 
      isGenerating: true, 
      loadingText: '正在进行完整创作，请稍候...',
      activeTab: 'concept'
    });

    wx.showLoading({ title: '创作中...', mask: true });

    try {
      const res = await wx.request({
        url: `${app.globalData.apiBase}/api/v1/free-anime/create`,
        method: 'POST',
        data: {
          prompt: this.data.prompt,
          style: this.data.selectedStyle,
          episodeCount: this.data.episodeCount,
          generateImages: this.data.generateImages,
          generateVideos: this.data.generateVideos,
          generateAudio: this.data.generateAudio,
        },
        timeout: 300000, // 5分钟超时
      });

      wx.hideLoading();

      if (res.data && res.data.success) {
        const result = res.data.data;
        
        // 更新构思
        this.setData({
          concept: {
            title: result.story.title,
            synopsis: result.story.synopsis,
            mainCharacters: Object.keys(result.characters),
            keyScenes: result.story.episodes[0]?.scenes?.slice(0, 3).map(s => s.description) || [],
          },
          storyText: this.formatStory(result.story),
          characters: Object.entries(result.characters).map(([name, char]) => ({
            name,
            ...char,
          })),
          mediaList: this.extractMediaList(result),
          isGenerating: false,
        });

        wx.showToast({ title: '创作完成！', icon: 'success' });
      } else {
        throw new Error(res.data?.error || '创作失败');
      }
    } catch (err) {
      wx.hideLoading();
      console.error('Full creation error:', err);
      this.setData({ isGenerating: false });
      wx.showToast({ title: err.message || '创作失败', icon: 'none' });
    }
  },

  // 格式化故事文本
  formatStory(story) {
    let text = `《${story.title}》\n\n`;
    text += `【故事简介】\n${story.synopsis}\n\n`;
    
    for (const episode of story.episodes) {
      text += `【第${episode.episodeNumber}集：${episode.title}】\n`;
      text += `${episode.summary}\n\n`;
      
      for (const scene of episode.scenes) {
        text += `  场景${scene.sceneNumber}：${scene.location}（${scene.timeOfDay}）\n`;
        text += `  ${scene.description}\n`;
        
        for (const dialogue of scene.dialogue) {
          text += `    ${dialogue.character}：${dialogue.line}\n`;
        }
        text += '\n';
      }
    }

    return text;
  },

  // 提取媒体列表
  extractMediaList(result) {
    const mediaList = [];

    // 提取场景图片
    for (const [key, url] of Object.entries(result.sceneImages)) {
      mediaList.push({
        type: 'image',
        url,
        label: `场景 ${key}`,
      });
    }

    // 提取视频
    for (const [key, url] of Object.entries(result.videos)) {
      mediaList.push({
        type: 'video',
        url,
        label: `视频 ${key}`,
      });
    }

    // 提取音频
    for (const [key, url] of Object.entries(result.audioClips)) {
      mediaList.push({
        type: 'audio',
        url,
        label: `配音 ${key}`,
      });
    }

    return mediaList;
  },

  // 返回主页
  goBack() {
    wx.navigateBack();
  },
});
