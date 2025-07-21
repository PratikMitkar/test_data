const axios = require('axios');

// TODO: Replace these with real tokens or implement login to get them
tokenUser = 'USER_JWT_TOKEN';
tokenAdmin = 'ADMIN_JWT_TOKEN';
tokenSuperAdmin = 'SUPERADMIN_JWT_TOKEN';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  validateStatus: () => true
});

async function runTests() {
  // 1. Create a ticket as a normal user
  console.log('--- Creating ticket as user ---');
  let res = await api.post('/tickets', {
    taskName: 'Test Ticket',
    description: 'Test ticket description',
    teamId: 1, // Change as needed
    priority: 'HIGH',
    project: 'Test Project',
    expectedClosure: '2024-12-31'
  }, {
    headers: { Authorization: `Bearer ${tokenUser}` }
  });
  console.log('Create ticket:', res.status, res.data);
  const ticketId = res.data.ticket?.id;

  // 2. List tickets as user
  console.log('--- Listing tickets as user ---');
  res = await api.get('/tickets', {
    headers: { Authorization: `Bearer ${tokenUser}` }
  });
  console.log('List tickets:', res.status, res.data.tickets?.length);

  // 3. Get ticket details as user
  console.log('--- Get ticket details as user ---');
  res = await api.get(`/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${tokenUser}` }
  });
  console.log('Ticket details:', res.status, res.data.ticket);

  // 4. Approve ticket as admin
  console.log('--- Approve ticket as admin ---');
  res = await api.put(`/tickets/${ticketId}`, {
    status: 'APPROVED',
    priority: 'HIGH',
    expectedClosure: '2024-12-31'
  }, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  console.log('Approve as admin:', res.status, res.data);

  // 5. Try to approve again as super admin (should fail)
  console.log('--- Try to approve again as super admin (should fail) ---');
  res = await api.put(`/tickets/${ticketId}`, {
    status: 'APPROVED',
    priority: 'LOW',
    expectedClosure: '2025-01-01'
  }, {
    headers: { Authorization: `Bearer ${tokenSuperAdmin}` }
  });
  console.log('Approve as super admin:', res.status, res.data);

  // 6. Try to approve as user (should fail)
  console.log('--- Try to approve as user (should fail) ---');
  res = await api.put(`/tickets/${ticketId}`, {
    status: 'APPROVED',
    priority: 'LOW',
    expectedClosure: '2025-01-01'
  }, {
    headers: { Authorization: `Bearer ${tokenUser}` }
  });
  console.log('Approve as user:', res.status, res.data);
}

runTests().catch(console.error); 