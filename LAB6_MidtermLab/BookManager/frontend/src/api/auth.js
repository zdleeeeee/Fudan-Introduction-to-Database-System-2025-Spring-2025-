// auth.js - 认证接口（登录、注册等）
import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getProfile = () => api.get('/auth/me');
export const updateProfile = (updateData) => api.put('/auth/me', updateData);