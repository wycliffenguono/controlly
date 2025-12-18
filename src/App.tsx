import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Staff';
import Insights from './pages/Insights';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Search from './pages/Search';
import Customers from './pages/Customers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Staff & Admin: dashboard and insights */}
        <Route element={<ProtectedRoute allowedRoles={['Admin','Staff']} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/pricing" element={<Pricing />} />
             <Route path="/customers" element={<Customers />} />
            <Route path="/search" element={<Search />} />
          </Route>
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/users" element={<Users />} />
           
          </Route>
        </Route>



        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;