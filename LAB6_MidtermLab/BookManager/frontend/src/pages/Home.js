// pages/Home.js - 首页

import React from 'react';
import '../style/Home.css';

/**
 * Home component - 显示欢迎信息与导航菜单
 *
 * @component
 * @param {{
 *   user: import('../types').User | null,
 *   onLogout: () => void
 * }} props
 * @returns {JSX.Element}
 */

const Home = ({ user, onLogout }) => {
  return (
    <div className="home-container">
      <div className="home-content">
        {/* 顶部栏 */}
        <header className="home-header">
          <div className="header-text">
            <h1 className="welcome-title">
              欢迎回来, <span className="username">{user?.username || '访客'}</span>
            </h1>
            <p className="welcome-subtitle">请选择您要操作的功能</p>
          </div>
          <button 
            onClick={onLogout}
            className="logout-button"
          >
            退出登录
          </button>
        </header>

        {/* 导航菜单 */}
        <div className="button-grid">
          {/* 基础菜单项 */}
          <a href="/books" className="big-button">
            <span className="button-icon">📚</span>
            <span className="button-text">书籍管理</span>
            <span className="button-hint">点击进入 →</span>
          </a>
          
          <a href="/profile" className="big-button">
            <span className="button-icon">👤</span>
            <span className="button-text">个人资料</span>
            <span className="button-hint">点击进入 →</span>
          </a>
          
          {/* 管理员菜单项 */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <>
              <a href="/orders" className="big-button">
                <span className="button-icon">📦</span>
                <span className="button-text">进货订单管理</span>
                <span className="button-hint">点击进入 →</span>
              </a>
              
              <a href="/bills" className="big-button">
                <span className="button-icon">💰</span>
                <span className="button-text">账单记录</span>
                <span className="button-hint">点击进入 →</span>
              </a>
            </>
          )}
          
          {/* 超级管理员菜单项 */}
          {user?.role === 'super_admin' && (
            <a href="/users" className="big-button">
              <span className="button-icon">👥</span>
              <span className="button-text">用户管理</span>
              <span className="button-hint">点击进入 →</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;