/*
 * @Description: create by southernMD
 */

/**
 * API 接口导出文件
 */
import authApi from './auth';
import userApi from './user';
import stationApi from './station';
import carriagesApi from './carriages';
import seatApi from './seat';
import trainStopApi from './trainStop';
import order from './order';
import waitingOrdersApi from './waiting-orders';
import changeRecordsApi from './change-records';

// 导出所有 API 接口
export {
  authApi,
  userApi,
  stationApi,
  carriagesApi,
  seatApi,
  trainStopApi,
  order,
  waitingOrdersApi,
  changeRecordsApi
};

// 默认导出
export default {
  auth: authApi,
  user: userApi,
  station: stationApi,
  carriages: carriagesApi,
  seat: seatApi,
  trainStop: trainStopApi,
  order: order,
  waitingOrders: waitingOrdersApi,
  changeRecords: changeRecordsApi
}; 