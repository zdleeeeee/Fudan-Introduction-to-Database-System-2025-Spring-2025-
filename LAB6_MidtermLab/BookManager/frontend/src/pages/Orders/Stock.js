// pages/Orders/Stock.js - 入库操作页面
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { stockOrder } from '../../api/orders';
import '../../style/Ordersa.css';

const StockOrder = () => {
  const { orderId } = useParams(); // 从路由参数获取orderId
  const navigate = useNavigate();
  const [retailData, setRetailData] = useState({
    retail_price: ''
  });
  const [loading, setLoading] = useState(false);

  const [isValidOrderId, setIsValidOrderId] = useState(true); // 新增状态来跟踪订单ID的有效性

  useEffect(() => {
    // 将 orderId 转换为整数
    const parsedOrderId = parseInt(orderId, 10);
    if (isNaN(parsedOrderId)) {
      console.error('Invalid orderId:', orderId);
      setIsValidOrderId(false); // 设置订单ID无效
    }
  }, [orderId, navigate]);

  useEffect(() => {
    if (!isValidOrderId) {
      alert('无效的订单ID');
      navigate('/orders'); // 返回订单列表
    }
  }, [isValidOrderId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRetailData({
      ...retailData,
      [name]: value
    });
  };

  const handleStock = async (e) => {
    e.preventDefault();

    // 验证零售价格
    const price = parseFloat(retailData.retail_price);
    if (isNaN(price) || price <= 0) {
      alert('请输入有效的零售价格（必须大于0）');
      return;
    }

    try {
      setLoading(true);
      await stockOrder(orderId, {
        retail_price: price
      });
      alert('图书入库成功！');
      navigate('/orders'); // 成功后返回订单列表
    } catch (error) {
      console.error('入库失败:', error);
      alert(error.response?.data?.message || '入库操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-container">
      <div className="stock-header">
        <h1 className="page-title">图书入库 (#{orderId})</h1>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="cancel-button"
        >
          取消返回
        </button>
      </div>

      <form onSubmit={handleStock} className="stock-form">
        <div className="form-group">
          <label className="form-label">零售定价（元）</label>
          <input
            type="number"
            name="retail_price"
            min="0.01"
            step="0.01"
            value={retailData.retail_price}
            onChange={handleChange}
            required
            placeholder="请输入零售价格"
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? '处理中...' : '确认入库'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockOrder;