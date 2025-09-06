// bills.js 财务管理相关接口（查看财务记录等）
import api from './api';

/**
 * 获取财务记录（需管理员权限）
 * @param {Object} params - 查询参数
 * @param {string} params.start - 开始时间（ISO格式）
 * @param {string} params.end - 结束时间（ISO格式）
 * @param {string|null} [params.type] - 类型过滤（purchase/sale）
 * @returns {Promise}
 */

export const getFinancialRecords = (params) => {
    return api.get("/bills/records", { params });
  };