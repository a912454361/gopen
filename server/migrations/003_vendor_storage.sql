-- 厂商存储配置表
-- 用于存储厂商自己的存储服务凭证（加密存储）

-- 厂商存储配置表
CREATE TABLE IF NOT EXISTS vendor_storage_configs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- 存储类型
  storage_type VARCHAR(30) NOT NULL, -- aliyun_oss, tencent_cos, aws_s3, minio
  
  -- 存储凭证（加密存储）
  access_key_id_encrypted TEXT NOT NULL,
  access_key_id_iv TEXT NOT NULL,
  access_key_secret_encrypted TEXT NOT NULL,
  access_key_secret_iv TEXT NOT NULL,
  
  -- 存储配置
  region VARCHAR(64) NOT NULL,
  bucket VARCHAR(128) NOT NULL,
  endpoint VARCHAR(256),
  
  -- 高级配置
  custom_domain VARCHAR(256),
  path_prefix VARCHAR(128),
  max_file_size INTEGER DEFAULT 104857600, -- 100MB
  allowed_types JSONB,
  
  -- 状态
  is_default BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  
  -- 统计
  total_files INTEGER DEFAULT 0,
  total_size INTEGER DEFAULT 0,
  
  -- 验证信息
  last_verified TIMESTAMPTZ,
  verify_status VARCHAR(20) DEFAULT 'pending',
  verify_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS vendor_storage_configs_vendor_id_idx ON vendor_storage_configs(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_storage_configs_storage_type_idx ON vendor_storage_configs(storage_type);
CREATE INDEX IF NOT EXISTS vendor_storage_configs_status_idx ON vendor_storage_configs(status);

-- 厂商存储文件记录表
CREATE TABLE IF NOT EXISTS vendor_storage_files (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR(36) NOT NULL,
  config_id VARCHAR(36) NOT NULL,
  
  -- 文件信息
  filename VARCHAR(512) NOT NULL,
  original_name VARCHAR(256),
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(128),
  
  -- 访问信息
  url TEXT,
  signed_url TEXT,
  signed_url_expires TIMESTAMPTZ,
  
  -- 关联信息
  service_id VARCHAR(36),
  model_id VARCHAR(128),
  category VARCHAR(64), -- model, dataset, output, other
  
  -- 元数据
  metadata JSONB,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS vendor_storage_files_vendor_id_idx ON vendor_storage_files(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_storage_files_config_id_idx ON vendor_storage_files(config_id);
CREATE INDEX IF NOT EXISTS vendor_storage_files_filename_idx ON vendor_storage_files(filename);
CREATE INDEX IF NOT EXISTS vendor_storage_files_category_idx ON vendor_storage_files(category);
CREATE INDEX IF NOT EXISTS vendor_storage_files_created_at_idx ON vendor_storage_files(created_at);

-- 外键约束
ALTER TABLE vendor_storage_configs 
  ADD CONSTRAINT fk_vendor_storage_configs_vendor_id 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE vendor_storage_files 
  ADD CONSTRAINT fk_vendor_storage_files_vendor_id 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE vendor_storage_files 
  ADD CONSTRAINT fk_vendor_storage_files_config_id 
  FOREIGN KEY (config_id) REFERENCES vendor_storage_configs(id) ON DELETE CASCADE;

-- 注释
COMMENT ON TABLE vendor_storage_configs IS '厂商存储配置表 - 厂商配置自己的存储服务凭证';
COMMENT ON TABLE vendor_storage_files IS '厂商存储文件记录表 - 记录厂商上传的文件';

COMMENT ON COLUMN vendor_storage_configs.storage_type IS '存储类型: aliyun_oss, tencent_cos, aws_s3, minio';
COMMENT ON COLUMN vendor_storage_configs.access_key_id_encrypted IS '加密的 Access Key ID';
COMMENT ON COLUMN vendor_storage_configs.access_key_secret_encrypted IS '加密的 Access Key Secret';
COMMENT ON COLUMN vendor_storage_configs.custom_domain IS '自定义域名（CDN）';
COMMENT ON COLUMN vendor_storage_configs.path_prefix IS '路径前缀，如 vendor123/';
COMMENT ON COLUMN vendor_storage_configs.allowed_types IS '允许的文件类型，如 ["image/*", "video/*", ".zip"]';

COMMENT ON COLUMN vendor_storage_files.category IS '文件分类: model（模型文件）, dataset（数据集）, output（输出文件）, other（其他）';
