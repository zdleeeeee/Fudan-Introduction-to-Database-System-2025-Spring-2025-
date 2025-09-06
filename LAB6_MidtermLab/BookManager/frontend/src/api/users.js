// users.js - 用户管理相关接口（创建管理员用户、查询修改用户信息等）
import api from './api';

// 创建管理员用户（需超级管理员权限）
export const createAdminUser = (userData) => {
  return api.post('/users/admin', userData);
};

// 获取所有用户列表
export const getAllUsers = () => {
  return api.get('/users');
};

// 获取指定ID的用户信息
export const getUserById = (userId) => {
  return api.get(`/users/${userId}`);
};

// 根据用户名获取用户信息
export const getUserByUsername = (username) => {
  return api.get(`/users/username/${username}`);
};

// 修改指定用户的激活状态（启用/禁用）
export const toggleUserActiveStatus = (userId) => {
  return api.put(`/users/${userId}/active`);
};

// 修改指定用户的信息（仅超级管理员可用）
export const updateUser = (userId, updateData) => {
  return api.put(`/users/${userId}`, updateData);
};