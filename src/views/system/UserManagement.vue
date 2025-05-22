<template>
  <div class="user-management-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="dialogVisible = true">添加管理员</el-button>
    </div>
    
    <el-card class="table-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱"
          clearable
          @clear="handleSearch"
          style="width: 300px;"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="handleSearch" style="width: 150px; margin-left: 10px;">
          <el-option label="全部" :value="0" style="display: none;" />
          <el-option label="正常" :value="1" />
          <el-option label="已封禁" :value="0" />
        </el-select>
      </div>
      
      <!-- 用户表格 -->
      <el-table
        v-loading="loading"
        :data="filteredTableData"
        style="width: 100%; margin-top: 20px;"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="scope">
            <div class="username-cell">
              <span>{{ scope.row.username }}</span>
              <el-tag v-if="scope.row.username === currentUsername" size="small" type="info" effect="plain" class="current-user-tag">
                当前用户
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="用户类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.userType === 1 ? 'danger' : 'info'">
              {{ scope.row.userType === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '已封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="formattedCreateTime" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 1"
              type="danger"
              size="small"
              @click="handleBanUser(scope.row)"
              :disabled="scope.row.username === currentUsername"
            >
              封禁
            </el-button>
            <el-button
              v-else
              type="success"
              size="small"
              @click="handleUnbanUser(scope.row)"
            >
              解封
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加管理员用户"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddUser" :loading="submitting">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import type { User, CreateUserResponse } from '@/api/user'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表格数据
const tableData = ref<User[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref<number>(0) // 默认全部，但由于Element UI的限制，使用0作为全部的值
const currentUsername = ref('') // 当前登录用户的用户名

// 添加用户表单
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = ref<FormRules>({
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
        if (value !== form.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  return tableData.value
    .filter(item => {
      // 关键词过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        return (
          item.username.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword)
        )
      }
      return true
    })
    .filter(item => {
      // 状态过滤（0是全部，我们在视图中隐藏了但存在）
      if (statusFilter.value === 0) {
        return true; // 如果是0（全部），返回所有项
      }
      return item.status === statusFilter.value
    })
    .map(item => ({
      ...item,
      formattedCreateTime: formatDateTime(item.createTime)
    }))
})

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm:ss')
}

// 获取当前用户信息
onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      currentUsername.value = userInfo.username || ''
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
  
  // 获取用户列表
  fetchUsers()
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await userApi.getAllUsers()
    tableData.value = result
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 添加用户
const handleAddUser = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // 调用创建用户API
        const result = await userApi.createUser({
          username: form.value.username,
          email: form.value.email,
          password: form.value.password
        })
        
        ElMessage.success('添加用户成功')
        
        // 保存登录凭证
        localStorage.setItem('token', result.accessToken)
        localStorage.setItem('refreshToken', result.refreshToken)
        localStorage.setItem('userInfo', JSON.stringify({
          userId: result.userId,
          username: result.username,
          isAdmin: result.admin
        }))
        
        // 关闭对话框
        dialogVisible.value = false
        
        // 重置表单
        form.value = {
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
        
        // 直接跳转到临时页面
        router.push('/temp-page')
      } catch (error) {
        console.error('添加用户失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 封禁用户
const handleBanUser = async (user: User) => {
  // 检查是否是当前用户自己
  if (user.username === currentUsername.value) {
    ElMessage.warning('您不能封禁自己的账号')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 ${user.username} 吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.banUser(user.id)
    ElMessage.success(`已封禁用户 ${user.username}`)
    
    // 刷新用户列表
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('封禁用户失败:', error)
    }
  }
}

// 解封用户
const handleUnbanUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封用户 ${user.username} 吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.unbanUser(user.id)
    ElMessage.success(`已解封用户 ${user.username}`)
    
    // 刷新用户列表
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解封用户失败:', error)
    }
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.search-area {
  display: flex;
  margin-bottom: 15px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-user-tag {
  margin-left: 5px;
}
</style>