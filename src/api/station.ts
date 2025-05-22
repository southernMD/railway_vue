/**
 * 车站管理相关的 API 接口
 */
import http from '@/utils/http'

// 车站接口定义
export interface Station {
  id: number
  stationName: string
  city: string
  province: string
  address: string
  status: number
}

// 创建车站参数
export interface CreateStationParams {
  stationName: string
  city: string
  province: string
  address: string
  status: number
}

// 查询参数
export interface StationQueryParams {
  query?: string
  status?: number
}

// 获取所有车站列表（不分页）
export const getStations = (params?: StationQueryParams): Promise<Station[]> => {
  return http.get('/station', { params })
}

// 获取单个车站详情
export const getStationById = (id: number): Promise<Station> => {
  return http.get(`/station/${id}`)
}

// 创建车站
export const createStation = (data: CreateStationParams): Promise<null> => {
  return http.post('/station', data)
}

// 更新车站
export const updateStation = (data: Station): Promise<null> => {
  return http.put(`/station`, data)
}

// 删除车站
export const deleteStation = (id: number): Promise<null> => {
  return http.del(`/station/${id}`)
}

export default {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
}; 