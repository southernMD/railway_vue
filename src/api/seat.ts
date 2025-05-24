/*
 * @Description: create by southernMD
 */
/**
 * @Description: create by southernMD
 */
import http from '../utils/http'

export type Seat = {
  id: number
  carriageId: number,
  seatNumber: string
  status: number
}
export type SeatLock = {
  seatId: number,
  lockStart: string,
  expireTime: string,
  reason: string,
  type: number
}
export type CreateSeat = Omit<Seat, "id">

export const batchCreateSeat = (seats: CreateSeat[]) => {
  return http.post("/seats/batch", seats)
}

export const batchDeleteSeats = (seatIds: number[]) => {
  return http.post("/seats/batch-delete", {
    seatIds,
  });
};

/**
 * 座位锁定
 * 
*/
export const createSeatLock = (data: SeatLock) => {
  return http.post("/seat-locks", data);
};


export const cancelSeatLock = (lockId: number) => {
  return http.del(`/seat-locks/${lockId}`);
};
export const finishSeatLock = (lockId: number) => {
  return http.put(`/seat-locks/${lockId}`);
};


// 更新导出
export default {
  batchCreateSeat,
  batchDeleteSeats,
  createSeatLock,
  cancelSeatLock,
  finishSeatLock 
};