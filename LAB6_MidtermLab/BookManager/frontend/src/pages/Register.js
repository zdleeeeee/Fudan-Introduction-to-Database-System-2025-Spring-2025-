// Register.js - 注册页

import React, { useState } from 'react';
import { register } from '../api/auth';

const Register = () => {
  const [userData, setUserData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  });
  
  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData.username || !userData.email || !userData.password) {
      alert('Please fill in all the required fields');
      return;
    }

    try {
      await register({
        username: userData.username.trim(),  // 去除首尾空格
        email: userData.email.trim(),
        password: userData.password
      });
      alert('Registration successful');

      // 注册成功后可以清空表单
      setUserData({ username: '', email: '', password: '' });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Registration fail, please try it again');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2 className="form-title">用户注册</h2>

        {/* 用户名输入 */}
        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="用户名（4-20位字符）"
            value={userData.username}
            onChange={handleChange}
            required
            minLength={4}
            maxLength={20}
            className="form-input"
          />
          <span className="input-hint">4-20位字符，支持字母、数字和下划线</span>
        </div>

        {/* 邮箱输入 */}
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="电子邮箱"
            value={userData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="form-input"
          />
          <span className="input-hint">请输入有效的电子邮箱地址</span>
        </div>

        {/* 密码输入 */}
        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="密码（至少8位）"
            value={userData.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="form-input"
          />
          <span className="input-hint">至少8位字符，建议包含字母、数字和特殊符号</span>
        </div>

        {/* 提交按钮 */}
        <button type="submit" className="submit-button">
          注册
        </button>

        <div className="form-footer">
          已有账号？<a href="/login" className="login-link">立即登录</a>
        </div>
      </form>
    </div>
  );
};

export default Register;