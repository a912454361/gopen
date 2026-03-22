-- 更新 ai_models 表结构，添加平台加价比例字段
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS platform_markup DECIMAL(3,2) DEFAULT 0.20;

-- 更新现有模型数据，使用新的价格体系
-- 清空旧数据
TRUNCATE TABLE ai_models CASCADE;

-- 重新插入模型数据（价格单位：厘/百万tokens）
INSERT INTO ai_models (code, name, provider, category, cost_input_price, cost_output_price, sell_input_price, sell_output_price, platform_markup, max_context_tokens, max_output_tokens, description, status, sort_order) VALUES

-- ============ OpenAI ============
('gpt-4o', 'GPT-4o', 'openai', 'multimodal', 250, 1000, 300, 1200, 0.20, 128000, 16384, 'OpenAI 最新多模态模型，支持文本、图像、音频', 'active', 1),
('gpt-4o-mini', 'GPT-4o Mini', 'openai', 'multimodal', 15, 60, 18, 72, 0.20, 128000, 16384, 'GPT-4o 轻量版，性价比高', 'active', 2),
('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 'text', 100, 300, 120, 360, 0.20, 128000, 4096, 'GPT-4 高性能版本', 'active', 3),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 'text', 5, 15, 6, 18, 0.20, 16384, 4096, '经典高性价比模型', 'active', 4),
('dall-e-3', 'DALL-E 3', 'openai', 'image', 4000, 0, 5000, 0, 0.25, 0, 0, 'OpenAI 图像生成模型', 'active', 5),
('whisper-1', 'Whisper', 'openai', 'audio', 60, 0, 72, 0, 0.20, 0, 0, '语音转文字', 'active', 6),
('tts-1', 'TTS-1', 'openai', 'audio', 150, 0, 180, 0, 0.20, 0, 0, '文字转语音', 'active', 7),

-- ============ Anthropic ============
('claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 'anthropic', 'multimodal', 300, 1500, 360, 1800, 0.20, 200000, 8192, 'Anthropic 最新旗舰模型', 'active', 10),
('claude-3-opus-20240229', 'Claude 3 Opus', 'anthropic', 'multimodal', 1500, 7500, 1800, 9000, 0.20, 200000, 4096, 'Anthropic 最强模型', 'active', 11),
('claude-3-haiku-20240307', 'Claude 3 Haiku', 'anthropic', 'text', 25, 125, 30, 150, 0.20, 200000, 4096, 'Claude 轻量快速版', 'active', 12),

-- ============ Google ============
('gemini-2.0-flash', 'Gemini 2.0 Flash', 'google', 'multimodal', 0, 0, 50, 50, 0.50, 1000000, 8192, 'Google 最新多模态模型', 'active', 20),
('gemini-1.5-pro', 'Gemini 1.5 Pro', 'google', 'multimodal', 175, 700, 210, 840, 0.20, 2000000, 8192, 'Google 专业版模型', 'active', 21),
('gemini-1.5-flash', 'Gemini 1.5 Flash', 'google', 'multimodal', 35, 105, 42, 126, 0.20, 1000000, 8192, 'Google 快速版模型', 'active', 22),

-- ============ DeepSeek ============
('deepseek-chat', 'DeepSeek Chat', 'deepseek', 'text', 10, 20, 12, 24, 0.20, 64000, 4096, 'DeepSeek 对话模型', 'active', 30),
('deepseek-reasoner', 'DeepSeek R1', 'deepseek', 'text', 55, 220, 66, 264, 0.20, 64000, 8192, 'DeepSeek 推理模型', 'active', 31),

-- ============ Groq (极速推理) ============
('llama-3.3-70b-versatile', 'Llama 3.3 70B', 'groq', 'text', 60, 60, 72, 72, 0.20, 128000, 8192, 'Groq 极速推理 Llama 模型', 'active', 40),
('llama-3.2-90b-vision-preview', 'Llama 3.2 90B Vision', 'groq', 'multimodal', 90, 90, 108, 108, 0.20, 128000, 8192, 'Groq 多模态 Llama 模型', 'active', 41),
('whisper-large-v3', 'Whisper Large V3 (Groq)', 'groq', 'audio', 20, 0, 24, 0, 0.20, 0, 0, 'Groq 极速语音识别', 'active', 42),

-- ============ Mistral ============
('mistral-large-latest', 'Mistral Large', 'mistral', 'text', 200, 600, 240, 720, 0.20, 128000, 8192, 'Mistral 旗舰模型', 'active', 50),
('mistral-small-latest', 'Mistral Small', 'mistral', 'text', 20, 60, 24, 72, 0.20, 128000, 8192, 'Mistral 轻量模型', 'active', 51),
('pixtral-12b-2409', 'Pixtral 12B', 'mistral', 'multimodal', 15, 15, 18, 18, 0.20, 128000, 8192, 'Mistral 多模态模型', 'active', 52),

-- ============ Cohere ============
('command-r-plus', 'Command R+', 'cohere', 'text', 30, 150, 36, 180, 0.20, 128000, 4096, 'Cohere 检索增强模型', 'active', 60),
('embed-english-v3.0', 'Cohere Embed', 'cohere', 'embedding', 10, 0, 11, 0, 0.10, 512, 0, 'Cohere 文本嵌入模型', 'active', 61),

-- ============ Stability AI ============
('stable-diffusion-3', 'Stable Diffusion 3', 'stability', 'image', 350, 0, 438, 0, 0.25, 0, 0, 'Stability AI 图像生成', 'active', 70),

-- ============ 豆包 ============
('doubao-pro-128k', '豆包 Pro 128K', 'doubao', 'text', 50, 50, 58, 58, 0.15, 128000, 4096, '字节豆包专业版', 'active', 80),
('doubao-lite-4k', '豆包 Lite', 'doubao', 'text', 3, 3, 4, 4, 0.15, 4096, 2048, '字节豆包轻量版', 'active', 81),
('doubao-vision-pro-32k', '豆包 Vision', 'doubao', 'multimodal', 80, 80, 92, 92, 0.15, 32000, 4096, '豆包多模态模型', 'active', 82),

-- ============ 通义千问 ============
('qwen-max', '通义千问 Max', 'qwen', 'multimodal', 200, 600, 230, 690, 0.15, 32768, 8192, '阿里通义千问旗舰版', 'active', 90),
('qwen-plus', '通义千问 Plus', 'qwen', 'text', 40, 120, 46, 138, 0.15, 128000, 6144, '阿里通义千问增强版', 'active', 91),
('qwen-turbo', '通义千问 Turbo', 'qwen', 'text', 30, 60, 35, 69, 0.15, 128000, 6144, '阿里通义千问快速版', 'active', 92),
('qwen-vl-max', '通义千问 VL Max', 'qwen', 'multimodal', 200, 600, 230, 690, 0.15, 32768, 8192, '通义千问视觉模型', 'active', 93),
('wanx-v1', '通义万相', 'qwen', 'image', 80, 0, 100, 0, 0.25, 0, 0, '阿里图像生成模型', 'active', 94),

-- ============ 文心一言 ============
('ernie-4.0-8k', '文心一言 4.0', 'wenxin', 'text', 120, 120, 138, 138, 0.15, 8192, 4096, '百度文心一言旗舰版', 'active', 100),
('ernie-3.5-4k', '文心一言 3.5', 'wenxin', 'text', 40, 80, 46, 92, 0.15, 4096, 2048, '百度文心一言标准版', 'active', 101),
('ernie-speed-8k', '文心一言 Speed', 'wenxin', 'text', 4, 4, 5, 5, 0.15, 8192, 4096, '百度文心一言快速版', 'active', 102),

-- ============ 智谱AI ============
('glm-4-plus', 'GLM-4 Plus', 'zhipu', 'text', 500, 500, 575, 575, 0.15, 128000, 4096, '智谱GLM-4增强版', 'active', 110),
('glm-4-flash', 'GLM-4 Flash', 'zhipu', 'text', 10, 10, 12, 12, 0.15, 128000, 4096, '智谱GLM-4快速版', 'active', 111),
('glm-4v', 'GLM-4V', 'zhipu', 'multimodal', 100, 100, 115, 115, 0.15, 8192, 4096, '智谱多模态模型', 'active', 112),
('cogview-3', 'CogView 3', 'zhipu', 'image', 80, 0, 100, 0, 0.25, 0, 0, '智谱图像生成模型', 'active', 113),

-- ============ Moonshot (Kimi) ============
('moonshot-v1-8k', 'Kimi', 'moonshot', 'text', 120, 120, 138, 138, 0.15, 8192, 4096, '月之暗面 Kimi 对话模型', 'active', 120),
('moonshot-v1-32k', 'Kimi 32K', 'moonshot', 'text', 240, 240, 276, 276, 0.15, 32768, 4096, 'Kimi 长文本版', 'active', 121),
('moonshot-v1-128k', 'Kimi 128K', 'moonshot', 'text', 600, 600, 690, 690, 0.15, 128000, 4096, 'Kimi 超长文本版', 'active', 122),

-- ============ MiniMax ============
('abab6.5-chat', '海螺 AI', 'minimax', 'text', 300, 300, 345, 345, 0.15, 245000, 8192, 'MiniMax 海螺AI', 'active', 130),
('abab5.5-chat', '海螺 AI Lite', 'minimax', 'text', 150, 150, 173, 173, 0.15, 16384, 4096, 'MiniMax 海螺AI轻量版', 'active', 131),
('video-01', '海螺视频', 'minimax', 'video', 5000, 0, 6500, 0, 0.30, 0, 0, 'MiniMax 视频生成', 'active', 132),

-- ============ 讯飞星火 ============
('generalv3.5', '星火 3.5', 'spark', 'text', 30, 30, 35, 35, 0.15, 8192, 4096, '讯飞星火3.5', 'active', 140),
('generalv4', '星火 4.0', 'spark', 'text', 100, 100, 115, 115, 0.15, 8192, 4096, '讯飞星火4.0旗舰版', 'active', 141),
('general-lite', '星火 Lite', 'spark', 'text', 2, 2, 3, 3, 0.15, 4096, 2048, '讯飞星火轻量版', 'active', 142),

-- ============ 腾讯混元 ============
('hunyuan-lite', '混元 Lite', 'hunyuan', 'text', 3, 3, 4, 4, 0.15, 256000, 6144, '腾讯混元轻量版', 'active', 150),
('hunyuan-pro', '混元 Pro', 'hunyuan', 'text', 40, 40, 46, 46, 0.15, 32000, 4096, '腾讯混元专业版', 'active', 151),
('hunyuan-vision', '混元 Vision', 'hunyuan', 'multimodal', 80, 80, 92, 92, 0.15, 8192, 4096, '腾讯混元视觉模型', 'active', 152),

-- ============ 零一万物 ============
('yi-large', 'Yi Large', 'yi', 'text', 200, 200, 230, 230, 0.15, 32768, 4096, '零一万物大模型', 'active', 160),
('yi-medium', 'Yi Medium', 'yi', 'text', 25, 25, 29, 29, 0.15, 16384, 4096, '零一万物中型模型', 'active', 161),
('yi-vision', 'Yi Vision', 'yi', 'multimodal', 60, 60, 69, 69, 0.15, 16384, 4096, '零一万物视觉模型', 'active', 162),

-- ============ 百川 ============
('Baichuan4', '百川 4', 'baichuan', 'text', 100, 100, 115, 115, 0.15, 128000, 4096, '百川智能旗舰模型', 'active', 170),
('Baichuan3-Turbo', '百川 3 Turbo', 'baichuan', 'text', 12, 12, 14, 14, 0.15, 32000, 4096, '百川智能快速版', 'active', 171);

-- 更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
