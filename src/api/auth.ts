/**
 * 认证相关的 API 接口
 */
import http from '@/utils/http';

// 登录响应数据
export interface LoginResponse {
  userId: number;
  username: string;
  accessToken: string;
  refreshToken: string;
  admin: boolean;
  email: string;
}

// 登录参数
export interface LoginByUsernameParams {
  username: string;
  password: string;
}

export interface LoginByEmailParams {
  email: string;
  password: string;
}

// 注册参数
export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export interface RegisterResponse {
  email: string,
  accessToken: string,
  refreshToken: string,
  userId: number,
  admin: true
  username: string;
}

/**
 * 用户名登录
 */
export const loginByUsername = (params: LoginByUsernameParams) => {
  return http.post<LoginResponse>('/auth/login/username', params);
};

/**
 * 邮箱登录
 */
export const loginByEmail = (params: LoginByEmailParams) => {
  return http.post<LoginResponse>('/auth/login/email', params);
};

/**
 * 用户注册
 */
export const register = (params: RegisterParams) => {
  return http.post<RegisterResponse>('/auth/register', params);
};

/**
 * 发送验证码
 */
export const sendVerificationCode = (email: string) => {
  return http.get<null>(`/auth/send-code?email=${encodeURIComponent(email)}`);
};

/**
 * 刷新 token
 */
export const refreshToken = (refreshToken: string) => {
  return http.post<{token: string, refreshToken: string}>(
    '/auth/refresh', 
    {}, // 空对象作为请求体
    { 
      skipRefreshToken: true,
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    }
  );
};

/**
 * 登出
 */
export const logout = () => {
  return http.post<null>('/auth/logout');
};

export default {
  loginByUsername,
  loginByEmail,
  register,
  sendVerificationCode,
  refreshToken,
  logout
}; 