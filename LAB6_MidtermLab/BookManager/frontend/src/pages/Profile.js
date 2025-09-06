// pages/Profile.js - 个人信息页

import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import '../style/Profile.css';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState({ 
    username: '',
    email: '',
    full_name: '',
    gender: '',
    age: null ,
    id: null,
    role: 'user',
    is_active: true,
    created_at: null,
    password: ''
  });

  const navigate = useNavigate();

  const [passwordConfirm, setPasswordConfirm] = useState(''); // 密码确认字段

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfileData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 密码验证
    if (profileData.password && profileData.password !== passwordConfirm) {
      alert("密码确认不匹配！");
      return;
    }

    try {
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        full_name: profileData.full_name || null,
        gender: profileData.gender || null,
        age: profileData.age ? Number(profileData.age) : null,
        ...(profileData.password && { password: profileData.password }) // 条件添加密码字段
      };

      await updateProfile(updateData);
      alert('个人资料更新成功');

      setProfileData({...profileData, password: ''});
      setPasswordConfirm('');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || '更新失败');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">用户个人资料</h1>
        <button onClick={() => navigate('/')} className="back-button">
          返回主页
        </button>
      </div>

      <div className="profile-content">
        <div className="read-only-section">
          <div className="info-item">
            <span className="info-label">用户ID:</span>
            <span className="info-value">{profileData.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">账户状态:</span>
            <span className={`status-value ${profileData.is_active ? 'active' : 'inactive'}`}>
              {profileData.is_active ? '活跃' : '非活跃'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">角色:</span>
            <span className="info-value">{profileData.role}</span>
          </div>
          <div className="info-item">
            <span className="info-label">注册日期:</span>
            <span className="info-value">
              {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              value={profileData.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">电子邮件</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">全名</label>
            <input
              type="text"
              name="full_name"
              value={profileData.full_name || ''}
              onChange={handleChange}
              placeholder="请输入您的全名"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">性别</label>
            <select
              name="gender"
              value={profileData.gender || ''}
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
              value={profileData.age || ''}
              onChange={handleChange}
              placeholder="请输入您的年龄"
              min="0"
              className="form-input"
            />
          </div>

          <div className="password-section">
            <h3 className="section-title">更改密码（留空则保持当前密码）</h3>
            <div className="form-group">
              <label className="form-label">新密码</label>
              <input
                type="password"
                name="password"
                value={profileData.password}
                onChange={handleChange}
                placeholder="输入新密码"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                name="passwordConfirm"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="再次输入新密码"
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            更新个人资料
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;



