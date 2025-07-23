-- 产品资料管理表
CREATE TABLE IF NOT EXISTS product_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 文件信息
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_type TEXT,
  file_size BIGINT,
  
  -- 内容信息
  description TEXT,
  keywords TEXT[], -- 关键词数组
  
  -- 索引和约束
  CONSTRAINT valid_file_name CHECK (length(file_name) > 0),
  CONSTRAINT valid_storage_path CHECK (length(storage_path) > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_materials_user_id ON product_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_product_materials_created_at ON product_materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_materials_keywords ON product_materials USING GIN(keywords);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_materials_updated_at 
    BEFORE UPDATE ON product_materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE product_materials ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "用户只能查看自己的产品资料" ON product_materials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的产品资料" ON product_materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的产品资料" ON product_materials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的产品资料" ON product_materials
    FOR DELETE USING (auth.uid() = user_id);

-- 创建Storage bucket (如果不存在)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-materials', 'product-materials', false)
ON CONFLICT (id) DO NOTHING;

-- 创建Storage策略
CREATE POLICY "用户只能上传到自己的文件夹" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-materials' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "用户只能查看自己的文件" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'product-materials' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "用户只能删除自己的文件" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-materials' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 添加注释
COMMENT ON TABLE product_materials IS '产品资料管理表，存储用户上传的产品相关文件信息';
COMMENT ON COLUMN product_materials.file_name IS '原始文件名';
COMMENT ON COLUMN product_materials.storage_path IS 'Supabase Storage中的文件路径';
COMMENT ON COLUMN product_materials.file_type IS '文件MIME类型';
COMMENT ON COLUMN product_materials.file_size IS '文件大小（字节）';
COMMENT ON COLUMN product_materials.description IS '文件描述';
COMMENT ON COLUMN product_materials.keywords IS '关键词数组，用于智能匹配';
