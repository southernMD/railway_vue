import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '../components/layout/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import UserManagement from '../views/system/UserManagement.vue'
import StationManagement from '../views/station/StationManagement.vue'
import TrainModelManagement from '../views/vehicle/TrainModelManagement.vue'
import LoginRegister from '../views/LoginRegister.vue'
import TempPage from '../views/TempPage.vue'
import { ElMessage } from 'element-plus'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'LoginRegister',
    component: LoginRegister,
    meta: { title: '登录/注册' }
  },
  {
    path: '/temp-page',
    name: 'TempPage',
    component: TempPage,
    meta: { title: '临时页面', requiresAuth: true }
  },
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/index',
    children: [
      {
        path: 'index',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', icon: 'Menu', requiresAuth: true, requiresAdmin: true } 
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    name: 'System',
    meta: { title: '系统管理', icon: 'Setting', requiresAuth: true, requiresAdmin: true }, 
    children: [
      {
        path: 'user',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理', icon: 'User', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },
  {
    path: '/vehicle',
    component: Layout,
    redirect: '/vehicle/station',
    name: 'VehicleManagement',
    meta: { title: '车管理', icon: 'Van', requiresAuth: true, requiresAdmin: true }, 
    children: [
      {
        path: 'station',
        name: 'StationManagement',
        component: StationManagement,
        meta: { title: '车站管理', icon: 'Location', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'train-model',
        name: 'TrainModelManagement',
        component: TrainModelManagement,
        meta: { title: '车型管理', icon: 'TakeawayBox', requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
  // 后续会在这里添加更多包含二级菜单的路由
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 添加路由守卫，控制未登录用户只能访问登录页面
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token'); // 从 localStorage 中获取 token
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  
  // 获取用户信息，检查是否是管理员
  const userInfoStr = localStorage.getItem('userInfo');
  let isAdmin = false;
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr);
      isAdmin = userInfo.isAdmin === true || userInfo.admin === 'true';
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
  
  if (requiresAuth && !token) {
    // 如果路由需要认证且用户未登录，则重定向到登录页
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (requiresAdmin && !isAdmin) {
    // 如果路由需要管理员权限但用户不是管理员，则重定向到临时页面
    ElMessage.error('您没有权限访问该页面');
    next({ path: '/temp-page' });
  } else if (to.path === '/login' && token) {
    // 如果用户已登录但尝试访问登录页
    // 根据用户角色决定跳转到仪表盘或临时页面
    next({ path: isAdmin ? '/dashboard/index' : '/temp-page' });
  } else {
    // 其他情况正常放行
    next();
  }
});

export default router 