<template>
  <div class="login-register-container">
    <div class="form-container">
      <div class="toggle-container">
        <el-button 
          type="text" 
          :class="{ active: activeForm === 'login' }" 
          @click="activeForm = 'login'"
        >
          登录
        </el-button>
        <span class="divider">|</span>
        <el-button 
          type="text" 
          :class="{ active: activeForm === 'register' }" 
          @click="activeForm = 'register'"
        >
          注册
        </el-button>
      </div>
      
      <!-- 登录表单 -->
      <el-form 
        v-if="activeForm === 'login'" 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="loginRules" 
        label-position="top"
        status-icon
      >
        <h2>用户登录</h2>
        
        <!-- 登录类型切换 -->
        <el-radio-group v-model="loginType" class="login-type-toggle">
          <el-radio label="username">用户名登录</el-radio>
          <el-radio label="email">邮箱登录</el-radio>
        </el-radio-group>
        
        <!-- 用户名/邮箱输入 -->
        <el-form-item :label="loginType === 'username' ? '用户名' : '邮箱'" prop="account">
          <el-input 
            v-model="loginForm.account" 
            :placeholder="loginType === 'username' ? '请输入用户名' : '请输入邮箱'"
          >
            <template #prefix>
              <el-icon><User v-if="loginType === 'username'" /><Message v-else /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 密码输入 -->
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 管理员登录选项 -->
        <div class="admin-login-option">
          <el-checkbox v-model="loginForm.isAdmin">以管理员身份登录</el-checkbox>
        </div>
        
        <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading">
          登录
        </el-button>
      </el-form>
      
      <!-- 注册表单 -->
      <el-form 
        v-else 
        ref="registerFormRef"
        :model="registerForm" 
        :rules="registerRules" 
        label-position="top"
        status-icon
      >
        <h2>用户注册</h2>
        
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="请输入邮箱"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码" 
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 验证码 -->
        <el-form-item label="验证码" prop="verificationCode">
          <div class="verification-code-container">
            <el-input 
              v-model="registerForm.verificationCode" 
              placeholder="请输入验证码"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button 
              type="primary" 
              :disabled="!isEmailValid || countDown > 0" 
              @click="sendVerificationCode"
            >
              {{ countDown > 0 ? `${countDown}秒后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-button type="primary" class="submit-btn" @click="handleRegister" :loading="loading">
          注册
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入必要的模块
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// 导入图标组件
import { User, Message, Lock, Key } from '@element-plus/icons-vue'
// 导入 API
import { authApi } from '@/api'
import { LoginResponse } from '@/api/auth'

// 表单激活状态
const activeForm = ref('login')
const loginType = ref('username')
const loading = ref(false)
const router = useRouter()

// 验证码倒计时
const countDown = ref(0)
let timer: number | null = null

// 登录表单数据
const loginFormRef = ref<FormInstance>()
const loginForm = ref({
  account: '',
  password: '',
  isAdmin: false
})

// 登录表单验证规则
const loginRules = ref<FormRules>({
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (loginType.value === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            callback(new Error('请输入有效的邮箱地址'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
})

// 注册表单数据
const registerFormRef = ref<FormInstance>()
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
})

// 注册表单验证规则
const registerRules = ref<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度应在4到6个字符之间', trigger: 'blur' }
  ]
})

// 判断邮箱是否有效
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(registerForm.value.email)
})

// 发送验证码
const sendVerificationCode = async () => {
  if (!isEmailValid.value) {
    ElMessage.warning('请先输入有效的邮箱地址')
    return
  }
  
  // 开始倒计时
  countDown.value = 10 // 10秒倒计时
  timer = window.setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, 1000)
  
  try {
    // 调用发送验证码 API
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '发送验证码中...' })
    
    await authApi.sendVerificationCode(registerForm.value.email)
    
    loadingInstance.close()
    ElMessage.success(`验证码已发送到邮箱: ${registerForm.value.email}`)
  } catch (error) {
    // 如果发送验证码失败，停止倒计时
    if (timer) {
      clearInterval(timer)
      timer = null
      countDown.value = 0
    }
    // HTTP 工具已经处理了错误提示，这里不需要重复处理
    console.error('发送验证码失败:', error)
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      
      try {
        // 根据登录类型选择不同的 API
        let result:LoginResponse
        if (loginType.value === 'username') {
          result = await authApi.loginByUsername({
            username: loginForm.value.account,
            password: loginForm.value.password
          })
        } else {
          result = await authApi.loginByEmail({
            email: loginForm.value.account,
            password: loginForm.value.password
          })
        }
        
        console.log(result);
        
        // 检查管理员身份
        const isRealAdmin = result.admin == true; // 从后端返回的结果判断是否为管理员
        
        // 如果用户勾选了管理员登录但实际不是管理员
        if (loginForm.value.isAdmin && !isRealAdmin) {
          ElMessage.error('您不是管理员，无法以管理员身份登录');
          loading.value = false;
          return;
        }
        
        // 保存 token 到本地存储
        localStorage.setItem('token', result.accessToken)
        localStorage.setItem('refreshToken', result.refreshToken)
        localStorage.setItem('userInfo', JSON.stringify({
          userId: result.userId,
          username: result.username,
          isAdmin: isRealAdmin && loginForm.value.isAdmin, // 只有真实管理员且勾选了管理员登录才设置为管理员
          email: result.email
        }))
        
        // 登录成功提示
        const role = isRealAdmin && loginForm.value.isAdmin ? '管理员' : '普通用户'
        ElMessage.success(`以${role}身份登录成功`)
        
        // 判断跳转路径
        let redirectPath = '/user/home'; // 默认为用户首页，不再跳转到临时页面
        
        // 如果是管理员并且勾选了管理员登录选项，则跳转到仪表盘
        if (isRealAdmin && loginForm.value.isAdmin) {
          redirectPath = '/dashboard/index';
        }
        
        // 跳转到对应页面
        router.push(redirectPath)
      } catch (error) {
        // HTTP 工具已经处理了错误提示，这里不需要重复处理
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      
      try {
        // 调用注册 API
        const result = await authApi.register({
          username: registerForm.value.username,
          email: registerForm.value.email,
          password: registerForm.value.password,
          confirmPassword: registerForm.value.confirmPassword,
          verificationCode: registerForm.value.verificationCode
        })
        localStorage.setItem('token', result.accessToken)
        localStorage.setItem('refreshToken', result.refreshToken)
        localStorage.setItem('userInfo', JSON.stringify({
          userId: result.userId,
          username: result.username,
          isAdmin: false,
          email: result.email
        }))
        
        router.push('/user/home');
        
      } catch (error) {
        // HTTP 工具已经处理了错误提示，这里不需要重复处理
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 组件销毁前清理定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.login-register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.form-container {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.divider {
  margin: 0 10px;
  color: #dcdfe6;
  align-self: center;
}

.active {
  color: #409EFF;
  font-weight: bold;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #303133;
}

.login-type-toggle {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-around;
}

.admin-login-option {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
}

.verification-code-container {
  display: flex;
  gap: 10px;
}

.verification-code-container .el-input {
  flex-grow: 1;
}

.verification-code-container .el-button {
  width: 120px;
  flex-shrink: 0;
}
</style> 