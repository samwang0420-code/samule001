-- 修复Policy已存在的错误
-- 如果之前执行过部分SQL，需要先删除已存在的Policy

-- ==========================================
-- 删除已存在的Policies (如果报错再执行)
-- ==========================================

DROP POLICY IF EXISTS questionnaire_admin_all ON public.questionnaire_submissions;
DROP POLICY IF EXISTS jobs_admin_all ON public.analysis_jobs;

-- ==========================================
-- 重新创建Policies
-- ==========================================

-- 管理员可以查看所有问卷提交
CREATE POLICY questionnaire_admin_all ON public.questionnaire_submissions
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- 管理员可以查看所有任务
CREATE POLICY jobs_admin_all ON public.analysis_jobs
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- ==========================================
-- 或者：使用IF NOT EXISTS方式 (更安全的做法)
-- ==========================================

-- 如果不想删除重建，可以直接跳过已存在的Policy创建
-- 上面的DROP + CREATE已经处理了这个问题

-- 验证Policies是否创建成功
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('questionnaire_submissions', 'analysis_jobs');
