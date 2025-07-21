const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Create test results directory
const testResultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

const logTestResult = (testName, result) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${testName}: ${JSON.stringify(result, null, 2)}\n\n`;
  
  // Log to console
  console.log(`\n=== ${testName} ===`);
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  // Log to file
  const logFile = path.join(testResultsDir, `api-test-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logEntry);
};

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  validateStatus: () => true
});

let userToken = '';
let adminToken = '';
let superAdminToken = '';
let createdTicketId = null;

async function runAPITests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    // Test 1: Login as User
    console.log('1. Testing User Login...');
    let response = await api.post('/auth/login', {
      email: 'user@test.com',
      password: 'password123'
    });
    userToken = response.data.token;
    logTestResult('User Login', { status: response.status, data: response.data });
    
    // Test 2: Login as Admin
    console.log('2. Testing Admin Login...');
    response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    adminToken = response.data.token;
    logTestResult('Admin Login', { status: response.status, data: response.data });
    
    // Test 3: Login as Super Admin
    console.log('3. Testing Super Admin Login...');
    response = await api.post('/auth/login', {
      email: 'superadmin@test.com',
      password: 'password123'
    });
    superAdminToken = response.data.token;
    logTestResult('Super Admin Login', { status: response.status, data: response.data });
    
    // Test 4: Create Ticket as User
    console.log('4. Testing Ticket Creation as User...');
    response = await api.post('/tickets', {
      title: 'Test Ticket Creation',
      description: 'This is a test ticket to verify the approval workflow',
      type: 'bug',
      priority: 'high',
      category: 'technical',
      project: 3, // Use the seeded project ID
      department: 'IT',
      teamId: 1,
      dueDate: '2025-12-31'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    createdTicketId = response.data.ticket?.id;
    logTestResult('Create Ticket as User', { status: response.status, data: response.data });
    
    // Test 5: List Tickets as User
    console.log('5. Testing List Tickets as User...');
    response = await api.get('/tickets', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    logTestResult('List Tickets as User', { status: response.status, data: { count: response.data.tickets?.length } });
    
    // Test 6: Get Ticket Details as User
    console.log('6. Testing Get Ticket Details as User...');
    response = await api.get(`/tickets/${createdTicketId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    logTestResult('Get Ticket Details as User', { status: response.status, data: response.data });
    
    // Test 7: Approve Ticket as Admin
    console.log('7. Testing Approve Ticket as Admin...');
    response = await api.put(`/tickets/${createdTicketId}`, {
      status: 'APPROVED',
      priority: 'HIGH',
      expectedClosure: '2024-12-31'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('Approve Ticket as Admin', { status: response.status, data: response.data });
    
    // Test 8: Try to Approve Again as Super Admin (Should Fail)
    console.log('8. Testing Approve Again as Super Admin (Should Fail)...');
    response = await api.put(`/tickets/${createdTicketId}`, {
      status: 'APPROVED',
      priority: 'LOW',
      expectedClosure: '2025-01-01'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    logTestResult('Approve Again as Super Admin', { status: response.status, data: response.data });
    
    // Test 9: Try to Approve as User (Should Fail)
    console.log('9. Testing Approve as User (Should Fail)...');
    response = await api.put(`/tickets/${createdTicketId}`, {
      status: 'APPROVED',
      priority: 'LOW',
      expectedClosure: '2025-01-01'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    logTestResult('Approve as User', { status: response.status, data: response.data });
    
    // Test 10: Check Notifications as Admin
    console.log('10. Testing Get Notifications as Admin...');
    response = await api.get('/notifications', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('Get Notifications as Admin', { status: response.status, data: { count: response.data.notifications?.length } });
    
    // Test 11: Create Another Ticket for Rejection Test
    console.log('11. Creating Another Ticket for Rejection Test...');
    response = await api.post('/tickets', {
      title: 'Test Ticket for Rejection',
      description: 'This ticket will be rejected',
      type: 'feature',
      priority: 'medium',
      category: 'business',
      project: 3,
      department: 'IT',
      teamId: 1,
      dueDate: '2025-12-31'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const rejectionTicketId = response.data.ticket?.id;
    logTestResult('Create Second Ticket', { status: response.status, data: response.data });
    
    // Test 12: Reject Ticket as Super Admin
    console.log('12. Testing Reject Ticket as Super Admin...');
    response = await api.put(`/tickets/${rejectionTicketId}`, {
      status: 'REJECTED',
      rejectionReason: 'This ticket is not feasible',
      priority: 'LOW'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    logTestResult('Reject Ticket as Super Admin', { status: response.status, data: response.data });
    
    console.log('\n✅ All API tests completed!');
    console.log(`📁 Test results saved to: ${testResultsDir}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logTestResult('Test Error', { error: error.message, stack: error.stack });
  }
}

runAPITests(); 