<template>
  <el-main class="app-main-container">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </el-main>
</template>

<script setup>
// This component simply renders the routed page component with a transition.
</script>

<style scoped>
.app-main-container {
  padding: 20px;
  background-color: #e9eef3; /* Lightest grey background for content area */
  min-height: calc(100vh - 50px); /* Adjust 50px based on Navbar height */
}

/* Transition effect */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 