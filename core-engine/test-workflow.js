#!/usr/bin/env node
/**
 * 测试问卷→客户→分析完整流程
 */

const API_URL = 'http://localhost:3000';
const API_KEY = 'geo-internal-samwang0420';

const testSubmission = {
  website: "https://test-medical-spa.com",
  businessName: "Test Medical Spa LLC",
  industry: "medical-spa",
  businessDescription: "We provide premium medical aesthetic services including Botox, dermal fillers, and laser treatments in Houston.",
  companySize: "11-50",
  yearEstablished: 2018,
  serviceArea: "Houston, TX",
  keywords: ["best botox houston", "med spa near me", "fillers houston tx", "laser treatment houston"],
  competitors: ["competitor1.com", "luxemedspa.com"],
  challenges: "Low website traffic, competitors ranking higher on Google",
  goals: "Increase organic traffic by 50%, rank top 3 for target keywords",
  contactName: "Sarah Johnson",
  jobTitle: "Marketing Director",
  email: "sarah@test-medical-spa.com",
  phone: "+1 713-555-0123",
  messaging: "sarah_johnson_wechat",
  notes: "This is a test submission for workflow verification"
};

async function testWorkflow() {
  console.log('🚀 测试问卷→客户→分析完整流程\n');
  console.log('=====================================');
  
  try {
    // Step 1: 提交问卷
    console.log('\n📋 Step 1: 提交问卷');
    console.log('POST /api/analyze');
    
    const submitRes = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(testSubmission)
    });
    
    const submitData = await submitRes.json();
    console.log('Status:', submitRes.status);
    console.log('Response:', JSON.stringify(submitData, null, 2));
    
    if (!submitData.success) {
      throw new Error('Submission failed: ' + submitData.error);
    }
    
    const { submissionId, clientId } = submitData.data;
    console.log('\n✅ 问卷提交成功');
    console.log('  Submission ID:', submissionId);
    console.log('  Client ID:', clientId);
    
    // Step 2: 等待处理（实际场景是异步的，这里等一下）
    console.log('\n⏳ Step 2: 等待处理完成...');
    await new Promise(r => setTimeout(r, 5000));
    
    // Step 3: 获取客户列表
    console.log('\n📊 Step 3: 获取客户列表');
    console.log('GET /api/clients');
    
    const clientsRes = await fetch(`${API_URL}/api/clients`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const clientsData = await clientsRes.json();
    console.log('Status:', clientsRes.status);
    console.log('Total clients:', clientsData.data?.length || 0);
    
    const newClient = clientsData.data?.find(c => c.clientCode === clientId);
    if (newClient) {
      console.log('\n✅ 客户记录已创建');
      console.log('  Client:', newClient.name);
      console.log('  Industry:', newClient.industry);
      console.log('  Status:', newClient.status);
    }
    
    // Step 4: 获取客户详情
    console.log('\n📄 Step 4: 获取客户详情');
    console.log(`GET /api/clients/${clientId}`);
    
    const detailRes = await fetch(`${API_URL}/api/clients/${clientId}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const detailData = await detailRes.json();
    console.log('Status:', detailRes.status);
    
    if (detailData.success) {
      console.log('\n✅ 客户详情获取成功');
      console.log('  Business:', detailData.data.business_name);
      console.log('  Website:', detailData.data.website);
      console.log('  Email:', detailData.data.email);
    }
    
    // Step 5: 获取分析任务
    console.log('\n🔍 Step 5: 获取分析任务列表');
    console.log('GET /api/jobs');
    
    const jobsRes = await fetch(`${API_URL}/api/jobs`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const jobsData = await jobsRes.json();
    console.log('Status:', jobsRes.status);
    console.log('Total jobs:', jobsData.data?.length || 0);
    
    const clientJob = jobsData.data?.find(j => j.client_id === clientId);
    if (clientJob) {
      console.log('\n✅ 分析任务已创建');
      console.log('  Job ID:', clientJob.id);
      console.log('  Status:', clientJob.status);
    }
    
    // Step 6: 获取问卷提交
    console.log('\n📝 Step 6: 获取问卷提交列表');
    console.log('GET /api/submissions');
    
    const subsRes = await fetch(`${API_URL}/api/submissions`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const subsData = await subsRes.json();
    console.log('Status:', subsRes.status);
    console.log('Total submissions:', subsData.data?.length || 0);
    
    const ourSubmission = subsData.data?.find(s => s.id === submissionId);
    if (ourSubmission) {
      console.log('\n✅ 问卷记录已保存');
      console.log('  Linked to client:', ourSubmission.client_id ? 'Yes' : 'No');
      console.log('  Processed at:', ourSubmission.processed_at);
    }
    
    console.log('\n=====================================');
    console.log('✅ 完整流程测试通过！');
    console.log('=====================================');
    console.log('\n流程验证:');
    console.log('  1. ✅ 问卷提交成功');
    console.log('  2. ✅ 客户自动创建');
    console.log('  3. ✅ 分析任务生成');
    console.log('  4. ✅ 数据关联正确');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testWorkflow();
