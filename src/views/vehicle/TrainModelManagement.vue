<template>
  <div class="train-model-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>车型管理</span>
          <el-button type="primary" @click="handleAddModel">添加车型</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选区域 -->
      <div class="search-container">
        <el-input
          v-model="searchForm.modelName"
          placeholder="车型名称"
          clearable
          @clear="handleSearch"
        >
        </el-input>
        
        <el-input
          v-model="searchForm.modelCode"
          placeholder="车型代码"
          clearable
          @clear="handleSearch"
        >
        </el-input>
        
        <el-select v-model="searchForm.status" placeholder="状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetSearchForm">重置</el-button>
      </div>
      
      <!-- 车型列表表格 -->
      <el-table
        v-loading="loading"
        :data="filteredModels"
        stripe
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="carriages-container">
              <div class="model-info">
                <span class="model-name">车型: {{ row.modelName }}</span>
                <span class="model-code">代码: {{ row.modelCode }}</span>
              </div>
              
              <el-table
                :data="getSortedCarriages(row.carriages).slice((carriagesPagination[row.id]?.currentPage || 1) - 1, ((carriagesPagination[row.id]?.currentPage || 1) - 1) + 5)"
                stripe
                style="width: 100%"
                v-if="row.carriages && row.carriages.length > 0"
              >
                <el-table-column prop="carriageNumber" label="车厢号" width="100" />
                <el-table-column label="车厢类型" width="120">
                  <template #default="scope">
                    <el-tag :type="getCarriageTypeTag(scope.row.carriageType)">
                      {{ getCarriageTypeName(scope.row.carriageType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="seatCount" label="座位数" width="100" />
                <el-table-column label="创建时间" width="180">
                  <template #default="scope">
                    {{ formatDate(scope.row.createTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="更新时间" width="180">
                  <template #default="scope">
                    {{ formatDate(scope.row.updateTime) }}
                  </template>
                </el-table-column>
              </el-table>
              
              <div v-else class="empty-carriages">
                <el-empty description="暂无车厢信息" />
              </div>
              
              <el-pagination
                v-if="row.carriages && row.carriages.length > 5"
                @current-change="(page) => handleCarriagePageChange(row.id, page)"
                :current-page="carriagesPagination[row.id]?.currentPage || 1"
                :page-size="5"
                layout="prev, pager, next"
                :total="row.carriages.length"
                class="pagination"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="modelName" label="车型名称" />
        <el-table-column prop="modelCode" label="车型代码" />
        <el-table-column prop="maxCapacity" label="最大容量" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleEditModel(scope.row)"
            >编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteModel(scope.row)"
            >删除</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >{{ scope.row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="filteredModels.length === 0" class="empty-data">
        <el-empty description="暂无车型数据" />
      </div>
    </el-card>
    
    <!-- 添加/编辑车型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑车型' : '添加车型'"
      width="500px"
    >
      <el-form
        ref="modelFormRef"
        :model="modelForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="车型名称" prop="modelName">
          <el-input v-model="modelForm.modelName" placeholder="请输入车型名称" />
        </el-form-item>
        
        <el-form-item label="车型代码" prop="modelCode">
          <el-input v-model="modelForm.modelCode" placeholder="请输入车型代码" />
        </el-form-item>
        
        <el-form-item label="最大容量" prop="maxCapacity">
          <el-input-number v-model="modelForm.maxCapacity" :min="0" :step="10" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="modelForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入车型描述" 
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="modelForm.status" placeholder="请选择状态">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getTrainModels, 
  createTrainModel, 
  updateTrainModel, 
  deleteTrainModel 
} from '@/api/trainModel'

// 列表数据
const models = ref([])
const loading = ref(false)

// 车厢分页数据
const carriagesPagination = reactive({})

// 搜索表单
const searchForm = reactive({
  modelName: '',
  modelCode: '',
  status: ''
})

// 过滤后的车型列表
const filteredModels = computed(() => {
  let result = models.value
  
  // 车型名称过滤
  if (searchForm.modelName) {
    const keyword = searchForm.modelName.toLowerCase()
    result = result.filter(model => 
      model.modelName?.toLowerCase().includes(keyword)
    )
  }
  
  // 车型代码过滤
  if (searchForm.modelCode) {
    const keyword = searchForm.modelCode.toLowerCase()
    result = result.filter(model => 
      model.modelCode?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  if (searchForm.status !== '') {
    const status = parseInt(searchForm.status)
    result = result.filter(model => model.status === status)
  }
  
  return result
})

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const modelFormRef = ref(null)
const modelForm = reactive({
  id: 0,
  modelName: '',
  modelCode: '',
  status: 1,
  maxCapacity: 0,
  description: '',
  carriages: []
})

// 表单验证规则
const rules = {
  modelName: [
    { required: true, message: '请输入车型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  modelCode: [
    { required: true, message: '请输入车型代码', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  maxCapacity: [
    { required: true, message: '请输入最大容量', trigger: 'blur' },
    { type: 'number', min: 0, message: '容量必须大于等于0', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 初始化加载数据
onMounted(() => {
  fetchModels()
})

// 获取车型列表
const fetchModels = async () => {
  loading.value = true
  try {
    const result = await getTrainModels()
    models.value = result
    
    // 初始化车厢分页
    result.forEach(model => {
      if (!carriagesPagination[model.id]) {
        carriagesPagination[model.id] = {
          currentPage: 1
        }
      }
    })
  } catch (error) {
    console.error('获取车型列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取按车厢号排序的车厢列表
const getSortedCarriages = (carriages) => {
  if (!carriages || !Array.isArray(carriages)) return []
  return [...carriages].sort((a, b) => a.carriageNumber - b.carriageNumber)
}

// 处理车厢分页改变
const handleCarriagePageChange = (modelId, page) => {
  if (!carriagesPagination[modelId]) {
    carriagesPagination[modelId] = { currentPage: 1 }
  }
  carriagesPagination[modelId].currentPage = page
}

// 获取车厢类型名称
const getCarriageTypeName = (type) => {
  const types = {
    0: '商务座',
    1: '一等座',
    2: '二等座'
  }
  return types[type] || '未知类型'
}

// 获取车厢类型对应的标签样式
const getCarriageTypeTag = (type) => {
  const tags = {
    0: 'danger',  // 商务座
    1: 'warning', // 一等座
    2: 'success'  // 二等座
  }
  return tags[type] || 'info'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 重置搜索表单
const resetSearchForm = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

// 搜索处理
const handleSearch = () => {
  // 前端过滤，无需调用API
}

// 添加车型
const handleAddModel = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑车型
const handleEditModel = (row) => {
  isEdit.value = true
  resetForm()
  Object.keys(modelForm).forEach(key => {
    if (key in row) {
      modelForm[key] = row[key]
    }
  })
  dialogVisible.value = true
}

// 删除车型
const handleDeleteModel = (row) => {
  ElMessageBox.confirm(
    `确定要删除车型 "${row.modelName}" 吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await deleteTrainModel(row.id)
        ElMessage.success('删除成功')
        fetchModels()
      } catch (error) {
        console.error('删除车型失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 切换车型状态
const handleToggleStatus = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  ElMessageBox.confirm(
    `确定要${statusText}车型 "${row.modelName}" 吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const updatedModel = { ...row, status: newStatus }
        await updateTrainModel(updatedModel)
        ElMessage.success(`${statusText}成功`)
        fetchModels()
      } catch (error) {
        console.error(`${statusText}车型失败:`, error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消操作')
    })
}

// 重置表单
const resetForm = () => {
  if (modelFormRef.value) {
    modelFormRef.value.resetFields()
  }
  Object.assign(modelForm, {
    id: 0,
    modelName: '',
    modelCode: '',
    status: 1,
    maxCapacity: 0,
    description: '',
    carriages: []
  })
}

// 提交表单
const submitForm = async () => {
  if (!modelFormRef.value) return
  
  await modelFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateTrainModel(modelForm)
          ElMessage.success('修改成功')
        } else {
          // 创建车型时，排除id字段
          const { id, ...modelData } = modelForm
          await createTrainModel(modelData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchModels()
      } catch (error) {
        console.error('提交表单失败:', error)
      }
    } else {
      return false
    }
  })
}
</script>

<style scoped>
.train-model-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  gap: 10px;
}

.search-container .el-input,
.search-container .el-select {
  width: 180px;
}

.carriages-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 0 50px;
  animation: fadeIn 0.3s ease-in-out;
}

.model-info {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.model-name {
  font-weight: bold;
  font-size: 16px;
}

.model-code {
  color: #666;
  font-size: 14px;
}

.empty-carriages {
  padding: 20px 0;
}

.empty-data {
  padding: 40px 0;
}

.pagination {
  margin-top: 15px;
  text-align: right;
}

:deep(.el-table__expanded-cell) {
  padding: 10px 0 !important;
}

/* 添加展开收缩动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.el-table__expand-icon) {
  transition: transform 0.3s ease;
}

:deep(.el-table__expand-icon--expanded) {
  transform: rotate(90deg);
}

:deep(.el-table__expand-icon > .el-icon) {
  font-size: 16px;
  margin-right: 5px;
}
</style> 