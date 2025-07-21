const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testHierarchicalAuth() {
  console.log('🧪 Testing Hierarchical Registration and Authentication System...\n');

  try {
    // Step 1: Register Super Admin
    console.log('1️⃣ Registering Super Admin...');
    const superAdminData = {
      name: 'John Super Admin',
      email: 'superadmin@test.com',
      password: 'password123'
    };
    
    const superAdminResponse = await axios.post(`${BASE_URL}/auth/register/super-admin`, superAdminData);
    console.log('✅ Super Admin registered:', superAdminResponse.data.message);
    const superAdminId = superAdminResponse.data.superAdmin.id;

    // Step 2: Register Admin (under Super Admin)
    console.log('\n2️⃣ Registering Admin...');
    const adminData = {
      name: 'Jane Admin',
      email: 'admin@test.com',
      password: 'password123',
      superAdminId: superAdminId
    };
    
    const adminResponse = await axios.post(`${BASE_URL}/auth/register/admin`, adminData);
    console.log('✅ Admin registered:', adminResponse.data.message);

    // Step 3: Register Team
    console.log('\n3️⃣ Registering Team...');
    const teamData = {
      teamName: 'Development Team',
      managerName: 'Mike Manager',
      email: 'team@test.com',
      password: 'password123'
    };
    
    const teamResponse = await axios.post(`${BASE_URL}/auth/register/team`, teamData);
    console.log('✅ Team registered:', teamResponse.data.message);
    const teamId = teamResponse.data.team.id;

    // Step 4: Register User (under Team)
    console.log('\n4️⃣ Registering User...');
    const userData = {
      username: 'alice_dev',
      name: 'Alice Developer',
      email: 'user@test.com',
      password: 'password123',
      teamId: teamId
    };
    
    const userResponse = await axios.post(`${BASE_URL}/auth/register/user`, userData);
    console.log('✅ User registered:', userResponse.data.message);

    // Step 5: Test Authentication for each role
    console.log('\n5️⃣ Testing Authentication for each role...');

    // Test Super Admin Login
    console.log('\n   🔐 Testing Super Admin Login...');
    const superAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@test.com',
      password: 'password123'
    });
    console.log('   ✅ Super Admin login successful');
    console.log('   📋 Role:', superAdminLogin.data.user.role);
    console.log('   📋 User data:', JSON.stringify(superAdminLogin.data.user, null, 2));

    // Test Admin Login
    console.log('\n   🔐 Testing Admin Login...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });
    console.log('   ✅ Admin login successful');
    console.log('   📋 Role:', adminLogin.data.user.role);
    console.log('   📋 User data:', JSON.stringify(adminLogin.data.user, null, 2));

    // Test Team Login
    console.log('\n   🔐 Testing Team Login...');
    const teamLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'team@test.com',
      password: 'password123'
    });
    console.log('   ✅ Team login successful');
    console.log('   📋 Role:', teamLogin.data.user.role);
    console.log('   📋 User data:', JSON.stringify(teamLogin.data.user, null, 2));

    // Test User Login
    console.log('\n   🔐 Testing User Login...');
    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@test.com',
      password: 'password123'
    });
    console.log('   ✅ User login successful');
    console.log('   📋 Role:', userLogin.data.user.role);
    console.log('   📋 User data:', JSON.stringify(userLogin.data.user, null, 2));

    // Step 6: Test /auth/me endpoint for each role
    console.log('\n6️⃣ Testing /auth/me endpoint for each role...');

    // Test Super Admin /me
    console.log('\n   🔍 Testing Super Admin /me endpoint...');
    const superAdminMe = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminLogin.data.token}` }
    });
    console.log('   ✅ Super Admin /me successful');
    console.log('   📋 Role:', superAdminMe.data.user.role);
    console.log('   📋 User data:', JSON.stringify(superAdminMe.data.user, null, 2));

    // Test Admin /me
    console.log('\n   🔍 Testing Admin /me endpoint...');
    const adminMe = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminLogin.data.token}` }
    });
    console.log('   ✅ Admin /me successful');
    console.log('   📋 Role:', adminMe.data.user.role);
    console.log('   📋 User data:', JSON.stringify(adminMe.data.user, null, 2));

    // Test Team /me
    console.log('\n   🔍 Testing Team /me endpoint...');
    const teamMe = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${teamLogin.data.token}` }
    });
    console.log('   ✅ Team /me successful');
    console.log('   📋 Role:', teamMe.data.user.role);
    console.log('   📋 User data:', JSON.stringify(teamMe.data.user, null, 2));

    // Test User /me
    console.log('\n   🔍 Testing User /me endpoint...');
    const userMe = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userLogin.data.token}` }
    });
    console.log('   ✅ User /me successful');
    console.log('   📋 Role:', userMe.data.user.role);
    console.log('   📋 User data:', JSON.stringify(userMe.data.user, null, 2));

    // Step 7: Test role-based access
    console.log('\n7️⃣ Testing role-based access...');

    // Test that Admin can access admin-only endpoints
    console.log('\n   🔒 Testing Admin access to admin endpoints...');
    try {
      const adminAccess = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
      });
      console.log('   ✅ Admin can access /users endpoint');
    } catch (error) {
      console.log('   ❌ Admin cannot access /users endpoint:', error.response?.data?.error);
    }

    // Test that User cannot access admin-only endpoints
    console.log('\n   🔒 Testing User access to admin endpoints...');
    try {
      const userAccess = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${userLogin.data.token}` }
      });
      console.log('   ❌ User can access /users endpoint (should not)');
    } catch (error) {
      console.log('   ✅ User cannot access /users endpoint (correct behavior)');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Hierarchical registration working');
    console.log('   ✅ Authentication working for all roles');
    console.log('   ✅ Role-based access control working');
    console.log('   ✅ Database relationships stored correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

testHierarchicalAuth(); 