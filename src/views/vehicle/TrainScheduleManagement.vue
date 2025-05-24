<template>
  <div class="train-schedule-container">
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="车次号">
            <el-input v-model="filterForm.trainNumber" placeholder="请输入车次号" clearable @clear="handleFilter" />
          </el-form-item>
          <el-form-item label="起始站">
            <el-select v-model="filterForm.startStationId" placeholder="请选择起始站" clearable filterable @change="handleFilter">
              <el-option
                v-for="station in stationOptions"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="终点站">
            <el-select v-model="filterForm.endStationId" placeholder="请选择终点站" clearable filterable @change="handleFilter">
              <el-option
                v-for="station in stationOptions"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="filterForm.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleFilter"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <h3>车次管理</h3>
          <el-button type="primary" @click="handleAddTrain">添加车次</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="filteredTrainSchedules"
        stripe
        style="width: 100%"
        @expand-change="handleExpand"
        row-key="id"
        ref="trainTableRef"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="stops-container">
              <div class="train-info">
                <span class="train-number">车次: {{ row.trainNumber }}</span>
                <span class="train-route">路线: {{ row.startStation?.stationName }} → {{ row.endStation?.stationName }}</span>
                
                <!-- 编辑模式下显示确认和取消按钮 -->
                <template v-if="editingTrainId === row.id">
                  <el-button 
                    type="success" 
                    size="small" 
                    @click.stop="confirmEdit(row,row.id)"
                    style="margin-left: 15px;"
                  >
                    确认
                  </el-button>
                  <el-button 
                    type="info" 
                    size="small" 
                    @click.stop="cancelEdit(row)"
                  >
                    取消
                  </el-button>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click.stop="addStop(row)"
                    style="margin-left: 15px;"
                  >
                    添加停靠站
                  </el-button>
                </template>
                
                <!-- 非编辑模式下只显示编辑按钮 -->
                <template v-else>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click.stop="enterEditMode(row)"
                    style="margin-left: 15px;"
                  >
                    编辑
                  </el-button>
                </template>
              </div>
              
              <!-- 停靠站表格 -->
              <el-table
                :data="getStopsWithStartEnd(row)"
                stripe
                style="width: 100%"
                v-if="row.trainStops && row.trainStops.length > 0 || row.startStation || row.endStation"
                :ref="el => { if (el) stopTableRefs[row.id] = el }"
                row-key="id"
              >
                <!-- 拖拽手柄列，只有中间站点且在编辑模式下显示 -->
                <el-table-column width="60" align="center">
                  <template #default="scope">
                    <div 
                      v-if="scope.row.type !== 'start' && scope.row.type !== 'end' && editingTrainId === row.id" 
                      class="drag-handle"
                    >
                      <el-icon><Rank /></el-icon>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="sequence" label="序号" width="80" />
                <el-table-column label="站点名称" width="180">
                  <template #default="scope">
                    {{ scope.row.station?.stationName || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="所在城市" width="180">
                  <template #default="scope">
                    {{ scope.row.station?.city || '-' }}, {{ scope.row.station?.province || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="站点地址" min-width="200">
                  <template #default="scope">
                    {{ scope.row.station?.address || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="arrivalTime" label="到达时间" width="120" />
                <el-table-column label="停留时间" width="100">
                  <template #default="scope">
                    {{ scope.row.stopDuration }} 分钟
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="scope">
                    <!-- 只有中间站点且在编辑模式下可以编辑和删除 -->
                    <template v-if="scope.row.type !== 'start' && scope.row.type !== 'end' && editingTrainId === row.id">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click.stop="editStop(row, scope.row)"
                        text
                      >
                        编辑
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click.stop="deleteStop(row, scope.row)"
                        text
                      >
                        删除
                      </el-button>
                    </template>
                    <span v-else-if="scope.row.type === 'start' || scope.row.type === 'end'" class="fixed-stop">
                      {{ scope.row.type === 'start' ? '起始站' : '终点站' }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              
              <div v-else class="empty-stops">
                <el-empty description="暂无停靠站信息" />
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="trainNumber" label="车次号" min-width="150" />
        <el-table-column label="车型" min-width="120">
          <template #default="scope">{{ scope.row.model?.modelName }} ({{ scope.row.model?.modelCode }})</template>
        </el-table-column>
        <el-table-column label="起始站" min-width="120">
          <template #default="scope">{{ scope.row.startStation?.stationName }}</template>
        </el-table-column>
        <el-table-column label="终点站" min-width="120">
          <template #default="scope">{{ scope.row.endStation?.stationName }}</template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="100" />
        <el-table-column prop="departureTime" label="发车时间" width="100" />
        <el-table-column prop="arrivalTime" label="到达时间" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="empty-placeholder" v-if="filteredTrainSchedules.length === 0 && !loading">
        <el-empty description="暂无数据" />
      </div>
    </el-card>
    
    <!-- 添加/编辑车次对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? (isReadOnly ? '查看车次' : '编辑车次') : '添加车次'"
      width="700px"
      :key="dialogKey"
    >
      <!-- 添加只读提示 -->
      <div v-if="isReadOnly" class="readonly-warning">
        <el-alert
          title="此车次日期已过或即将发车，仅可查看不可编辑"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      
      <el-form :model="trainForm" :rules="rules" ref="trainFormRef" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="车次号" prop="trainNumber">
              <el-input v-model="trainForm.trainNumber" placeholder="请输入车次号" :disabled="isReadOnly" />
            </el-form-item>
            
            <el-form-item label="车型" prop="modelId">
              <el-select 
                v-model="trainForm.modelId" 
                placeholder="请选择车型" 
                filterable
                @change="handleModelChange"
                :disabled="isReadOnly"
              >
                <el-option
                  v-for="model in trainModelOptions"
                  :key="model.id"
                  :label="`${model.modelName} (${model.modelCode})`"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="起始站" prop="startStationId">
              <el-select v-model="trainForm.startStationId" placeholder="请选择起始站" filterable :disabled="isReadOnly">
                <el-option
                  v-for="station in stationOptions"
                  :key="station.id"
                  :label="station.stationName"
                  :value="station.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="终点站" prop="endStationId">
              <el-select v-model="trainForm.endStationId" placeholder="请选择终点站" filterable :disabled="isReadOnly">
                <el-option
                  v-for="station in stationOptions"
                  :key="station.id"
                  :label="station.stationName"
                  :value="station.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="日期" prop="date">
              <el-date-picker
                v-model="trainForm.date"
                type="date"
                placeholder="请选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled="isReadOnly"
                :disabledDate="disabledDate"
              />
            </el-form-item>
            
            <el-form-item label="发车时间" prop="departureTime">
              <el-time-picker
                v-model="trainForm.departureTime"
                placeholder="请选择发车时间"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
                :disabled="isReadOnly"
              />
            </el-form-item>
            
            <el-form-item label="到达时间" prop="arrivalTime">
              <el-time-picker
                v-model="trainForm.arrivalTime"
                placeholder="请选择到达时间"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
                :disabled="isReadOnly"
              />
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="座位及票价" name="seats">
            <div class="seat-info-block">
              <div v-if="selectedModel" class="capacity-info">
                <p>车型总容量: <strong>{{ selectedModel.maxCapacity }}</strong></p>
                <p>已分配座位: <strong>{{ selectedModel.totalSeats }}</strong></p>
                <p>剩余可分配: <strong>{{ remainingCapacity }}</strong></p>
              </div>
              <div v-else class="select-model-tip">
                <el-alert
                  title="请先在基本信息中选择车型"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
              
              <el-form-item label="无座票数量" prop="trainSeatInfo.noSeatTickets">
                <el-input-number 
                  v-model="trainForm.trainSeatInfo.noSeatTickets" 
                  :min="0" 
                  :max="remainingCapacity || 0"
                  :disabled="isReadOnly || !selectedModel"
                  placeholder="选择车型后可设置"
                />
              </el-form-item>
              
              <el-divider>票价设置</el-divider>
              
              <el-form-item label="商务座票价" prop="trainSeatInfo.businessPrice">
                <el-input-number 
                  v-model="trainForm.trainSeatInfo.businessPrice" 
                  :min="0" 
                  :precision="2" 
                  :step="10"
                  :disabled="isReadOnly"
                />
              </el-form-item>
              
              <el-form-item label="一等座票价" prop="trainSeatInfo.firstClassPrice">
                <el-input-number 
                  v-model="trainForm.trainSeatInfo.firstClassPrice" 
                  :min="0" 
                  :precision="2"
                  :step="10"
                  :disabled="isReadOnly"
                />
              </el-form-item>
              
              <el-form-item label="二等座票价" prop="trainSeatInfo.secondClassPrice">
                <el-input-number 
                  v-model="trainForm.trainSeatInfo.secondClassPrice" 
                  :min="0" 
                  :precision="2"
                  :step="10"
                  :disabled="isReadOnly"
                />
              </el-form-item>
              
              <el-form-item label="无座票价" prop="trainSeatInfo.noSeatPrice">
                <el-input-number 
                  v-model="trainForm.trainSeatInfo.noSeatPrice" 
                  :min="0" 
                  :precision="2"
                  :step="10"
                  :disabled="isReadOnly"
                />
              </el-form-item>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ isReadOnly ? '关闭' : '取消' }}</el-button>
          <el-button v-if="!isReadOnly" type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加停靠站对话框 -->
    <el-dialog
      v-model="stopDialogVisible"
      :title="isEditingStop ? '编辑停靠站' : '添加停靠站'"
      width="500px"
      append-to-body
      @close="handleStopDialogClose"
    >
      <el-form
        ref="stopFormRef"
        :model="stopForm"
        :rules="stopFormRules"
        label-width="100px"
      >
        <el-form-item label="站点" prop="stationId">
          <el-select 
            v-model="stopForm.stationId" 
            placeholder="请选择站点" 
            filterable
            :loading="stationsLoading"
          >
            <el-option
              v-for="station in availableStations"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
          <div v-if="availableStations.length === 0" class="form-tip">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              title="没有可用的站点"
              description="所有站点都已添加到当前车次"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="插入位置" prop="sequence">
          <el-input-number v-model="stopForm.sequence" :min="1" :step="1" />
          <div class="form-tip">站点将被插入到指定位置，后续站点序号自动顺延</div>
        </el-form-item>
        
        <el-form-item label="到达时间" prop="arrivalTime">
          <el-time-picker
            v-model="stopForm.arrivalTime"
            format="HH:mm:ss"
            placeholder="选择时间"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="停留时间" prop="stopDuration">
          <el-input-number v-model="stopForm.stopDuration" :min="0" :step="1" placeholder="分钟数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stopDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStopForm" :disabled="availableStations.length === 0">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import trainApi from '@/api/train'  // 导入车次API
import stationApi from '@/api/station'  // 站点API
import { getTrainModelsSimple } from '@/api/trainModel'  // 修改导入
import { Search, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { cloneDeep } from 'lodash' // 确保安装并导入lodash
import trainStopApi from '@/api/trainStop'  // 导入车次API

// 添加对话框key，用于强制重新渲染
const dialogKey = ref(0);

// 数据状态
const trainSchedules = ref([])
const stationOptions = ref([])
const trainModelOptions = ref([])
const loading = ref(false)
const activeTab = ref('basic')
const selectedModel = ref(null)
const isReadOnly = ref(false)

// 筛选表单
const filterForm = reactive({
  trainNumber: '',
  startStationId: null,
  endStationId: null,
  date: ''
})

// 筛选后的数据
const filteredTrainSchedules = computed(() => {
  return trainSchedules.value.filter(item => {
    // 车次号筛选
    if (filterForm.trainNumber && !item.trainNumber.toLowerCase().includes(filterForm.trainNumber.toLowerCase())) {
      return false
    }
    
    // 起始站筛选
    if (filterForm.startStationId && item.startStation.id !== filterForm.startStationId) {
      return false
    }
    
    // 终点站筛选
    if (filterForm.endStationId && item.endStation.id !== filterForm.endStationId) {
      return false
    }
    
    // 日期筛选
    if (filterForm.date && item.date !== filterForm.date) {
      return false
    }
    
    return true
  })
})

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const trainFormRef = ref(null)

// 改进剩余容量计算
const remainingCapacity = computed(() => {
  if (!selectedModel.value) return 0
  
  const maxCapacity = selectedModel.value.maxCapacity || 0
  const totalSeats = selectedModel.value.totalSeats || 0
  
  return Math.max(0, maxCapacity - totalSeats)
})

// 初始化表单时确保所有值为空或0
const initialTrainForm = {
  id: null,
  trainNumber: '',
  startStationId: null,
  endStationId: null,
  modelId: null,
  date: '',
  departureTime: '',
  arrivalTime: '',
  totalSeats: 0,
  trainSeatInfo: {
    noSeatTickets: 0,
    businessPrice: 0,
    firstClassPrice: 0,
    secondClassPrice: 0,
    noSeatPrice: 0
  }
}

// 表单状态
const trainForm = reactive({...initialTrainForm})

// 表单验证规则
const rules = {
  trainNumber: [
    { required: true, message: '请输入车次号', trigger: 'blur' }
  ],
  modelId: [
    { required: true, message: '请选择车型', trigger: 'change' }
  ],
  startStationId: [
    { required: true, message: '请选择起始站', trigger: 'change' }
  ],
  endStationId: [
    { required: true, message: '请选择终点站', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        if (value === trainForm.startStationId) {
          callback(new Error('终点站不能与起始站相同'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  departureTime: [
    { required: true, message: '请选择发车时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        // 只有当到达时间已经设置时才进行验证
        if (trainForm.arrivalTime && value) {
          validateTimeOrder(callback)
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  arrivalTime: [
    { required: true, message: '请选择到达时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        // 只有当发车时间已经设置时才进行验证
        if (trainForm.departureTime && value) {
          validateTimeOrder(callback)
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  'trainSeatInfo.noSeatTickets': [
    { required: true, message: '请输入无座票数量', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('无座票数量不能小于0'))
        } else if (selectedModel.value && value > remainingCapacity.value) {
          callback(new Error(`无座票数量不能超过剩余可分配容量: ${remainingCapacity.value}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  'trainSeatInfo.businessPrice': [
    { required: true, message: '请输入商务座票价', trigger: 'blur' }
  ],
  'trainSeatInfo.firstClassPrice': [
    { required: true, message: '请输入一等座票价', trigger: 'blur' }
  ],
  'trainSeatInfo.secondClassPrice': [
    { required: true, message: '请输入二等座票价', trigger: 'blur' }
  ],
  'trainSeatInfo.noSeatPrice': [
    { required: true, message: '请输入无座票价', trigger: 'blur' }
  ]
}

// 验证发车时间和到达时间的先后顺序
const validateTimeOrder = (callback) => {
  const departure = trainForm.departureTime
  const arrival = trainForm.arrivalTime
  
  if (departure && arrival) {
    // 将时间转换为分钟数进行比较
    const getMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const departureMinutes = getMinutes(departure)
    const arrivalMinutes = getMinutes(arrival)
    
    if (departureMinutes >= arrivalMinutes) {
      callback(new Error('出发时间必须早于到达时间'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

// 生命周期钩子
onMounted(() => {
  fetchTrainSchedules()
  fetchStations()
  fetchTrainModels()
})

// 方法
const fetchTrainSchedules = async () => {
  loading.value = true
  try {
    const res = await trainApi.getAllTrains()
    trainSchedules.value = res
    console.log('获取的车次数据:', res)
  } catch (error) {
    ElMessage.error('获取车次列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchStations = async () => {
  try {
    const res = await stationApi.getOpenStations()
    stationOptions.value = res
  } catch (error) {
    ElMessage.error('获取车站列表失败')
    console.error(error)
  }
}

const fetchTrainModels = async () => {
  try {
    const models = await getTrainModelsSimple()
    trainModelOptions.value = models
    console.log('获取的简化车型数据:', models)
  } catch (error) {
    ElMessage.error('获取车型列表失败')
    console.error(error)
  }
}

// 筛选相关方法
const handleFilter = () => {
  // 已经通过计算属性完成筛选，这里可以添加额外逻辑
  ElMessage.success('筛选已应用')
}

const resetFilter = () => {
  // 重置筛选表单
  filterForm.trainNumber = ''
  filterForm.startStationId = null
  filterForm.endStationId = null
  filterForm.date = ''
  
  ElMessage.info('筛选条件已重置')
}

// 修改重置表单方法
const resetForm = () => {
  // 重置表单字段
  trainForm.id = null;
  trainForm.trainNumber = '';
  trainForm.startStationId = null;
  trainForm.endStationId = null;
  trainForm.modelId = null;
  trainForm.date = '';
  trainForm.departureTime = '';
  trainForm.arrivalTime = '';
  trainForm.totalSeats = 0;
  
  // 重置嵌套对象的属性
  trainForm.trainSeatInfo.id = null;
  trainForm.trainSeatInfo.noSeatTickets = 0;
  trainForm.trainSeatInfo.businessPrice = 0;
  trainForm.trainSeatInfo.firstClassPrice = 0;
  trainForm.trainSeatInfo.secondClassPrice = 0;
  trainForm.trainSeatInfo.noSeatPrice = 0;
  
  // 清空选中的车型
  selectedModel.value = null;
  
  // 记录日志
  console.log('表单已重置:', JSON.stringify(trainForm));
}

// 更新添加车次处理方法
const handleAddTrain = () => {
  // 先关闭对话框
  dialogVisible.value = false;
  
  // 增加dialogKey，强制对话框组件重新渲染
  dialogKey.value += 1;
  
  // 重置状态
  isEdit.value = false;
  isReadOnly.value = false;
  activeTab.value = 'basic';
  
  // 彻底重置表单数据
  resetForm();
  
  // 设置默认日期为明天
  trainForm.date = formatDate(getTomorrowDate());
  
  // 使用nextTick确保DOM更新后再打开对话框
  nextTick(() => {
    // 打开对话框
    dialogVisible.value = true;
    
    // 确保表单验证器重置
    nextTick(() => {
      if (trainFormRef.value) {
        trainFormRef.value.resetFields();
      }
    });
  });
}

// 同样更新编辑处理方法
const handleEdit = (row) => {
  // 关闭对话框
  dialogVisible.value = false;
  
  // 增加dialogKey，强制对话框组件重新渲染
  dialogKey.value += 1;
  
  // 设置编辑状态
  isEdit.value = true;
  activeTab.value = 'basic';
  
  // 根据日期检查是否设为只读
  isReadOnly.value = isPastOrNearDate(row.date);
  
  // 填充表单数据
  trainForm.id = row.id
  trainForm.trainNumber = row.trainNumber
  trainForm.startStationId = row.startStation?.id
  trainForm.endStationId = row.endStation?.id
  trainForm.modelId = row.model?.id
  trainForm.date = row.date
  trainForm.departureTime = row.departureTime
  trainForm.arrivalTime = row.arrivalTime
  trainForm.totalSeats = row.totalSeats || 0
  
  // 设置座位和票价信息
  trainForm.trainSeatInfo = {
    noSeatTickets: row.trainSeatInfo?.noSeatTickets || 0,
    businessPrice: row.trainSeatInfo?.businessPrice || 0,
    firstClassPrice: row.trainSeatInfo?.firstClassPrice || 0,
    secondClassPrice: row.trainSeatInfo?.secondClassPrice || 0,
    noSeatPrice: row.trainSeatInfo?.noSeatPrice || 0
  }
  
  // 如果有ID，也保留
  if (row.trainSeatInfo?.id) {
    trainForm.trainSeatInfo.id = row.trainSeatInfo.id
  }
  
  // 设置当前选中的车型
  selectedModel.value = trainModelOptions.value.find(model => model.id === row.model?.id) || null
  
  // 使用nextTick确保DOM更新后再打开对话框
  nextTick(() => {
    dialogVisible.value = true;
  });
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除车次 ${row.trainNumber} 吗？`, '删除提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用删除API
    await trainApi.deleteTrain(row.id)
    
    // 更新本地数据
    trainSchedules.value = trainSchedules.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交表单方法
const submitForm = () => {
  trainFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    // 构造提交数据
    const submitData = {
      trainNumber: trainForm.trainNumber,
      startStationId: trainForm.startStationId,
      endStationId: trainForm.endStationId,
      modelId: trainForm.modelId,
      date: trainForm.date,
      departureTime: trainForm.departureTime,
      arrivalTime: trainForm.arrivalTime,
      trainSeatInfo: {
        noSeatTickets: trainForm.trainSeatInfo.noSeatTickets,
        businessPrice: trainForm.trainSeatInfo.businessPrice,
        firstClassPrice: trainForm.trainSeatInfo.firstClassPrice,
        secondClassPrice: trainForm.trainSeatInfo.secondClassPrice,
        noSeatPrice: trainForm.trainSeatInfo.noSeatPrice
      }
    }
    
    // 只有在编辑模式下才添加ID字段
    if (isEdit.value) {
      submitData.id = trainForm.id
      
      // 只有在编辑模式下且trainSeatInfo.id存在时才添加
      if (trainForm.trainSeatInfo.id) {
        submitData.trainSeatInfo.id = trainForm.trainSeatInfo.id
      }
    }
    
    console.log('提交的数据:', submitData)
    
    try {
      if (isEdit.value) {
        await trainApi.updateTrain(submitData)
      } else {
        await trainApi.createTrain(submitData)
      }
      
      // 重新获取数据列表
      await fetchTrainSchedules()
      
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
      console.error(error)
    } finally {
      submitting.value = false
    }
  })
}

// 车型变更处理
const handleModelChange = (modelId) => {
  console.log('车型变更:', modelId)
  // 根据选择的车型ID设置selectedModel
  selectedModel.value = trainModelOptions.value.find(model => model.id === modelId) || null
  
  if (selectedModel.value) {
    console.log('选择的车型:', selectedModel.value)
    console.log('剩余可分配容量:', remainingCapacity.value)
  }
  
  // 如果是新建车次，重置无座票数量
  if (!isEdit.value) {
    trainForm.trainSeatInfo.noSeatTickets = 0
  }
}

// 获取明天的日期（当前日期+1天）
const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

// 获取格式化的日期字符串 YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 禁用日期函数（禁用今天及之前的日期）
const disabledDate = (time) => {
  return time.getTime() < getTomorrowDate().getTime()
}

// 检查日期是否是过去日期或明天之前（用于编辑模式的只读判断）
const isPastOrNearDate = (dateString) => {
  if (!dateString) return false
  
  const inputDate = new Date(dateString)
  inputDate.setHours(0, 0, 0, 0)
  
  const tomorrowDate = getTomorrowDate()
  
  return inputDate.getTime() < tomorrowDate.getTime()
}

// 表格引用
const trainTableRef = ref(null)
const stopTableRefs = reactive({})
const stopFormRef = ref(null)
// Sortable实例存储
const sortableInstances = {}
// 展开的行ID
const expandedTrainIds = ref(new Set())
// 当前正在编辑的车次ID
const editingTrainId = ref(null)
// 原始数据备份，用于取消编辑
const originalTrainData = ref(null)

// 添加/编辑停靠站相关
const stopDialogVisible = ref(false)
const isEditingStop = ref(false)
const currentTrainId = ref(null)
const currentStopId = ref(null)
const stopForm = reactive({
  trainId: null,
  stationId: null,
  sequence: 1,
  arrivalTime: '',
  stopDuration: 3
})

// 停靠站表单验证规则
const stopFormRules = {
  stationId: [
    { required: true, message: '请选择站点', trigger: 'change' }
  ],
  sequence: [
    { required: true, message: '请输入序号', trigger: 'blur' },
    { type: 'number', min: 1, message: '序号必须大于等于1', trigger: 'blur' }
  ],
  arrivalTime: [
    { required: true, message: '请选择到达时间', trigger: 'change' }
  ],
  stopDuration: [
    { required: true, message: '请输入停留时间', trigger: 'blur' },
    { type: 'number', min: 0, message: '停留时间必须大于等于0', trigger: 'blur' }
  ]
}

// 站点加载状态
const stationsLoading = ref(false)

// 计算可用站点（过滤掉已经在排序列表中存在的站点）
const availableStations = computed(() => {
  if (!currentTrainId.value) return []
  
  const train = filteredTrainSchedules.value.find(t => t.id === currentTrainId.value)
  if (!train) return stationOptions.value
  
  // 获取当前车次已有的站点ID（包括起始站和终点站）
  const existingStationIds = new Set()
  
  // 添加起始站
  if (train.startStation) {
    existingStationIds.add(train.startStation.id)
  }
  
  // 添加终点站
  if (train.endStation) {
    existingStationIds.add(train.endStation.id)
  }
  
  // 添加中间停靠站
  if (train.trainStops && Array.isArray(train.trainStops)) {
    train.trainStops.forEach(stop => {
      if (stop.station && stop.station.id) {
        existingStationIds.add(stop.station.id)
      }
    })
  }
  
  // 如果是编辑模式，不过滤当前正在编辑的站点
  if (isEditingStop.value && stopForm.stationId) {
    existingStationIds.delete(stopForm.stationId)
  }
  
  // 过滤掉已存在的站点
  return stationOptions.value.filter(station => !existingStationIds.has(station.id))
})

// 监听对话框打开，重置站点选择
watch(stopDialogVisible, (val) => {
  if (val) {
    // 对话框打开时，如果可用站点不为空，自动选择第一个
    if (availableStations.value.length > 0 && !isEditingStop.value) {
      stopForm.stationId = availableStations.value[0].id
    }
  }
})

// 监听展开/收起事件
const handleExpand = (row, expanded) => {
  if (expanded) {
    expandedTrainIds.value.add(row.id)
    nextTick(() => {
      if (editingTrainId.value === row.id) {
        initSortableForTrain(row.id)
      }
    })
  } else {
    expandedTrainIds.value.delete(row.id)
    // 如果正在编辑，提示用户
    if (editingTrainId.value === row.id) {
      ElMessageBox.confirm(
        '您正在编辑此车次的停靠站，关闭面板将丢失未保存的更改。是否继续？',
        '警告',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(() => {
          // 用户确认关闭，退出编辑模式
          exitEditMode()
          // 销毁对应的 sortable 实例
          if (sortableInstances[row.id]) {
            sortableInstances[row.id].destroy()
            delete sortableInstances[row.id]
          }
        })
        .catch(() => {
          // 用户取消关闭，重新展开面板
          nextTick(() => {
            expandedTrainIds.value.add(row.id)
            const row = document.querySelector(`tr[data-row-key="${row.id}"]`)
            if (row) {
              const expandIcon = row.querySelector('.el-table__expand-icon')
              if (expandIcon && !expandIcon.classList.contains('el-table__expand-icon--expanded')) {
                expandIcon.click()
              }
            }
          })
        })
    } else {
      // 销毁对应的 sortable 实例
      if (sortableInstances[row.id]) {
        sortableInstances[row.id].destroy()
        delete sortableInstances[row.id]
      }
    }
  }
}

// 进入编辑模式
const enterEditMode = (train) => {
  if(isPastOrNearDate(train.date)){
    ElMessage.warning('车次日期是过去或接近的日期，不能编辑')
    return
  }
  // 如果已经在编辑其他车次，提示用户
  if (editingTrainId.value !== null && editingTrainId.value !== train.id) {
    ElMessageBox.confirm(
      '您正在编辑另一个车次的停靠站，切换将丢失未保存的更改。是否继续？',
      '警告',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        // 用户确认切换，保存当前车次的原始数据
        originalTrainData.value = cloneDeep(train)
        editingTrainId.value = train.id
        
        // 初始化sortable
        nextTick(() => {
          initSortableForTrain(train.id)
        })
      })
      .catch(() => {
        // 用户取消切换，不做任何操作
      })
  } else {
    // 保存当前车次的原始数据
    originalTrainData.value = cloneDeep(train)
    editingTrainId.value = train.id
    
    // 初始化sortable
    nextTick(() => {
      initSortableForTrain(train.id)
    })
  }
}

// 退出编辑模式
const exitEditMode = () => {
  editingTrainId.value = null
  originalTrainData.value = null
}

// 确认编辑
const confirmEdit = async (train,trainId) => {
  // 校验时间顺序
  
  const timeValidationResult = validateStopTimes(train)
  
  if (!timeValidationResult.valid) {
    ElMessage.error('停靠站时间顺序不合理')
    return
  }
  
  // 打印整个列表模拟提交表单
  console.log('提交更新后的停靠站列表:',train.trainStops,trainId)
  const hasStationIdTrainStops = train.trainStops.map(item => { return {...item,stationId:item.station.id}})
  await trainStopApi.batchUpdateTrainStops(hasStationIdTrainStops, trainId)

  ElMessage.success('停靠站更新成功')
  exitEditMode()
}

// 校验停靠站时间顺序
const validateStopTimes = (train) => {
  // 获取完整的站点列表（包括起始站和终点站）
  const allStops = getStopsWithStartEnd(train)
  
  // 按序号排序
  const sortedStops = [...allStops].sort((a, b) => a.sequence - b.sequence)
  
  // 清除所有标记
  clearTimeErrorMarks()
  
  // 检查时间顺序
  let isValid = true
  let previousTime = null
  let previousStop = null
  
  for (let i = 0; i < sortedStops.length; i++) {
    const stop = sortedStops[i]
    const currentTime = stop.arrivalTime
    
    // 转换时间为分钟数进行比较
    const currentMinutes = timeToMinutes(currentTime)
    
    if (previousTime !== null) {
      const previousMinutes = timeToMinutes(previousTime)
      
      // 如果当前时间小于前一个时间，标记为错误
      if (currentMinutes < previousMinutes) {
        isValid = false
        markTimeError(stop.id)
      }
    }
    
    previousTime = currentTime
    previousStop = stop
  }
  
  return { valid: isValid }
}

// 将时间转换为分钟数
const timeToMinutes = (timeString) => {
  if (!timeString) return 0
  
  const [hours, minutes, seconds] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// 标记时间错误
const markTimeError = (stopId) => {
  nextTick(() => {
    // 找到对应的行
    const tableRows = document.querySelectorAll('.stop-table tr')
    
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i]
      const rowKey = row.getAttribute('data-row-key')
      
      if (rowKey === String(stopId)) {
        // 找到时间单元格 (第6个单元格是时间)
        const cells = row.querySelectorAll('td')
        if (cells.length >= 6) {
          const timeCell = cells[5]  // 索引从0开始，第6个单元格
          if (timeCell) {
            // 添加错误类
            timeCell.classList.add('time-error')
            
            // 找到时间输入框并添加错误样式
            const timeInput = timeCell.querySelector('.el-input__inner')
            if (timeInput) {
              timeInput.style.borderColor = '#F56C6C'
              timeInput.style.backgroundColor = '#FEF0F0'
            }
          }
        }
        break
      }
    }
  })
}

// 清除所有时间错误标记
const clearTimeErrorMarks = () => {
  nextTick(() => {
    // 清除所有带有time-error类的单元格
    const errorCells = document.querySelectorAll('.time-error')
    errorCells.forEach(cell => {
      cell.classList.remove('time-error')
      
      // 清除输入框样式
      const timeInput = cell.querySelector('.el-input__inner')
      if (timeInput) {
        timeInput.style.borderColor = ''
        timeInput.style.backgroundColor = ''
      }
    })
  })
}

// 取消编辑
const cancelEdit = (train) => {
  if (originalTrainData.value) {
    // 找到当前车次在列表中的索引
    const index = filteredTrainSchedules.value.findIndex(t => t.id === train.id)
    if (index !== -1) {
      // 恢复原始数据
      Object.assign(filteredTrainSchedules.value[index], originalTrainData.value)
    }
  }
  
  ElMessage.info('已取消编辑')
  exitEditMode()
}
function deepToRaw(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(deepToRaw)
  }
  const raw = toRaw(obj)
  for (const key in raw) {
    raw[key] = deepToRaw(raw[key])
  }
  return raw
}
// 修改初始化单个车次的 Sortable 函数
const initSortableForTrain = (trainId) => {
  // 只有在编辑模式下才初始化sortable
  if (editingTrainId.value !== trainId) {
    return
  }
  
  // 先销毁旧的实例
  if (sortableInstances[trainId]) {
    sortableInstances[trainId].destroy()
    delete sortableInstances[trainId]
  }
  
  nextTick(() => {
    const tableRef = stopTableRefs[trainId]
    if (!tableRef) {
      console.warn(`未找到车次ID: ${trainId}的表格引用`)
      return
    }
    
    // 获取表格的 tbody 元素
    const el = tableRef.$el.querySelector('.el-table__body tbody')
    if (!el) {
      console.warn(`车次ID: ${trainId}的表格没有找到 tbody 元素`)
      return
    }
    
    console.log(`正在初始化车次ID: ${trainId}的 Sortable`)
    
    // 创建 Sortable 实例
    sortableInstances[trainId] = Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: '.fixed-stop, tr:first-child, tr:last-child',
      preventOnFilter: true,
      // 禁止拖拽到第一行和最后一行
      onMove: (evt) => {
        // 获取所有行
        const rows = Array.from(el.querySelectorAll('tr'))
        // 不允许拖拽到第一行之前或最后一行之后
        if (evt.related === rows[0] || evt.related === rows[rows.length - 1]) {
          return false
        }
        return true
      },
      onStart: (evt) => {
        // 防止拖拽事件触发表格行的点击事件
        evt.item.classList.add('dragging')
        
        // 获取所有行
        const rows = Array.from(el.querySelectorAll('tr'))
        // 禁止拖拽第一行和最后一行（起始站和终点站）
        if (evt.oldIndex === 0 || evt.oldIndex === rows.length - 1) {
          evt.preventDefault()
          return false
        }
      },
      onEnd: async (evt) => {
        // 移除标记类
        evt.item.classList.remove('dragging')
        
        const { oldIndex, newIndex } = evt
        if (oldIndex === newIndex) return
        
        // 找到当前车次
        const train = filteredTrainSchedules.value.find(t => t.id === trainId)
        if (!train) return
        
        // 获取完整的站点列表（包括起始站和终点站）
        const allStops = getStopsWithStartEnd(train)
        
        // 确保不是在操作起始站或终点站
        if (oldIndex === 0 || newIndex === 0 || oldIndex === allStops.length - 1 || newIndex === allStops.length - 1) {
          console.warn('不能移动起始站或终点站')
          return
        }
        
        try {
          // 获取实际的中间站点（不包括起始站和终点站）
          const middleStops = allStops.filter(stop => stop.type !== 'start' && stop.type !== 'end')
          const copyMiddleStops = structuredClone(deepToRaw(middleStops))
          // 调整oldIndex和newIndex，因为我们现在只考虑中间站点
          const adjustedOldIndex = oldIndex - 1  // -1 是因为起始站占据了第一个位置
          const adjustedNewIndex = newIndex - 1  // -1 是因为起始站占据了第一个位置
          
          // 获取需要移动的站点
          const stopToMove = copyMiddleStops[adjustedOldIndex]
          const stopToMove2 = copyMiddleStops[adjustedNewIndex]
          const index1 = copyMiddleStops.findIndex(s => s.id === stopToMove.id)
          const index2 = copyMiddleStops.findIndex(s => s.id === stopToMove2.id)
          console.log('移动站点:', stopToMove, '从位置', adjustedOldIndex + 1, '到位置', adjustedNewIndex + 1)
          middleStops[index1] = stopToMove2
          middleStops[index2] = stopToMove
          train.trainStops = middleStops

          reorderAllStops(train)
          // 打印更新后的站点信息
          console.log('更新后的站点信息:', getStopsWithStartEnd(train))
          ElMessage.success('站点顺序调整成功')

          // 重新初始化sortable
          nextTick(() => {
            if (expandedTrainIds.value.has(trainId) && editingTrainId.value === trainId) {
              initSortableForTrain(trainId)
            }
          })
        } catch (error) {
          console.error('站点交换失败:', error)
          ElMessage.error('站点顺序调整失败')
          
          // 重置DOM顺序
          const sortable = sortableInstances[trainId]
          if (sortable) {
            sortable.sort()
          }
        }
      }
    })
    
    // 添加事件委托，防止拖拽操作触发表格行的点击事件
    el.addEventListener('click', (e) => {
      if (e.target.closest('.drag-handle') || e.target.closest('tr.dragging')) {
        e.stopPropagation()
      }
    }, true)
  })
}

// 获取包含起始站和终点站的完整停靠站列表
const getStopsWithStartEnd = (train) => {
  const result = []
  
  // 添加起始站
  if (train.startStation) {
    result.push({
      id: `start-${train.id}`,
      sequence: 0,
      station: train.startStation,
      arrivalTime: train.departureTime,
      stopDuration: 0,
      type: 'start' // 标记为起始站
    })
  }
  
  // 添加中间停靠站
  if (train.trainStops && Array.isArray(train.trainStops)) {
    // 按序号排序
    const sortedStops = [...train.trainStops].sort((a, b) => a.sequence - b.sequence)
    result.push(...sortedStops)
  }
  
  // 添加终点站
  if (train.endStation) {
    result.push({
      id: `end-${train.id}`,
      sequence: result.length > 0 ? result[result.length - 1].sequence + 1 : 1,
      station: train.endStation,
      arrivalTime: train.arrivalTime,
      stopDuration: 0,
      type: 'end' // 标记为终点站
    })
  }
  
  return result
}

// 添加停靠站
const addStop = (train) => {
  // 确保在编辑模式下
  if (editingTrainId.value !== train.id) {
    enterEditMode(train)
  }
  
  // 设置当前车次ID
  currentTrainId.value = train.id
  isEditingStop.value = false
  
  // 重置表单
  resetStopForm()
  
  // 设置表单初始值
  stopForm.trainId = train.id
  
  // 计算新站点的序号（最大序号+1）
  if (train.trainStops && train.trainStops.length > 0) {
    const maxSequence = Math.max(...train.trainStops.map(stop => stop.sequence))
    stopForm.sequence = maxSequence + 1
  } else {
    stopForm.sequence = 1
  }
  
  // 如果没有可用站点，显示提示
  if (availableStations.value.length === 0) {
    ElMessage.warning('所有站点都已添加到当前车次')
  } else {
    // 自动选择第一个可用站点
    stopForm.stationId = availableStations.value[0].id
  }
  
  // 显示对话框
  stopDialogVisible.value = true
}

// 编辑停靠站
const editStop = (train, stop) => {

  // 确保在编辑模式下
  if (editingTrainId.value !== train.id) {
    enterEditMode(train)
  }
  
  // 设置当前车次ID和停靠站ID
  currentTrainId.value = train.id
  currentStopId.value = stop.id
  isEditingStop.value = true
  
  // 重置表单
  resetStopForm()
  
  // 设置表单值
  stopForm.trainId = train.id
  stopForm.stationId = stop.station?.id
  stopForm.sequence = stop.sequence
  stopForm.arrivalTime = stop.arrivalTime
  stopForm.stopDuration = stop.stopDuration
  
  // 显示对话框
  stopDialogVisible.value = true
}

// 删除停靠站
const deleteStop = (train, stop) => {
  ElMessageBox.confirm(
    `确定要删除 "${stop.station?.stationName || '此'}" 站点吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        // 从trainStops中移除该站点
        if (train.trainStops) {
          const index = train.trainStops.findIndex(s => s.id === stop.id)
          if (index !== -1) {
            train.trainStops.splice(index, 1)
            // 强制更新数组
            train.trainStops = [...train.trainStops]
          }
        }
        
        ElMessage.success('删除成功')
        
        // 重新初始化sortable
        nextTick(() => {
          if (expandedTrainIds.value.has(train.id) && editingTrainId.value === train.id) {
            initSortableForTrain(train.id)
          }
        })
      } catch (error) {
        console.error('删除站点失败:', error)
        ElMessage.error('删除失败: ' + (error.message || '未知错误'))
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 重置停靠站表单
const resetStopForm = () => {
  if (stopFormRef.value) {
    stopFormRef.value.resetFields()
  }
  
  Object.assign(stopForm, {
    trainId: null,
    stationId: null,
    sequence: 1,
    arrivalTime: '',
    stopDuration: 3
  })
}

// 关闭停靠站对话框
const handleStopDialogClose = () => {
  resetStopForm()
  currentStopId.value = null
  isEditingStop.value = false
}

// 提交停靠站表单
const submitStopForm = async () => {
  if (!stopFormRef.value) return
  
  try {
    await stopFormRef.value.validate()
    
    // 找到当前车次
    const train = filteredTrainSchedules.value.find(t => t.id === currentTrainId.value)
    if (!train) {
      throw new Error('找不到当前车次')
    }
    
    // 找到选择的站点
    const selectedStation = stationOptions.value.find(s => s.id === stopForm.stationId)
    if (!selectedStation) {
      throw new Error('找不到选择的站点')
    }
    
    // 检查站点是否已存在于当前车次中（除了当前正在编辑的站点）
    const isStationExists = (stationId) => {
      // 检查起始站
      if (train.startStation && train.startStation.id === stationId) {
        return true
      }
      
      // 检查终点站
      if (train.endStation && train.endStation.id === stationId) {
        return true
      }
      
      // 检查中间停靠站
      if (train.trainStops && Array.isArray(train.trainStops)) {
        return train.trainStops.some(stop => {
          // 如果是编辑模式，排除当前正在编辑的站点
          if (isEditingStop.value && stop.id === currentStopId.value) {
            return false
          }
          return stop.station && stop.station.id === stationId
        })
      }
      
      return false
    }
    
    // 如果站点已存在，显示错误提示
    if (isStationExists(stopForm.stationId)) {
      ElMessage.error(`站点 "${selectedStation.stationName}" 已存在于当前车次中`)
      return
    }
    
    if (isEditingStop.value) {
      // 编辑现有站点
      const stopIndex = train.trainStops.findIndex(s => s.id === currentStopId.value)
      if (stopIndex !== -1) {
        // 更新站点信息，但保留原有序号
        const originalSequence = train.trainStops[stopIndex].sequence
        train.trainStops[stopIndex] = reactive({
          ...train.trainStops[stopIndex],
          station: selectedStation,
          arrivalTime: stopForm.arrivalTime,
          stopDuration: stopForm.stopDuration,
          updateTime: new Date().toISOString()
        })
        
        // 如果序号发生变化，需要重新排序
        if (originalSequence !== stopForm.sequence) {
          reorderStops(train, stopIndex, stopForm.sequence)
        }
      }
    } else {
      // 添加新站点
      if (!train.trainStops) {
        train.trainStops = []
      }
      
      // 创建新站点对象
      const newStop = reactive({
        trainId: train.id,
        station: selectedStation,
        sequence: stopForm.sequence, // 暂时使用表单中的序号
        arrivalTime: stopForm.arrivalTime,
        stopDuration: stopForm.stopDuration,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      })
      
      // 添加到列表并重新排序
      train.trainStops.push(newStop)
      
      // 根据序号重新排序所有站点
      reorderAllStops(train)
    }
    
    ElMessage.success(isEditingStop.value ? '站点更新成功' : '站点添加成功')
    stopDialogVisible.value = false
    
    // 重新初始化sortable
    nextTick(() => {
      if (expandedTrainIds.value.has(currentTrainId.value) && editingTrainId.value === currentTrainId.value) {
        initSortableForTrain(currentTrainId.value)
      }
    })
  } catch (error) {
    console.error('提交站点表单失败:', error)
    ElMessage.error('提交失败: ' + (error.message || '未知错误'))
  }
}

// 重新排序所有站点
const reorderAllStops = (train) => {
  console.log(train.trainStops,"KKKKKK");
  if (!train.trainStops || train.trainStops.length === 0) return
  let i = 0
  // 按照当前顺序重新分配序号，从1开始
  for (let i = 0; i < train.trainStops.length; i++) {
    train.trainStops[i].sequence = i + 1
  }
  // 强制更新数组，触发视图更新
  train.trainStops = [...train.trainStops]
}

// 将一个站点移动到新位置并重新排序
const reorderStops = (train, oldIndex, newSequence) => {
  if (!train.trainStops || train.trainStops.length === 0) return
  
  // 获取要移动的站点
  const stopToMove = train.trainStops[oldIndex]
  
  // 移除该站点
  train.trainStops.splice(oldIndex, 1)
  
  // 计算新的插入位置
  // 确保newSequence在有效范围内
  const maxSequence = train.trainStops.length + 1
  newSequence = Math.max(1, Math.min(newSequence, maxSequence))
  
  // 找到插入位置
  let insertIndex = 0
  for (let i = 0; i < train.trainStops.length; i++) {
    if (train.trainStops[i].sequence >= newSequence) {
      insertIndex = i
      break
    }
    insertIndex = i + 1
  }
  
  // 插入站点
  train.trainStops.splice(insertIndex, 0, stopToMove)
  
  // 重新分配序号
  reorderAllStops(train)
}
</script>

<style scoped>
.train-schedule-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.empty-placeholder {
  padding: 30px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.seat-info-block {
  padding: 10px;
}

.capacity-info {
  background-color: #f8f8f8;
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.select-model-tip {
  margin-bottom: 20px;
}

.readonly-warning {
  margin-bottom: 20px;
}

.stops-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 0 50px;
  animation: fadeIn 0.3s ease-in-out;
}

.train-info {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.train-number {
  font-weight: bold;
  font-size: 16px;
}

.train-route {
  color: #666;
  font-size: 14px;
}

.empty-stops {
  padding: 20px 0;
}

.empty-data {
  padding: 40px 0;
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

:deep(.el-table__expanded-cell) {
  padding: 10px 0 !important;
}

/* 添加固定站点的样式 */
.fixed-stop {
  color: #909399;
  font-size: 12px;
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 拖拽手柄样式 */
.drag-handle {
  cursor: move;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.2s;
  margin: 0 auto;
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

/* 编辑模式下的样式 */
.edit-mode {
  background-color: #f0f9eb;
  border: 1px dashed #67c23a;
}

/* 添加拖拽中的样式 */
:deep(tr.dragging) {
  cursor: move !important;
}

/* 防止拖拽时触发行点击事件 */
:deep(tr.dragging *) {
  pointer-events: none;
}

/* 对话框样式 */
.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

/* 添加表单提示样式 */
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  padding-top: 4px;
  margin-bottom: 10px;
}

/* 设置第一行和最后一行的背景色，以便用户知道这些是不可拖拽的区域 */
.stops-container .el-table__body tr:first-child,
.stops-container .el-table__body tr:last-child {
  background-color: #f8f8f8 !important;
}

/* 当拖拽元素靠近第一行或最后一行时，显示禁止样式 */
.stops-container .el-table__body tr:first-child.sortable-ghost,
.stops-container .el-table__body tr:last-child.sortable-ghost {
  background-color: #fef0f0 !important;
  border: 1px dashed #f56c6c !important;
  cursor: not-allowed !important;
}

/* 添加拖拽禁止区域样式 */
:deep(.el-table__body tr:first-child),
:deep(.el-table__body tr:last-child) {
  background-color: #f8f8f8 !important;
}

:deep(.el-table__body tr:first-child.sortable-ghost),
:deep(.el-table__body tr:last-child.sortable-ghost) {
  background-color: #fef0f0 !important;
  border: 1px dashed #f56c6c !important;
  cursor: not-allowed !important;
}

/* 添加时间错误样式 */
:deep(.time-error) {
  position: relative;
}

:deep(.time-error::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #F56C6C;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
</style> 