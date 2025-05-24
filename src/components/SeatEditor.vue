<template>
  <el-dialog
    v-model="visibleMy"
    :title="`编辑座位 - 车厢${carriageNumber}`"
    width="950px"
    :before-close="handleClose"
  >
    <div class="seats-container">
      <div class="seats-header">
        <div class="seat-controls">
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
            
            <el-button 
              :type="selectionMode ? 'success' : 'info'" 
              size="small" 
              @click="toggleSelectionMode" 
              class="selection-mode-btn"
            >
              {{ selectionMode ? '退出多选' : '删除座位' }}
            </el-button>
          </div>
          
          <div v-if="selectionMode" class="selection-controls">
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
          </div>
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
              <div class="seat-icon business scheduled-occupied">A01</div>
              <span>计划占用中</span>
          </div>
            <div class="legend-item">
              <div class="seat-icon business disabled">A01</div>
              <span>维护中</span>
        </div>
            <div class="legend-item">
              <div class="seat-icon business scheduled-maintenance">A01</div>
              <span>计划维护中</span>
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
              <div class="seat-icon first-class scheduled-occupied">A01</div>
              <span>计划占用中</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon first-class disabled">A01</div>
              <span>维护中</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon first-class scheduled-maintenance">A01</div>
              <span>计划维护中</span>
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
              <div class="seat-icon second-class scheduled-occupied">A01</div>
              <span>计划占用中</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon second-class disabled">A01</div>
              <span>维护中</span>
            </div>
            <div class="legend-item">
              <div class="seat-icon second-class scheduled-maintenance">A01</div>
              <span>计划维护中</span>
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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
                        getSeatDisplayStatus(seat),
                        seat.isNew ? 'new-seat' : '',
                        selectionMode && selectedSeats.includes(seat.id) ? 'selected' : '',
                        selectionMode ? 'selectable' : ''
                      ]"
                      @click="handleSeatClick(seat)"
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

  <!-- 修改LockInfo展示对话框，添加"添加锁定记录"按钮 -->
  <el-dialog
    v-model="lockInfoDialogVisible"
    :title="`座位 ${currentSeat?.seatNumber || ''} 锁定信息`"
    width="70%"
    :append-to-body="true"
  >
    <div class="lock-info-header">
      <el-button 
        type="primary" 
        size="small" 
        @click="showAddLockForm"
        :disabled="!currentSeat || currentSeat.isNew"
      >
        添加锁定记录
      </el-button>
    </div>
    
    <div v-if="currentSeat && currentSeat.lockInfo && currentSeat.lockInfo.length">
      <el-table 
        :data="currentSeat.lockInfo" 
        style="width: 100%" 
        border
        :default-sort="{ prop: 'lockStart', order: 'ascending' }"
      >
        <el-table-column prop="id" label="ID" width="80" sortable></el-table-column>
        <el-table-column label="状态" width="100" sortable prop="finish">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.finish)">
              {{ getStatusName(scope.row.finish) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120" sortable prop="type">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.type)">
              {{ getTypeName(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lockStart" label="开始时间" width="180" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.lockStart) }}
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="结束时间" width="180" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.expireTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" sortable>
          <template #default="scope">
            {{ scope.row.reason || '无' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" :sortable="false">
          <template #default="scope">
            <div class="button-group">
              <el-button
                v-if="scope.row.type === 0 && scope.row.finish === 0 && isCurrentlyActive(scope.row)"
                type="success"
                size="small"
                @click="handleCompleteLock(scope.row)"
                :loading="completingLockId === scope.row.id"
              >
                立刻完成
              </el-button>
              <el-button
                v-if="scope.row.type === 0 && scope.row.finish === 0 && isNotStartedYet(scope.row)"
                type="primary"
                size="small"
                @click="handleCancelMaintenance(scope.row)"
                :loading="cancelingLockId === scope.row.id"
              >
                取消维护
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else class="empty-data">
      该座位没有锁定记录
    </div>
  </el-dialog>

  <!-- 修改锁定记录表单对话框 -->
  <el-dialog
    v-model="addLockDialogVisible"
    title="添加锁定记录"
    width="50%"
    :append-to-body="true"
  >
    <el-form :model="addLockForm" :rules="addLockRules" ref="addLockFormRef" label-width="100px">
      <!-- 改成下拉菜单选择锁定类型 -->
      <el-form-item label="锁定类型" prop="type">
        <el-select v-model="addLockForm.type" placeholder="请选择锁定类型">
          <el-option :value="0" label="维护"></el-option>
          <el-option :value="1" label="占用"></el-option>
          <el-option :value="2" label="取消"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="开始时间" prop="lockStart">
        <el-date-picker
          v-model="addLockForm.lockStart"
          type="datetime"
          placeholder="选择开始时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :disabled-date="disablePastDates"
        />
      </el-form-item>
      
      <el-form-item label="结束时间" prop="expireTime">
        <el-date-picker
          v-model="addLockForm.expireTime"
          type="datetime"
          placeholder="选择结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :disabled-date="(time) => time < new Date(addLockForm.lockStart) || disablePastDates(time)"
        />
      </el-form-item>
      
      <el-form-item label="锁定原因" prop="reason">
        <el-input
          v-model="addLockForm.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入锁定原因（选填）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="addLockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLockForm" :loading="isSubmittingLock">保存</el-button>
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
watch(()=>initialSeats,()=>{
  console.log(initialSeats.value,"座位信息");
},{immediate:true,deep:true})
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

// 修改切换座位选择状态函数，允许选择临时座位
const toggleSeatSelection = (seat) => {
  // 只有在多选模式下才能选择座位
  if (!selectionMode.value) return;
  
  // 移除对临时座位的限制，允许选择所有座位
  // 对于临时座位，使用临时ID存储在选中数组中
  const seatId = seat.id;
  const index = selectedSeats.value.indexOf(seatId);
  
  if (index === -1) {
    selectedSeats.value.push(seatId);
  } else {
    selectedSeats.value.splice(index, 1);
  }
};

// 修改批量删除座位函数，改进成功和失败提示
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
    
    // 分离临时座位ID和已保存的座位ID
    const tempSeatIds = [];
    const savedSeatIds = [];
    
    // 记录每个座位ID对应的座位号，用于显示结果信息
    const seatNumberMap = {};
    
    selectedSeats.value.forEach(id => {
      if (String(id).startsWith('new-')) {
        tempSeatIds.push(id);
        // 查找临时座位对应的座位号
        const seat = tempSeats.value.find(s => s.id === id);
        if (seat) {
          seatNumberMap[id] = seat.seatNumber;
        }
      } else {
        savedSeatIds.push(id);
        // 查找已保存座位对应的座位号
        const seat = initialSeats.value.find(s => s.id === id);
        if (seat) {
          seatNumberMap[id] = seat.seatNumber;
        }
      }
    });
    
    let successIds = [];  // 记录成功删除的ID
    let failedIds = [];   // 记录失败的ID
    
    // 处理临时座位的删除（从临时数组中移除）
    if (tempSeatIds.length > 0) {
      // 从临时座位数组中移除选中的临时座位
      tempSeats.value = tempSeats.value.filter(seat => !tempSeatIds.includes(seat.id));
      // 所有临时座位都视为成功删除
      successIds = [...successIds, ...tempSeatIds];
    }
    
    // 处理已保存座位的删除（调用API）
    if (savedSeatIds.length > 0) {
      // 显示加载指示器
      const loadingInstance = ElLoading.service({
        text: '正在删除座位...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 调用API进行批量删除，使用单独事务策略
        const result = await seatApi.batchDeleteSeats(savedSeatIds, { separateTransactions: true });
        
        // 处理返回的结果
        const { success, failed } = result;
        
        // 从本地数据中移除成功删除的座位
        if (success && success.length > 0) {
          props.carriage.seats = props.carriage.seats.filter(seat => !success.includes(seat.id));
          successIds = [...successIds, ...success];
        }
        
        // 记录失败的ID
        if (failed && failed.length > 0) {
          failedIds = [...failedIds, ...failed];
        }
      } finally {
        // 无论成功失败，都关闭加载指示器
        loadingInstance.close();
      }
    }
    
    // 显示结果 - 无论成功或失败都显示详情
    // 构建成功和失败座位的详细信息
    const successSeatsInfo = successIds.map(id => {
      return `座位 ${seatNumberMap[id] || id}`;
    }).join('、');
    
    const failedSeatsInfo = failedIds.map(id => {
      return `座位 ${seatNumberMap[id] || id}`;
    }).join('、');
    
    let messageContent = '';
    let messageType = 'info';
    
    if (successIds.length > 0 && failedIds.length > 0) {
      // 部分成功部分失败
      messageContent = 
        `<div style="margin-bottom:10px">删除操作完成，成功 <b>${successIds.length}</b> 个座位，失败 <b>${failedIds.length}</b> 个座位。</div>` +
        `<div style="margin-bottom:8px"><b style="color:#67c23a">✓ 成功删除的座位：</b></div>` +
        `<div style="margin-bottom:15px;color:#67c23a;max-height:80px;overflow-y:auto;">${successSeatsInfo}</div>` +
        `<div style="margin-bottom:8px"><b style="color:#f56c6c">✗ 删除失败的座位：</b></div>` +
        `<div style="margin-bottom:8px;color:#f56c6c;max-height:80px;overflow-y:auto;">${failedSeatsInfo}</div>` +
        `<div style="font-size:12px;color:#909399">删除失败可能原因：这些座位已被占用或有关联数据</div>`;
      messageType = 'warning';
    } else if (failedIds.length > 0) {
      // 全部失败
      messageContent = 
        `<div style="margin-bottom:10px"><b>所有座位删除失败</b></div>` +
        `<div style="margin-bottom:8px"><b style="color:#f56c6c">✗ 删除失败的座位：</b></div>` +
        `<div style="margin-bottom:8px;color:#f56c6c;max-height:150px;overflow-y:auto;">${failedSeatsInfo}</div>` +
        `<div style="font-size:12px;color:#909399">删除失败可能原因：这些座位已被占用或有关联数据</div>`;
      messageType = 'error';
    } else {
      // 全部成功
      messageContent = 
        `<div style="margin-bottom:10px"><b>所有座位删除成功</b></div>` +
        `<div style="margin-bottom:8px"><b style="color:#67c23a">✓ 成功删除的座位：</b></div>` +
        `<div style="color:#67c23a;max-height:150px;overflow-y:auto;">${successSeatsInfo}</div>`;
      messageType = 'success';
    }
    
    // 使用ElMessageBox显示结果，不会自动关闭
    ElMessageBox.alert(
      messageContent,
      '删除结果',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        type: messageType,
      }
    );
    
    // 清空选择
    selectedSeats.value = [];
    
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

// 添加座位状态判断函数
const getSeatDisplayStatus = (seat) => {
  if (!seat) return null;
  
  // 获取当前时间
  const now = new Date();
  
  // 没有锁定信息或status为1时，默认为可用
  if (!seat.lockInfo || seat.lockInfo.length === 0) {
    return seat.status === 1 ? 'available' : 'disabled';
  }
  
  // 查找所有未完成的锁定项(finish==0)
  const unfinishedLocks = seat.lockInfo.filter(lock => lock.finish === 0);
  if (unfinishedLocks.length === 0) {
    return seat.status === 1 ? 'available' : 'disabled';
  }
  
  // 查找当前时间在[lockStart,expireTime]区间内的锁定项
  let currentLock = unfinishedLocks.find(lock => {
    const lockStart = new Date(lock.lockStart);
    const expireTime = new Date(lock.expireTime);
    return now >= lockStart && now <= expireTime;
  });
  
  // 如果没有找到当前区间内的锁定，查找最接近当前时间的锁定
  if (!currentLock) {
    // 按照lockStart时间排序，找出最接近当前时间的
    const sortedLocks = [...unfinishedLocks].sort((a, b) => {
      const timeA = Math.abs(new Date(a.lockStart) - now);
      const timeB = Math.abs(new Date(b.lockStart) - now);
      return timeA - timeB;
    });
    
    currentLock = sortedLocks[0];
  }
  
  if (currentLock) {
    const lockStart = new Date(currentLock.lockStart);
    const expireTime = new Date(currentLock.expireTime);
    
    // 判断当前时间是否在锁定区间内
    const inTimeRange = now >= lockStart && now <= expireTime;
    
    if (inTimeRange) {
      // 在区间内
      return currentLock.type === 1 ? 'occupied' : 'disabled';
    } else {
      // 区间外（计划中的锁定）
      return currentLock.type === 1 ? 'scheduled-occupied' : 'scheduled-maintenance';
    }
  }
  
  // 如果没有有效的锁定信息，检查座位基本状态
  return seat.status === 1 ? 'available' : 'disabled';
};

// 添加LockInfo对话框相关的状态
const lockInfoDialogVisible = ref(false);
const currentSeat = ref(null);

// 处理座位点击事件
const handleSeatClick = (seat) => {
  if (selectionMode.value) {
    // 在多选模式下，保留原有的选择功能
    toggleSeatSelection(seat);
    return;
  }
  
  // 临时座位没有lockInfo，显示提示
  if (seat.isNew) {
    ElMessage({
      message: '临时添加的座位没有锁定信息',
      type: 'info',
      duration: 2000
    });
    return;
  }
  
  // 显示锁定信息对话框
  currentSeat.value = seat;
  lockInfoDialogVisible.value = true;
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr || dateTimeStr === '1970-01-01T00:00:00') return '未设置';
  
  try {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    return dateTimeStr;
  }
};

// 添加锁定记录相关变量和函数
const addLockDialogVisible = ref(false);
const addLockFormRef = ref(null);
const isSubmittingLock = ref(false);

// 添加锁定记录表单
const addLockForm = ref({
  type: 0, // 默认为"维护"类型
  lockStart: null,
  expireTime: null,
  reason: ''
});

// 表单验证规则
const addLockRules = {
  type: [
    { required: true, message: '请选择锁定类型', trigger: 'change' }
  ],
  lockStart: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  expireTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        if (addLockForm.value.lockStart && value && new Date(value) <= new Date(addLockForm.value.lockStart)) {
          callback(new Error('结束时间必须晚于开始时间'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
};

// 禁用过去的日期
const disablePastDates = (time) => {
  return time < new Date(new Date().setHours(0, 0, 0, 0));
};

// 修改格式化日期为本地时间格式的函数
const formatDateForPicker = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// 确保日期格式为ISO格式（在提交表单时使用）
const formatToISO = (dateStr) => {
  if (!dateStr) return null;
  
  // 确保使用T作为日期和时间的分隔符
  if (dateStr.includes(' ')) {
    return dateStr.replace(' ', 'T');
  }
  
  return dateStr;
};

// 显示添加锁定记录表单
const showAddLockForm = () => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 重置表单，使用本地时间格式
  addLockForm.value = {
    type: 0, // 默认为"维护"类型
    lockStart: formatDateForPicker(now),
    expireTime: formatDateForPicker(tomorrow),
    reason: ''
  };
  
  // 显示对话框
  addLockDialogVisible.value = true;
};

// 提交锁定记录表单
const submitLockForm = () => {
  if (!currentSeat.value) return;
  
  addLockFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        isSubmittingLock.value = true;
        
        // 确保日期格式为ISO格式
        const formatToISO = (dateStr) => {
          if (!dateStr) return null;
          // 将 "YYYY-MM-DD HH:mm:ss" 转换为 "YYYY-MM-DDThh:mm:ss"
          return dateStr.replace(" ", "T");
        };
        
        // 构建锁定记录数据
        const lockData = {
          seatId: currentSeat.value.id,
          type: addLockForm.value.type, // 使用用户选择的类型
          lockStart: formatToISO(addLockForm.value.lockStart),
          expireTime: formatToISO(addLockForm.value.expireTime),
          reason: addLockForm.value.reason,
          finish: 0  // 默认为未完成
        };
        
        console.log("提交的锁定数据:", lockData); // 调试输出
        
        // 调用API保存锁定记录
        const response = await seatApi.createSeatLock(lockData);
        
        // 更新当前座位的锁定信息
        if (response && response.id) {
          // 添加到座位的锁定记录中
          currentSeat.value.lockInfo.push(response);
          
          // 更新视图中的座位状态
          const allSeatsArray = [...initialSeats.value, ...tempSeats.value];
          const seatIndex = allSeatsArray.findIndex(seat => seat.id === currentSeat.value.id);
          
          if (seatIndex !== -1) {
            allSeatsArray[seatIndex].lockInfo = currentSeat.value.lockInfo;
          }

// 关闭对话框
          addLockDialogVisible.value = false;
          
          // 显示成功消息
          ElMessage({
            message: '锁定记录添加成功',
            type: 'success'
          });
        }
      } catch (error) {
        ElMessage.error(`添加锁定记录失败: ${error.message || '未知错误'}`);
        console.error('添加锁定记录出错:', error);
      } finally {
        isSubmittingLock.value = false;
      }
    }
  });
};

// 添加取消中状态跟踪
const cancelingLockId = ref(null);

// 获取锁定类型名称
const getTypeName = (type) => {
  const types = {
    0: "维护",
    1: "占用",
    2: "取消"
  };
  return types[type] || "未知";
};

// 获取锁定类型对应的标签类型
const getTagType = (type) => {
  const types = {
    0: "warning",
    1: "danger",
    2: "info"
  };
  return types[type] || "info";
};

// 获取状态名称
const getStatusName = (finish) => {
  const statuses = {
    0: "进行中",
    1: "已完成",
    2: "已取消"
  };
  return statuses[finish] || "未知";
};

// 获取状态对应的标签类型
const getStatusTagType = (finish) => {
  const types = {
    0: "primary",
    1: "info",
    2: "danger"
  };
  return types[finish] || "info";
};

// 处理取消维护操作
const handleCancelMaintenance = async (lock) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要取消此维护状态吗？`,
      '取消维护',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 设置加载状态
    cancelingLockId.value = lock.id;
    
    // 更新锁定记录状态为已取消(finish=2)，而不是已完成
    // const updatedLock = { ...lock, finish: 2 };
    
    // 调用API更新锁定记录
    await seatApi.cancelSeatLock(lock.id);
    
    // 更新本地数据
    if (currentSeat.value && currentSeat.value.lockInfo) {
      const lockIndex = currentSeat.value.lockInfo.findIndex(item => item.id === lock.id);
      if (lockIndex !== -1) {
        // 更新锁定记录状态
        currentSeat.value.lockInfo[lockIndex].finish = 2; // 修改为finish=2
        currentSeat.value.lockInfo[lockIndex].updateTime = new Date().toISOString().slice(0, 19);
        
        // 更新座位视图中的状态
        const allSeatsArray = [...initialSeats.value, ...tempSeats.value];
        const seatIndex = allSeatsArray.findIndex(seat => seat.id === currentSeat.value.id);
        
        if (seatIndex !== -1) {
          allSeatsArray[seatIndex].lockInfo = [...currentSeat.value.lockInfo];
        }
      }
    }
    
    // 显示成功消息
    ElMessage({
      message: '维护状态已取消',
      type: 'success'
    });
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`取消维护失败: ${error.message || '未知错误'}`);
      console.error('取消维护出错:', error);
    }
  } finally {
    // 重置加载状态
    cancelingLockId.value = null;
  }
};

// 添加立刻完成状态跟踪
const completingLockId = ref(null);

// 处理立刻完成操作
const handleCompleteLock = async (lock) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要将此${getTypeName(lock.type)}记录标记为已完成吗？`,
      '完成锁定',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
    
    // 设置加载状态
    completingLockId.value = lock.id;
    
    // 更新锁定记录状态为已完成(finish=1)
    // const updatedLock = { ...lock, finish: 1 };
    
    // 调用API更新锁定记录
    await seatApi.finishSeatLock(lock.id);
    
    // 更新本地数据
    if (currentSeat.value && currentSeat.value.lockInfo) {
      const lockIndex = currentSeat.value.lockInfo.findIndex(item => item.id === lock.id);
      if (lockIndex !== -1) {
        // 更新锁定记录状态
        currentSeat.value.lockInfo[lockIndex].finish = 1;
        currentSeat.value.lockInfo[lockIndex].updateTime = new Date().toISOString().slice(0, 19);
        
        // 更新座位视图中的状态
        const allSeatsArray = [...initialSeats.value, ...tempSeats.value];
        const seatIndex = allSeatsArray.findIndex(seat => seat.id === currentSeat.value.id);
        
        if (seatIndex !== -1) {
          allSeatsArray[seatIndex].lockInfo = [...currentSeat.value.lockInfo];
        }
      }
    }
    
    // 显示成功消息
    ElMessage({
      message: '锁定记录已标记为完成',
      type: 'success'
    });
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`操作失败: ${error.message || '未知错误'}`);
      console.error('完成锁定记录出错:', error);
    }
  } finally {
    // 重置加载状态
    completingLockId.value = null;
  }
};

