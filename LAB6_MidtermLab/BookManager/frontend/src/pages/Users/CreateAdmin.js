// pages/Users/CreateAdmin.js - 创建普通管理员页（超级管理员）

import React, { useState } from 'react';
import { createAdminUser } from '../../api/users';
import { useNavigate } from 'react-router-dom';
import '../../style/Users.css';

const CreateAdmin = () => {
  const [userData, setUserData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'admin'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdminUser(userData);
      alert('新建管理员成功');
      setUserData({ username: '', email: '', password: '' });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || '新建管理员失败');
    }
  };

  return (
    <div className="create-admin-container">
      <div className="create-header">
        <h1>新建管理员账户</h1>
        <button onClick={() => navigate('/users')} className="back-button">
          返回用户列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            type="text"
            name="username"
            placeholder="输入用户名"
            onChange={handleChange}
            required
            minLength={3}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            name="email"
            placeholder="输入邮箱"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">密码</label>
          <input
            type="password"
            name="password"
            placeholder="输入密码"
            onChange={handleChange}
            required
            minLength={8}
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            新建管理员
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdmin;