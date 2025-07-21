const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authTokens = {};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    error: error?.message || error
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }
  
  return axios(config);
}

// Test Authentication APIs
async function testAuthAPIs() {
  console.log('\n🔐 Testing Authentication APIs...\n');
  
  // Test Super Admin Login
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'superadmin@example.com',
      password: 'superadmin123'
    });
    
    if (response.data.token) {
      authTokens.superAdmin = response.data.token;
      logTest('Super Admin Login', true);
    } else {
      logTest('Super Admin Login', false, 'No token received');
    }
  } catch (error) {
    logTest('Super Admin Login', false, error.response?.data?.error || error.message);
  }
  
  // Test Admin Login
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (response.data.token) {
      authTokens.admin = response.data.token;
      logTest('Admin Login', true);
    } else {
      logTest('Admin Login', false, 'No token received');
    }
  } catch (error) {
    logTest('Admin Login', false, error.response?.data?.error || error.message);
  }
  
  // Test Team Login
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'dev-team@example.com',
      password: 'team123'
    });
    
    if (response.data.token) {
      authTokens.team = response.data.token;
      logTest('Team Login', true);
    } else {
      logTest('Team Login', false, 'No token received');
    }
  } catch (error) {
    logTest('Team Login', false, error.response?.data?.error || error.message);
  }
  
  // Test User Login
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'john@example.com',
      password: 'user123'
    });
    
    if (response.data.token) {
      authTokens.user = response.data.token;
      logTest('User Login', true);
    } else {
      logTest('User Login', false, 'No token received');
    }
  } catch (error) {
    logTest('User Login', false, error.response?.data?.error || error.message);
  }
  
  // Test Get Current User
  try {
    const response = await makeRequest('GET', '/auth/me', null, authTokens.user);
    
    if (response.data.user) {
      logTest('Get Current User', true);
    } else {
      logTest('Get Current User', false, 'No user data received');
    }
  } catch (error) {
    logTest('Get Current User', false, error.response?.data?.error || error.message);
  }
  
  // Test Invalid Login
  try {
    await makeRequest('POST', '/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    logTest('Invalid Login (should fail)', false, 'Login should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Invalid Login (should fail)', true);
    } else {
      logTest('Invalid Login (should fail)', false, error.message);
    }
  }
}

// Test Ticket APIs
async function testTicketAPIs() {
  console.log('\n🎫 Testing Ticket APIs...\n');
  
  let createdTicketId = null;
  
  // Test Create Ticket
  try {
    const response = await makeRequest('POST', '/tickets', {
      title: 'Test API Ticket',
      description: 'This is a test ticket created via API',
      type: 'bug',
      category: 'technical',
      department: 'IT',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      teamId: 1,
      projectId: 1,
      priority: 'MEDIUM',
      estimatedHours: 4
    }, authTokens.user);
    
    if (response.data.ticket) {
      createdTicketId = response.data.ticket.id;
      logTest('Create Ticket', true);
    } else {
      logTest('Create Ticket', false, 'No ticket data received');
    }
  } catch (error) {
    logTest('Create Ticket', false, error.response?.data?.error || error.message);
  }
  
  // Test Get All Tickets
  try {
    const response = await makeRequest('GET', '/tickets', null, authTokens.user);
    
    if (response.data.tickets && Array.isArray(response.data.tickets)) {
      logTest('Get All Tickets', true);
    } else {
      logTest('Get All Tickets', false, 'No tickets array received');
    }
  } catch (error) {
    logTest('Get All Tickets', false, error.response?.data?.error || error.message);
  }
  
  // Test Get Ticket by ID
  if (createdTicketId) {
    try {
      const response = await makeRequest('GET', `/tickets/${createdTicketId}`, null, authTokens.user);
      
      if (response.data.ticket) {
        logTest('Get Ticket by ID', true);
      } else {
        logTest('Get Ticket by ID', false, 'No ticket data received');
      }
    } catch (error) {
      logTest('Get Ticket by ID', false, error.response?.data?.error || error.message);
    }
  }
  
  // Test Update Ticket
  if (createdTicketId) {
    try {
      const response = await makeRequest('PUT', `/tickets/${createdTicketId}`, {
        title: 'Updated Test API Ticket',
        description: 'This ticket has been updated via API'
      }, authTokens.user);
      
      if (response.data.ticket) {
        logTest('Update Ticket', true);
      } else {
        logTest('Update Ticket', false, 'No ticket data received');
      }
    } catch (error) {
      logTest('Update Ticket', false, error.response?.data?.error || error.message);
    }
  }
  
  // Test Add Comment to Ticket
  if (createdTicketId) {
    try {
      const response = await makeRequest('POST', `/tickets/${createdTicketId}/comments`, {
        content: 'This is a test comment added via API',
        isInternal: false
      }, authTokens.user);
      
      if (response.data.ticket) {
        logTest('Add Comment to Ticket', true);
      } else {
        logTest('Add Comment to Ticket', false, 'No response received');
      }
    } catch (error) {
      logTest('Add Comment to Ticket', false, error.response?.data?.error || error.message);
    }
  }
  
  // Test Get Ticket Statistics
  try {
    const response = await makeRequest('GET', '/tickets/stats', null, authTokens.user);
    
    if (response.data && typeof response.data.totalTickets !== 'undefined') {
      logTest('Get Ticket Statistics', true);
    } else {
      logTest('Get Ticket Statistics', false, 'No statistics data received');
    }
  } catch (error) {
    logTest('Get Ticket Statistics', false, error.response?.data?.error || error.message);
  }
}

