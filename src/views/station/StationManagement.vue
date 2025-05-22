<template>
  <div class="station-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>车站管理</span>
          <el-button type="primary" @click="handleAddStation">添加车站</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选区域 -->
      <div class="search-container">
        <el-input
          v-model="searchForm.stationName"
          placeholder="车站名称"
          clearable
          @clear="handleSearch"
        >
        </el-input>
        
        <!-- 省份选择 -->
        <el-select
          v-model="searchForm.province"
          placeholder="省份"
          clearable
          filterable
          @change="handleProvinceChange('search')"
        >
          <el-option
            v-for="province in existingProvinces"
            :key="province"
            :label="province"
            :value="province"
          />
        </el-select>
        
        <!-- 城市选择 -->
        <el-select
          v-model="searchForm.city"
          placeholder="城市"
          clearable
          filterable
          :disabled="!searchForm.province"
        >
          <el-option
            v-for="city in filteredCities.search"
            :key="city"
            :label="city"
            :value="city"
          />
        </el-select>
        
        <el-input
          v-model="searchForm.address"
          placeholder="地址"
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
      
      <!-- 车站列表表格 -->
      <el-table
        v-loading="loading"
        :data="filteredStations"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="stationName" label="车站名称" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="province" label="省份" />
        <el-table-column prop="address" label="地址" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleEditStation(scope.row)"
            >编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteStation(scope.row)"
            >删除</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >{{ scope.row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加/编辑车站对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑车站' : '添加车站'"
      width="500px"
    >
      <el-form
        ref="stationFormRef"
        :model="stationForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="车站名称" prop="stationName">
          <el-input v-model="stationForm.stationName" placeholder="请输入车站名称" />
        </el-form-item>
        
        <!-- 省份选择 -->
        <el-form-item label="省份" prop="province">
          <el-select
            v-model="stationForm.province"
            placeholder="请选择或输入省份"
            filterable
            default-first-option
            @change="handleProvinceChange('form')"
          >
            <el-option
              v-for="province in provinces"
              :key="province.name"
              :label="province.name"
              :value="province.name"
            />
          </el-select>
        </el-form-item>
        
        <!-- 城市选择 -->
        <el-form-item label="城市" prop="city">
          <el-select
            v-model="stationForm.city"
            placeholder="请选择或输入城市"
            filterable
            default-first-option
            :disabled="!stationForm.province"
          >
            <el-option
              v-for="city in filteredCities.form"
              :key="city.name"
              :label="city.name"
              :value="city.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input v-model="stationForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="stationForm.status" placeholder="请选择状态">
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
  getStations, 
  createStation, 
  updateStation, 
  deleteStation 
} from '@/api/station'
import levelData from '@/assets/level.json'

// 解析省市数据
const provinces = ref(levelData)

// 提取已有的省份和城市数据（用于查询表单）
const existingProvinces = ref([])
const existingCities = ref([])

// 列表数据
const stations = ref([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  stationName: '',
  province: '',
  city: '',
  address: '',
  status: ''
})

// 省市关联过滤
const filteredCities = reactive({
  search: [],
  form: []
})

// 省份选择变更处理
const handleProvinceChange = (type) => {
  if (type === 'search') {
    filteredCities.search = existingCities.value.filter(city => 
      stations.value.some(station => 
        station.province === searchForm.province && 
        station.city === city
      )
    )
    
    // 如果当前选中的城市不在筛选后的城市列表中，则清空城市选择
    if (searchForm.city && !filteredCities.search.includes(searchForm.city)) {
      searchForm.city = ''
    }
  } else if (type === 'form') {
    // 表单中的省份变更
    const selectedProvince = provinces.value.find(p => p.name === stationForm.province)
    filteredCities.form = selectedProvince ? selectedProvince.children || [] : []
    
    // 如果是编辑模式且有已选城市，不清空城市选择（只有在用户手动更改省份时才清空）
    if (!isEdit.value || stationForm.city === '') {
      stationForm.city = ''
    } else {
      // 检查当前城市是否在新的城市列表中，如果不在则保留城市但标记为自定义
      const cityExists = filteredCities.form.some(city => city.name === stationForm.city)
      if (!cityExists && stationForm.city) {
        // 如果城市不在列表中但有值，添加到城市列表中
        filteredCities.form.push({ name: stationForm.city })
      }
    }
  }
}

// 切换车站状态
const handleToggleStatus = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  ElMessageBox.confirm(
    `确定要${statusText}车站 "${row.stationName}" 吗? ${statusText=='禁用'?"更改只在后续添加中生效。":""}`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const updatedStation = { ...row, status: newStatus }
        await updateStation(updatedStation)
        ElMessage.success(`${statusText}成功`)
        fetchStations()
      } catch (error) {
        console.error(`${statusText}车站失败:`, error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消操作')
    })
}

