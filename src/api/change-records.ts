/*
 * @Description: create by southernMD
 */
import { get, post, put, del } from '@/utils/http';

// 基础实体类型定义
export interface BaseEntity {
  createTime: string;
  updateTime: string;
  id: number;
}

// 用户类型定义
export interface User extends BaseEntity {
  username: string;
  email: string;
  userType: number;
  status: number;
}

// 乘客类型定义
export interface Passenger extends BaseEntity {
  user: User;
  realName: string;
  idCard: string;
  phone: string;
  passengerType: number;
  isDefault: number;
}

// 站点类型定义
export interface Station extends BaseEntity {
  stationName: string;
  city: string;
  province: string;
  address: string;
  status: number;
}


// 车型类型定义
export interface TrainModel extends BaseEntity {
  modelName: string;
  modelCode: string;
  maxCapacity: number;
}

// 座位信息类型定义
export interface TrainSeatInfo extends BaseEntity {
  noSeatTickets: number;
  businessPrice: number;
  firstClassPrice: number;
  secondClassPrice: number;
  noSeatPrice: number;
}

// 列车站点类型定义
export interface TrainStop extends BaseEntity {
  trainId: number;
  station: Station;
  sequence: number;
  arrivalTime: string;
  stopDuration: number;
}

// 列车类型定义
export interface Train extends BaseEntity {
  trainNumber: string;
  model: TrainModel;
  startStation: Station;
  endStation: Station;
  date: string;
  departureTime: string;
  arrivalTime: string;
  trainSeatInfo: TrainSeatInfo;
  trainStops: TrainStop[];
}

// 车厢类型定义
export interface Carriage extends BaseEntity {
  modelId: number;
  carriageNumber: number;
  carriageType: number;
}

// 锁定信息类型定义
export interface LockInfo extends BaseEntity {
  seatId: number;
  expireTime: string;
  lockStart: string;
  reason: string;
  finish: number;
  type: number;
}

// 座位类型定义
export interface Seat extends BaseEntity {
  carriageId: number;
  seatNumber: string;
  status: number;
  lockInfo: LockInfo[];
}

// 车票类型定义
export interface Ticket extends BaseEntity {
  ticketNo: string;
  orderId: number;
  passenger: Passenger;
  train: Train;
  date: string;
  departureStation: Station;
  arrivalStation: Station;
  seatType: number;
  carriage: Carriage;
  seat: Seat;
  price: number;
  status: number;
  refundAmount: number;
  refundTime: string;
}

// 改签记录类型定义
export interface ChangeRecord {
  id: number;
  ticket: Ticket;         // 原车票
  newTicket: Ticket;      // 新车票
  orderId: number;        // 订单ID
  changeFee: number;      // 改签费用
  priceDifference: number; // 票价差额
  status: number;         // 状态：0-处理中，1-改签成功，2-改签取消
  reason: string;         // 改签原因
}

// 改签记录查询参数
export interface ChangeRecordQueryParams {
  id?: number;
  ticketNo?: string;
  orderId?: number;
  username?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}

// 获取改签记录列表
export const getChangeRecords = (params?: ChangeRecordQueryParams) => {
  return get<ChangeRecord[]>('/change-records', params);
};

// 获取改签记录详情
export const getChangeRecordById = (id: number) => {
  return get<ChangeRecord>(`/change-records/${id}`);
};

// 更新改签记录状态
export const updateChangeRecordStatus = (id: number, status: number, reason?: string) => {
  return put<ChangeRecord>(`/change-records/${id}/status`, { status, reason });
};

// 取消改签
export const cancelChangeRecord = (id: number, reason: string) => {
  return put<ChangeRecord>(`/change-records/${id}/cancel`, { reason });
};

// 导出改签记录相关的API
export default {
  getChangeRecords,
  getChangeRecordById,
  updateChangeRecordStatus,
  cancelChangeRecord
}; 