<template>
  <div class="passenger-management-container">
    <div class="page-header">
      <h2 class="page-title">常用乘客管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="showAddPassengerDialog">
          <el-icon><Plus /></el-icon> 添加乘客
        </el-button>
      </div>
    </div>
    
    <el-card class="passenger-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>常用乘客列表</span>
          <span class="record-count" v-if="passengers.length > 0">
            共 {{ passengers.length }} 条记录
          </span>
        </div>
      </template>
      
      <div class="passenger-list">
        <template v-if="passengers.length > 0">
          <el-table
            :data="passengers"
            border
            style="width: 100%"
          >
            <el-table-column label="姓名" prop="realName" min-width="100"></el-table-column>
            <el-table-column label="证件类型" min-width="120">
              <template #default="scope">
                {{ getIdCardTypeName(scope.row.idCardType || 0) }}
              </template>
            </el-table-column>
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
    </el-card>
    
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
        <el-form-item label="证件类型" prop="idCardType">
          <el-select v-model="passengerForm.idCardType" placeholder="请选择证件类型" style="width: 100%;">
            <el-option
              v-for="(value, key) in idCardTypes"
              :key="key"
              :label="value"
              :value="Number(key)"
            ></el-option>
          </el-select>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, UserFilled, Phone, Document } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const passengerDialogVisible = ref(false);
const isEdit = ref(false);
const passengers = ref<any[]>([]);
const passengerFormRef = ref<FormInstance>();

// 证件类型
const idCardTypes = {
  0: '身份证',
  1: '护照',
  2: '军官证',
  3: '港澳通行证',
  4: '台湾通行证'
};

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
  realName: '',
  idCardType: 0,
  idCard: '',
  passengerType: 0,
  phone: '',
  isDefault: false
});

// 表单验证规则
const passengerRules = reactive<FormRules>({
  realName: [
    { required: true, message: '请输入乘客姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  idCardType: [
    { required: true, message: '请选择证件类型', trigger: 'change' }
  ],
  idCard: [
    { required: true, message: '请输入证件号码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (passengerForm.idCardType === 0) {
          // 身份证校验
          const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
          if (!pattern.test(value)) {
            callback(new Error('请输入正确的身份证号码'));
          } else {
            callback();
          }
        } else {
          // 其他证件只做简单校验
          const pattern = /^[0-9a-zA-Z]{5,18}$/;
          if (!pattern.test(value)) {
            callback(new Error('证件号码格式不正确'));
          } else {
            callback();
          }
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

// 获取证件类型名称
const getIdCardTypeName = (type: number) => {
  return idCardTypes[type as keyof typeof idCardTypes] || '未知';
};

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
    // 实际项目中应该调用API获取常用乘客数据
    // const result = await passengerApi.getPassengers();
    
    // 模拟从localStorage获取数据
    const storedPassengers = localStorage.getItem('passengers');
    
    if (storedPassengers) {
      passengers.value = JSON.parse(storedPassengers);
    } else {
      // 示例数据
      passengers.value = [
        {
          id: 1,
          realName: '张三',
          idCardType: 0,
          idCard: '110101199001011234',
          passengerType: 0,
          phone: '13800138000',
          isDefault: 1
        },
        {
          id: 2,
          realName: '李四',
          idCardType: 0,
          idCard: '110101199201021234',
          passengerType: 0,
          phone: '13900139000',
          isDefault: 0
        },
        {
          id: 3,
          realName: '小明',
          idCardType: 0,
          idCard: '110101201001011234',
          passengerType: 1,
          phone: '13700137000',
          isDefault: 0
        }
      ];
      
      // 保存到localStorage
      localStorage.setItem('passengers', JSON.stringify(passengers.value));
    }
    
    loading.value = false;
  } catch (error) {
    console.error('获取常用乘客失败:', error);
    ElMessage.error('获取常用乘客失败，请重试');
    loading.value = false;
  }
};

// 显示添加乘客对话框
const showAddPassengerDialog = () => {
  isEdit.value = false;
  resetPassengerForm();
  passengerDialogVisible.value = true;
  
  // 等待DOM更新后设置焦点
  nextTick(() => {
    passengerFormRef.value?.clearValidate();
  });
};

// 编辑乘客
const editPassenger = (passenger: any) => {
  isEdit.value = true;
  passengerForm.id = passenger.id;
  passengerForm.realName = passenger.realName;
  passengerForm.idCardType = passenger.idCardType;
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

// 重置乘客表单
const resetPassengerForm = () => {
  passengerForm.id = 0;
  passengerForm.realName = '';
  passengerForm.idCardType = 0;
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
        // 实际项目中应该调用API保存乘客数据
        // if (isEdit.value) {
        //   await passengerApi.updatePassenger(passengerForm);
        // } else {
        //   await passengerApi.addPassenger(passengerForm);
        // }
        
        // 模拟API调用
        setTimeout(() => {
          if (isEdit.value) {
            // 更新本地数据
            const index = passengers.value.findIndex(item => item.id === passengerForm.id);
            if (index !== -1) {
              // 如果设为默认，则其他乘客取消默认
              if (passengerForm.isDefault) {
                passengers.value.forEach(item => {
                  if (item.id !== passengerForm.id) {
                    item.isDefault = 0;
                  }
                });
              }
              
              passengers.value[index] = {
                ...passengerForm,
                isDefault: passengerForm.isDefault ? 1 : 0
              };
            }
            
            ElMessage.success('乘客信息已更新');
          } else {
            // 添加新乘客
            const newId = Math.max(...passengers.value.map(item => item.id), 0) + 1;
            
            const newPassenger = {
              ...passengerForm,
              id: newId,
              isDefault: passengerForm.isDefault ? 1 : 0
            };
            
            // 如果设为默认，则其他乘客取消默认
            if (passengerForm.isDefault) {
              passengers.value.forEach(item => {
                item.isDefault = 0;
              });
            }
            
            passengers.value.push(newPassenger);
            
            ElMessage.success('乘客添加成功');
          }
          
          // 保存到localStorage
          localStorage.setItem('passengers', JSON.stringify(passengers.value));
          
          passengerDialogVisible.value = false;
          loading.value = false;
        }, 500);
      } catch (error) {
        console.error('保存乘客信息失败:', error);
        ElMessage.error('保存乘客信息失败，请重试');
        loading.value = false;
      }
    }
  });
};

