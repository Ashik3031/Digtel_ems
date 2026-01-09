import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/sales/SalesDashboard';
import AMDashboard from './pages/am/AMDashboard'; // New Import
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // New Import

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Route Definitions for ALL Roles */}
          <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
            <Route path="/super-admin" element={<Dashboard title="Super Admin Dashboard" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<Dashboard title="Admin Operations" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/hr" element={<Dashboard title="HR Portal" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Sales Manager']} />}>
            <Route path="/sales-manager" element={<SalesDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Sales Executive']} />}>
            <Route path="/sales-executive" element={<SalesDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Backend Manager']} />}>
            <Route path="/backend-manager" element={<Dashboard title="Engineering Lead" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Backend Team Member']} />}>
            <Route path="/backend-team" element={<Dashboard title="Developer Console" />} />
          </Route>

          {/* New AM Route */}
          <Route element={<ProtectedRoute allowedRoles={['Account Manager', 'Admin', 'Super Admin']} />}>
            <Route path="/account-manager" element={<AMDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['QC']} />}>
            <Route path="/qc" element={<Dashboard title="Quality Control" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
            <Route path="/client-portal" element={<Dashboard title="Client Portal" />} />
          </Route>

          {/* Fallback */}
          <Route path="/dashboard" element={<Dashboard title="General Dashboard" />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
