-- AI 模型配置表
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL, -- 模型代码，如 gpt-4o
  name VARCHAR(200) NOT NULL, -- 显示名称
  provider VARCHAR(50) NOT NULL, -- 提供商：doubao/openai/anthropic
  category VARCHAR(50) NOT NULL DEFAULT 'chat', -- 类型：chat/image/audio/embedding
  
  -- 定价配置（单位：分/百万token）
  cost_input_price INTEGER DEFAULT 0, -- 输入成本价
  cost_output_price INTEGER DEFAULT 0, -- 输出成本价
  sell_input_price INTEGER DEFAULT 0, -- 输入售价
  sell_output_price INTEGER DEFAULT 0, -- 输出售价
  
  -- 权限配置
  is_free BOOLEAN DEFAULT false, -- 是否免费
  member_only BOOLEAN DEFAULT false, -- 仅会员可用
  super_member_only BOOLEAN DEFAULT false, -- 仅超级会员可用
  
  -- 模型参数
  max_context_tokens INTEGER DEFAULT 4096,
  max_output_tokens INTEGER DEFAULT 4096,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active', -- active/disabled
  is_public BOOLEAN DEFAULT true, -- 是否公开
  sort_order INTEGER DEFAULT 0,
  
  -- 元数据
  description TEXT,
  icon_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消费记录表
CREATE TABLE IF NOT EXISTS consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  
  -- 消费类型
  consumption_type VARCHAR(50) NOT NULL, -- model/image/audio/gpu
  
  -- 资源信息
  resource_id UUID, -- 关联 ai_models.id 或其他资源
  resource_name VARCHAR(200), -- 资源名称
  
  -- Token 使用量
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  
  -- 费用（单位：分）
  cost_input_fee INTEGER DEFAULT 0, -- 输入成本
  cost_output_fee INTEGER DEFAULT 0, -- 输出成本
  cost_total INTEGER DEFAULT 0, -- 总成本
  
  sell_input_fee INTEGER DEFAULT 0, -- 输入售价
  sell_output_fee INTEGER DEFAULT 0, -- 输出售价
  sell_total INTEGER DEFAULT 0, -- 总售价
  
  -- 利润
  profit INTEGER DEFAULT 0, -- 利润 = sell_total - cost_total
  
  -- 项目关联
  project_id UUID,
  
  -- 元数据
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户余额表
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) UNIQUE NOT NULL,
  
  balance INTEGER DEFAULT 0, -- 余额（分）
  total_recharged INTEGER DEFAULT 0, -- 累计充值
  total_consumed INTEGER DEFAULT 0, -- 累计消费
  monthly_consumed INTEGER DEFAULT 0, -- 本月消费
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_created_at ON consumption_records(created_at);
CREATE INDEX IF NOT EXISTS idx_consumption_records_consumption_type ON consumption_records(consumption_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_code ON ai_models(code);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- 插入默认模型配置
INSERT INTO ai_models (code, name, provider, category, cost_input_price, cost_output_price, sell_input_price, sell_output_price, is_free, member_only, super_member_only, max_context_tokens, max_output_tokens, description, sort_order) VALUES
-- 豆包模型
('doubao-pro-32k', '豆包 Pro 32K', 'doubao', 'chat', 500, 1000, 800, 1500, false, false, false, 32768, 4096, '豆包专业版，32K上下文', 1),
('doubao-lite-4k', '豆包 Lite 4K', 'doubao', 'chat', 50, 100, 100, 150, true, false, false, 4096, 4096, '豆包轻量版，免费使用', 2),
('doubao-pro-128k', '豆包 Pro 128K', 'doubao', 'chat', 500, 1000, 1000, 2000, false, true, false, 131072, 4096, '豆包专业版，128K超长上下文', 3),

-- OpenAI 模型
('gpt-4o', 'GPT-4o', 'openai', 'chat', 2500, 10000, 4000, 15000, false, false, false, 128000, 4096, 'OpenAI最新多模态模型', 10),
('gpt-4o-mini', 'GPT-4o Mini', 'openai', 'chat', 150, 600, 250, 1000, false, false, false, 128000, 4096, 'OpenAI轻量级模型', 11),
('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 'chat', 1000, 3000, 1500, 5000, false, true, false, 128000, 4096, 'GPT-4 Turbo', 12),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 'chat', 50, 150, 100, 250, false, false, false, 16385, 4096, 'GPT-3.5 Turbo', 13),

-- 图像模型
('dall-e-3', 'DALL·E 3', 'openai', 'image', 4000, 0, 5000, 0, false, true, false, 0, 0, 'OpenAI最新图像生成模型', 20),
('dall-e-2', 'DALL·E 2', 'openai', 'image', 2000, 0, 2500, 0, false, false, false, 0, 0, 'OpenAI图像生成模型', 21),

-- Anthropic 模型
('claude-3-opus', 'Claude 3 Opus', 'anthropic', 'chat', 1500, 7500, 2500, 12000, false, true, true, 200000, 4096, 'Anthropic最强模型', 30),
('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 'chat', 300, 1500, 500, 2500, false, true, false, 200000, 4096, 'Anthropic平衡型模型', 31),
('claude-3-haiku', 'Claude 3 Haiku', 'anthropic', 'chat', 25, 125, 50, 200, false, false, false, 200000, 4096, 'Anthropic快速模型', 32)

ON CONFLICT (code) DO NOTHING;

-- 更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
