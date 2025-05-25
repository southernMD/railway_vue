<!--
 * @Description: create by southernMD
-->
<!--
 * @Description: create by southernMD
-->
<template>
  <el-menu
    :default-active="activeIndex"
    class="user-sidebar"
    :router="true"
    background-color="#f5f7fa"
    text-color="#303133"
    active-text-color="#409eff"
  >
    <el-menu-item index="/user/home">
      <el-icon><House /></el-icon>
      <span>用户首页</span>
    </el-menu-item>
    
    <el-menu-item index="/user/profile">
      <el-icon><UserFilled /></el-icon>
      <span>个人资料</span>
    </el-menu-item>
    
    <el-menu-item index="/user/tickets">
      <el-icon><Search /></el-icon>
      <span>车票查询</span>
    </el-menu-item>
    
    <el-sub-menu index="orders">
      <template #title>
        <el-icon><Tickets /></el-icon>
        <span>订单管理</span>
      </template>
      <el-menu-item index="/user/orders">全部订单</el-menu-item>
      <el-menu-item index="/user/orders/waitlist">候补订单</el-menu-item>
      <el-menu-item index="/user/orders/changes">改签记录</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  House, 
  UserFilled, 
  Search,
  Tickets
} from '@element-plus/icons-vue';

const route = useRoute();
const activeIndex = ref('/user/home');

// 根据当前路由设置活动菜单项
const setActiveMenuItem = () => {
  const { path } = route;
  if (path.startsWith('/user/orders/')) {
    activeIndex.value = 'orders';
  } else {
    activeIndex.value = path;
  }
};

// 监听路由变化
watch(() => route.path, () => {
  setActiveMenuItem();
});

// 组件挂载时设置活动菜单项
onMounted(() => {
  setActiveMenuItem();
});
</script>

<style scoped>
.user-sidebar {
  height: 100%;
  border-right: none;
}

.el-menu-item, .el-sub-menu {
  font-size: 14px;
}

.el-menu-item [class^="el-icon-"] {
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
  vertical-align: middle;
}
</style> 