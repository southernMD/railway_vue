<template>
  <div class="temp-page-container">
    <div class="content">
      <el-card class="welcome-card">
        <template #header>
          <div class="card-header">
            <h2>欢迎访问临时页面</h2>
          </div>
        </template>
        <div class="card-content">
          <el-result
            icon="success"
            title="登录成功"
            sub-title="您已成功登录系统，但当前处于临时页面"
          >
            <template #extra>
              <div class="action-buttons">
                <el-button type="primary" @click="handleLogout">退出登录</el-button>
              </div>
            </template>
          </el-result>
          
          <div class="user-info">
            <h3>当前用户信息</h3>
            <p><strong>用户名:</strong> {{ userInfo.username }}</p>
            <p><strong>身份类型:</strong> 普通用户</p>
            <p class="note">注意：此页面仅作为临时演示，实际项目中应替换为正式的用户页面</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { authApi } from '@/api';

const router = useRouter();
const userInfo = ref<any>({
  username: '',
  isAdmin: false
});

// 获取用户信息
onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    try {
      userInfo.value = JSON.parse(userInfoStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
});

// 处理登出
const handleLogout = async () => {
  try {
    // 确认登出
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 调用登出接口
    // await authApi.logout();
    
    // 清除本地存储的用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    
    // 提示登出成功
    ElMessage.success('登出成功');
    
    // 跳转到登录页
    router.push('/login');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('登出失败:', error);
    }
  }
};
</script>

<style scoped>
.temp-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.content {
  width: 100%;
  max-width: 800px;
}

.welcome-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
  font-weight: 600;
}

.card-content {
  padding: 20px 0;
}

.user-info {
  margin-top: 30px;
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
}

.user-info h3 {
  margin-top: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.user-info p {
  margin: 10px 0;
  color: #606266;
}

.note {
  margin-top: 15px;
  color: #909399;
  font-size: 14px;
  font-style: italic;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}
</style> 