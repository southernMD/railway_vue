 /**
 * 乘客相关接口
 */
import { get, post, put, del } from '@/utils/http';

// 乘客对象接口
export interface Passenger {
  id: number;
  userId: number;
  realName: string;
  idCard: string;
  phone: string;
  passengerType: number;
  isDefault: number;
}

// 乘客类型枚举
export enum PassengerType {
  ADULT = 0,
  CHILD = 1,
  STUDENT = 2,
  ELDERLY = 3
}


// 查询参数接口
export interface PassengerQuery {
  userId?: number;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 获取所有乘客信息
 * @param query 查询参数
 * @returns Promise<Passenger[]>
 */
export function getPassengers(query?: PassengerQuery) {
  return get<Passenger[]>('/passengers', query);
}

/**
 * 创建乘客
 * @param passenger 乘客信息
 * @returns Promise<Passenger>
 */
export function createPassenger(passenger: Omit<Passenger, 'id'>) {
  return post<Passenger>('/passengers', passenger);
}

/**
 * 根据ID获取乘客信息
 * @param id 乘客ID
 * @returns Promise<Passenger>
 */
export function getPassengerById(id: number) {
  return get<Passenger>(`/passengers/${id}`);
}

/**
 * 更新乘客信息
 * @param id 乘客ID
 * @param passenger 乘客信息
 * @returns Promise<Passenger>
 */
export function updatePassenger(id: number, passenger: Partial<Passenger>) {
  return put<Passenger>(`/passengers/${id}`, passenger);
}

/**
 * 删除乘客
 * @param id 乘客ID
 * @returns Promise<void>
 */
export function deletePassenger(id: number) {
  return del<void>(`/passengers/${id}`);
}

/**
 * 获取当前用户的所有乘客
 * @returns Promise<Passenger[]>
 */
export function getCurrentUserPassengers(userId: number) {
  return get<Passenger[]>(`/passengers/user/${userId}`);
}

/**
 * 设置默认乘客
 * @param id 乘客ID
 * @returns Promise<void>
 */
export function setDefaultPassenger(id: number,userId:number) {
  return put<void>(`/passengers/default`,{id,userId});
}

/**
 * 批量导入乘客
 * @param passengers 乘客列表
 * @returns Promise<Passenger[]>
 */
export function batchImportPassengers(passengers: Omit<Passenger, 'id'>[]) {
  return post<Passenger[]>('/passengers/batch', { passengers });
}

/**
 * 获取乘客类型名称
 * @param type 乘客类型
 * @returns 类型名称
 */
export function getPassengerTypeName(type: number): string {
  const typeMap: Record<number, string> = {
    [PassengerType.ADULT]: '成人',
    [PassengerType.CHILD]: '儿童',
    [PassengerType.STUDENT]: '学生',
    [PassengerType.ELDERLY]: '老年人'
  };
  return typeMap[type] || '未知';
}

export default {
  getPassengers,
  createPassenger,
  getPassengerById,
  updatePassenger,
  deletePassenger,
  getCurrentUserPassengers,
  setDefaultPassenger,
  batchImportPassengers,
  getPassengerTypeName,
};