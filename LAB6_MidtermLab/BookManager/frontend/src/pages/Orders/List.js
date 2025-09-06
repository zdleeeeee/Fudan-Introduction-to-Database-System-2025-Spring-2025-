// pages/Orders/List.js - 订单列表页
import React, { useEffect, useState } from 'react';
import { getAllOrders, payOrder, returnOrder } from '../../api/orders';
import { useNavigate } from 'react-router-dom';
import '../../style/Orders.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingId, setPayingId] = useState(null); // 支付状态
  const [returnId, setReturnId] = useState(null); // 退款状态
  const navigate = useNavigate();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getAllOrders();
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (error) {
        console.error('获取订单失败:', error);
        setError(error.response?.data?.message || '加载订单失败');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showUnpaidOnly) {
      setFilteredOrders(orders.filter(order => order.order_status === 'unpaid'));
    } else {
      setFilteredOrders(orders);
    }
  }, [showUnpaidOnly, orders]);

  const handlePay = async (orderId) => {
    try {
      setPayingId(orderId);
      await payOrder(orderId);
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, order_status: 'paid' } : order
      ));
      alert('支付成功');
    } catch (error) {
      alert(error.response?.data?.message || '支付失败');
    } finally {
      setPayingId(null);
    }
  };

  const handleReturn = async (orderId) => {
    try {
      setReturnId(orderId);
      await returnOrder(orderId);
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, order_status: 'returned' } : order
      ));
      alert('退货成功');
    } catch (error) {
      alert(error.response?.data?.message || '退货失败');
    } finally {
      setReturnId(null);
    }
  };

  if (loading) return <div>加载订单中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="page-title">采购订单列表</h1>
        <button onClick={() => navigate('/')} className="back-button">
          返回主页
        </button>
      </div>

      <div className="orders-toolbar">
        <button
          onClick={() => navigate('/orders/new')}
          className="create-order-button"
        >
          + 新建进货订单
        </button>
        <label className="unpaid-filter">
            <input
              type="checkbox"
              checked={showUnpaidOnly}
              onChange={() => setShowUnpaidOnly(!showUnpaidOnly)}
            />
            仅显示未付款订单
          </label>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>订单ID</th>
              <th>图书信息</th>
              <th>采购信息</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="order-id">#{order.id}</td>
                  <td className="book-info">
                    <div className="book-title">{order.title}</div>
                    <div className="book-detail">ISBN: {order.isbn}</div>
                    <div className="book-detail">作者: {order.author}</div>
                    <div className="book-detail">出版社: {order.publisher}</div>
                    {order.bk_id && <div className="book-detail">图书ID: {order.bk_id}</div>}
                  </td>
                  <td className="purchase-info">
                    <div className="purchase-detail">单价: ¥{order.purchase_price.toFixed(2)}</div>
                    <div className="purchase-detail">数量: {order.quantity}</div>
                    <div className="purchase-detail">总价: ¥{(order.purchase_price * order.quantity).toFixed(2)}</div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${order.order_status}`}>
                      {order.order_status === 'unpaid' ? '未支付' :
                        order.order_status === 'paid' ? '已支付' : '已退货'}
                    </span>
                    <div className="stock-status">
                      入库: {order.is_stocked ? '✅' : '❌'}
                    </div>
                  </td>
                  <td className="time-cell">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div className="action-container">
                      {order.order_status === 'unpaid' && (
                        <button
                          onClick={() => handlePay(order.id)}
                          disabled={payingId === order.id}
                          className={`action-button pay-button ${payingId === order.id ? 'processing' : ''}`}
                        >
                          {payingId === order.id ? '处理中...' : '支付订单'}
                        </button>
                      )}
                      {order.order_status === 'unpaid' && (
                        <button
                          onClick={() => handleReturn(order.id)}
                          disabled={returnId === order.id}
                          className={`action-button return-button ${returnId === order.id ? 'processing' : ''}`}
                        >
                          {returnId === order.id ? '处理中...' : '图书退货'}
                        </button>
                      )}
                      {order.order_status === 'paid' && !order.is_stocked && (
                        <button
                          onClick={() => navigate(`/orders/stock/${order.id}`)}
                          className="action-button stock-button"
                        >
                          图书入库
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-orders-message">
                  {showUnpaidOnly ? '暂无未付款订单' : '暂无采购订单'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;