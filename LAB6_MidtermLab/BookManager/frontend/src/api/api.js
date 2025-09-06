// api.js - Axios全局配置
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器 - 自动添加token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('authUser'));
  if (user?.accessToken) {
    config.headers.Authorization = `Bearer ${user.accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
