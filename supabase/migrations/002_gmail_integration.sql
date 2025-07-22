-- Gmail集成相关字段扩展
-- 为leads表添加Gmail相关字段

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS gmail_draft_id TEXT,
ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- 更新status枚举类型以包含新状态
DO $$ 
BEGIN
    -- 检查是否需要添加新的状态值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'sent' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'lead_status'
        )
    ) THEN
        ALTER TYPE lead_status ADD VALUE 'sent';
    END IF;
END $$;

-- 创建Gmail认证信息表
CREATE TABLE IF NOT EXISTS gmail_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 确保每个用户只有一个Gmail认证记录
    UNIQUE(user_id)
);

-- 启用RLS
ALTER TABLE gmail_auth ENABLE ROW LEVEL SECURITY;

-- Gmail认证表的RLS策略
CREATE POLICY "Users can only access their own Gmail auth" ON gmail_auth
    FOR ALL USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为gmail_auth表添加更新时间触发器
DROP TRIGGER IF EXISTS update_gmail_auth_updated_at ON gmail_auth;
CREATE TRIGGER update_gmail_auth_updated_at
    BEFORE UPDATE ON gmail_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为leads表添加Gmail相关索引
CREATE INDEX IF NOT EXISTS idx_leads_gmail_draft_id ON leads(gmail_draft_id) WHERE gmail_draft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_gmail_message_id ON leads(gmail_message_id) WHERE gmail_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_sent_at ON leads(sent_at) WHERE sent_at IS NOT NULL;

-- 添加注释
COMMENT ON TABLE gmail_auth IS 'Gmail OAuth认证信息存储';
COMMENT ON COLUMN gmail_auth.access_token IS 'Gmail API访问令牌';
COMMENT ON COLUMN gmail_auth.refresh_token IS 'Gmail API刷新令牌';
COMMENT ON COLUMN gmail_auth.expires_at IS '访问令牌过期时间';
COMMENT ON COLUMN gmail_auth.scope IS '授权范围';

COMMENT ON COLUMN leads.gmail_draft_id IS 'Gmail草稿ID';
COMMENT ON COLUMN leads.gmail_message_id IS 'Gmail消息ID（发送后）';
COMMENT ON COLUMN leads.sent_at IS '邮件发送时间';

-- 创建视图：带Gmail状态的线索列表
CREATE OR REPLACE VIEW leads_with_gmail_status AS
SELECT 
    l.*,
    CASE 
        WHEN l.gmail_message_id IS NOT NULL THEN 'sent'
        WHEN l.gmail_draft_id IS NOT NULL THEN 'draft_created'
        WHEN l.status = 'completed' THEN 'ready_to_send'
        ELSE l.status::text
    END as gmail_status,
    ga.access_token IS NOT NULL as has_gmail_auth
FROM leads l
LEFT JOIN gmail_auth ga ON l.user_id = ga.user_id;

-- 为视图添加注释
COMMENT ON VIEW leads_with_gmail_status IS '包含Gmail状态的线索视图';

-- 创建函数：清理过期的Gmail认证
CREATE OR REPLACE FUNCTION cleanup_expired_gmail_auth()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM gmail_auth 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION cleanup_expired_gmail_auth() IS '清理过期的Gmail认证记录';

-- 创建函数：获取用户的Gmail认证状态
CREATE OR REPLACE FUNCTION get_gmail_auth_status(user_uuid UUID)
RETURNS TABLE (
    has_auth BOOLEAN,
    is_expired BOOLEAN,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ga.access_token IS NOT NULL as has_auth,
        ga.expires_at < NOW() as is_expired,
        ga.expires_at
    FROM gmail_auth ga
    WHERE ga.user_id = user_uuid;
    
    -- 如果没有记录，返回默认值
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, TRUE, NULL::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION get_gmail_auth_status(UUID) IS '获取用户的Gmail认证状态';

-- 创建附件推荐记录表
CREATE TABLE IF NOT EXISTS attachment_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    email_subject TEXT,
    total_materials INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    recommendation_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE attachment_recommendations ENABLE ROW LEVEL SECURITY;

-- 附件推荐表的RLS策略
CREATE POLICY "Users can only access their own attachment recommendations" ON attachment_recommendations
    FOR ALL USING (auth.uid() = user_id);

-- 创建批处理进度表
CREATE TABLE IF NOT EXISTS batch_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    current_step TEXT,
    current_item TEXT,
    status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE(user_id, batch_id)
);

-- 启用RLS
ALTER TABLE batch_progress ENABLE ROW LEVEL SECURITY;

-- 批处理进度表的RLS策略
CREATE POLICY "Users can only access their own batch progress" ON batch_progress
    FOR ALL USING (auth.uid() = user_id);

-- 为产品资料表添加描述和关键词字段
ALTER TABLE product_materials
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_attachment_recommendations_user_id ON attachment_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_attachment_recommendations_lead_id ON attachment_recommendations(lead_id);
CREATE INDEX IF NOT EXISTS idx_batch_progress_user_batch ON batch_progress(user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_progress_status ON batch_progress(status);
CREATE INDEX IF NOT EXISTS idx_product_materials_keywords ON product_materials USING GIN(keywords);

-- 添加注释
COMMENT ON TABLE attachment_recommendations IS '智能附件推荐记录';
COMMENT ON TABLE batch_progress IS '批处理进度跟踪';
COMMENT ON COLUMN product_materials.description IS '产品资料描述';
COMMENT ON COLUMN product_materials.keywords IS '产品资料关键词数组';
