// pages/Bills/List.js - 财务记录列表页
import React, { useEffect, useState } from 'react';
import { getFinancialRecords } from '../../api/bills';
import { useNavigate } from 'react-router-dom';
import '../../style/Bills.css';

const BillsList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    start: getChinaDateDaysAgo(30), // 最近30天（中国时区）
    end: getChinaToday(),          // 今天（中国时区）
    type: ''
  });
  // 辅助函数：获取中国时区N天前的日期（格式：YYYY-MM-DD）
  function getChinaDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    // 调整为UTC+8时区（中国时区）
    const chinaOffset = 8 * 60 * 60 * 1000; // 8小时的毫秒数
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const chinaDate = new Date(utc + chinaOffset);

    return chinaDate.toISOString().split('T')[0];
  }
  // 辅助函数：获取中国时区今天的日期（格式：YYYY-MM-DD）
  function getChinaToday() {
    const date = new Date();
    // 调整为UTC+8时区
    const chinaOffset = 8 * 60 * 60 * 1000;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const chinaDate = new Date(utc + chinaOffset);

    return chinaDate.toISOString().split('T')[0];
  }

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        start: `${filters.start}T00:00:00`,
        end: `${filters.end}T23:59:59`,
        ...(filters.type && { type: filters.type })
      };
      const response = await getFinancialRecords(params);
      setRecords(response.data);
    } catch (error) {
      console.error('获取财务记录失败:', error);
      setError(error.response?.data?.message || '加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="bills-container">
      <div className="bills-header">
        <h1 className="page-title">财务记录</h1>
        <button onClick={() => navigate('/')} className="back-button">
          返回主页
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <div className="filter-item">
            <label className="filter-label">开始日期</label>
            <input
              type="date"
              name="start"
              value={filters.start}
              onChange={handleFilterChange}
              max={filters.end}
              className="filter-input"
            />
          </div>
          <div className="filter-item">
            <label className="filter-label">结束日期</label>
            <input
              type="date"
              name="end"
              value={filters.end}
              onChange={handleFilterChange}
              min={filters.start}
              /*max={ getChinaToday() }*/
              className="filter-input"
            />
          </div>
          <div className="filter-item">
            <label className="filter-label">交易类型</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">全部</option>
              <option value="purchase">采购</option>
              <option value="sale">销售</option>
            </select>
          </div>
          <button onClick={fetchRecords} className="refresh-button">
            刷新
          </button>
        </div>
      </div>

      {/* 记录表格 */}
      <div className="records-table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>交易时间</th>
              <th>类型</th>
              <th>图书信息</th>
              <th>交易详情</th>
              <th>操作人</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map(record => (
                <tr key={record.id} className={`record-${record.bill_type}`}>
                  <td className="record-id">#{record.id}</td>
                  <td className="record-time">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                  <td className={`record-type type-${record.bill_type}`}>
                    {record.bill_type === 'purchase' ? '采购' : '销售'}
                  </td>
                  <td className="book-info">
                    <div className="book-title">{record.title}</div>
                    <div className="book-detail">ISBN: {record.isbn}</div>
                    <div className="book-detail">ID: {record.bk_id}</div>
                    <div className="book-detail">{record.author} | {record.publisher}</div>
                  </td>
                  <td className="transaction-details">
                    <div className="transaction-item">单价: ¥{record.price.toFixed(2)}</div>
                    <div className="transaction-item">数量: {record.quantity}</div>
                    <div className="transaction-item">总金额: ¥{record.amount.toFixed(2)}</div>
                  </td>
                  <td className="operator">
                    {record.user_id ? `用户ID: ${record.user_id}` : '系统操作'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-records">
                  没有找到财务记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillsList;