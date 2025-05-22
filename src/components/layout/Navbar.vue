<template>
  <el-header class="navbar-container">
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
          <span v-if="index === breadcrumbs.length - 1" class="no-redirect">{{ item.meta.title }}</span>
          <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right-menu">
      <!-- User avatar, dropdown, etc. -->
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          {{ username }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { authApi } from '@/api'

const route = useRoute()
const router = useRouter()
const username = ref('用户')

// 在组件挂载时获取用户信息
onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      username.value = userInfo.username || '用户'
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
})

interface BreadcrumbItem {
  path: string;
  meta: { title?: string };
  redirect?: string | { name: string };
}

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const first = matched[0]

  let crumbs: BreadcrumbItem[] = []

  if (first && first.path !== '/dashboard' && first.path !== '/') {
    // Add a dashboard link if the current route is not dashboard itself or a direct child of root
    // (unless the first matched route is already the root path leading to dashboard)
    if (route.path !== '/dashboard' && !(first.path === '/' && first.redirect === '/dashboard')) {
        crumbs.push({ path: '/dashboard', meta: { title: '仪表盘' } })
    }
  }
  
  matched.forEach(item => {
    // Type assertion for meta because we filtered for it.
    const meta = item.meta as { title: string; icon?: string; [key: string]: any };
    if (meta.title) {
      crumbs.push({
        path: item.path,
        meta: { title: meta.title },
        redirect: item.redirect as string | { name: string } | undefined
      } as BreadcrumbItem); // Added type assertion here for the whole object
    }
  });
  return crumbs;
})

// 处理面包屑导航链接点击
const handleLink = (item: BreadcrumbItem) => {
  const { redirect, path } = item
  if (redirect) {
    if (typeof redirect === 'string') {
      router.push(redirect)
    } else if (typeof redirect === 'object' && redirect.name) {
      router.push({ name: redirect.name })
    }
    return
  }
  router.push(path)
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      // 确认是否退出
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      
      // 调用登出接口
      // await authApi.logout()
      
      // 清除本地存储的认证信息
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      
      // 提示登出成功
      ElMessage.success('退出成功')
      
      // 跳转到登录页
      router.push('/login')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('登出失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.navbar-container {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff; /* White background */
  border-bottom: 1px solid #dcdfe6; /* Light grey border */
  padding: 0 20px;
}

.breadcrumb-container {
  flex-grow: 1; /* Allow breadcrumb to take available space */
}

.right-menu {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.no-redirect {
  color: #97a8be;
  cursor: text;
}

/* Styling for breadcrumb links */
a {
  text-decoration: none;
  color: #303133; /* Element Plus default text color */
}
a:hover {
  color: #409EFF; /* Element Plus primary color */
}
</style> 