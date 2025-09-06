// sales.js - 销售相关接口（销售图书）
import api from './api';

/**
 * 销售图书
 * @param {number} bk_id - 图书ID
 * @param {number} quantity - 销售数量
 * @returns {Promise} 返回销售记录的Promise对象
 */

export const sellBook = (bk_id, quantity) => {
  // 确保使用正确的路径前缀 '/sales'
  return api.post(`/sales/${bk_id}?quantity=${quantity}`);
};