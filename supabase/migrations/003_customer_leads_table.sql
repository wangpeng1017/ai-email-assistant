-- 创建customer_leads表以支持新的UI结构
-- 这个表将替代原有的leads表，提供更完整的客户线索管理功能

CREATE TABLE IF NOT EXISTS customer_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 基本客户信息
    customer_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- 线索管理信息
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'excel_import', 'scraped')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    
    -- 附加信息
    notes TEXT,
    industry TEXT,
    company_size TEXT,
    
    -- AI邮件相关
    generated_email_subject TEXT,
    generated_email_body TEXT,
    
    -- Gmail集成
    gmail_draft_id TEXT,
    gmail_message_id TEXT,
    sent_at TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_customer_leads_user_id ON customer_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_leads_source ON customer_leads(source);
CREATE INDEX IF NOT EXISTS idx_customer_leads_status ON customer_leads(status);
CREATE INDEX IF NOT EXISTS idx_customer_leads_created_at ON customer_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_leads_email ON customer_leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_leads_company ON customer_leads(company_name) WHERE company_name IS NOT NULL;

-- 启用RLS
ALTER TABLE customer_leads ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own customer leads" ON customer_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer leads" ON customer_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer leads" ON customer_leads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer leads" ON customer_leads
    FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_customer_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_customer_leads_updated_at ON customer_leads;
CREATE TRIGGER update_customer_leads_updated_at
    BEFORE UPDATE ON customer_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_leads_updated_at();

-- 创建视图：带统计信息的客户线索
CREATE OR REPLACE VIEW customer_leads_with_stats AS
SELECT 
    cl.*,
    CASE 
        WHEN cl.gmail_message_id IS NOT NULL THEN 'sent'
        WHEN cl.gmail_draft_id IS NOT NULL THEN 'draft_created'
        WHEN cl.generated_email_body IS NOT NULL THEN 'email_generated'
        ELSE cl.status
    END as email_status,
    ga.access_token IS NOT NULL as has_gmail_auth
FROM customer_leads cl
LEFT JOIN gmail_auth ga ON cl.user_id = ga.user_id;

-- 创建函数：获取用户的线索统计
CREATE OR REPLACE FUNCTION get_customer_leads_stats(user_uuid UUID)
RETURNS TABLE (
    total_leads BIGINT,
    new_leads BIGINT,
    contacted_leads BIGINT,
    qualified_leads BIGINT,
    converted_leads BIGINT,
    lost_leads BIGINT,
    leads_this_month BIGINT,
    leads_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_leads,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as leads_this_month,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW())) as leads_this_week
    FROM customer_leads
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：按来源统计线索
CREATE OR REPLACE FUNCTION get_leads_by_source(user_uuid UUID)
RETURNS TABLE (
    source TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH source_counts AS (
        SELECT 
            cl.source,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
        FROM customer_leads cl
        WHERE cl.user_id = user_uuid
        GROUP BY cl.source
    )
    SELECT sc.source, sc.count, ROUND(sc.percentage, 2) as percentage
    FROM source_counts sc
    ORDER BY sc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE customer_leads IS '客户线索管理表';
COMMENT ON COLUMN customer_leads.source IS '线索来源: manual(手动添加), excel_import(Excel导入), scraped(网页爬取)';
COMMENT ON COLUMN customer_leads.status IS '线索状态: new(新线索), contacted(已联系), qualified(已验证), converted(已转化), lost(已流失)';
COMMENT ON VIEW customer_leads_with_stats IS '包含统计信息的客户线索视图';
COMMENT ON FUNCTION get_customer_leads_stats(UUID) IS '获取用户的客户线索统计信息';
COMMENT ON FUNCTION get_leads_by_source(UUID) IS '按来源统计客户线索分布';

-- 数据迁移：将现有leads表数据迁移到customer_leads表（如果需要）
-- 注意：这个迁移是可选的，如果原有leads表有重要数据才需要执行
/*
INSERT INTO customer_leads (
    user_id, customer_name, company_name, email, source, status, 
    generated_email_subject, generated_email_body, gmail_draft_id, 
    gmail_message_id, sent_at, created_at
)
SELECT 
    user_id,
    COALESCE(customer_name, 'Unknown') as customer_name,
    customer_website as company_name,
    customer_email as email,
    CASE 
        WHEN source = 'excel' THEN 'excel_import'
        WHEN source = 'manual' THEN 'manual'
        WHEN source = 'scraped' THEN 'scraped'
        ELSE 'manual'
    END as source,
    CASE 
        WHEN status = 'pending' THEN 'new'
        WHEN status = 'processing' THEN 'contacted'
        WHEN status = 'completed' THEN 'qualified'
        WHEN status = 'failed' THEN 'lost'
        ELSE 'new'
    END as status,
    generated_mail_subject,
    generated_mail_body,
    gmail_draft_id,
    gmail_message_id,
    sent_at,
    created_at
FROM leads
WHERE NOT EXISTS (
    SELECT 1 FROM customer_leads cl 
    WHERE cl.user_id = leads.user_id 
    AND cl.email = leads.customer_email
);
*/
