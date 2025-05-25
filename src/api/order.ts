/**
 * 订单相关接口
 */
import { get, post, put, del } from '@/utils/http';

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  /** 待支付 */
  PENDING_PAYMENT = 0,
  /** 已支付 */
  PAID = 1,
  /** 已取消 */
  CANCELLED = 2,
  /** 已完成 */
  COMPLETED = 3,
  /** 已退款 */
  REFUNDED = 4
}

/**
 * 订单状态文本映射
 */
export const OrderStatusTextMap = {
  [OrderStatus.PENDING_PAYMENT]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.REFUNDED]: '已退款'
};

/**
 * 订单状态标签类型映射
 */
export const OrderStatusTagTypeMap = {
  [OrderStatus.PENDING_PAYMENT]: 'warning',
  [OrderStatus.PAID]: 'success',
  [OrderStatus.CANCELLED]: 'info',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.REFUNDED]: 'info'
};

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
  status: OrderStatus;
  paymentTime: string | null;
  tickets: Ticket[];
  createTime?: string;
  updateTime?: string;
}

/**
 * 获取订单列表
 * @returns 订单列表
 */
export const getOrders = (): Promise<Order[]> => {
  return get('/orders');
};

// /**
//  * 获取订单详情
//  * @param id 订单ID
//  * @returns 订单详情
//  */
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
  // getOrderById,
  // cancelOrder,
  // payOrder
}; 