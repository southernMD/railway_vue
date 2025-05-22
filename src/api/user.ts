/**
 * 用户管理相关的 API 接口
 */
import http from '@/utils/http';

// 用户信息接口
export interface User {
  id: number;
  username: string;
  email: string;
  userType: number;
  status: number;
  createTime: string;
}

// 创建用户参数
export interface CreateUserParams {
  username: string;
  password: string;
  email: string;
}

// 创建用户返回数据
export interface CreateUserResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  admin: boolean;
}

/**
 * 获取所有用户列表
 */
export const getAllUsers = () => {
  return http.get<User[]>('/users');
};

/**
 * 创建新用户（管理员）
 */
export const createUser = (params: CreateUserParams) => {
  return http.post<CreateUserResponse>('/users', params);
};

/**
 * 封禁用户
 */
export const banUser = (userId: number) => {
  return http.post<null>(`/users/${userId}/ban`);
};

/**
 * 解封用户
 */
export const unbanUser = (userId: number) => {
  return http.post<null>(`/users/${userId}/unBan`);
};

export default {
  getAllUsers,
  createUser,
  banUser,
  unbanUser
}; 