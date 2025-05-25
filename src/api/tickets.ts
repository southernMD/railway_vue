/**
 * 车票相关接口
 */
import { get, post, put, del } from '@/utils/http';

/**
 * 车票创建请求参数接口
 */
export interface CreateTicketRequest {
//   orderId: number;
  passengerId: number;
  trainId: number;
  date: string;
  departureStationId: number;
  arrivalStationId: number;
  seatType: number; // 1: 商务座, 2: 一等座, 3: 二等座, 4: 无座
  carriageId: number;
  seatId: number;
  price: number;
  status: number; // 车票状态，例如：0-待支付，1-已出票，2-已退票，5-已改签等
}

/**
 * 车票响应接口
 */
export interface TicketResponse {
  id: number;
  ticketNo: string;
  orderId: number;
  passengerId: number;
  trainId: number;
  date: string;
  departureStationId: number;
  arrivalStationId: number;
  seatType: number;
  carriageId: number;
  seatId: number;
  price: number;
  status: number;
  createTime: string;
  updateTime: string;
}

/**
 * 座位类型枚举
 */
export enum SeatType {
  BUSINESS = 1,    // 商务座
  FIRST_CLASS = 2, // 一等座
  SECOND_CLASS = 3, // 二等座
  NO_SEAT = 4      // 无座
}

/**
 * 座位类型名称映射
 */
export const SeatTypeNameMap = {
  [SeatType.BUSINESS]: '商务座',
  [SeatType.FIRST_CLASS]: '一等座',
  [SeatType.SECOND_CLASS]: '二等座',
  [SeatType.NO_SEAT]: '无座'
};

/**
 * 车票状态枚举
 */
export enum TicketStatus {
  PENDING_PAYMENT = 0,  // 待支付
  ISSUED = 1,           // 已出票
  REFUNDED = 2,         // 已退票
  CHANGING = 3,         // 改签处理中
  CHANGE_PENDING = 4,   // 改签待支付
  CHANGED = 5           // 已改签
}

/**
 * 车票状态名称映射
 */
export const TicketStatusNameMap = {
  [TicketStatus.PENDING_PAYMENT]: '待支付',
  [TicketStatus.ISSUED]: '已出票',
  [TicketStatus.REFUNDED]: '已退票',
  [TicketStatus.CHANGING]: '改签处理中',
  [TicketStatus.CHANGE_PENDING]: '改签待支付',
  [TicketStatus.CHANGED]: '已改签'
};

/**
 * 创建车票
 * @param ticketData 创建车票所需的参数
 * @returns 创建的车票信息
 */
export const createTicket = (ticketData: CreateTicketRequest): Promise<TicketResponse> => {
  return post('/tickets', ticketData);
};

/**
 * 批量创建车票
 * @param ticketsData 多个车票数据的数组
 * @returns 创建的车票信息数组
 */
export const createTickets = (ticketsData: CreateTicketRequest[]): Promise<TicketResponse[]> => {
  return post('/tickets/batch', ticketsData);
};

/**
 * 获取车票详情
 * @param id 车票ID
 * @returns 车票详情
 */
export const getTicketById = (id: number): Promise<TicketResponse> => {
  return get(`/tickets/${id}`);
};

/**
 * 获取订单的车票列表
 * @param orderId 订单ID
 * @returns 车票列表
 */
export const getTicketsByOrderId = (orderId: number): Promise<TicketResponse[]> => {
  return get(`/tickets/order/${orderId}`);
};

export default {
  createTicket,
  createTickets,
  getTicketById,
  getTicketsByOrderId,
  SeatType,
  SeatTypeNameMap,
  TicketStatus,
  TicketStatusNameMap
};