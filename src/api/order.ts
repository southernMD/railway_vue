/**
 * 订单相关接口
 */
import { get, post, put, del } from '@/utils/http';
import { v4 as uuidv4 } from 'uuid'; // 导入uuid库用于生成唯一ID
import { CreateTicketRequest } from './tickets';

/**
 * 车票信息接口
 */
export interface Ticket {
  id: number;
  seatNo: string;
  carriageNo: string;
  trainNo: string;
  startStation: string;
  endStation: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
}

/**
 * 用户信息接口
 */
export interface OrderUser {
  id: number;
  username: string;
  email: string;
  userType: number;
  status: number;
  createTime: string;
  updateTime: string;
}

/**
 * 订单信息接口
 */
export interface Order {
  id: number;
  orderNo: string;
  user: OrderUser;
  totalAmount: number;
  tickets: Ticket[];
  createTime?: string;
  updateTime?: string;
}

/**
 * 创建订单请求参数接口
 */
export interface CreateOrderParams {
  userId: number;
  totalAmount: number;
  tickets: CreateTicketRequest[];
  // 可以添加其他创建订单所需的参数，如车票信息等
}

/**
 * 创建订单响应接口
 */
export interface CreateOrderResponse {
  id: number;
  orderNo: string;
  userId: number;
  totalAmount: number;
  createTime: string;
  updateTime: string;
}

/**
 * 获取订单列表
 * @returns 订单列表
 */
export const getOrders = (): Promise<Order[]> => {
  return get('/orders');
};

/**
 * 创建新订单
 * @param params 创建订单所需参数
 * @returns 创建的订单信息
 */
export const createOrder = (params: CreateOrderParams): Promise<CreateOrderResponse> => {
  // 使用UUID生成订单号 (前8位即可，避免过长)
  const orderNo = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  
  // 构建请求体
  const requestBody = {
    orderNo,
    userId: params.userId,
    totalAmount: params.totalAmount,
    tickets: params.tickets
  };
  
  return post('/orders', requestBody);
};

/***
 * 获取指定用户订单
 */
export const getUserOrders = (userId: number): Promise<any[]> => {
  return get(`/orders/user?userId=${userId}`);
};

/**
 * 获取订单详情
 * @param id 订单ID
 * @returns 订单详情
 */
// export const getOrderById = (id: number): Promise<Order> => {
//   return get(`/orders/${id}`);
// };

// /**
//  * 取消订单
//  * @param id 订单ID
//  * @returns 操作结果
//  */
// export const cancelOrder = (id: number): Promise<void> => {
//   return put(`/orders/${id}/cancel`);
// };

// /**
//  * 支付订单
//  * @param id 订单ID
//  * @returns 操作结果
//  */
// export const payOrder = (id: number): Promise<void> => {
//   return put(`/orders/${id}/pay`);
// };

export default {
  getOrders,
  createOrder
  // getOrderById,
  // cancelOrder,
  // payOrder
}; 