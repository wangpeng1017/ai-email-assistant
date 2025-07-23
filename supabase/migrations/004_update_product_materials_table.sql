-- 更新product_materials表结构以支持新的上传功能
-- 添加缺失的字段：file_size, description, updated_at

-- 添加缺失的列
ALTER TABLE product_materials 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_product_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_product_materials_updated_at ON product_materials;
CREATE TRIGGER update_product_materials_updated_at
    BEFORE UPDATE ON product_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_product_materials_updated_at();

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS product_materials_file_type_idx ON product_materials (file_type);
CREATE INDEX IF NOT EXISTS product_materials_created_at_idx ON product_materials (created_at);

-- 添加注释
COMMENT ON TABLE product_materials IS '产品资料管理表';
COMMENT ON COLUMN product_materials.file_name IS '原始文件名';
COMMENT ON COLUMN product_materials.storage_path IS 'Supabase Storage中的文件路径';
COMMENT ON COLUMN product_materials.file_type IS '文件MIME类型';
COMMENT ON COLUMN product_materials.file_size IS '文件大小（字节）';
COMMENT ON COLUMN product_materials.description IS '文件描述';
