<template>
  <el-aside width="200px" class="sidebar-container">
    <el-scrollbar>
      <el-menu :default-openeds="['1', '2']" router>
        <el-menu-item index="/dashboard/index">
          <el-icon><Menu /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">
             <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Van /></el-icon>
            <span>车管理</span>
          </template>
          <el-menu-item index="/vehicle/station">
             <el-icon><Location /></el-icon>
            <span>车站管理</span>
          </el-menu-item>
          <el-menu-item index="/vehicle/train-model">
             <el-icon><TakeawayBox /></el-icon>
            <span>车型管理</span>
          </el-menu-item>
          <el-menu-item index="/vehicle/train-schedule">
             <el-icon><Calendar /></el-icon>
            <span>车次管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/order">
          <template #title>
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/order/list">
            <el-icon><List /></el-icon>
            <span>订单一览</span>
          </el-menu-item>
          <el-menu-item index="/order/waitlist">
            <el-icon><Timer /></el-icon>
            <span>订单候补</span>
          </el-menu-item>
          <el-menu-item index="/order/change-records">
            <el-icon><SetUp /></el-icon>
            <span>改签记录</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
// 导入 Element Plus 图标
import { Menu, Setting, User, Van, Location, TakeawayBox, Calendar, Tickets, List, Timer, SetUp } from '@element-plus/icons-vue'
</script>

<style scoped>
.sidebar-container {
  background-color: #f4f4f5; /* Light grey background */
  height: 100%;
}

.el-menu {
  border-right: none; /* Remove the default border */
}
</style> 