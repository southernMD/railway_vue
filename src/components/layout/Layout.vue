<template>
  <el-container class="layout-container">
    <Sidebar />
    <el-container direction="vertical">
      <Navbar />
      <AppMain />
    </el-container>
  </el-container>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue' // Assuming you will have a Navbar
import AppMain from './AppMain.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
</style> 