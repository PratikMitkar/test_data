// Updated to fix Users component reference issue
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import EditTicket from './pages/EditTicket';
import UsersPage from './pages/Users';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';
import Teams from './pages/Teams';
import CreateAdmin from './pages/CreateAdmin';
import CreateTeam from './pages/CreateTeam';
import CreateMember from './pages/CreateMember';
import TicketApproval from './pages/TicketApproval';
import AssignedTickets from './pages/AssignedTickets';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Ticket Routes - All users can access */}
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/assigned" element={<AssignedTickets />} />
              <Route 
                path="tickets/create" 
                element={
                  <ProtectedRoute allowedRoles={['user', 'team', 'admin', 'super_admin']}>
                    <CreateTicket />
                  </ProtectedRoute>
                } 
              />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route 
                path="tickets/:id/edit" 
                element={
                  <ProtectedRoute allowedRoles={['user', 'team', 'admin', 'super_admin']}>
                    <EditTicket />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ticket Approval - Only Team Managers, Admin and Super Admin */}
              <Route
                path="tickets/approval"
                element={
                  <ProtectedRoute allowedRoles={['team', 'admin', 'super_admin']}>
                    <TicketApproval />
                  </ProtectedRoute>
                }
              />
              
              {/* User Management - Only Super Admin and Admin */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Team Management - Only Admin and Super Admin can see all teams */}
              <Route
                path="teams"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Teams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teams/create"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <CreateTeam />
                  </ProtectedRoute>
                }
              />
              
              {/* User Creation Routes */}
              <Route
                path="users/create-admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <CreateAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/create-member"
                element={
                  <ProtectedRoute allowedRoles={['team', 'admin', 'super_admin']}>
                    <CreateMember />
                  </ProtectedRoute>
                }
              />
              
              {/* Project Management - Team managers can see their team's projects */}
              <Route
                path="projects"
                element={
                  <ProtectedRoute allowedRoles={['team', 'admin', 'super_admin']}>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              
              {/* Notifications - All users */}
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