// Test User APIs
async function testUserAPIs() {
  console.log('\n👥 Testing User APIs...\n');
  
  // Test Get All Users (Admin only)
  try {
    const response = await makeRequest('GET', '/users', null, authTokens.admin);
    
    if (response.data.users && Array.isArray(response.data.users)) {
      logTest('Get All Users (Admin)', true);
    } else {
      logTest('Get All Users (Admin)', false, 'No users array received');
    }
  } catch (error) {
    logTest('Get All Users (Admin)', false, error.response?.data?.error || error.message);
  }
  
  // Test Get All Users (Regular User - should fail)
  try {
    await makeRequest('GET', '/users', null, authTokens.user);
    logTest('Get All Users (User - should fail)', false, 'Should have been denied access');
  } catch (error) {
    if (error.response?.status === 403) {
      logTest('Get All Users (User - should fail)', true);
    } else {
      logTest('Get All Users (User - should fail)', false, error.message);
    }
  }
  
  // Test Get User by ID
  try {
    const response = await makeRequest('GET', '/users/1', null, authTokens.admin);
    
    if (response.data.user) {
      logTest('Get User by ID', true);
    } else {
      logTest('Get User by ID', false, 'No user data received');
    }
  } catch (error) {
    logTest('Get User by ID', false, error.response?.data?.error || error.message);
  }
}

