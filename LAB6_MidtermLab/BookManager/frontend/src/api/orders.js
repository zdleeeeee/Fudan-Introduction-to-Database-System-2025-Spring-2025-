// orders.js - 订单接口（创建、支付、入库、获取所有订单）
import api from './api';

// 创建进货订单
export const createOrder = (orderData, manualBookInfo = null) => {
  return api.post('/orders', {
    isbn: orderData.isbn,
    quantity: orderData.quantity,
    purchase_price: orderData.purchase_price, 
    manual_book_info: manualBookInfo });
};

// 支付进货订单
export const payOrder = (orderId) => {
  return api.post(`/orders/${orderId}/pay`);
};

// 订单退货
export const returnOrder = (orderId) => {
  return api.post(`/orders/${orderId}/return`)
}
// 入库操作
export const stockOrder = (orderId, retailData) => {
  return api.post(`/orders/${orderId}/stock`, retailData);
};

// 获取所有订单
export const getAllOrders = () => {
  return api.get('/orders');
};