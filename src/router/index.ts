import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '../components/layout/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import UserManagement from '../views/system/UserManagement.vue'
import StationManagement from '../views/station/StationManagement.vue'
import TrainModelManagement from '../views/vehicle/TrainModelManagement.vue'
import LoginRegister from '../views/LoginRegister.vue'
import TempPage from '../views/TempPage.vue'
import { ElMessage } from 'element-plus'
import TrainScheduleManagement from '../views/vehicle/TrainScheduleManagement.vue'

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
      },
      {
        path: 'train-schedule',
        name: 'TrainScheduleManagement',
        component: TrainScheduleManagement,
        meta: { title: '车次管理', icon: 'Calendar', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },
  {
    path: '/order',
    component: Layout,
    meta: {
      title: '订单管理',
      icon: 'Tickets',
      requiresAuth: true
    },
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
        meta: {
          title: '订单一览',
          icon: 'List',
          requiresAuth: true
        }
      },
      {
        path: 'waitlist',
        name: 'OrderWaitlist',
        component: () => import('@/views/order/OrderWaitlist.vue'),
        meta: {
          title: '订单候补',
          icon: 'Timer',
          requiresAuth: true
        }
      },
      {
        path: 'change-records',
        name: 'ChangeRecords',
        component: () => import('@/views/order/ChangeRecords.vue'),
        meta: {
          title: '改签记录',
          icon: 'SetUp',
          requiresAuth: true
        }
      }
    ]
  },
  // 用户模块路由配置
  {
    path: '/user',
    component: () => import('@/components/user/UserLayout.vue'),
    redirect: '/user/home',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'home',
        name: 'UserHome',
        component: () => import('@/views/user/UserHome.vue'),
        meta: {
          title: '用户首页',
          icon: 'House',
          requiresAuth: true
        }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/Profile.vue'),
        meta: {
          title: '个人资料',
          icon: 'UserFilled',
          requiresAuth: true
        }
      },
      {
        path: 'tickets',
        name: 'TicketSearch',
        component: () => import('@/views/user/TicketSearch.vue'),
        meta: {
          title: '车票查询',
          icon: 'Search',
          requiresAuth: true
        }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('@/views/user/order/OrderList.vue'),
        meta: {
          title: '我的订单',
          icon: 'Tickets',
          requiresAuth: true
        }
      },
      {
        path: 'order/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/user/order/OrderDetail.vue'),
        meta: {
          title: '订单详情',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'order/change/:id',
        name: 'TicketChange',
        component: () => import('@/views/user/TicketChange.vue'),
        meta: {
          title: '车票改签',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'order/refund/:id',
        name: 'TicketRefund',
        component: () => import('@/views/user/TicketRefund.vue'),
        meta: {
          title: '车票退票',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'orders/changes',
        name: 'userChangeRecords',
        component: () => import('@/views/order/ChangeRecords.vue'),
        meta: {
          title: '改签记录',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'orders/waitlist',
        name: 'userOrderWaitlist',
        component: () => import('@/views/user/order/OrderWaitlist.vue'),
        meta: {
          title: '候补订单',
          requiresAuth: true,
          hidden: true
        }
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
    // 如果路由需要管理员权限但用户不是管理员，则重定向到用户首页
    ElMessage.error('您没有权限访问该页面');
    next({ path: '/user/home' });
  } else if (to.path === '/login' && token) {
    // 如果用户已登录但尝试访问登录页
    // 根据用户角色决定跳转到仪表盘或用户首页
    next({ path: isAdmin ? '/dashboard/index' : '/user/home' });
  } else {
    // 其他情况正常放行
    next();
  }
});

export default router 