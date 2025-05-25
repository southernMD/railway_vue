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
        @expand-change="handleExpand"
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="carriages-container">
              <div class="model-info">
                <span class="model-name">车型: {{ row.modelName }}</span>
                <span class="model-code">代码: {{ row.modelCode }}</span>
                
                <!-- 添加车厢按钮 -->
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="createCarriage(row)"
                  style="margin-left: 15px;"
                >
                  添加车厢
                </el-button>
              </div>
              
              <!-- 车厢表格 -->
              <el-table
                :data="getSortedCarriages(row.carriages)"
                stripe
                style="width: 100%"
                v-if="row.carriages && row.carriages.length > 0"
                :ref="el => { if (el) carriageTableRefs[row.id] = el }"
                row-key="id"
              >
                <el-table-column width="60" align="center">
                  <template #default>
                    <div class="drag-handle">
                      <el-icon><Rank /></el-icon>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="carriageNumber" label="车厢号" width="100" />
                <el-table-column label="车厢类型" width="120">
                  <template #default="scope">
                    <el-tag :type="getCarriageTypeTag(scope.row.carriageType)">
                      {{ getCarriageTypeName(scope.row.carriageType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="座位数" width="100">
                  <template #default="scope">
                    {{ scope.row.seats ? scope.row.seats.length : 0 }}
                  </template>
                </el-table-column>
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
                
                <!-- 修改操作列，添加删除按钮 -->
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="scope">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="editCarriage(row, scope.row)"
                      text
                    >
                      编辑
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="deleteCarriage(row, scope.row)"
                      text
                    >
                      删除
                    </el-button>
                    <el-button 
                      type="success" 
                      size="small" 
                      @click="openSeatEditor(row, scope.row)"
                      text
                    >
                      编辑座位
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div v-else class="empty-carriages">
                <el-empty description="暂无车厢信息" />
              </div>
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
    
    <!-- 添加车厢弹窗 -->
    <el-dialog
      v-model="addCarriageDialogVisible"
      title="添加车厢"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="carriageForm" 
        label-width="100px"
        :rules="carriageFormRules"
        ref="carriageFormRef"
      >
        <el-form-item label="车型名称">
          <el-input v-model="carriageForm.modelName" disabled />
        </el-form-item>
        <el-form-item label="车厢号">
          <el-input v-model="carriageForm.carriageNumber" disabled>
            <template #append>
              <span style="color: #606266; padding: 0 5px;">(自动分配)</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="车厢类型" prop="carriageType">
          <el-select v-model="carriageForm.carriageType" placeholder="请选择车厢类型">
            <el-option :value="0" label="商务座" />
            <el-option :value="1" label="一等座" />
            <el-option :value="2" label="二等座" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="submitCarriageForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑车厢弹窗 -->
    <el-dialog
      v-model="editCarriageDialogVisible"
      title="编辑车厢"
      width="500px"
      :before-close="handleEditDialogClose"
    >
      <el-form 
        :model="editCarriageForm" 
        label-width="100px"
        :rules="carriageFormRules"
        ref="editCarriageFormRef"
      >
        <el-form-item label="车型名称">
          <el-input v-model="editCarriageForm.modelName" disabled />
        </el-form-item>
        <el-form-item label="车厢号">
          <el-input v-model="editCarriageForm.carriageNumber" disabled />
        </el-form-item>
        <el-form-item label="车厢类型" prop="carriageType">
          <el-select v-model="editCarriageForm.carriageType" placeholder="请选择车厢类型">
            <el-option :value="0" label="商务座" />
            <el-option :value="1" label="一等座" />
            <el-option :value="2" label="二等座" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleEditDialogClose">取消</el-button>
          <el-button type="primary" @click="submitEditCarriageForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 座位编辑弹窗 -->
    <SeatEditor 
      v-if="seatEditorVisible"
      v-model:visible="seatEditorVisible"
      :carriage="currentCarriage"
      :model="currentModel"
      :initialSeats="currentCarriage?.seats || []"
      @save="saveSeatChanges"
      @update:initialSeats="handleSeatUpdate"
      @close="closeSeatEditor"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { Search, Rank } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getTrainModels, 
  createTrainModel, 
  updateTrainModel, 
  deleteTrainModel,
} from '@/api/trainModel'
import { 
  createCarriage as createCarriageApi, 
  swapCarriages,
  updateCarriage,
  deleteCarriage as deleteCarriageApi,
  batchUpdateCarriages
} from '@/api/carriages'
import Sortable from 'sortablejs'

// 列表数据
const models = ref([])
const loading = ref(false)
const carriageTableRefs = reactive({})
const expandedModelIds = ref(new Set())

// 搜索表单
const searchForm = reactive({
  modelName: '',
  modelCode: '',
  status: ''
})
const filteredModels = ref([])
watch(models, (newVal) => {
  console.log(models.value);
  let result = models.value
  
  // 车型名称过滤
  if (searchForm.modelName) {
    const keyword = searchForm.modelName.toLowerCase()
    result = result.filter(model => 
      reactive(model.modelName?.toLowerCase().includes(keyword))
    )
  }
  
  // 车型代码过滤
  if (searchForm.modelCode) {
    const keyword = searchForm.modelCode.toLowerCase()
    result = result.filter(model => 
      reactive(model.modelCode?.toLowerCase().includes(keyword))
    )
  }
  
  // 状态过滤
  if (searchForm.status !== '') {
    const status = parseInt(searchForm.status)
    result = reactive(result.filter(model => model.status === status))
  }
  
  filteredModels.value = result
}, {deep: true,immediate: true})

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

// Sortable实例存储
const sortableInstances = {}

// 添加车厢弹窗相关
const addCarriageDialogVisible = ref(false)
const currentModelId = ref(null)
const carriageFormRef = ref(null)
const carriageForm = reactive({
  modelId: null,
  modelName: '',
  carriageNumber: 1,
  carriageType: 0,
  seats: []
})

// 表单验证规则 - 移除了车厢号的验证
const carriageFormRules = {
  carriageType: [
    { required: true, message: '请选择车厢类型', trigger: 'change' }
  ]
}

// 编辑车厢弹窗相关
const editCarriageDialogVisible = ref(false)
const editCarriageFormRef = ref(null)
const currentCarriageId = ref(null)
const editCarriageForm = reactive({
  id: null,
  modelId: null,
  modelName: '',
  carriageNumber: 1,
  carriageType: 0,
  seats: []
})

// 监听展开/收起事件
const handleExpand = (row, expanded) => {
  if (expanded) {
    expandedModelIds.value.add(row.id)
    nextTick(() => {
      initSortableForModel(row.id)
    })
  } else {
    expandedModelIds.value.delete(row.id)
    // 销毁对应的 sortable 实例
    if (sortableInstances[row.id]) {
      sortableInstances[row.id].destroy()
      delete sortableInstances[row.id]
    }
  }
}

// 获取车型列表
const fetchModels = async () => {
  loading.value = true
  try {
    const result = await getTrainModels()
    models.value = result
    
    // 重新初始化已展开模型的 sortable
    nextTick(() => {
      expandedModelIds.value.forEach(modelId => {
        initSortableForModel(modelId)
      })
    })
  } catch (error) {
    console.error('获取车型列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始化单个模型的 Sortable
const initSortableForModel = (modelId) => {
  // 先销毁旧的实例
  if (sortableInstances[modelId]) {
    sortableInstances[modelId].destroy()
    delete sortableInstances[modelId]
  }
  
  nextTick(() => {
    const tableRef = carriageTableRefs[modelId]
    if (!tableRef) {
      console.warn(`未找到模型ID: ${modelId}的表格引用`)
      return
    }
    
    // 获取表格的 tbody 元素
    const el = tableRef.$el.querySelector('.el-table__body tbody')
    if (!el) {
      console.warn(`模型ID: ${modelId}的表格没有找到 tbody 元素`)
      return
    }
    
    console.log(`正在初始化模型ID: ${modelId}的 Sortable`, el)
    
    // 创建 Sortable 实例
    sortableInstances[modelId] = Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: async (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === newIndex) return
        
        const model = models.value.find(m => m.id === modelId)
        if (!model) return
        
        // 去掉分页逻辑，直接使用排序后的索引
        const sortedCarriages = getSortedCarriages(model.carriages)
        const carriage1 = sortedCarriages[oldIndex]
        const carriage2 = sortedCarriages[newIndex]
        
        if (!carriage1 || !carriage2) return
        
        try {
          console.log('交换车厢:', carriage1.id, carriage2.id)
          // 调用API交换车厢位置
          const [updatedCarriage1, updatedCarriage2] = await swapCarriages({ 
            carriageId1: carriage1.id, 
            carriageId2: carriage2.id 
          })
          
          // 找到原数组中的对象索引
          const index1 = model.carriages.findIndex(c => c.id === carriage1.id)
          const index2 = model.carriages.findIndex(c => c.id === carriage2.id)
          
          if (index1 !== -1 && index2 !== -1) {
            // 直接替换对象，但保持原始车厢号不变
            model.carriages[index1] = updatedCarriage2
            model.carriages[index2] = updatedCarriage1
          }
          
          ElMessage.success('车厢位置交换成功')
        } catch (error) {
          console.error('车厢交换失败:', error)
          ElMessage.error('车厢位置交换失败')
          
          // 重置DOM顺序
          const sortable = sortableInstances[modelId]
          if (sortable) {
            sortable.sort()
          }
        }
      }
    })
  })
}


const getSortedCarriages = (carriages) => {
  if (!carriages || !Array.isArray(carriages)) return []
  return [...carriages].sort((a, b) => a.carriageNumber - b.carriageNumber)
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

// 打开添加车厢弹窗
const showAddCarriageDialog = (model) => {
  currentModelId.value = model.id
  
  // 设置表单初始值
  carriageForm.modelId = model.id
  carriageForm.modelName = model.modelName
  
  // 自动计算车厢号为当前长度+1
  carriageForm.carriageNumber = model.carriages[model.carriages.length - 1] ? model.carriages[model.carriages.length - 1].carriageNumber + 1 : 1
  
  carriageForm.carriageType = 0
  
  addCarriageDialogVisible.value = true
}

// 关闭弹窗
const handleDialogClose = () => {
  addCarriageDialogVisible.value = false
  if (carriageFormRef.value) {
    carriageFormRef.value.resetFields()
  }
}

// 提交表单创建车厢
const submitCarriageForm = async () => {
  if (!carriageFormRef.value) return
  
  try {
    await carriageFormRef.value.validate()
    
    loading.value = true
    
    // 找到当前模型
    const model = models.value.find(m => m.id === carriageForm.modelId)
    if (!model) {
      throw new Error('无法找到对应的车型')
    }
    
    // 再次确认车厢号为当前长度+1
    const nextCarriageNumber = model.carriages ? model.carriages.length + 1 : 1
    
    // 构建请求参数
    const newCarriage = {
      modelId: carriageForm.modelId,
      carriageNumber: nextCarriageNumber,
      carriageType: carriageForm.carriageType,
      seats: [] 
    }
    
    console.log('创建新车厢:', newCarriage)
    
    // 调用API创建车厢
    const createdCarriage = await createCarriageApi(newCarriage)
    
    // 找到模型索引
    const modelIndex = models.value.findIndex(m => m.id === carriageForm.modelId)
    if (modelIndex === -1) return
    
    // 创建模型的深拷贝
    const updatedModel = JSON.parse(JSON.stringify(models.value[modelIndex]))
    // 添加新车厢到车厢列表
    if (!updatedModel.carriages) {
      updatedModel.carriages = []
    }
    if(createdCarriage.seats === null){
      createdCarriage.seats = []
    }
    updatedModel.carriages.push(createdCarriage)
    
    // 更新模型
    models.value.splice(modelIndex, 1, updatedModel)
    
    ElMessage.success('车厢创建成功')
    
    // 如果模型已展开，重新初始化sortable
    if (expandedModelIds.value.has(carriageForm.modelId)) {
      nextTick(() => {
        initSortableForModel(carriageForm.modelId)
      })
    }
    
    // 关闭弹窗
    handleDialogClose()
  } catch (error) {
    console.error('创建车厢失败:', error)
    ElMessage.error('创建车厢失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 打开编辑车厢弹窗
const editCarriage = (model, carriage) => {
  currentModelId.value = model.id
  currentCarriageId.value = carriage.id
  
  // 设置表单初始值
  editCarriageForm.id = carriage.id
  editCarriageForm.modelId = model.id
  editCarriageForm.modelName = model.modelName
  editCarriageForm.carriageNumber = carriage.carriageNumber
  editCarriageForm.carriageType = carriage.carriageType
  editCarriageForm.seats = carriage.seats || []
  
  editCarriageDialogVisible.value = true
}

// 关闭编辑弹窗
const handleEditDialogClose = () => {
  editCarriageDialogVisible.value = false
  if (editCarriageFormRef.value) {
    editCarriageFormRef.value.resetFields()
  }
}

// 提交编辑车厢表单
const submitEditCarriageForm = async () => {
  if (!editCarriageFormRef.value) return
  
  try {
    await editCarriageFormRef.value.validate()
    
    loading.value = true
    
    if (!editCarriageForm.id) {
      throw new Error('无法找到车厢ID')
    }
    
    // 构建请求参数
    const updateData = {
      carriageType: editCarriageForm.carriageType,
      carriageNumber: editCarriageForm.carriageNumber,
      modelId: editCarriageForm.modelId,
    }
    
    console.log('更新车厢:', editCarriageForm.id, editCarriageForm)
    
    // 调用API更新车厢
    const updatedCarriage = await updateCarriage(editCarriageForm.id, updateData)
    
    // 找到模型索引
    const modelIndex = models.value.findIndex(m => m.id === editCarriageForm.modelId)
    if (modelIndex === -1) return
    
    // 找到车厢索引
    const carriageIndex = models.value[modelIndex].carriages.findIndex(c => c.id === editCarriageForm.id)
    if (carriageIndex === -1) return
    
    // 创建模型的深拷贝
    const updatedModel = JSON.parse(JSON.stringify(models.value[modelIndex]))
    
    // 更新车厢信息，保持原有属性
    updatedModel.carriages[carriageIndex] = {
      ...updatedModel.carriages[carriageIndex],
      ...updatedCarriage
    }
    
    // 更新模型
    models.value.splice(modelIndex, 1, updatedModel)
    
    ElMessage.success('车厢更新成功')
    
    // 关闭弹窗
    handleEditDialogClose()
  } catch (error) {
    console.error('更新车厢失败:', error)
    ElMessage.error('更新车厢失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 修改删除车厢函数，使用API函数而不是直接调用http
const deleteCarriage = (model, carriage) => {
  ElMessageBox.confirm(
    `确定要删除车厢 ${carriage.carriageNumber} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        loading.value = true
        
        // 使用API函数而不是直接调用http
        await deleteCarriageApi(carriage.id)
        
        // 找到模型索引
        const modelIndex = models.value.findIndex(m => m.id === model.id)
        if (modelIndex === -1) return
        
        // 创建模型的深拷贝
        const updatedModel = JSON.parse(JSON.stringify(models.value[modelIndex]))
        
        // 从车厢列表中移除该车厢
        const carriageIndex = updatedModel.carriages.findIndex(c => c.id === carriage.id)
        if (carriageIndex !== -1) {
          updatedModel.carriages.splice(carriageIndex, 1)
          const newCarriages = updatedModel.carriages.map((c,index)=>{
            if(index >= carriageIndex){
              c.carriageNumber = c.carriageNumber - 1
            }
            return c
          })
          await batchUpdateCarriages(newCarriages)
          // models.value
        }
        
        // 更新模型

        models.value.splice(modelIndex, 1, updatedModel)
        
        // 如果模型已展开，重新初始化sortable
        if (expandedModelIds.value.has(model.id)) {
          nextTick(() => {
            initSortableForModel(model.id)
          })
        }
        
        ElMessage.success('车厢删除成功')
      } catch (error) {
        console.error('删除车厢失败:', error)
        ElMessage.error('删除车厢失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 模板中的按钮需要调用这个函数，而不是直接调用创建函数
const createCarriage = (model) => {
  showAddCarriageDialog(model)
}

onMounted(() => {
  fetchModels()
})


// 座位编辑器相关数据
const seatEditorVisible = ref(false)
const currentSeats = ref([])
const currentModel = ref()
const currentCarriage = ref([])
// 打开座位编辑器
const openSeatEditor = (model, carriage) => {
  currentModel.value = model
  currentCarriage.value = carriage
  currentModelId.value = model.id
  seatEditorVisible.value = true
}

// 关闭座位编辑器
const closeSeatEditor = () => {
  seatEditorVisible.value = false
  currentModel.value = null
  currentCarriage.value = null
}

// 保存座位变更
const saveSeatChanges = async (data) => {
  try {
    loading.value = true
    
    // 调用API更新座位
    const updatedCarriage = await updateCarriage(data.id, { seats: data.seats })
    
    // 更新本地数据
    const modelIndex = models.value.findIndex(m => m.id === currentModelId.value)
    if (modelIndex !== -1) {
      const carriageIndex = models.value[modelIndex].carriages.findIndex(
        c => c.id === data.id
      )
      
      if (carriageIndex !== -1) {
        // 创建模型的深拷贝
        const updatedModel = JSON.parse(JSON.stringify(models.value[modelIndex]))
        
        // 更新座位数据，保持其他属性不变
        updatedModel.carriages[carriageIndex] = {
          ...updatedModel.carriages[carriageIndex],
          seats: data.seats
        }
        
        // 更新模型
        models.value.splice(modelIndex, 1, updatedModel)
      }
    }
    
    ElMessage.success('座位更新成功')
    seatEditorVisible.value = false
  } catch (error) {
    console.error('更新座位失败:', error)
    ElMessage.error('更新座位失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 添加initialSeats更新的处理函数
const handleSeatUpdate = (updatedSeats) => {
  if (currentCarriage.value && currentModel.value) {
    // 更新当前车厢的座位数据
    currentCarriage.value.seats = updatedSeats
    
    // 更新模型中对应车厢的座位数据
    const modelIndex = models.value.findIndex(m => m.id === currentModel.value.id)
    if (modelIndex !== -1) {
      const carriageIndex = models.value[modelIndex].carriages.findIndex(
        c => c.id === currentCarriage.value.id
      )
      
      if (carriageIndex !== -1) {
        // 创建模型的深拷贝
        const updatedModel = JSON.parse(JSON.stringify(models.value[modelIndex]))
        
        // 更新座位数据
        updatedModel.carriages[carriageIndex].seats = updatedSeats
        
        // 更新模型
        models.value.splice(modelIndex, 1, updatedModel)
      }
    }
  }
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

/* 拖拽相关样式 - 只在图标上显示移动指针 */
.drag-handle {
  cursor: move; /* 只在拖拽手柄上显示移动指针 */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.2s;
}

.drag-handle:hover {
  background-color: #ecf5ff;
  transform: scale(1.1);
}

/* Sortable相关样式 */
:deep(.sortable-ghost) {
  opacity: 0.5;
  background-color: #e6f7ff;
}

:deep(.sortable-chosen) {
  background-color: #f0faff;
}

:deep(.sortable-drag) {
  opacity: 0.8;
  background-color: #d9ecff !important;
}

.drag-handle .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* 添加一些按钮样式 */
.model-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.model-name, .model-code {
  margin-right: 20px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.lock-type-fixed {
  display: flex;
  align-items: center;
}

.lock-type-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 