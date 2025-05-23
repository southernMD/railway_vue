/*
 * @Description: create by southernMD
 */
import http from '@/utils/http'

// 定义车厢接口
export interface Carriage {
  modelId: number;
  carriageNumber: number;
  carriageType: number;
  seats: any[];
}

// 交换车厢参数接口
export interface SwapCarriagesParams {
  carriageId1: number;
  carriageId2: number;
}

// 交换车厢位置
export const swapCarriages = ({carriageId1, carriageId2}: SwapCarriagesParams): Promise<[Carriage, Carriage]> => {
  return http.get(`/carriages/swap?carriageId1=${carriageId1}&carriageId2=${carriageId2}`)
}

// 创建新车厢
export const createCarriage = (carriage: Carriage): Promise<Carriage> => {
  return http.post('/carriages', carriage)
}

// 获取车厢详情
export const getCarriage = (id: number): Promise<Carriage> => {
  return http.get(`/carriages/${id}`)
}

// 获取车型下所有车厢
export const getCarriagesByModelId = (modelId: number): Promise<Carriage[]> => {
  return http.get('/carriages', { modelId })
}
// 更新车厢
export const updateCarriage = (id: number, carriage: Carriage): Promise<Carriage> => {
  return http.put(`/carriages/${id}`, carriage)
}

// 删除车厢
export const deleteCarriage = (id: number): Promise<any> => {
  return http.del(`/carriages/${id}`)
}
//批量更新/batch-update
export const batchUpdateCarriages = (carriages: Carriage[]): Promise<Carriage[]> => {
  return http.put('/carriages/batch-update', carriages)
}
export default {
  swapCarriages,
  createCarriage,
  getCarriage,
  getCarriagesByModelId,
  updateCarriage,
  deleteCarriage,
  batchUpdateCarriages
}
