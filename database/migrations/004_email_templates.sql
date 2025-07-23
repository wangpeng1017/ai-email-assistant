-- 邮件模板管理表
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 模板信息
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_default BOOLEAN DEFAULT FALSE,
  
  -- 使用统计
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT valid_name CHECK (length(name) > 0),
  CONSTRAINT valid_subject CHECK (length(subject) > 0),
  CONSTRAINT valid_content CHECK (length(content) > 0),
  CONSTRAINT valid_category CHECK (category IN ('general', 'introduction', 'follow_up', 'proposal', 'thank_you'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_default ON email_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at DESC);

-- 创建更新时间触发器
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "用户只能查看自己的邮件模板" ON email_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的邮件模板" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的邮件模板" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的邮件模板" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- 创建确保每个用户只有一个默认模板的触发器
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果设置为默认模板，取消同一用户的其他默认模板
    IF NEW.is_default = TRUE THEN
        UPDATE email_templates 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_template_trigger
    BEFORE INSERT OR UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_template();

-- 插入一些默认模板
INSERT INTO email_templates (user_id, name, subject, content, category, is_default) 
SELECT 
    auth.uid(),
    '通用介绍模板',
    '关于 {company_name} 的合作机会',
    '尊敬的 {customer_name}，

您好！我是来自 {company_name} 的代表。

我们注意到您的公司 {customer_website} 在行业中的出色表现，希望能够探讨潜在的合作机会。

我们的产品/服务能够为您的业务带来以下价值：
- 提升运营效率
- 降低成本
- 增强竞争优势

如果您有兴趣了解更多详情，我很乐意安排一次简短的通话或会议。

期待您的回复！

此致
敬礼

{sender_name}
{company_name}',
    'introduction',
    TRUE
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- 添加注释
COMMENT ON TABLE email_templates IS '邮件模板管理表，存储用户创建的邮件模板';
COMMENT ON COLUMN email_templates.name IS '模板名称';
COMMENT ON COLUMN email_templates.subject IS '邮件主题模板';
COMMENT ON COLUMN email_templates.content IS '邮件内容模板';
COMMENT ON COLUMN email_templates.category IS '模板分类';
COMMENT ON COLUMN email_templates.is_default IS '是否为默认模板';
COMMENT ON COLUMN email_templates.usage_count IS '使用次数统计';
COMMENT ON COLUMN email_templates.last_used_at IS '最后使用时间';
