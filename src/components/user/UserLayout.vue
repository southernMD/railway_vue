<template>
  <div class="user-layout">
    <el-container>
      <el-aside width="250px" class="user-aside">
        <div class="logo">
          <span class="logo-text">铁路票务系统</span>
        </div>
        <UserSidebar />
      </el-aside>
      
      <el-container>
        <el-header height="60px" class="user-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/user/home' }">用户中心</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentRoute.meta.title">{{ currentRoute.meta.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-dropdown-link">
                {{ username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="user-main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
        
        <el-footer height="50px" class="user-footer">
          <div class="footer-content">
            © 2023 铁路票务系统 - 版权所有
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import UserSidebar from '@/components/user/UserSidebar.vue';

const route = useRoute();
const router = useRouter();
const username = ref('用户名'); // 实际应用中应从用户状态获取

// 获取当前路由
const currentRoute = computed(() => route);

// 处理用户下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/user/profile');
  } else if (command === 'password') {
    // 显示修改密码对话框逻辑
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 清除用户登录状态
      localStorage.removeItem('token');
      // 跳转到登录页
      router.push('/login');
    }).catch(() => {});
  }
};
</script>

<style scoped>
.user-layout {
  height: 100vh;
  overflow: hidden;
}

.user-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #409eff;
  color: white;
}

.logo-img {
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  font-size: 16px;
  font-weight: bold;
}

.user-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.user-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.user-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px - 50px);
  box-sizing: border-box;
}

.user-footer {
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-content {
  color: #909399;
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 