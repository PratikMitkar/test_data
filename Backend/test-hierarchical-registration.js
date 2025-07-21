const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testHierarchicalRegistration() {
  console.log('🧪 Testing Hierarchical Registration System...\n');

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

    // Step 5: Test fetching Super Admins for Admin registration
    console.log('\n5️⃣ Testing Super Admins endpoint...');
    const superAdminsResponse = await axios.get(`${BASE_URL}/users/super-admins`);
    console.log('✅ Super Admins fetched:', superAdminsResponse.data.length, 'super admins found');

    // Step 6: Test fetching Teams for User registration
    console.log('\n6️⃣ Testing Teams endpoint...');
    const teamsResponse = await axios.get(`${BASE_URL}/users/teams`);
    console.log('✅ Teams fetched:', teamsResponse.data.length, 'teams found');

    console.log('\n🎉 All tests passed! Hierarchical registration system is working correctly.');
    console.log('\n📋 Registration Flow:');
    console.log('   Super Admin → Admin (selects Super Admin)');
    console.log('   Team Manager → User (selects Team)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testHierarchicalRegistration(); 