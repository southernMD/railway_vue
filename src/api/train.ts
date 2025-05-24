/*
 * @Description: create by southernMD
 */
/*
 * @Description: create by southernMD
 */
import http from '@/utils/http'

// 车次接口类型定义
export interface TrainSeatInfo {
  id?: number
  noSeatTickets: number
  businessPrice: number
  firstClassPrice: number
  secondClassPrice: number
  noSeatPrice: number
}

export interface Train {
  id: number
  trainNumber: string
  startStation: {
    id: number
    stationName: string
    [key: string]: any
  }
  endStation: {
    id: number
    stationName: string
    [key: string]: any
  }
  model?: {
    id: number
    modelName: string
    modelCode: string
    maxCapacity: number
    [key: string]: any
  }
  date: string
  departureTime: string
  arrivalTime: string
  createTime: string
  updateTime: string
  trainSeatInfo: TrainSeatInfo
  trainStops: any[]
  totalSeats?: number // 已分配的座位数量
}

// 车次查询参数
export interface TrainQuery {
  trainNumber?: string
  startStationId?: number
  endStationId?: number
  date?: string
}

// 创建车次参数
export interface CreateTrainDto {
  trainNumber: string
  startStationId: number
  endStationId: number
  modelId: number
  date: string
  departureTime: string
  arrivalTime: string
  trainSeatInfo: {
    noSeatTickets: number
    businessPrice: number
    firstClassPrice: number
    secondClassPrice: number
    noSeatPrice: number
  }
}

// 车次API
export default {
  // 获取所有车次 - GET /trains 查询所有列车信息
  getAllTrains() {
    return http.get<Train[]>('trains')
  },
  
  // 获取单个车次详情 - GET /trains/{id} 根据ID查询列车信息
  getTrainById(id: number) {
    return http.get<Train>(`trains/${id}`)
  },
  
  // 创建新车次 - POST /trains 创建列车记录
  createTrain(data: CreateTrainDto) {
    return http.post<Train>('trains', data)
  },
  
  // 更新车次信息 - PUT /trains/{id} 更新列车记录
  updateTrain(data: CreateTrainDto & { id: number }) {
    return http.put<Train>(`trains/${data.id}`, data)
  },
  
  // 删除车次 - DELETE /trains/{id} 删除列车记录
  deleteTrain(id: number) {
    return http.del<boolean>(`trains/${id}`)
  }
}
