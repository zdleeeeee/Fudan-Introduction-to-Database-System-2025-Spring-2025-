// src/components/PrivateRoute.js - 用于保护需要认证的页面

// PrivateRoute 组件用于检查用户是否已登录。
// 如果未登录，则重定向到登录页面。

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ user, roles }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default PrivateRoute;