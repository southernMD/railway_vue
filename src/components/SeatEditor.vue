<template>
  <el-dialog
    v-model="visibleMy"
    :title="`编辑座位 - 车厢${carriageNumber}`"
    width="950px"
    :before-close="handleClose"
  >
    <div class="seats-container">
      <div class="seats-header">
        <div class="seat-info">
          <span>车厢类型: {{ getCarriageTypeName(carriageType) }}</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="showAddSeatDialog" 
            class="add-seat-btn"
          >
            添加座位
          </el-button>
          
          <!-- 新增：多选模式开关按钮 -->
          <el-button 
            :type="selectionMode ? 'success' : 'info'" 
            size="small" 
            @click="toggleSelectionMode" 
            class="selection-mode-btn"
          >
            {{ selectionMode ? '退出多选' : '删除座位' }}
          </el-button>
          
          <!-- 只在多选模式下显示这些操作按钮 -->
          <template v-if="selectionMode">
            <el-button 
              type="default" 
              size="small" 
              @click="selectAllSeats" 
              class="selection-btn"
              :disabled="existingSeats.length === 0"
            >
              全选
            </el-button>
            <el-button 
              type="default" 
              size="small" 
              @click="clearSelection" 
              class="selection-btn"
              :disabled="selectedSeats.length === 0"
            >
              清空
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="batchDeleteSeats" 
              :disabled="selectedSeats.length === 0"
              class="delete-seat-btn"
            >
              删除座位({{ selectedSeats.length }})
            </el-button>
          </template>
        </div>
        <div class="seat-legend">
          <!-- 根据车厢类型动态显示对应的座位图例 -->
          <template v-if="carriageType === 0">
            <div class="legend-item">
              <div class="seat-icon business available">A01</div>
              <span>可用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon business occupied">A01</div>
              <span>已占用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon business disabled">A01</div>
              <span>维护中</span>
            </div>
          </template>
          
          <template v-else-if="carriageType === 1">
            <div class="legend-item">
              <div class="seat-icon first-class available">A01</div>
              <span>可用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon first-class occupied">A01</div>
              <span>已占用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon first-class disabled">A01</div>
              <span>维护中</span>
            </div>
          </template>
          
          <template v-else-if="carriageType === 2">
            <div class="legend-item">
              <div class="seat-icon second-class available">A01</div>
              <span>可用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon second-class occupied">A01</div>
              <span>已占用</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon second-class disabled">A01</div>
              <span>维护中</span>
            </div>
          </template>
        </div>
      </div>

      <div class="carriage-container">
        <!-- 商务座：2-1布局 -->
        <template v-if="carriageType === 0">
          <div class="seat-section">
            <div class="seat-row-group" v-for="(section, sectionIndex) in allColumnSections" :key="`section-${sectionIndex}`">
              <!-- 左侧2列 -->
              <div class="column-group">
                <div v-for="col in 2" :key="`col-left-${col}`" class="seat-column">
                  <div class="column-label">{{ col }}列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(col, sectionIndex)"
                    :key="`seat-${col}-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'business',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
              
              <!-- 过道 -->
              <div class="aisle-vertical">过道</div>
              
              <!-- 右侧1列 -->
              <div class="column-group">
                <div class="seat-column">
                  <div class="column-label">3列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(3, sectionIndex)"
                    :key="`seat-3-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'business',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 一等座：2-2布局 -->
        <template v-else-if="carriageType === 1">
          <div class="seat-section">
            <div class="seat-row-group" v-for="(section, sectionIndex) in allColumnSections" :key="`section-${sectionIndex}`">
              <!-- 左侧2列 -->
              <div class="column-group">
                <div v-for="col in 2" :key="`col-left-${col}`" class="seat-column">
                  <div class="column-label">{{ col }}列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(col, sectionIndex)"
                    :key="`seat-${col}-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'first-class',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
              
              <!-- 过道 -->
              <div class="aisle-vertical">过道</div>
              
              <!-- 右侧2列 -->
              <div class="column-group">
                <div v-for="col in 2" :key="`col-right-${col}`" class="seat-column">
                  <div class="column-label">{{ col+2 }}列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(col+2, sectionIndex)"
                    :key="`seat-${col+2}-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'first-class',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 二等座：2-3布局 -->
        <template v-else-if="carriageType === 2">
          <div class="seat-section">
            <div class="seat-row-group" v-for="(section, sectionIndex) in allColumnSections" :key="`section-${sectionIndex}`">
              <!-- 左侧2列 -->
              <div class="column-group">
                <div v-for="col in 2" :key="`col-left-${col}`" class="seat-column">
                  <div class="column-label">{{ col }}列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(col, sectionIndex)"
                    :key="`seat-${col}-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'second-class',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
              
              <!-- 过道 -->
              <div class="aisle-vertical">过道</div>
              
              <!-- 右侧3列 -->
              <div class="column-group">
                <div v-for="col in 3" :key="`col-right-${col}`" class="seat-column">
                  <div class="column-label">{{ col+2 }}列</div>
                  <div 
                    v-for="(seat, index) in sectionColumnSeats(col+2, sectionIndex)"
                    :key="`seat-${col+2}-${index}-${sectionIndex}`" 
                    class="seat-wrapper"
                  >
                    <div 
                      v-if="seat"
                      :class="[
                        'seat-icon', 
                        'second-class',
                        seat.status === 1 ? 'available' : 'disabled',
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="selectionMode ? toggleSeatSelection(seat) : null"
                    >
                      {{ seat.seatNumber }}
                    </div>
                    <div v-else class="seat-placeholder"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="saveTempSeats" :loading="isSaving">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 添加座位表单对话框 -->
  <el-dialog
    v-model="addSeatDialogVisible"
    title="添加座位"
    width="30%"
    :append-to-body="true"
  >
    <el-form :model="addSeatForm" :rules="addSeatRules" ref="addSeatFormRef" label-width="120px">
      <el-form-item label="添加座位数量" prop="count">
        <el-input-number
          v-model="addSeatForm.count"
          :min="1"
          :max="remainingSeatsToAdd"
          :precision="0"
          :step="1"
        ></el-input-number>
        <span class="max-seats-info">最多可添加 {{ remainingSeatsToAdd }} 个座位</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="addSeatDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddSeats">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>
  
