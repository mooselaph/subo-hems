import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OrderManagement from './pages/OrderManagement';
import KitchenDispatch from './pages/KitchenDispatch';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (username, role) => {
    setUser(username);
    setUserRole(role);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="navbar-container">
            <button 
              className="hamburger-menu" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1 className="app-title">Restaurant HEMS</h1>
            <div className="navbar-user-section">
              <span className="user-info-inline">{user.charAt(0).toUpperCase() + user.slice(1)} ({userRole})</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </nav>

        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            {userRole === 'management' && (
              <li>
                <Link to="/dashboard" className="sidebar-link" onClick={closeSidebar}>Dashboard</Link>
              </li>
            )}
            {(userRole === 'dining' || userRole === 'management') && (
              <li>
                <Link to="/" className="sidebar-link" onClick={closeSidebar}>Order Management</Link>
              </li>
            )}
            {(userRole === 'kitchen' || userRole === 'management') && (
              <li>
                <Link to="/kitchen" className="sidebar-link" onClick={closeSidebar}>Kitchen Dispatch</Link>
              </li>
            )}
          </ul>
        </div>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            {userRole === 'management' && (
              <Route path="/dashboard" element={<Dashboard />} />
            )}
            {(userRole === 'dining' || userRole === 'management') && (
              <Route path="/" element={<OrderManagement />} />
            )}
            {(userRole === 'kitchen' || userRole === 'management') && (
              <Route path="/kitchen" element={<KitchenDispatch />} />
            )}
            <Route 
              path="/" 
              element={
                userRole === 'kitchen' ? (
                  <Navigate to="/kitchen" replace />
                ) : userRole === 'management' ? (
                  <Navigate to="/dashboard" replace />
                ) : userRole === 'dining' ? (
                  <Navigate to="/" replace />
                ) : null
              } 
            />
            <Route path="*" element={<AccessDenied userRole={userRole} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function AccessDenied({ userRole }) {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Access Denied</h2>
      <p>Your role ({userRole}) does not have access to this page.</p>
      {userRole === 'dining' && (
        <button onClick={() => navigate('/')} className="nav-link">Go to Order Management</button>
      )}
      {userRole === 'kitchen' && (
        <button onClick={() => navigate('/kitchen')} className="nav-link">Go to Kitchen Dispatch</button>
      )}
    </div>
  );
}

export default App;
