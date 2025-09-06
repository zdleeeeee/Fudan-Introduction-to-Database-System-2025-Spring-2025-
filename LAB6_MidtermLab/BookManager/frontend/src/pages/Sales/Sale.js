// pages/Sales/Sale.js - 图书销售页
import React, { useState } from 'react';
import { sellBook } from '../../api/sales';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../../style/Sales.css';


const Sale = () => {
  const { bookId } = useParams(); // 获取路由参数
  const [quantity, setQuantity] = useState(1); // 默认改为1更合理
  const [saleRecord, setSaleRecord] = useState(null); // 新增状态存储销售记录
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1); // 确保最小为1
    setQuantity(value);
  };

  const handleSale = async () => {
    setError(null);
    try {
      setLoading(true);
      const response = await sellBook(Number(bookId), Number(quantity));
      setSaleRecord(response.data); // 存储完整销售记录
    } catch (error) {
      console.error('购买失败:', error);
      if (error.response?.status === 422) {
        const errorDetails = error.response.data.detail;
        if (Array.isArray(errorDetails)) {
          // 将错误数组转换为可读字符串
          setError(errorDetails.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n'));
        } else {
          setError(errorDetails || '验证失败');
        }
      } else {
        setError(error.response?.data?.message || error.message || '销售失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sale-container">
      <div className="sale-header">
        <h1>购买图书 #{bookId}</h1>
        <button onClick={() => navigate('/books')} className="back-button">
          返回图书列表
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sale-content">
        <form className="sale-form">
          <div className="form-group">
            <label className="form-label">购买数量</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
            />
          </div>
          <button 
            onClick={handleSale} 
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <span className="button-loading">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            ) : '确认购买'}
          </button>
        </form>

        {saleRecord && (
          <div className="sale-record">
            <h2 className="record-title">购买凭证</h2>
            <div className="record-table">
              <div className="record-row">
                <div className="record-header">交易ID</div>
                <div className="record-value">{saleRecord.id}</div>
              </div>
              <div className="record-row">
                <div className="record-header">交易类型</div>
                <div className="record-value">{saleRecord.bill_type}</div>
              </div>
              <div className="record-row">
                <div className="record-header">图书ID</div>
                <div className="record-value">{saleRecord.bk_id}</div>
              </div>
              <div className="record-row">
                <div className="record-header">ISBN</div>
                <div className="record-value">{saleRecord.isbn}</div>
              </div>
              <div className="record-row">
                <div className="record-header">书名</div>
                <div className="record-value">{saleRecord.title}</div>
              </div>
              <div className="record-row">
                <div className="record-header">作者</div>
                <div className="record-value">{saleRecord.author}</div>
              </div>
              <div className="record-row">
                <div className="record-header">出版社</div>
                <div className="record-value">{saleRecord.publisher}</div>
              </div>
              <div className="record-row">
                <div className="record-header">单价</div>
                <div className="record-value">¥{saleRecord.price.toFixed(2)}</div>
              </div>
              <div className="record-row">
                <div className="record-header">数量</div>
                <div className="record-value">{saleRecord.quantity}</div>
              </div>
              <div className="record-row">
                <div className="record-header">总金额</div>
                <div className="record-value">¥{saleRecord.amount.toFixed(2)}</div>
              </div>
              <div className="record-row">
                <div className="record-header">交易时间</div>
                <div className="record-value">{new Date(saleRecord.created_at).toLocaleString()}</div>
              </div>
              <div className="record-row">
                <div className="record-header">交易者ID</div>
                <div className="record-value">{saleRecord.user_id}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sale;