// 过滤后的车站列表
const filteredStations = computed(() => {
  let result = stations.value
  
  // 车站名称过滤
  if (searchForm.stationName) {
    const keyword = searchForm.stationName.toLowerCase()
    result = result.filter(station => 
      station.stationName?.toLowerCase().includes(keyword)
    )
  }
  
  // 省份过滤
  if (searchForm.province) {
    result = result.filter(station => 
      station.province === searchForm.province
    )
  }
  
  // 城市过滤
  if (searchForm.city) {
    result = result.filter(station => 
      station.city === searchForm.city
    )
  }
  
  // 地址过滤
  if (searchForm.address) {
    const keyword = searchForm.address.toLowerCase()
    result = result.filter(station => 
      station.address?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  if (searchForm.status !== '') {
    const status = parseInt(searchForm.status)
    result = result.filter(station => station.status === status)
  }
  
  return result
})

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const stationFormRef = ref(null)
const stationForm = reactive({
  id: 0,
  stationName: '',
  province: '',
  city: '',
  address: '',
  status: 1
})

// 表单验证规则
const rules = {
  stationName: [
    { required: true, message: '请输入车站名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 初始化加载数据
onMounted(() => {
  fetchStations()
})

// 获取车站列表
const fetchStations = async () => {
  loading.value = true
  try {
    const result = await getStations()
    stations.value = result
    
    // 提取现有的省份和城市
    const provinces = new Set()
    const cities = new Set()
    
    stations.value.forEach(station => {
      if (station.province) {
        provinces.add(station.province)
      }
      if (station.city) {
        cities.add(station.city)
      }
    })
    
    existingProvinces.value = Array.from(provinces)
    existingCities.value = Array.from(cities)
    
    // 如果已经选择了省份，则更新城市列表
    if (searchForm.province) {
      handleProvinceChange('search')
    }
  } catch (error) {
    console.error('获取车站列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 重置搜索表单
const resetSearchForm = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  filteredCities.search = []
  handleSearch()
}

// 搜索处理
const handleSearch = () => {
  // 前端过滤，无需调用API
}

// 添加车站
const handleAddStation = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑车站
const handleEditStation = (row) => {
  isEdit.value = true
  resetForm()
  
  // 先设置省份
  stationForm.province = row.province
  
  // 然后更新城市列表
  handleProvinceChange('form')
  
  // 最后设置其他字段，包括城市
  Object.keys(stationForm).forEach(key => {
    if (key in row) {
      stationForm[key] = row[key]
    }
  })
  
  dialogVisible.value = true
}

// 删除车站
const handleDeleteStation = (row) => {
  ElMessageBox.confirm(
    `确定要删除车站 "${row.stationName}" 吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await deleteStation(row.id)
        ElMessage.success('删除成功')
        fetchStations()
      } catch (error) {
        console.error('删除车站失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 重置表单
const resetForm = () => {
  if (stationFormRef.value) {
    stationFormRef.value.resetFields()
  }
  Object.assign(stationForm, {
    id: 0,
    stationName: '',
    province: '',
    city: '',
    address: '',
    status: 1
  })
  
  filteredCities.form = []
}

// 提交表单
const submitForm = async () => {
  if (!stationFormRef.value) return
  
  await stationFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateStation(stationForm)
          ElMessage.success('修改成功')
        } else {
          // 创建站点时，排除id字段
          const { id, ...stationData } = stationForm
          await createStation(stationData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchStations()
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
.station-management {
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
</style> 