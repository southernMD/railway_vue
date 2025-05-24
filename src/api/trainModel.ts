/*
 * @Description: create by southernMD
 */
import http from '@/utils/http'

// 座位接口定义
export interface Seat {
  // 暂时为空，将来可能会扩展
}

// 车厢接口定义
export interface Carriage {
  createTime: string
  updateTime: string
  id: number
  modelId: number
  carriageNumber: number
  carriageType: number // 0-商务座，1-一等座，2-二等座
  seatCount: number
  seats: Seat[]
}

// 车型接口定义
export interface TrainModel {
  id: number
  modelName: string
  modelCode: string
  status: number
  maxCapacity: number
  description: string
  carriages: Carriage[]
}

export interface TrainModelSimple {
  id: number,
  modelName: string,
  modelCode: string,
  maxCapacity: number,
  totalSeats: number
}

// 获取所有车型
export function getTrainModels() {
  return http.get<TrainModel[]>('/train-models')
}
// 获取所有车型的简单信息
export function getTrainModelsSimple() {
  return http.get<TrainModelSimple[]>('/train-models/simple')
}

// 根据ID获取车型详情
export function getTrainModelById(id: number) {
  return http.get<TrainModel>(`/train-models/${id}`)
}

// 创建车型
export function createTrainModel(data: Omit<TrainModel, 'id'>) {
  return http.post<null>('/train-models', data)
}

// 更新车型
export function updateTrainModel(data: TrainModel) {
  return http.put<null>(`/train-models/${data.id}`, data)
}

// 删除车型
export function deleteTrainModel(id: number) {
  return http.del<null>(`/train-models/${id}`)
} 