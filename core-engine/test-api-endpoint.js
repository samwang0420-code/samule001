#!/usr/bin/env node
/**
 * Test API Endpoint - 测试问卷提交接口
 */

const testData = {
    website: "https://test-company.com",
    businessName: "Test Medical Spa",
    industry: "medical-spa",
    businessDescription: "We provide premium medical aesthetic services including Botox, fillers, and laser treatments.",
    companySize: "11-50",
    yearEstablished: "2018",
    serviceArea: "Houston, TX",
    keywords: ["best botox houston", "med spa near me", "fillers houston tx"],
    competitors: ["competitor1.com", "competitor2.com"],
    challenges: "Low website traffic and competitors ranking higher",
    goals: "Improve keyword rankings and increase inquiries by 30%",
    contactName: "John Doe",
    jobTitle: "Marketing Director",
    email: "john@test-company.com",
    phone: "+1 555-123-4567",
    messaging: "johndoe_wechat",
    notes: "This is a test submission"
};

async function testAPI() {
    console.log('Testing API Endpoint...\n');
    console.log('URL: http://localhost:3000/api/analyze');
    console.log('Data:', JSON.stringify(testData, null, 2));
    console.log('\n--- Sending Request ---\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'geo-internal-samwang0420'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
            console.log('\n✅ API TEST PASSED - Interface is working!');
            process.exit(0);
        } else {
            console.log('\n❌ API TEST FAILED');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ API TEST FAILED:', error.message);
        process.exit(1);
    }
}

testAPI();
