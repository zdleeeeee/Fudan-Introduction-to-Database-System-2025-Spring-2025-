import './index.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import BooksList from './pages/Books/List';
import EditBook from './pages/Books/Edit';
import OrdersList from './pages/Orders/List';
import NewOrder from './pages/Orders/New';
import StockOrder from './pages/Orders/Stock';
import BillsList from './pages/Bills/List';
import Sale from './pages/Sales/Sale';
import UsersList from './pages/Users/List';
import CreateAdmin from './pages/Users/CreateAdmin';
import EditUser from './pages/Users/Edit';
import UserProfile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

function App() {
    // 页面加载时从 localStorage 中读取用户信息
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('authUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      localStorage.removeItem('authUser');
      console.error('Failed to parse user data from localStorage', e);
      return null;
    }
  });

  const login = (authData) => {
    if (!authData?.user) {
      console.error('Invalid user data received:', authData);
      return;
    }

    const userToStore = {
      ...authData.user,
      accessToken: authData.token.access_token
    };
    setUser(userToStore);

    // 确保存储的是有效的用户数据
    localStorage.setItem('authUser', JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  const isUserLoggedIn = () => user !== null;
  const isAdmin = () => user && user.role === 'admin';
  const isSuperAdmin = () => user && user.role === 'super_admin';

  return (
    <Router>
      <Routes>
        {/* 公共页面 */}
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register />} />

        {/* 受保护的页面 */}
        <Route path="/" element={isUserLoggedIn() ? <Home user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isUserLoggedIn() ? <UserProfile user={user} /> : <Navigate to="/login" />} />

        {/* 图书相关页面 */}
        <Route path="/books" element={isUserLoggedIn() ? <BooksList user={user} /> : <Navigate to="/login" />} />
        <Route path="/books/edit/:id" element={isAdmin() || isSuperAdmin() ? <EditBook /> : <Navigate to="/" />} />

        {/* 订单相关页面 */}
        <Route path="/orders" element={isUserLoggedIn() ? <OrdersList /> : <Navigate to="/login" />} />
        <Route path="/orders/new" element={isUserLoggedIn() ? <NewOrder /> : <Navigate to="/login" />} />
        <Route path="/orders/stock/:orderId" element={isAdmin() || isSuperAdmin() ? <StockOrder /> : <Navigate to="/" />} />

        {/* 财务相关页面 */}
        <Route path="/bills" element={isAdmin() || isSuperAdmin() ? <BillsList /> : <Navigate to="/" />} />

        {/* 销售相关页面 */}
        <Route path="/sale/:bookId" element={isUserLoggedIn() ? <Sale /> : <Navigate to="/login" />} />

        {/* 用户管理页面 */}
        <Route path="/users" element={isSuperAdmin() ? <UsersList /> : <Navigate to="/" />} />
        <Route path="/users/create-admin" element={isSuperAdmin() ? <CreateAdmin /> : <Navigate to="/" />} />
        <Route path="/users/edit/:userId" element={isSuperAdmin() ? <EditUser /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;



