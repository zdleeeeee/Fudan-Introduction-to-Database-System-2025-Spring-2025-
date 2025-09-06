// pages/Orders/New.js - 新建订单页
import React from 'react';
import OrderForm from '../../components/OrderForm';
import '../../style/Ordersa.css';
import { useNavigate } from 'react-router-dom';

const NewOrder = () => {
  const navigate = useNavigate();
  return (
    <div className="new-order-container">
      <div className="new-order-header">
        <h1 className="page-title">创建新订单</h1>
        <button type="button" onClick={() => navigate('/orders')} className="back-button" >取消返回</button>
      </div>
      <OrderForm />
    </div>
  );
};

export default NewOrder;