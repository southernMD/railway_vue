/**
 * 封装 fetch 的 HTTP 请求工具
 */

// API 基础 URL
const BASE_URL = '/api';

// 默认请求超时时间 (10 秒)
const DEFAULT_TIMEOUT = 10000;

// 接口响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 请求配置接口
export interface RequestOptions extends RequestInit {
  // 请求超时时间
  timeout?: number;
  // 请求参数（会自动转为 query string 或 JSON body）
  params?: Record<string, any>;
  // 是否不使用刷新令牌（用于刷新令牌接口本身）
  skipRefreshToken?: boolean;
}

// 刷新令牌的标志，防止多个请求同时触发刷新
let isRefreshing = false;
// 等待刷新令牌的请求队列
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * 处理刷新令牌后，执行队列中的请求
 */
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * 添加请求到等待队列
 */
const addSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * 刷新 token
 */
const refreshToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise(resolve => {
      addSubscriber(token => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('无刷新令牌');
    }

    // 调用刷新令牌 API
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      debugger
      throw new Error('刷新令牌失败');
    }

    const result: ApiResponse<{ token: string; refreshToken: string }> = await response.json();
    
    if (result.code !== 200) {
      throw new Error(result.message || '刷新令牌失败');
    }

    // 保存新的 token
    const { token, refreshToken: newRefreshToken } = result.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken);

    // 执行队列中的请求
    onRefreshed(token);
    return token;
  } catch (error) {
    // 刷新失败，清除所有令牌，并跳转到登录页
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    // 使用路由导航而不是直接修改 window.location
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * 处理 API 响应
 */
const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.code !== 200) {
    // 如果状态码不是 200，抛出错误
    throw new Error(response.message || '请求失败');
  }
  return response.data;
};

/**
 * 发送 HTTP 请求
 * @param url 请求地址
 * @param options 请求选项
 * @returns Promise 响应
 */
export const request = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { timeout = DEFAULT_TIMEOUT, params, skipRefreshToken = false, ...fetchOptions } = options;
  
  // 构建完整 URL
  let fullUrl = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  
  // 默认请求头
  const headers = new Headers(fetchOptions.headers || {});
  
  // 如果没有设置 Content-Type 并且不是 GET 请求，设置为 JSON
  if (!headers.has('Content-Type') && fetchOptions.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  
  // 获取存储的 token
  let token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // 构建请求配置
  const config: RequestInit = {
    ...fetchOptions,
    headers
  };
  
  // 处理请求参数
  if (params) {
    if (config.method === 'GET' || !config.method) {
      // 对于 GET 请求，将参数转换为查询字符串
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        fullUrl += `${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
      }
    } else {
      // 对于非 GET 请求，将参数转换为 JSON 主体
      config.body = JSON.stringify(params);
    }
  }
  
  // 封装请求发送函数
  const sendRequest = async (): Promise<Response> => {
    return Promise.race([
      fetch(fullUrl, config),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`请求超时: ${timeout}ms`));
        }, timeout);
      }),
    ]);
  };
  
  try {
    // 发送请求，带超时
    let response = await sendRequest();
    
    // 检查响应状态
    if (!response.ok) {
      // 如果是 401 未授权且不是刷新令牌请求，尝试刷新令牌
      if (response.status === 403 && !skipRefreshToken && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
        try {
          // 尝试刷新令牌
          token = await refreshToken();
          
          // 使用新令牌重新发起请求
          headers.set('Authorization', `Bearer ${token}`);
          config.headers = headers;
          
          response = await sendRequest();
          
          if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          throw error;
        }
      } else {
        // 其他错误状态码
        let errorMessage: string;
        try {
          // 尝试解析错误响应为 JSON
          const errorData = await response.json();
          errorMessage = errorData.message || `错误: ${response.status} ${response.statusText}`;
        } catch (e) {
          // 如果不是 JSON，使用状态文本
          errorMessage = `错误: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
    }
    
    // 解析响应 JSON
    const responseData: ApiResponse<T> = await response.json();
    
    // 处理 API 响应
    return handleApiResponse<T>(responseData);
  } catch (error) {
    // 处理网络错误或其他异常
    console.error('请求出错:', error);
    // 使用全局消息提示
    window.ElMessage?.error((error as Error).message || '请求失败');
    throw error;
  }
};

/**
 * HTTP GET 请求
 */
export const get = <T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> => {
  return request<T>(url, { ...options, method: 'GET', params });
};

/**
 * HTTP POST 请求
 */
export const post = <T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> => {
  return request<T>(url, { ...options, method: 'POST', params });
};

/**
 * HTTP PUT 请求
 */
export const put = <T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> => {
  return request<T>(url, { ...options, method: 'PUT', params });
};

/**
 * HTTP DELETE 请求
 */
export const del = <T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> => {
  return request<T>(url, { ...options, method: 'DELETE', params });
};

/**
 * HTTP PATCH 请求
 */
export const patch = <T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> => {
  return request<T>(url, { ...options, method: 'PATCH', params });
};

export default {
  request,
  get,
  post,
  put,
  del,
  patch
}; 