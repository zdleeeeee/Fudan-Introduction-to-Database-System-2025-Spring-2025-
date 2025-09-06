// Login.js - 登录页
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authLogin } from '../api/auth';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await authLogin(credentials);
      console.log('Login response:', response); // 添加日志
      onLogin({
        user: response.data.user,
        token: response.data.token
      });
      setCredentials({ ...credentials, password: '' });
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      alert(error.response && error.response.data.detail ? error.response.data.detail : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">欢迎登录</h2>

          <div className="form-input-group">
            <div className="input-field">
              <input
                type="text"
                name="username"
                placeholder="用户名"
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="input-field">
              <input
                type="password"
                name="password"
                placeholder="密码"
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <span className="button-loading">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
            ) : '登录'}
          </button>

          <div className="form-footer">
            <a href="/register" className="register-link">
              没有账号？立即注册
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;