// Test Project APIs
async function testProjectAPIs() {
  console.log('\n📋 Testing Project APIs...\n');
  
  let createdProjectId = null;
  
  // Test Create Project (Admin)
  try {
    const uniqueCode = `TEST-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const response = await makeRequest('POST', '/projects', {
      name: 'Test API Project',
      description: 'This is a test project created via API for testing purposes',
      code: uniqueCode,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      budget: 10000,
      departments: ['IT'],
      tags: ['test', 'api']
    }, authTokens.admin);
    
    if (response.data.project) {
      createdProjectId = response.data.project.id;
      logTest('Create Project (Admin)', true);
    } else {
      logTest('Create Project (Admin)', false, 'No project data received');
    }
  } catch (error) {
    const errorDetails = error.response?.data?.details || error.response?.data?.error || error.message;
    logTest('Create Project (Admin)', false, errorDetails);
  }
  
  // Test Get All Projects
  try {
    const response = await makeRequest('GET', '/projects', null, authTokens.admin);
    
    if (response.data.projects && Array.isArray(response.data.projects)) {
      logTest('Get All Projects', true);
    } else {
      logTest('Get All Projects', false, 'No projects array received');
    }
  } catch (error) {
    logTest('Get All Projects', false, error.response?.data?.error || error.message);
  }
  
  // Test Get Project by ID
  if (createdProjectId) {
    try {
      const response = await makeRequest('GET', `/projects/${createdProjectId}`, null, authTokens.admin);
      
      if (response.data.project) {
        logTest('Get Project by ID', true);
      } else {
        logTest('Get Project by ID', false, 'No project data received');
      }
    } catch (error) {
      logTest('Get Project by ID', false, error.response?.data?.error || error.message);
    }
  }
}

// Test Resource APIs
async function testResourceAPIs() {
  console.log('\n🔧 Testing Resource APIs...\n');
  
  let createdResourceId = null;
  
  // Test Create Resource (Admin)
  try {
    const response = await makeRequest('POST', '/resources', {
      name: 'Test API Resource',
      type: 'hardware',
      category: 'development',
      description: 'This is a test resource created via API',
      quantity: 5,
      unit: 'pieces',
      priority: 'medium',
      departments: ['IT'],
      tags: ['test', 'api']
    }, authTokens.admin);
    
    if (response.data.resource) {
      createdResourceId = response.data.resource.id;
      logTest('Create Resource (Admin)', true);
    } else {
      logTest('Create Resource (Admin)', false, 'No resource data received');
    }
  } catch (error) {
    logTest('Create Resource (Admin)', false, error.response?.data?.error || error.message);
  }
  
  // Test Get All Resources
  try {
    const response = await makeRequest('GET', '/resources', null, authTokens.user);
    
    if (response.data.resources && Array.isArray(response.data.resources)) {
      logTest('Get All Resources', true);
    } else {
      logTest('Get All Resources', false, 'No resources array received');
    }
  } catch (error) {
    logTest('Get All Resources', false, error.response?.data?.error || error.message);
  }
  
  // Test Get Available Resources
  try {
    const response = await makeRequest('GET', '/resources/available', null, authTokens.user);
    
    if (response.data.resources && Array.isArray(response.data.resources)) {
      logTest('Get Available Resources', true);
    } else {
      logTest('Get Available Resources', false, 'No resources array received');
    }
  } catch (error) {
    logTest('Get Available Resources', false, error.response?.data?.error || error.message);
  }
}

// Test Notification APIs
async function testNotificationAPIs() {
  console.log('\n🔔 Testing Notification APIs...\n');
  
  // Test Get User Notifications
  try {
    const response = await makeRequest('GET', '/notifications', null, authTokens.user);
    
    if (response.data.notifications && Array.isArray(response.data.notifications)) {
      logTest('Get User Notifications', true);
    } else {
      logTest('Get User Notifications', false, 'No notifications array received');
    }
  } catch (error) {
    logTest('Get User Notifications', false, error.response?.data?.error || error.message);
  }
  
  // Test Get Unread Notification Count
  try {
    const response = await makeRequest('GET', '/notifications/unread/count', null, authTokens.user);
    
    if (typeof response.data.count !== 'undefined') {
      logTest('Get Unread Notification Count', true);
    } else {
      logTest('Get Unread Notification Count', false, 'No count received');
    }
  } catch (error) {
    logTest('Get Unread Notification Count', false, error.response?.data?.error || error.message);
  }
}

// Test Health Check
async function testHealthCheck() {
  console.log('\n❤️ Testing Health Check...\n');
  
  try {
    const response = await makeRequest('GET', '/health');
    
    if (response.data.status === 'OK') {
      logTest('Health Check', true);
    } else {
      logTest('Health Check', false, 'Status not OK');
    }
  } catch (error) {
    logTest('Health Check', false, error.response?.data?.error || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('=' .repeat(50));
  
  try {
    await testHealthCheck();
    await testAuthAPIs();
    await testTicketAPIs();
    await testUserAPIs();
    await testProjectAPIs();
    await testResourceAPIs();
    await testNotificationAPIs();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n🎉 API Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };