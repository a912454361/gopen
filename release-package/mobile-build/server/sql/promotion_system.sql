-- 推广系统数据库表

-- 1. 推广员表
CREATE TABLE IF NOT EXISTS promoters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promoter_code VARCHAR(20) UNIQUE NOT NULL, -- 推广码，如 GOP_xxxxx
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings BIGINT DEFAULT 0, -- 分为单位
  withdrawn_earnings BIGINT DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0.1000, -- 默认10%分成
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 2. 推广点击记录表
CREATE TABLE IF NOT EXISTS promotion_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  visitor_ip VARCHAR(50),
  visitor_device VARCHAR(100),
  visitor_ua TEXT,
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  click_time TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES users(id),
  
  INDEX idx_promotion_clicks_promoter (promoter_id),
  INDEX idx_promotion_clicks_time (click_time)
);

-- 3. 推广转化记录表
CREATE TABLE IF NOT EXISTS promotion_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  click_id UUID REFERENCES promotion_clicks(id),
  converted_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversion_time TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, cancelled
  total_spent BIGINT DEFAULT 0, -- 该用户总消费
  total_commission BIGINT DEFAULT 0, -- 产生的总佣金
  
  UNIQUE(converted_user_id), -- 一个用户只能被转化一次
  INDEX idx_promotion_conversions_promoter (promoter_id)
);

-- 4. 推广收益记录表
CREATE TABLE IF NOT EXISTS promotion_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES promotion_conversions(id),
  order_id UUID, -- 关联订单
  user_id UUID REFERENCES users(id),
  amount BIGINT NOT NULL, -- 消费金额（分）
  commission_rate DECIMAL(5,4) NOT NULL,
  commission BIGINT NOT NULL, -- 佣金（分）
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, paid, cancelled
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  
  INDEX idx_promotion_earnings_promoter (promoter_id),
  INDEX idx_promotion_earnings_status (status)
);

-- 5. 提现记录表
CREATE TABLE IF NOT EXISTS promotion_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- 提现金额（分）
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
  payment_method VARCHAR(20) NOT NULL, -- alipay, wechat, bank
  payment_account VARCHAR(100) NOT NULL,
  payment_name VARCHAR(50) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by VARCHAR(50),
  remark TEXT,
  
  INDEX idx_promotion_withdrawals_promoter (promoter_id),
  INDEX idx_promotion_withdrawals_status (status)
);

-- 6. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_promoters_user ON promoters(user_id);
CREATE INDEX IF NOT EXISTS idx_promoters_code ON promoters(promoter_code);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);

-- 7. 触发器：更新推广员统计
CREATE OR REPLACE FUNCTION update_promoter_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'promotion_clicks' AND TG_OP = 'INSERT' THEN
    UPDATE promoters SET total_clicks = total_clicks + 1 WHERE id = NEW.promoter_id;
    RETURN NEW;
  END IF;
  
  IF TG_TABLE_NAME = 'promotion_conversions' AND TG_OP = 'INSERT' THEN
    UPDATE promoters SET total_conversions = total_conversions + 1 WHERE id = NEW.promoter_id;
    RETURN NEW;
  END IF;
  
  IF TG_TABLE_NAME = 'promotion_earnings' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE promoters SET total_earnings = total_earnings + NEW.commission WHERE id = NEW.promoter_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      IF NEW.status = 'cancelled' THEN
        UPDATE promoters SET total_earnings = total_earnings - NEW.commission WHERE id = NEW.promoter_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clicks_update_stats AFTER INSERT ON promotion_clicks
FOR EACH ROW EXECUTE FUNCTION update_promoter_stats();

CREATE TRIGGER trg_conversions_update_stats AFTER INSERT ON promotion_conversions
FOR EACH ROW EXECUTE FUNCTION update_promoter_stats();

CREATE TRIGGER trg_earnings_update_stats AFTER INSERT OR UPDATE ON promotion_earnings
FOR EACH ROW EXECUTE FUNCTION update_promoter_stats();

-- 8. 初始化：为所有现有用户生成推广码（如果他们是推广员）
-- INSERT INTO promoters (user_id, promoter_code)
-- SELECT id, 'GOP_' || SUBSTR(MD5(id::TEXT), 1, 8)
-- FROM users WHERE id NOT IN (SELECT user_id FROM promoters);
