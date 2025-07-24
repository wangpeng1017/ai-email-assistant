-- 数据抓取任务表
CREATE TABLE IF NOT EXISTS data_extraction_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extraction_type VARCHAR(20) NOT NULL CHECK (extraction_type IN ('api', 'database', 'file')),
    data_source TEXT NOT NULL,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 数据抓取配置模板表
CREATE TABLE IF NOT EXISTS data_extraction_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    extraction_type VARCHAR(20) NOT NULL CHECK (extraction_type IN ('api', 'database', 'file')),
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 线索发现任务表
CREATE TABLE IF NOT EXISTS lead_discovery_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_criteria JSONB NOT NULL,
    total_discovered INTEGER DEFAULT 0,
    processed_leads INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 线索评分表
CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) DEFAULT 0,
    industry_match_score DECIMAL(5,2) DEFAULT 0,
    location_score DECIMAL(5,2) DEFAULT 0,
    company_size_score DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    ai_confidence DECIMAL(5,2) DEFAULT 0,
    scoring_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, user_id)
);

-- 相似公司推荐表
CREATE TABLE IF NOT EXISTS similar_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    similar_lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) DEFAULT 0,
    similarity_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_lead_id, similar_lead_id, user_id)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_data_extraction_jobs_user_id ON data_extraction_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_extraction_jobs_status ON data_extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_extraction_jobs_created_at ON data_extraction_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_data_extraction_templates_user_id ON data_extraction_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_data_extraction_templates_type ON data_extraction_templates(extraction_type);

CREATE INDEX IF NOT EXISTS idx_lead_discovery_jobs_user_id ON lead_discovery_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_discovery_jobs_status ON lead_discovery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_lead_discovery_jobs_created_at ON lead_discovery_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_overall_score ON lead_scores(overall_score);

CREATE INDEX IF NOT EXISTS idx_similar_companies_source_lead ON similar_companies(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_similar_companies_user_id ON similar_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_similar_companies_similarity_score ON similar_companies(similarity_score);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_extraction_jobs_updated_at 
    BEFORE UPDATE ON data_extraction_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_extraction_templates_updated_at 
    BEFORE UPDATE ON data_extraction_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_discovery_jobs_updated_at 
    BEFORE UPDATE ON lead_discovery_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_scores_updated_at 
    BEFORE UPDATE ON lead_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为leads表添加extraction_job_id字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'extraction_job_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN extraction_job_id UUID REFERENCES data_extraction_jobs(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_leads_extraction_job_id ON leads(extraction_job_id);
    END IF;
END $$;

-- 为leads表添加discovery_job_id字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'discovery_job_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN discovery_job_id UUID REFERENCES lead_discovery_jobs(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_leads_discovery_job_id ON leads(discovery_job_id);
    END IF;
END $$;
