// pages/Users/List.js - 用户列表页（超级管理员）

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllUsers, 
  getUserById, 
  getUserByUsername,
  toggleUserActiveStatus 
} from '../../api/users';
import '../../style/Users.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('all'); // 'all' | 'id' | 'username'
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  // 通用数据获取函数
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchMode === 'id' && searchInput) {
        response = await getUserById(searchInput);
        setUsers([response.data]); // 单条结果转为数组
      } else if (searchMode === 'username' && searchInput) {
        response = await getUserByUsername(searchInput);
        setUsers([response.data]);
      } else {
        response = await getAllUsers();
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
      setUsers([]); // 清空结果
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载和搜索条件变化时重新获取
  useEffect(() => {
    fetchData();
  }, [searchMode]); // 搜索模式改变时触发重新加载

  const handleSearch = () => {
    if ((searchMode === 'id' || searchMode === 'username') && !searchInput.trim()) {
      setError('Please enter search term');
      return;
    }
    fetchData();
  };

  const handleReset = () => {
    setSearchMode('all');
    setSearchInput('');
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await toggleUserActiveStatus(userId);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Toggle status failed:', error);
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h1 className="page-title">用户管理</h1>
        <button onClick={() => navigate('/')} className="back-button">
          返回主页
        </button>
      </div>

      <div className="users-toolbar">
        <button 
          onClick={() => navigate('/users/create-admin')}
          className="create-admin-button"
        >
          + 新建管理员用户
        </button>
      </div>

      <div className="search-controls">
        <div className="search-options">
          <label className="radio-option">
            <input 
              type="radio" 
              checked={searchMode === 'all'} 
              onChange={() => setSearchMode('all')}
            />
            <span>显示全部</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              checked={searchMode === 'id'}
              onChange={() => setSearchMode('id')}
            />
            <span>ID搜索</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              checked={searchMode === 'username'}
              onChange={() => setSearchMode('username')}
            />
            <span>用户名搜索</span>
          </label>
        </div>

        {(searchMode === 'id' || searchMode === 'username') && (
          <div className="search-input-group">
            <input
              className="search-input"
              placeholder={`输入${searchMode === 'id' ? '用户ID' : '用户名'}`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button onClick={handleSearch} className="search-button">
              搜索
            </button>
            <button onClick={handleReset} className="reset-button">
              重置
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading-indicator">加载中...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>账户状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.email}</td>
                  <td className={`role-cell role-${user.role}`}>{user.role}</td>
                  <td className={`status-cell ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '活跃' : '停用'}
                  </td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => navigate(`/users/edit/${user.id}`)}
                      className="edit-button"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`toggle-button ${user.is_active ? 'danger' : 'success'}`}
                    >
                      {user.is_active ? '失效' : '激活'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data-message">
                  {!loading && '未找到用户'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;