<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 左侧导航 - 已缩小宽度 -->
      <el-col :span="4">
        <el-card class="profile-nav-card">
          <div class="user-profile-header">
            <!-- 删除头像 -->
            <h2 class="username">{{ userInfo.username }}</h2>
          </div>
          
          <el-menu
            :default-active="activeMenu"
            class="profile-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="info">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </el-menu-item>
            <el-menu-item index="passengers">
              <el-icon><UserFilled /></el-icon>
              <span>乘客管理</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <!-- 右侧内容 - 已增加宽度 -->
      <el-col :span="20">
        <!-- 个人信息 -->
        <el-card v-if="activeMenu === 'info'" class="content-card">
          <template #header>
            <div class="card-header">
              <h3>个人信息</h3>
            </div>
          </template>
          
          <el-form 
            :model="userInfo" 
            label-width="100px"
            disabled
          >
            <el-form-item label="用户名">
              <el-input v-model="userInfo.username"></el-input>
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="userInfo.email"></el-input>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 乘客管理 -->
        <el-card v-if="activeMenu === 'passengers'" class="content-card">
          <template #header>
            <div class="card-header">
              <h3>常用乘客管理</h3>
              <el-button type="primary" @click="showAddPassengerDialog">
                <el-icon><Plus /></el-icon> 添加乘客
              </el-button>
            </div>
          </template>
          
          <div class="passenger-list" v-loading="loading">
            <template v-if="passengers.length > 0">
              <el-table
                :data="passengers"
                border
                style="width: 100%"
              >
                <el-table-column label="姓名" prop="realName" min-width="100"></el-table-column>
                <el-table-column label="证件号码" min-width="180">
                  <template #default="scope">
                    {{ maskIdCard(scope.row.idCard) }}
                  </template>
                </el-table-column>
                <el-table-column label="乘客类型" min-width="120">
                  <template #default="scope">
                    {{ getPassengerTypeName(scope.row.passengerType) }}
                  </template>
                </el-table-column>
                <el-table-column label="手机号码" prop="phone" min-width="140"></el-table-column>
                <el-table-column label="默认" min-width="80" align="center">
                  <template #default="scope">
                    <el-tag v-if="scope.row.isDefault === 1" type="success">默认</el-tag>
                    <el-button 
                      v-else 
                      type="text" 
                      @click="setAsDefault(scope.row.id)"
                    >
                      设为默认
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="操作" min-width="150" fixed="right">
                  <template #default="scope">
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="editPassenger(scope.row)"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small"
                      :disabled="scope.row.isDefault === 1"
                      @click="deletePassenger(scope.row.id)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
            
            <el-empty 
              v-else 
              description="暂无常用乘客" 
              :image-size="200"
            >
              <el-button type="primary" @click="showAddPassengerDialog">添加乘客</el-button>
            </el-empty>
          </div>
          
          <!-- 添加/编辑乘客对话框 -->
          <el-dialog
            v-model="passengerDialogVisible"
            :title="isEdit ? '编辑乘客' : '添加乘客'"
            width="600px"
            destroy-on-close
          >
            <el-form
              ref="passengerFormRef"
              :model="passengerForm"
              :rules="passengerRules"
              label-width="100px"
            >
              <el-form-item label="姓名" prop="realName">
                <el-input v-model="passengerForm.realName" placeholder="请输入乘客姓名"></el-input>
              </el-form-item>
              <el-form-item label="证件号码" prop="idCard">
                <el-input v-model="passengerForm.idCard" placeholder="请输入证件号码"></el-input>
              </el-form-item>
              <el-form-item label="乘客类型" prop="passengerType">
                <el-select v-model="passengerForm.passengerType" placeholder="请选择乘客类型" style="width: 100%;">
                  <el-option
                    v-for="(value, key) in passengerTypes"
                    :key="key"
                    :label="value"
                    :value="Number(key)"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="passengerForm.phone" placeholder="请输入手机号码"></el-input>
              </el-form-item>
              <el-form-item label="设为默认">
                <el-switch v-model="passengerForm.isDefault"></el-switch>
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="passengerDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitPassengerForm">确认</el-button>
              </span>
            </template>
          </el-dialog>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { 
  User, 
  UserFilled,
  Plus
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import { 
  getCurrentUserPassengers, 
  createPassenger, 
  updatePassenger, 
  deletePassenger as removePassenger, 
  setDefaultPassenger,
  type Passenger 
} from '@/api/passenger';

// 用户信息
const userInfo = reactive({
  userId: 0,
  username: '',
  email: '',
});

// 当前激活的菜单
const activeMenu = ref('info');

// 只保留必要的表单引用
const passengerFormRef = ref<FormInstance>();

// 乘客管理相关代码保持不变
const loading = ref(false);
const passengerDialogVisible = ref(false);
const isEdit = ref(false);
const passengers = ref<Passenger[]>([]);

// 乘客类型
const passengerTypes = {
  0: '成人',
  1: '儿童',
  2: '学生',
  3: '老年人'
};

// 乘客表单
const passengerForm = reactive({
  id: 0,
  userId: 0,
  realName: '',
  idCard: '',
  passengerType: 0,
  phone: '',
  isDefault: false
});

// 乘客表单验证规则，移除idCardType相关验证
const passengerRules = reactive<FormRules>({
  realName: [
    { required: true, message: '请输入乘客姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入证件号码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        // 身份证校验
        const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        if (!pattern.test(value)) {
          callback(new Error('请输入正确的身份证号码'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  passengerType: [
    { required: true, message: '请选择乘客类型', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$/, 
      message: '手机号码格式不正确', 
      trigger: 'blur' 
    }
  ]
});

// 获取用户信息
onMounted(() => {
  // 从本地存储中获取用户信息
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    try {
      const userData = JSON.parse(userInfoStr);
      userInfo.userId = userData.userId || 0;
      userInfo.username = userData.username || '';
      userInfo.email = userData.email || '';
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
});

// 获取乘客类型名称
const getPassengerTypeName = (type: number) => {
  return passengerTypes[type as keyof typeof passengerTypes] || '未知';
};

// 遮蔽身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 11) return idCard;
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
};

// 获取常用乘客列表
const fetchPassengers = async () => {
  loading.value = true;
  try {
    // 调用API获取当前用户的乘客列表
    const result = await getCurrentUserPassengers(userInfo.userId);
    passengers.value = result;
    loading.value = false;
  } catch (error) {
    console.error('获取常用乘客失败:', error);
    ElMessage.error('获取常用乘客失败，请重试');
    loading.value = false;
  }
};

const showAddPassengerDialog = () => {
  isEdit.value = false;
  resetPassengerForm();
  passengerDialogVisible.value = true;
  
  // 等待DOM更新后设置焦点
  nextTick(() => {
    passengerFormRef.value?.clearValidate();
  });
};

const editPassenger = (passenger: Passenger) => {
  isEdit.value = true;
  passengerForm.id = passenger.id;
  passengerForm.userId = passenger.userId;
  passengerForm.realName = passenger.realName;
  passengerForm.idCard = passenger.idCard;
  passengerForm.passengerType = passenger.passengerType;
  passengerForm.phone = passenger.phone;
  passengerForm.isDefault = passenger.isDefault === 1;
  
  passengerDialogVisible.value = true;
  
  // 等待DOM更新后设置焦点
  nextTick(() => {
    passengerFormRef.value?.clearValidate();
  });
};

const resetPassengerForm = () => {
  passengerForm.id = 0;
  passengerForm.userId = userInfo.id; // 设置当前用户ID
  passengerForm.realName = '';
  passengerForm.idCard = '';
  passengerForm.passengerType = 0;
  passengerForm.phone = '';
  passengerForm.isDefault = false;
};

// 提交乘客表单
const submitPassengerForm = async () => {
  if (!passengerFormRef.value) return;
  
  await passengerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        const passengerData = {
          ...passengerForm,
          isDefault: passengerForm.isDefault ? 1 : 0
        };
        passengerData.userId = userInfo.userId;
        
        if (isEdit.value) {
          // 更新乘客
          await updatePassenger(passengerForm.id, passengerData);
          ElMessage.success('乘客信息已更新');
        } else {
          console.log(passengerData);
          // 创建乘客
          await createPassenger(passengerData);
          ElMessage.success('乘客添加成功');
        }
        
        // 关闭对话框并重新获取乘客列表
        passengerDialogVisible.value = false;
        await fetchPassengers();
      } catch (error) {
        console.error('保存乘客信息失败:', error);
        ElMessage.error('保存乘客信息失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 设为默认乘客
const setAsDefault = async (id: number) => {
  loading.value = true;
  
  try {
    await setDefaultPassenger(id,userInfo.userId);
    ElMessage.success('已设为默认乘客');
    // 重新获取乘客列表以更新UI
    await fetchPassengers();
  } catch (error) {
    console.error('设置默认乘客失败:', error);
    ElMessage.error('设置默认乘客失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 删除乘客，重命名导入的函数以避免冲突
const deletePassenger = (id: number) => {
  ElMessageBox.confirm('确定要删除该乘客吗？删除后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true;
    
    try {
      await removePassenger(id);
      ElMessage.success('乘客已删除');
      // 重新获取乘客列表以更新UI
      await fetchPassengers();
    } catch (error) {
      console.error('删除乘客失败:', error);
      ElMessage.error('删除乘客失败，请重试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户取消删除，不做任何操作
  });
};

const router = useRouter();

// 菜单切换处理
const handleMenuSelect = (index: string) => {
  activeMenu.value = index;
  // 如果选择乘客管理，获取乘客列表
  if (index === 'passengers') {
    fetchPassengers();
  }
};
</script>

<style scoped>
/* 修改部分样式 */
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
  display: flex;
}

.el-row {
  flex: 1;
  height: 100%;
}

.el-col:nth-child(2) {
  height: 100%;
}

.profile-nav-card {
  margin-bottom: 20px;
}

.user-profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 15px;
}

.username {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.profile-menu {
  border-right: none;
}

.content-card {
  margin-bottom: 20px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

/* 确保内容区域内部元素正常显示 */
.content-card .el-card__body {
  overflow: visible;
}

/* 美化滚动条样式 */
.content-card::-webkit-scrollbar {
  width: 6px;
}

.content-card::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.content-card::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.content-card::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

/* 乘客管理相关样式 */
.passenger-list {
  margin-top: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer button + button {
  margin-left: 10px;
}
</style> 