<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';  // 添加ElMessageBox导入
import seatApi from '../api/seat'; // 导入座位API

// 简化props，只保留显示相关的属性
const props = defineProps({
  visible: Boolean,
  model: Object,
  carriage: Object,
  initialSeats: Array,
});
const carriageNumber = computed(() => props.carriage.carriageNumber);
const carriageType = computed(() => props.carriage.carriageType);
const carriageId = computed(() => props.carriage.id);
const modelId = computed(() => props.model.id);
const initialSeats = computed(()=>props.carriage.seats)
const visibleMy = computed(() => props.visible);
const maxSeatsToAdd = computed(()=>props.model.maxCapacity - props.model.carriages?.map(it=>it.seats.length).reduce((a,b)=>a+b,0))

// 只保留关闭对话框的emit事件
const emit = defineEmits(["update:visible", "close"]);

// 添加座位相关变量
const addSeatDialogVisible = ref(false);
const addSeatFormRef = ref(null);
const addSeatForm = ref({
  count: 1
});

// 新增：实际可添加的剩余座位数
const remainingSeatsToAdd = computed(() => {
  return maxSeatsToAdd.value - tempSeats.value.length;
});

// 表单验证规则
const addSeatRules = {
  count: [
    { required: true, message: '请输入座位数量', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value < 1) {
          callback(new Error('最少添加1个座位'));
        } else if (value > remainingSeatsToAdd.value) {
          callback(new Error(`最多添加${remainingSeatsToAdd.value}个座位`));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 新座位数组（临时存储添加的座位）
const tempSeats = ref([]);

// 合并的座位列表（原有座位 + 临时座位）
const allSeats = computed(() => {
  return [...initialSeats.value, ...tempSeats.value];
});

// 添加保存状态标记
const isSaving = ref(false);

// 添加选中座位的状态
const selectedSeats = ref([]);

// 添加多选模式状态
const selectionMode = ref(false);

// 计算所有非临时座位（即已保存到服务器的座位）
const existingSeats = computed(() => {
  return initialSeats.value.filter(seat => !seat.isNew);
});

// 切换多选模式
const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value;
  
  // 退出多选模式时，清空选择
  if (!selectionMode.value) {
    selectedSeats.value = [];
  }
};

// 选择全部座位
const selectAllSeats = () => {
  // 只选择已保存的座位（非临时座位）
  selectedSeats.value = existingSeats.value.map(seat => seat.id);
};

// 清空选择
const clearSelection = () => {
  selectedSeats.value = [];
};

// 切换座位选择状态 - 修改为只在多选模式下有效
const toggleSeatSelection = (seat) => {
  // 只有在多选模式下才能选择座位
  if (!selectionMode.value) return;
  
  // 临时添加的座位不能删除
  if (seat.isNew) {
    ElMessage({
      message: '临时添加的座位无法删除，请先保存',
      type: 'warning'
    });
    return;
  }
  
  const index = selectedSeats.value.indexOf(seat.id);
  if (index === -1) {
    selectedSeats.value.push(seat.id);
  } else {
    selectedSeats.value.splice(index, 1);
  }
};

// 批量删除座位函数
const batchDeleteSeats = async () => {
  if (selectedSeats.value.length === 0) {
    return;
  }
  
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSeats.value.length} 个座位吗？`,
      '删除座位',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 显示加载指示器
    const loadingInstance = ElLoading.service({
      text: '正在删除座位...',
      background: 'rgba(0, 0, 0, 0.7)'
    });
    
    try {
      // 调用API进行批量删除，使用单独事务策略
      // 这里我们需要在后端API实现单独事务处理每个座位
      const result = await seatApi.batchDeleteSeats(selectedSeats.value, { separateTransactions: true });
      
      // 处理返回的结果
      const { success, failed } = result;
      
      // 从本地数据中移除成功删除的座位
      if (success && success.length > 0) {
        props.carriage.seats = props.carriage.seats.filter(seat => !success.includes(seat.id));
      }
      
      // 提示用户删除结果
      if (failed && failed.length > 0) {
        ElMessage({
          message: `成功删除 ${success.length} 个座位，${failed.length} 个座位删除失败，可能被占用或有关联数据`,
          type: 'warning',
          duration: 5000
        });
      } else {
        ElMessage({
          message: `成功删除 ${success.length} 个座位`,
          type: 'success'
        });
      }
      
      // 清空选择
      selectedSeats.value = [];
    } finally {
      // 无论成功失败，都关闭加载指示器
      loadingInstance.close();
    }
  } catch (error) {
    // 用户取消删除操作
    if (error !== 'cancel') {
      ElMessage.error(`删除操作出错: ${error.message || '未知错误'}`);
      console.error('删除座位出错:', error);
    }
  }
};

// 修改显示添加座位对话框函数
const showAddSeatDialog = () => {
  // 检查是否已达上限，包含临时添加的座位
  if (remainingSeatsToAdd.value <= 0) {
    // 显示警告信息
    ElMessage({
      message: '已达到座位上限，无法添加更多座位',
      type: 'warning',
      duration: 3000
    });
    return; // 中断函数执行
  }
  
  // 未达上限，正常显示对话框
  // 调整默认值确保不超过剩余可添加数
  addSeatForm.value.count = Math.min(1, remainingSeatsToAdd.value);
  addSeatDialogVisible.value = true;
};

// 修改确认添加座位的函数
const confirmAddSeats = () => {
  addSeatFormRef.value.validate((valid) => {
    if (valid) {
      const count = addSeatForm.value.count;
      const seatsToAdd = generateNewSeats(count);
      
      // 将新生成的座位加入到临时座位数组
      tempSeats.value = [...tempSeats.value, ...seatsToAdd];
      
      // 关闭对话框
      addSeatDialogVisible.value = false;
    }
  });
};

// 修改生成新座位的函数，使用allSeats计算属性
const generateNewSeats = (count) => {
  // 找出当前已使用的所有座位号
  const usedSeatNumbers = new Set();
  
  // 添加原有座位和临时座位
  allSeats.value.forEach(seat => {
    usedSeatNumbers.add(seat.seatNumber);
  });
  
  // 获取车厢类型对应的最大列数
  const maxColumns = getDefaultColumnCountForType(carriageType.value);
  
  // 确定下一个可用的座位编号
  let nextLetter = "A";
  let nextNumber = 1;
  
  // 查找第一个可用的位置
  while (usedSeatNumbers.has(generateSeatNumber(nextLetter, nextNumber))) {
    if (nextNumber < maxColumns) {
      // 同一行，下一列
      nextNumber++;
    } else {
      // 换到下一行第一列
      nextNumber = 1;
      nextLetter = getNextLetter(nextLetter);
    }
  }
  
  // 生成新座位
  const newSeatsArray = [];
  let currentLetter = nextLetter;
  let currentNumber = nextNumber;
  
  for (let i = 0; i < count; i++) {
    // 确保当前座位号未被使用
    let seatNumber = generateSeatNumber(currentLetter, currentNumber);
    
    // 连续检查，直到找到未使用的座位号
    while (usedSeatNumbers.has(seatNumber)) {
      // 移动到下一个位置
      if (currentNumber < maxColumns) {
        currentNumber++;
      } else {
        currentNumber = 1;
        currentLetter = getNextLetter(currentLetter);
      }
      seatNumber = generateSeatNumber(currentLetter, currentNumber);
    }
    
    // 创建新座位对象
    newSeatsArray.push({
      id: `new-${Date.now()}-${i}`, // 临时ID，提交时后端会重新分配
      carriageId: carriageId.value,
      seatNumber,
      status: 1, // 默认为可用状态
      lockInfo: [],
      isNew: true // 标记为新添加的座位
    });
    
    // 记录已使用的座位号，避免下一个座位重复
    usedSeatNumbers.add(seatNumber);
    
    // 移动到下一个座位编号 - 遵循先填满一行再到下一行的规则
    if (currentNumber < maxColumns) {
      // 当前行未填满，移动到下一列
      currentNumber++;
    } else {
      // 当前行已填满，移动到下一行的第一列
      currentNumber = 1;
      currentLetter = getNextLetter(currentLetter);
    }
  }
  
  return newSeatsArray;
};

// 修正根据车厢类型获取默认列数的函数
const getDefaultColumnCountForType = (type) => {
  const type_num = parseInt(type);
  switch (type_num) {
    case 0: return 3; // 商务座：2-1布局，共3列
    case 1: return 4; // 一等座：2-2布局，共4列
    case 2: return 5; // 二等座：2-3布局，共5列
    default: return 3;
  }
};

// 获取下一个字母（支持从Z到AA）
const getNextLetter = (letter) => {
  const lastChar = letter.charAt(letter.length - 1);
  
  if (lastChar === 'Z') {
    // 如果是Z，则变成AA
    return letter.slice(0, -1) + 'AA';
  } else {
    // 否则字母+1
    return letter.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
  }
};

// 解析座位号
const parseSeatNumber = (seatNumber) => {
  const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return {
      letter: match[1],
      number: parseInt(match[2], 10)
    };
  }
  return null;
};

// 获取所有唯一的列号 - 计算属性
const uniqueColumnNumbers = computed(() => {
  if (!allSeats.value || !allSeats.value.length) return [];
  
  const columnNumbers = new Set();
  allSeats.value.forEach(seat => {
    const parsed = parseSeatNumber(seat.seatNumber);
    if (parsed) columnNumbers.add(parsed.number);
  });
  
  return Array.from(columnNumbers).sort((a, b) => a - b);
});

// 获取某列的所有座位 - 计算属性
const columnSeats = computed(() => {
  if (!allSeats.value || !allSeats.value.length) {
    return {};
  }
  
  const result = {};
  uniqueColumnNumbers.value.forEach(colNumber => {
    // 筛选出当前列的座位
    const seats = allSeats.value.filter(seat => {
      const parsed = parseSeatNumber(seat.seatNumber);
      return parsed && parsed.number === colNumber;
    });
    
    // 按字母排序（A, B, C, ..., Z, AA, AB, ...）
    result[colNumber] = seats.sort((a, b) => {
      const letterA = parseSeatNumber(a.seatNumber).letter;
      const letterB = parseSeatNumber(b.seatNumber).letter;
      if (letterA.length !== letterB.length) {
        return letterA.length - letterB.length;
      }
      return letterA.localeCompare(letterB);
    });
  });
  
  return result;
});

// 获取每列最多可能需要分成几个6座一组的区块 - 转为计算属性
const allColumnSections = computed(() => {
  if (!allSeats.value || !allSeats.value.length) return [0];
  
  const maxSeatsPerColumn = Math.max(
    ...uniqueColumnNumbers.value.map(col => 
      columnSeats.value[col] ? columnSeats.value[col].length : 0
    )
  );
  
  const sections = Math.ceil(maxSeatsPerColumn / 6);
  return Array.from({ length: sections }, (_, i) => i);
});

// 获取某一列在特定区块的6个座位 - 转为返回函数的计算属性
const sectionColumnSeats = computed(() => {
  return (colNumber, sectionIndex) => {
    if (!columnSeats.value[colNumber]) {
      return Array(6).fill(null);
    }
    
    const allSeats = columnSeats.value[colNumber];
    const startIdx = sectionIndex * 6;
    const endIdx = startIdx + 6;
    const sectionSeats = allSeats.slice(startIdx, endIdx);
    
    // 填充到6个座位
    const result = [...sectionSeats];
    while (result.length < 6) {
      result.push(null);
    }
    
    return result;
  };
});

// 获取车厢类型名称
const getCarriageTypeName = (type) => {
  const types = {
    0: "商务座",
    1: "一等座",
    2: "二等座",
  };
  return types[type] || "未知类型";
};

// 生成座位号（如果需要添加新座位）
const generateSeatNumber = (rowLetter, colNumber) => {
  return `${rowLetter}${colNumber.toString().padStart(2, '0')}`;
};

// 修改保存临时座位的方法，保存成功后更新列表而不是关闭对话框
const saveTempSeats = async () => {
  // 如果没有新增的座位，直接提示
  if (tempSeats.value.length === 0) {
    ElMessage({
      message: '没有需要保存的新座位',
      type: 'warning'
    });
    return;
  }
  
  try {
    // 设置保存状态为正在保存
    isSaving.value = true;
    
    // 将临时座位转换为CreateSeat类型
    const seatsToSave = tempSeats.value.map(seat => ({
      carriageId: seat.carriageId,
      seatNumber: seat.seatNumber,
      status: seat.status
      // 不需要包含id和isNew等临时属性
    }));
    
    // 调用API保存座位，并获取返回结果
    const response = await seatApi.batchCreateSeat(seatsToSave);
    
    // 从响应中获取保存成功的座位数据
    const savedSeats = response || [];
    
    if (savedSeats && savedSeats.length > 0) {
      // 将保存成功的座位添加到车厢座位列表中
      props.carriage.seats = [...props.carriage.seats, ...savedSeats];
      
      // 清空临时座位列表
      tempSeats.value = [];
      
      // 保存成功提示
      ElMessage({
        message: `成功添加 ${savedSeats.length} 个座位`,
        type: 'success'
      });
    } else {
      // 如果没有返回有效数据，给出提示
      ElMessage({
        message: '座位保存成功，但未返回数据',
        type: 'info'
      });
    }
  } catch (error) {
    // 保存失败提示
    ElMessage({
      message: `保存失败: ${error.message || '未知错误'}`,
      type: 'error'
    });
    console.error('保存座位出错:', error);
  } finally {
    // 无论成功失败，都重置保存状态
    isSaving.value = false;
  }
};

// 修改关闭对话框方法，添加未保存座位检查
const handleClose = async () => {
  // 检查是否正在保存，如果是则不允许关闭
  if (isSaving.value) {
    ElMessage({
      message: '正在保存，请稍候...',
      type: 'info'
    });
    return;
  }
  
  // 检查是否有未保存的临时座位
  if (tempSeats.value.length > 0) {
    try {
      // 弹出确认对话框询问是否保存
      await ElMessageBox.confirm(
        `您有 ${tempSeats.value.length} 个座位尚未保存，关闭将丢失这些数据。是否保存？`,
        '未保存的座位',
        {
          confirmButtonText: '保存',
          cancelButtonText: '不保存',
          type: 'warning',
        }
      );
      
      // 用户点击了"保存"，调用保存方法
      await saveTempSeats();
      
      // 保存完成后，继续关闭对话框
      closeDialog();
    } catch (error) {
      // 用户选择了"不保存"或关闭了对话框
      if (error === 'cancel') {
        // 用户选择不保存，直接关闭对话框
        closeDialog();
      }
      // 如果是其他错误，不关闭对话框
    }
  } else {
    // 没有未保存的座位，直接关闭
    closeDialog();
  }
};

// 提取实际关闭对话框的逻辑为单独函数
const closeDialog = () => {
  // 清除临时添加的座位
  tempSeats.value = [];
  
  emit("update:visible", false);
  emit("close");
};
</script>
  
<style scoped>
/* 座位容器样式 */
.seats-container {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  height: 600px; /* 保持总高度不变 */
}

.seats-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.seat-legend {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 座位布局 - 添加滚动功能 */
.carriage-container {
  padding: 20px 0;
  overflow-y: auto; /* 只在座位区域添加垂直滚动 */
  flex-grow: 1; /* 允许座位区域占据剩余空间 */
}

.seat-section {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 20px;
}

.seat-row-group {
  display: flex;
  gap: 15px;
  position: relative;
}

.column-group {
  display: flex;
  gap: 15px;
}

.seat-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.column-label {
  font-weight: bold;
  font-size: 14px;
  padding-bottom: 5px;
}

.aisle-vertical {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-lr;
  text-orientation: upright;
  color: #909399;
  font-size: 12px;
  margin: 0 5px;
}

.seat-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.seat-icon, .seat-placeholder {
  width: 35px;
  height: 35px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 12px;
}

.seat-placeholder {
  opacity: 0.1;
  border: 1px dashed #ccc;
}

.seat-icon {
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.seat-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

/* 座位类型样式 */
.seat-icon.business {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

.seat-icon.first-class {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.seat-icon.second-class {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

/* 座位状态样式 */
.seat-icon.available {
  opacity: 1;
}

.seat-icon.occupied {
  background-color: #f56c6c !important;
  color: white !important;
  border-color: #f56c6c !important;
}

.seat-icon.disabled {
  background-color: #909399 !important;
  color: #dddddd !important;
  border-color: #909399 !important;
  opacity: 0.6;
}

/* 添加新样式 */
.seat-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.add-seat-btn {
  margin-left: 10px;
}

.max-seats-info {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

/* 添加新座位的样式 */
.seat-icon.new-seat {
  border-style: dashed;
  background-color: rgba(255, 255, 255, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
}

/* 添加选中座位的样式 */
.seat-icon.selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.8);
}

/* 删除按钮样式 */
.delete-seat-btn {
  margin-left: 10px;
}

/* 新增样式 */
.selection-mode-btn,
.selection-btn {
  margin-left: 10px;
}

/* 可选择状态的座位样式 */
.seat-icon.selectable {
  cursor: pointer;
}

.seat-icon.selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
}

/* 修改选中座位样式 */
.seat-icon.selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.8);
  position: relative;
}

.seat-icon.selected::after {
  content: "✓";
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #409eff;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}
</style>