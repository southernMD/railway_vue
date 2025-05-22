/**
 * 全局消息工具
 * 在 HTTP 工具中使用 ElMessage，需要先在全局范围内初始化
 */
import { ElMessage } from 'element-plus';

/**
 * 初始化全局消息
 */
export function initGlobalMessage() {
  // 将 ElMessage 附加到 window 对象
  window.ElMessage = {
    error: (message: string) => ElMessage.error(message),
    success: (message: string) => ElMessage.success(message),
    warning: (message: string) => ElMessage.warning(message),
    info: (message: string) => ElMessage.info(message),
  };
}

/**
 * 显示全局错误消息
 */
export function showError(message: string) {
  ElMessage.error(message);
}

/**
 * 显示全局成功消息
 */
export function showSuccess(message: string) {
  ElMessage.success(message);
}

/**
 * 显示全局警告消息
 */
export function showWarning(message: string) {
  ElMessage.warning(message);
}

/**
 * 显示全局信息消息
 */
export function showInfo(message: string) {
  ElMessage.info(message);
}

// 默认导出所有函数
export default {
  initGlobalMessage,
  showError,
  showSuccess,
  showWarning,
  showInfo,
}; 