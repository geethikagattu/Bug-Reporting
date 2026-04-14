import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages - Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import GithubAuth from './pages/GithubAuth';

// Pages - Tester
import TesterDashboard from './pages/tester/Dashboard';
import SubmitBug from './pages/tester/SubmitBug';
import MyBugs from './pages/tester/MyBugs';
import TesterBugDetail from './pages/tester/BugDetail';

// Pages - Developer
import DevDashboard from './pages/developer/Dashboard';
import AssignedBugs from './pages/developer/AssignedBugs';
import DevBugDetail from './pages/developer/BugDetail';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AllBugs from './pages/admin/AllBugs';
import AssignmentLogs from './pages/admin/AssignmentLogs';
import Reports from './pages/admin/Reports';
import Projects from './pages/admin/Projects';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-slate-100">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-slate-100">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
};

// Simple unauthorized page
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-slate-100">
    <h1 className="text-3xl font-bold text-danger">403 - Unauthorized Access</h1>
  </div>
);

// Generic BugDetail routing wrapper based on role
const RoleBugDetail = () => {
    const { user } = useAuth();
    if(user?.role === 'Developer') return <DevBugDetail />;
    if(user?.role === 'Admin') return <DevBugDetail />; // Admin can also view dev mode details for simplicity in demo
    return <TesterBugDetail />; 
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/github-auth" element={<GithubAuth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Tester Routes */}
          <Route path="/tester/dashboard" element={<RoleRoute allowedRoles={['Tester', 'Admin']}><TesterDashboard /></RoleRoute>} />
          <Route path="/tester/submit" element={<RoleRoute allowedRoles={['Tester', 'Admin']}><SubmitBug /></RoleRoute>} />
          <Route path="/tester/bugs" element={<RoleRoute allowedRoles={['Tester', 'Admin']}><MyBugs /></RoleRoute>} />
          
          {/* Developer Routes */}
          <Route path="/developer/dashboard" element={<RoleRoute allowedRoles={['Developer', 'Admin']}><DevDashboard /></RoleRoute>} />
          <Route path="/developer/bugs" element={<RoleRoute allowedRoles={['Developer', 'Admin']}><AssignedBugs /></RoleRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['Admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute allowedRoles={['Admin']}><ManageUsers /></RoleRoute>} />
          <Route path="/admin/bugs" element={<RoleRoute allowedRoles={['Admin']}><AllBugs /></RoleRoute>} />
          <Route path="/admin/assignments" element={<RoleRoute allowedRoles={['Admin']}><AssignmentLogs /></RoleRoute>} />
          <Route path="/admin/reports" element={<RoleRoute allowedRoles={['Admin']}><Reports /></RoleRoute>} />
          <Route path="/admin/projects" element={<RoleRoute allowedRoles={['Admin']}><Projects /></RoleRoute>} />

          {/* Shared Dynamic ID Route */}
          <Route path="/bugs/:id" element={<PrivateRoute><RoleBugDetail /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
