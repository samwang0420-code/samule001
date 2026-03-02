#!/usr/bin/env node
/**
 * Test Database Write Operations - 验证数据真正写入数据库
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://cqtqanpuqmvicjjwqnwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdHFhbnB1cW12aWNqandxbnd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTI4MDAwMCwiZXhwIjoyMDI0ODU2MDAwfQ.demo';
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = 'http://localhost:3000';
const API_KEY = 'geo-internal-samwang0420';

// 测试数据
const testSubmission = {
    website: "https://test-medical-spa.com",
    businessName: "Test Medical Spa " + Date.now(),
    industry: "medical-spa",
    businessDescription: "Premium medical aesthetic services in Houston",
    companySize: "11-50",
    yearEstablished: 2018,
    serviceArea: "Houston, TX",
    keywords: ["best botox houston", "med spa near me", "fillers houston tx"],
    competitors: ["competitor1.com", "competitor2.com"],
    challenges: "Low website traffic",
    goals: "Increase inquiries by 30%",
    contactName: "John Test",
    jobTitle: "Marketing Director",
    email: "john.test" + Date.now() + "@example.com",
    phone: "+1 555-123-4567",
    messaging: "johntest_wechat",
    notes: "Test submission from API"
};

async function testAPI() {
    console.log('🧪 Testing Database Write Operations\n');
    console.log('=====================================\n');
    
    let submissionId = null;
    let clientId = null;
    
    // Test 1: Submit questionnaire via API
    console.log('Test 1: POST /api/analyze (Submit Questionnaire)');
    console.log('------------------------------------------------');
    try {
        const res = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(testSubmission)
        });
        
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            submissionId = data.data.submissionId;
            clientId = data.data.clientId;
            console.log('✅ Submission accepted\n');
        } else {
            console.log('❌ Submission failed\n');
            return;
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
        return;
    }
    
    // Wait for async processing
    console.log('⏳ Waiting 5 seconds for async processing...\n');
    await new Promise(r => setTimeout(r, 5000));
    
    // Test 2: Check questionnaire_submissions table
    console.log('Test 2: Verify questionnaire_submissions table');
    console.log('------------------------------------------------');
    try {
        const { data: submissions, error } = await supabase
            .from('questionnaire_submissions')
            .select('*')
            .eq('business_name', testSubmission.businessName);
        
        if (error) {
            console.log('❌ Database error:', error.message);
        } else if (submissions && submissions.length > 0) {
            console.log('✅ Found', submissions.length, 'submission(s) in database');
            console.log('Submission ID:', submissions[0].id);
            console.log('Client ID linked:', submissions[0].client_id);
            console.log('Processed at:', submissions[0].processed_at);
        } else {
            console.log('❌ No submission found in database');
        }
        console.log('');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    
    // Test 3: Check clients table
    console.log('Test 3: Verify clients table');
    console.log('------------------------------');
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .ilike('business_name', '%Test Medical Spa%')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) {
            console.log('❌ Database error:', error.message);
        } else if (clients && clients.length > 0) {
            console.log('✅ Found', clients.length, 'client(s) in database');
            clients.forEach(c => {
                console.log('  - Client ID:', c.id);
                console.log('    Business:', c.business_name);
                console.log('    Website:', c.website);
                console.log('    Industry:', c.industry);
                console.log('    Keywords:', c.target_keywords);
                console.log('    Created:', c.created_at);
            });
        } else {
            console.log('❌ No client found in database');
        }
        console.log('');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    
    // Test 4: Check analysis_jobs table
    console.log('Test 4: Verify analysis_jobs table');
    console.log('-------------------------------------');
    try {
        const { data: jobs, error } = await supabase
            .from('analysis_jobs')
            .select('*, clients(business_name)')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) {
            console.log('❌ Database error:', error.message);
        } else if (jobs && jobs.length > 0) {
            console.log('✅ Found', jobs.length, 'job(s) in database');
            jobs.forEach(j => {
                console.log('  - Job ID:', j.id);
                console.log('    Client:', j.clients?.business_name || 'N/A');
                console.log('    Status:', j.status);
                console.log('    Created:', j.created_at);
            });
        } else {
            console.log('❌ No jobs found in database');
        }
        console.log('');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    
    // Test 5: Get clients via API
    console.log('Test 5: GET /api/clients (via API)');
    console.log('-------------------------------------');
    try {
        const res = await fetch(`${API_URL}/api/clients`, {
            headers: { 'X-API-Key': API_KEY }
        });
        
        const data = await res.json();
        console.log('Status:', res.status);
        
        if (data.success && data.data) {
            console.log('✅ API returned', data.data.length, 'client(s)');
            const testClient = data.data.find(c => 
                c.name && c.name.includes('Test Medical Spa')
            );
            if (testClient) {
                console.log('✅ Test client found in API response');
                console.log('  Client:', JSON.stringify(testClient, null, 2));
            } else {
                console.log('⚠️ Test client not in API response (may use file fallback)');
            }
        } else {
            console.log('❌ API error:', data.error);
        }
        console.log('');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    
    // Test 6: Get submissions via API
    console.log('Test 6: GET /api/submissions (via API)');
    console.log('----------------------------------------');
    try {
        const res = await fetch(`${API_URL}/api/submissions`, {
            headers: { 'X-API-Key': API_KEY }
        });
        
        const data = await res.json();
        console.log('Status:', res.status);
        
        if (data.success && data.data) {
            console.log('✅ API returned', data.data.length, 'submission(s)');
            const testSub = data.data.find(s => 
                s.business_name === testSubmission.businessName
            );
            if (testSub) {
                console.log('✅ Test submission found in API response');
            } else {
                console.log('⚠️ Test submission not in API response');
            }
        } else {
            console.log('❌ API error:', data.error);
        }
        console.log('');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    
    console.log('=====================================');
    console.log('Test Summary:');
    console.log('Submission ID:', submissionId || 'N/A');
    console.log('Client ID:', clientId || 'N/A');
    console.log('\nCheck database to verify all tables have data!');
}

testAPI().catch(console.error);
