import { get, post, put, del } from '@/utils/http';

// 候补订单相关的数据类型定义
export interface Station {
  createTime: string;
  updateTime: string;
  id: number;
  stationName: string;
  city: string;
  province: string;
  address: string;
  status: number;
}

export interface TrainSeatInfo {
  createTime: string;
  updateTime: string;
  id: number;
  noSeatTickets: number;
  businessPrice: number;
  firstClassPrice: number;
  secondClassPrice: number;
  noSeatPrice: number;
}

export interface TrainModel {
  createTime: string;
  updateTime: string;
  id: number;
  modelName: string;
  modelCode: string;
  maxCapacity: number;
}

export interface TrainStop {
  createTime: string;
  updateTime: string;
  id: number;
  trainId: number;
  station: Station;
  sequence: number;
  arrivalTime: string;
  stopDuration: number;
}

export interface User {
  createTime: string;
  updateTime: string;
  id: number;
  username: string;
  email: string;
  userType: number;
  status: number;
}

export interface Train {
  createTime: string;
  updateTime: string;
  id: number;
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

export interface WaitingOrder {
  createTime: string;
  updateTime: string;
  id: number;
  user: User;
  train: Train;
  date: string;
  departureStation: Station;
  arrivalStation: Station;
  seatType: number;
  passengerCount: number;
  status: number;
  expireTime: string;
}

// 候补订单查询参数
export interface WaitingOrderQueryParams {
  page?: number;
  size?: number;
  userId?: number;
  trainId?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
}

// 获取候补订单列表
export const getWaitingOrders = (params?: WaitingOrderQueryParams) => {
  return get<WaitingOrder[]>('/waiting-orders', params);
};

// 获取候补订单详情
export const getWaitingOrderById = (id: number) => {
  return get<WaitingOrder>(`/waiting-orders/${id}`);
};

// 创建候补订单
export const createWaitingOrder = (data: Partial<WaitingOrder>) => {
  return post<WaitingOrder>('/waiting-orders', data);
};

// 更新候补订单
export const updateWaitingOrder = (id: number, data: Partial<WaitingOrder>) => {
  return put<WaitingOrder>(`/waiting-orders/${id}`, data);
};

// 取消候补订单
export const cancelWaitingOrder = (id: number) => {
  return put<WaitingOrder>(`/waiting-orders/${id}/cancel`, {});
};

// 删除候补订单
export const deleteWaitingOrder = (id: number) => {
  return del<void>(`/waiting-orders/${id}`);
};

// 获取用户的候补订单
export const getUserWaitingOrders = (userId: number, params?: WaitingOrderQueryParams) => {
  return get<WaitingOrder[]>(`/users/${userId}/waiting-orders`, params);
};

// 获取列车的候补订单
export const getTrainWaitingOrders = (trainId: number, params?: WaitingOrderQueryParams) => {
  return get<WaitingOrder[]>(`/trains/${trainId}/waiting-orders`, params);
};

// 导出候补订单相关的API
export default {
  getWaitingOrders,
  getWaitingOrderById,
  createWaitingOrder,
  updateWaitingOrder,
  cancelWaitingOrder,
  deleteWaitingOrder,
  getUserWaitingOrders,
  getTrainWaitingOrders
};