// 判断锁定记录是否当前激活（当前时间在开始和结束之间）
const isCurrentlyActive = (lock) => {
  const now = new Date();
  const lockStart = new Date(lock.lockStart.replace(' ', 'T'));
  const expireTime = new Date(lock.expireTime.replace(' ', 'T'));
  
  return now >= lockStart && now <= expireTime;
};

// 判断锁定记录是否尚未开始（当前时间在开始时间之前）
const isNotStartedYet = (lock) => {
  const now = new Date();
  const lockStart = new Date(lock.lockStart.replace(' ', 'T'));
  
  return now < lockStart;
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

.seat-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seat-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.seat-legend {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  max-width: none;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: initial;
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

/* 添加"计划维护中"状态的样式 */
.seat-icon.scheduled-maintenance {
  background-color: #8e44ad !important;
  color: white !important;
  border-color: #8e44ad !important;
  opacity: 0.8;
}

/* 添加"计划占用中"状态的样式 */
.seat-icon.scheduled-occupied {
  background-color: #ff7f50 !important;
  color: white !important;
  border-color: #ff7f50 !important;
  opacity: 0.85;
}

/* 修改后的选择器 - 只针对座位区域内的元素 */
.carriage-container .seat-icon.scheduled-maintenance::after,
.carriage-container .seat-icon.scheduled-occupied::after {
  content: "⏱";
  position: absolute;
  bottom: -3px;
  right: -3px;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  border: 1px solid currentColor;
}

/* 确保图例中不显示这些额外图标 */
.seat-legend .seat-icon::after {
  display: none !important;
}

/* 修改座位悬浮提示效果，只针对实际座位区域 */
.carriage-container .seat-icon:not(.selectable):hover::before {
  content: "点击查看详情";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: normal;
  white-space: nowrap;
  z-index: 10;
  margin-bottom: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.carriage-container .seat-icon:not(.selectable):hover::before {
  opacity: 1;
}

/* 明确禁用图例中座位的悬浮提示 */
.seat-legend .seat-icon::before {
  display: none !important;
}

/* 添加锁定信息表格相关样式 */
.empty-data {
  text-align: center;
  padding: 30px;
  color: #909399;
  font-size: 14px;
}

/* 非选择模式下座位鼠标样式 */
.seat-icon:not(.selectable) {
  cursor: pointer;
}

/* 锁定信息头部样式 */
.lock-info-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表单样式优化 */
.el-date-picker {
  width: 100%;
}

/* 表单提示样式 */
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

/* 添加按钮组样式 */
.button-group {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* 如果空间有限，可以考虑调整按钮的尺寸 */
.button-group .el-button--small {
  padding: 5px 10px;
  font-size: 12px;
}
</style>