/**
 * 全局类型声明
 */

// 扩展 Window 接口以包含 ElMessage
declare interface Window {
  ElMessage: {
    error: (message: string) => void;
    success: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
} 