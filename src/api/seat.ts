/**
 * @Description: create by southernMD
 */
import http from '../utils/http'

export type Seat = {
    id: number
    carriageId: number,
    seatNumber:string
    status: number
}

export type CreateSeat = Omit<Seat,"id">

export const batchCreateSeat = (seats:CreateSeat[])=>{
    return http.post("/seats/batch",seats)
}

export const batchDeleteSeats = (seatIds: number[]) => {
    return http.post("/seats/batch-delete", { 
      seatIds, 
    });
  };
  
  // 更新导出
  export default {
    batchCreateSeat,
    batchDeleteSeats,
  };