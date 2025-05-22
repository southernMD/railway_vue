import { createApp } from 'vue'
// import ElementPlus from 'element-plus' // No longer needed for components
import 'element-plus/dist/index.css' // Still needed for base styles, or use unplugin-element-plus for style import
import App from './App.vue'
import router from './router'
// If you installed @element-plus/icons-vue and want to register them globally
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { initGlobalMessage } from './utils/globalMessage'

const app = createApp(App)

// 初始化全局消息工具
initGlobalMessage()

// Globally register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
// app.use(ElementPlus) // No longer needed if components are auto-imported

app.mount('#app')