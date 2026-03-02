-- 检查表结构并修复
-- 查看 questionnaire_submissions 表的列和约束

-- 1. 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'questionnaire_submissions';

-- 2. 检查列信息
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'questionnaire_submissions'
ORDER BY ordinal_position;

-- 3. 检查外键约束
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'questionnaire_submissions';

-- 4. 如果有 processed_by 外键问题，删除它
-- ALTER TABLE public.questionnaire_submissions 
-- DROP CONSTRAINT IF EXISTS questionnaire_submissions_processed_by_fkey;

-- 5. 检查是否所有必需的字段都有默认值或可为空
-- 如果有问题，可以修改表结构
