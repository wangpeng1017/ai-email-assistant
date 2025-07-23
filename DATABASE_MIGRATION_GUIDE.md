# 🗄️ 数据库迁移执行指南

## ⚠️ **紧急修复：customer_leads表缺失错误**

**错误信息**: `获取统计失败 relation 'public.customer_leads' does not exist`

**原因**: 新的UI重构需要`customer_leads`表，但该表尚未在生产数据库中创建。

---

## 🔧 **立即执行步骤**

### **步骤1: 登录Supabase Dashboard**
1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择AI邮件助手项目

### **步骤2: 打开SQL编辑器**
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### **步骤3: 执行迁移SQL**
复制以下完整SQL代码并在SQL编辑器中执行：

```sql
-- 创建customer_leads表以支持新的UI结构
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

-- 创建统计函数
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

-- 创建按来源统计函数
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
```

### **步骤4: 执行SQL**
1. 点击 **"Run"** 按钮执行SQL
2. 确认所有语句都成功执行
3. 检查是否有任何错误信息

### **步骤5: 验证表创建**
执行以下查询验证表是否正确创建：

```sql
-- 检查表是否存在
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'customer_leads';

-- 检查表结构
\d customer_leads;

-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customer_leads';
```

---

## ✅ **验证步骤**

### **1. 检查表创建**
- 表 `customer_leads` 应该出现在Tables列表中
- 应该有6个索引被创建
- 应该有4个RLS策略被创建

### **2. 测试应用**
1. 刷新AI邮件助手应用
2. 登录后应该不再看到数据库错误
3. 客户线索页面应该正常加载

### **3. 功能验证**
- 可以添加新的客户线索
- 统计信息正常显示
- 来源标识正确显示

---

## 🔄 **数据迁移（可选）**

如果您在原有的`leads`表中有重要数据，可以执行以下迁移SQL：

```sql
-- 将现有leads表数据迁移到customer_leads表
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
```

---

## 🆘 **故障排除**

### **常见错误**
1. **权限错误**: 确保您有数据库管理权限
2. **语法错误**: 确保复制了完整的SQL代码
3. **依赖错误**: 确保auth.users表存在

### **联系支持**
如果遇到问题，请提供：
- 错误信息截图
- 执行的SQL语句
- Supabase项目ID

---

**⚠️ 重要提醒**: 执行此迁移后，应用将恢复正常功能。请在执行前备份重要数据。
