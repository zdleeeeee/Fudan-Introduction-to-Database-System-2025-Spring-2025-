// main.js - 应用入口

// 这个文件主要用于初始化 React 应用，
// 并挂载到 DOM 上。
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取根 DOM 节点并渲染 App
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