// 设为默认乘客
const setAsDefault = (id: number) => {
  loading.value = true;
  
  try {
    // 实际项目中应该调用API设置默认乘客
    // await passengerApi.setDefaultPassenger(id);
    
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据
      passengers.value.forEach(item => {
        item.isDefault = item.id === id ? 1 : 0;
      });
      
      // 保存到localStorage
      localStorage.setItem('passengers', JSON.stringify(passengers.value));
      
      loading.value = false;
      ElMessage.success('已设为默认乘客');
    }, 500);
  } catch (error) {
    console.error('设置默认乘客失败:', error);
    ElMessage.error('设置默认乘客失败，请重试');
    loading.value = false;
  }
};

// 删除乘客
const deletePassenger = (id: number) => {
  ElMessageBox.confirm('确定要删除该乘客吗？删除后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true;
    
    try {
      // 实际项目中应该调用API删除乘客
      // await passengerApi.deletePassenger(id);
      
      // 模拟API调用
      setTimeout(() => {
        // 更新本地数据
        passengers.value = passengers.value.filter(item => item.id !== id);
        
        // 保存到localStorage
        localStorage.setItem('passengers', JSON.stringify(passengers.value));
        
        loading.value = false;
        ElMessage.success('乘客已删除');
      }, 500);
    } catch (error) {
      console.error('删除乘客失败:', error);
      ElMessage.error('删除乘客失败，请重试');
      loading.value = false;
    }
  }).catch(() => {});
};

// 返回个人中心
const goBack = () => {
  router.push('/user/profile');
};

// 页面加载时获取常用乘客数据
onMounted(() => {
  fetchPassengers();
});
</script>

<style scoped>
.passenger-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-weight: 500;
}

.passenger-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-count {
  color: #909399;
  font-size: 14px;
}

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

/* 响应式适配 */
@media (max-width: 768px) {
  .passenger-management-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-actions {
    margin-top: 10px;
    width: 100%;
  }
  
  .page-actions .el-button {
    width: 100%;
  }
}
</style>
