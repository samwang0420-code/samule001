-- 修复RLS策略 - 允许service_role绕过
-- 在Supabase SQL Editor中执行

-- 禁用questionnaire_submissions表的RLS（简单方案）
ALTER TABLE public.questionnaire_submissions DISABLE ROW LEVEL SECURITY;

-- 或者：创建允许service_role的策略（推荐方案）
-- 先删除旧策略
DROP POLICY IF EXISTS "Enable all for service role" ON public.questionnaire_submissions;

-- 创建新策略允许service_role
CREATE POLICY "Enable all for service role" 
ON public.questionnaire_submissions
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 同样修复其他表
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 或者为所有表创建service_role策略
DROP POLICY IF EXISTS "Enable all for service role" ON public.clients;
CREATE POLICY "Enable all for service role" ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for service role" ON public.analysis_jobs;
CREATE POLICY "Enable all for service role" ON public.analysis_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for service role" ON public.users;
CREATE POLICY "Enable all for service role" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
