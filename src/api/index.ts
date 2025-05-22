/**
 * API 接口导出文件
 */
import authApi from './auth';
import userApi from './user';
import stationApi from './station';

// 导出所有 API 接口
export {
  authApi,
  userApi,
  stationApi,
};

// 默认导出
export default {
  auth: authApi,
  user: userApi,
  station: stationApi
}; 