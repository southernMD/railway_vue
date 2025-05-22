import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path' // Node.js path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ['vue', 'vue-router'],
      // 指定自动导入函数TS类型声明文件路径 (true: ./auto-imports.d.ts)
      dts: 'src/auto-imports.d.ts', 
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      // 指定自定义组件位置，默认是 src/components
      dirs: ['src/components'],
      // 指定自动生成组件TS类型声明文件路径 (true: ./components.d.ts)
      dts: 'src/components.d.ts',
      // 组件的有效文件扩展名。
      extensions: ['vue'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Set '@' alias to /src directory
    },
  },
  server: {
    proxy: {
      // Proxying API requests
      '/api': {
        target: 'http://localhost:8080', // Target host
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite path: remove /api prefix
      },
    },
  },
}) 