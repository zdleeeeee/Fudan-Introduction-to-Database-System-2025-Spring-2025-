// pages/Users/Edit.js - 编辑用户信息页面（超级管理员）

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser, toggleUserActiveStatus} from '../../api/users';
import '../../style/Users.css';

const EditUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    role: '',
    full_name: '',
    gender: '',
    age: null,
    is_active: null
  });

  const handleToggleActive = async () => {
    try {
      await toggleUserActiveStatus(userId);
      setUserData(prev => ({ ...prev, is_active: !prev.is_active }));
      alert(`User ${!userData.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error(error);
      alert('Failed to toggle user status');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserById(userId);
        setUserData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name || null,
        gender: userData.gender || null,
        age: userData.age ? Number(userData.age) : null,
        role: userData.role,
        ...(userData.password && { password: userData.password })
      };
      
      await updateUser(userId, updateData);
      alert('User updated successfully');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="user-edit-container">
      <div className="edit-header">
        <h1>修改用户信息</h1>
        <button onClick={() => navigate('/users')} className="back-button">
          返回用户列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h2 className="section-title">基本信息</h2>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">补充信息</h2>
          <div className="form-group">
            <label className="form-label">全名</label>
            <input
              type="text"
              name="full_name"
              value={userData.full_name || ''}
              onChange={handleChange}
              placeholder="请输入全名"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">性别</label>
            <select
              name="gender"
              value={userData.gender || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">请选择性别</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">年龄</label>
            <input
              type="number"
              name="age"
              value={userData.age || ''}
              onChange={handleChange}
              placeholder="请输入年龄"
              min="0"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">账户设置</h2>
          <div className="form-group">
            <label className="form-label">角色</label>
            <select
              name="role"
              value={userData.role}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              value={userData.password || ''}
              onChange={handleChange}
              placeholder="留空则不修改密码"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            更新用户信息
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            className={`toggle-button ${userData.is_active ? 'danger' : 'success'}`}
          >
            {userData.is_active ? '停用账户' : '激活账户'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;