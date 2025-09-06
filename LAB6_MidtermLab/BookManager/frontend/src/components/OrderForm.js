import React, { useState } from 'react';
import { createOrder } from '../api/orders';
import '../style/Ordersa.css';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    isbn: '',
    purchase_price: 0,
    quantity: 1,
    manualInfo: {
      title: '',
      author: '',
      publisher: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [isBookExists, setIsBookExists] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.manualInfo) {
      setFormData({
        ...formData,
        manualInfo: {
          ...formData.manualInfo,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'quantity' || name === 'purchase_price'
          ? parseFloat(value) || 0
          : value
      });
    }
  };

  const handleCheckboxChange = (e) => {
    setIsBookExists(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const orderData = {
        isbn: formData.isbn,
        purchase_price: isNaN(parseFloat(formData.purchase_price)) ? 0 : parseFloat(formData.purchase_price),
        quantity: isNaN(parseInt(formData.quantity)) ? 1 : parseInt(formData.quantity)
      };

      let manualBookInfo = null;
      if (!isBookExists) {
        manualBookInfo = {
          title: formData.manualInfo.title,
          author: formData.manualInfo.author,
          publisher: formData.manualInfo.publisher
        };
      }

      await createOrder(orderData, manualBookInfo);
      alert('订单创建成功！');
      setFormData({
        isbn: '',
        purchase_price: 0,
        quantity: 1,
        manualInfo: {
          title: '',
          author: '',
          publisher: ''
        }
      }); // 重置表单
    } catch (error) {
      console.error('创建订单失败:', error);
      alert(error.response?.data?.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <div className="form-header">
        
      </div>

      <div className="form-section">
        <h2 className="section-title">图书信息</h2>
        <div className="form-group">
          <label className="form-label">ISBN</label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isBookExists}
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">书籍已存在</span>
          </label>
        </div>

        {!isBookExists && (
          <div className="manual-info">
            <h3 className="subsection-title">请补充图书信息</h3>
            <div className="form-group">
              <label className="form-label">书名</label>
              <input
                type="text"
                name="title"
                value={formData.manualInfo.title}
                onChange={handleChange}
                required={!isBookExists}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">作者</label>
              <input
                type="text"
                name="author"
                value={formData.manualInfo.author}
                onChange={handleChange}
                required={!isBookExists}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">出版社</label>
              <input
                type="text"
                name="publisher"
                value={formData.manualInfo.publisher}
                onChange={handleChange}
                required={!isBookExists}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h2 className="section-title">采购信息</h2>
        <div className="form-group">
          <label className="form-label">采购单价</label>
          <input
            type="number"
            name="purchase_price"
            min="0"
            step="0.01"
            value={formData.purchase_price}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">数量</label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className={`submit-button ${loading ? 'loading' : ''}`}>
          {loading ? '提交中...' : '创建订单'}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;



