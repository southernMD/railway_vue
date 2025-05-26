<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择座位"
    width="1000px"
    :before-close="handleClose"
    class="seat-selection-dialog"
  >
    <div v-loading="loading" class="seat-selection-container">
      <!-- 乘客选择区域 - 仅在非单乘客模式下显示 -->
      <div class="passenger-selection" v-if="!props.singlePassengerMode">
        <div class="section-title">选择乘客</div>
        <div class="passenger-list" v-loading="passengersLoading">
          <template v-if="passengers.length > 0">
            <el-checkbox-group v-model="selectedPassengerIds">
              <el-checkbox 
                v-for="passenger in passengers" 
                :key="passenger.id" 
                :label="passenger.id"
              >
                {{ passenger.realName }} 
                <el-tag size="small" :type="getPassengerTagType(passenger.passengerType)">
                  {{ getPassengerTypeName(passenger.passengerType) }}
                </el-tag>
              </el-checkbox>
            </el-checkbox-group>
          </template>
          
          <!-- 没有乘客数据时的提示 -->
          <el-empty 
            v-else 
            description="您还没有添加乘客信息" 
            :image-size="100"
          >
            <el-button type="primary" @click="goToAddPassenger">
              添加乘客
            </el-button>
          </el-empty>
        </div>
        <div class="passenger-selection-footer" v-if="passengers.length > 0">
          <el-button type="primary" size="small" @click="confirmPassengerSelection" :disabled="!hasPassengersSelected">
            确认乘客选择
          </el-button>
        </div>
      </div>

      <!-- 单乘客模式（改签）下显示乘客信息 -->
      <div class="single-passenger-info" v-if="props.singlePassengerMode && props.passengerInfo">
        <div class="section-title">乘客信息</div>
        <div class="passenger-detail">
          <span class="passenger-name">{{ props.passengerInfo.realName }}</span>
          <el-tag size="small" :type="getPassengerTagType(props.passengerInfo.passengerType)">
            {{ getPassengerTypeName(props.passengerInfo.passengerType) }}
          </el-tag>
        </div>
      </div>

      <!-- 修改座位选择状态，添加返回上一位乘客按钮 -->
      <div class="seat-selection-status" v-if="isSelectingSeats && !props.singlePassengerMode && selectedPassengers.length > 1">
        <div class="current-passenger">
          当前为 <span class="passenger-name">{{ currentPassenger.realName }}</span> 选座
          ({{ currentPassengerIndex + 1 }}/{{ selectedPassengers.length }})
        </div>
        <div class="seat-selection-progress">
          <el-steps :active="currentPassengerIndex + 1" size="small" finish-status="success">
            <el-step 
              v-for="(passenger, index) in selectedPassengers" 
              :key="passenger.id" 
              :title="passenger.realName" 
              :description="getPassengerSeatInfo(index)"
            ></el-step>
          </el-steps>
        </div>
        
        <!-- 导航按钮 -->
        <div class="navigation-buttons">
          <el-button 
            type="info" 
            size="small" 
            @click="previousPassenger" 
            :disabled="currentPassengerIndex === 0"
          >
            <el-icon><ArrowLeft /></el-icon> 上一位乘客
          </el-button>
          
          <el-button 
            type="primary" 
            size="small" 
            @click="nextPassenger" 
            :disabled="currentPassengerIndex >= selectedPassengers.length - 1 || !selectedSeat && !selectedNoSeat"
          >
            下一位乘客 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 原有的列车信息部分 -->
      <div class="train-info">
        <div class="train-details">
          <h3>{{ trainInfo.trainNumber }}</h3>
          <div class="train-route">
            {{ departureStation }} → {{ arrivalStation }}
          </div>
          <div class="train-time">
            {{ formatTime(departureTime) }} - {{ formatTime(arrivalTime) }}
          </div>
          <div class="train-date">{{ date }}</div>
        </div>
      </div>

      <div class="seat-legend">
        <div class="legend-item">
          <div class="seat-icon available">A01</div>
          <span>可选</span>
        </div>
        <div class="legend-item">
          <div class="seat-icon occupied">A01</div>
          <span>已占用</span>
        </div>
        <div class="legend-item">
          <div class="seat-icon disabled">A01</div>
          <span>不可选</span>
        </div>
        <div class="legend-item">
          <div class="seat-icon selected">A01</div>
          <span>已选择</span>
        </div>
      </div>

      <!-- 座位类型选项卡 -->
      <el-tabs v-model="activeSeatType" class="seat-type-tabs" v-if="isSelectingSeats">
        <!-- 商务座选项卡 -->
        <el-tab-pane 
          v-if="hasBusinessSeats" 
          label="商务座" 
          name="business"
        >
          <div class="price-info">票价: ¥{{ prices.businessPrice.toFixed(2) }}</div>
          
          <!-- 车厢选项卡 -->
          <el-tabs v-model="activeCarriage" type="card" class="carriage-tabs">
            <el-tab-pane
              v-for="carriage in getCarriagesOfType(0)"
              :key="carriage.id"
              :label="`${carriage.carriageNumber}号车厢`"
              :name="String(carriage.id)"
            >
              <div class="carriage-container">
                <!-- 商务座：2-1布局 -->
                <template v-if="carriage.carriageType === 0">
                  <div class="seat-section">
                    <div
                      class="seat-row-group"
                      v-for="(section, sectionIndex) in getColumnSections(carriage)"
                      :key="`section-${sectionIndex}`"
                    >
                      <!-- 左侧2列 -->
                      <div class="column-group">
                        <div
                          v-for="col in 2"
                          :key="`col-left-${col}`"
                          class="seat-column"
                        >
                          <div class="column-label">{{ col }}列</div>
                          <div
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              col,
                              sectionIndex
                            )"
                            :key="`seat-${col}-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'business',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              3,
                              sectionIndex
                            )"
                            :key="`seat-3-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'business',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <!-- 一等座选项卡 -->
        <el-tab-pane 
          v-if="hasFirstClassSeats" 
          label="一等座" 
          name="firstClass"
        >
          <div class="price-info">票价: ¥{{ prices.firstClassPrice.toFixed(2) }}</div>
          
          <!-- 车厢选项卡 -->
          <el-tabs v-model="activeCarriage" type="card" class="carriage-tabs">
            <el-tab-pane
              v-for="carriage in getCarriagesOfType(1)"
              :key="carriage.id"
              :label="`${carriage.carriageNumber}号车厢`"
              :name="String(carriage.id)"
            >
              <div class="carriage-container">
                <!-- 一等座：2-2布局 -->
                <template v-if="carriage.carriageType === 1">
                  <div class="seat-section">
                    <div
                      class="seat-row-group"
                      v-for="(section, sectionIndex) in getColumnSections(carriage)"
                      :key="`section-${sectionIndex}`"
                    >
                      <!-- 左侧2列 -->
                      <div class="column-group">
                        <div
                          v-for="col in 2"
                          :key="`col-left-${col}`"
                          class="seat-column"
                        >
                          <div class="column-label">{{ col }}列</div>
                          <div
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              col,
                              sectionIndex
                            )"
                            :key="`seat-${col}-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'first-class',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
                        <div
                          v-for="col in 2"
                          :key="`col-right-${col}`"
                          class="seat-column"
                        >
                          <div class="column-label">{{ col + 2 }}列</div>
                          <div
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              col + 2,
                              sectionIndex
                            )"
                            :key="`seat-${col + 2}-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'first-class',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <!-- 二等座选项卡 -->
        <el-tab-pane 
          v-if="hasSecondClassSeats" 
          label="二等座" 
          name="secondClass"
        >
          <div class="price-info">票价: ¥{{ prices.secondClassPrice.toFixed(2) }}</div>
          
          <!-- 车厢选项卡 -->
          <el-tabs v-model="activeCarriage" type="card" class="carriage-tabs">
            <el-tab-pane
              v-for="carriage in getCarriagesOfType(2)"
              :key="carriage.id"
              :label="`${carriage.carriageNumber}号车厢`"
              :name="String(carriage.id)"
            >
              <div class="carriage-container">
                <!-- 二等座：2-3布局 -->
                <template v-if="carriage.carriageType === 2">
                  <div class="seat-section">
                    <div
                      class="seat-row-group"
                      v-for="(section, sectionIndex) in getColumnSections(carriage)"
                      :key="`section-${sectionIndex}`"
                    >
                      <!-- 左侧2列 -->
                      <div class="column-group">
                        <div
                          v-for="col in 2"
                          :key="`col-left-${col}`"
                          class="seat-column"
                        >
                          <div class="column-label">{{ col }}列</div>
                          <div
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              col,
                              sectionIndex
                            )"
                            :key="`seat-${col}-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'second-class',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
                        <div
                          v-for="col in 3"
                          :key="`col-right-${col}`"
                          class="seat-column"
                        >
                          <div class="column-label">{{ col + 2 }}列</div>
                          <div
                            v-for="(seat, index) in getSectionColumnSeats(
                              carriage,
                              col + 2,
                              sectionIndex
                            )"
                            :key="`seat-${col + 2}-${index}`"
                            class="seat-wrapper"
                          >
                            <div
                              v-if="seat"
                              :class="[
                                'seat-icon',
                                'second-class',
                                getSeatDisplayStatus(seat),
                                selectedSeat && selectedSeat.id === seat.id
                                  ? 'selected'
                                  : '',
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
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <!-- 无座选项卡 -->
        <el-tab-pane 
          v-if="hasNoSeats" 
          label="无座" 
          name="noSeat"
        >
          <div class="price-info">票价: ¥{{ prices.noSeatPrice.toFixed(2) }}</div>
          
          <div class="no-seat-info">
            <el-alert
              title="无座票说明"
              type="info"
              description="无座票没有固定座位，您可以在车厢内寻找空位或站立区域。"
              :closable="false"
              show-icon
            />
            <el-button
              type="primary"
              size="large"
              class="no-seat-button"
              @click="selectNoSeat"
            >
              选择无座
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 修改已选座位信息区域 -->
      <div class="selected-seat-info" v-if="isSelectingSeats && (selectedSeat || selectedNoSeat)">
        <div class="info-title">{{ currentPassenger.realName }} 已选座位</div>
        <div class="info-content">
          {{ selectedSeatInfo }}
        </div>
        <div class="passenger-actions" v-if="!props.singlePassengerMode && currentPassengerIndex < selectedPassengers.length - 1">
          <el-button type="primary" size="small" @click="nextPassenger">
            下一位乘客
          </el-button>
        </div>
      </div>

      <!-- 所有乘客选座完成后的汇总 -->
      <div class="all-selections-summary" v-if="allSelectionsComplete && !props.singlePassengerMode && selectedPassengers.length > 1">
        <div class="summary-title">所有乘客座位选择完成</div>
        <el-table :data="passengerSelections" stripe style="width: 100%">
          <el-table-column label="乘客姓名" prop="passenger.realName" />
          <el-table-column label="乘客类型">
            <template #default="scope">
              {{ getPassengerTypeName(scope.row.passenger.passengerType) }}
            </template>
          </el-table-column>
          <el-table-column label="座位类型">
            <template #default="scope">
              {{ getSeatTypeName(scope.row.seatType) }}
            </template>
          </el-table-column>
          <el-table-column label="座位信息">
            <template #default="scope">
              <span v-if="scope.row.seat">
                {{ scope.row.seat.carriageNumber }}号车厢 {{ scope.row.seat.seatNumber }}号座位
              </span>
              <span v-else>无座</span>
            </template>
          </el-table-column>
          <el-table-column label="票价">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          :disabled="!canConfirm"
        >确认选择</el-button>
      </span>
    </template>
  </el-dialog>
</template>
  
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'; // 导入图标
import { getTrainModelById } from "@/api/trainModel";
import { getCurrentUserPassengers, getPassengerTypeName } from "@/api/passenger";
import { useRouter } from 'vue-router'; // 导入路由

const router = useRouter(); // 使用路由

const props = defineProps({
  visible: Boolean,
  trainId: Number,
  modelId: Number,
  trainInfo: Object,
  departureStation: String,
  arrivalStation: String,
  departureTime: String,
  arrivalTime: String,
  date: String,
  hasBusinessSeats: Boolean,
  hasFirstClassSeats: Boolean,
  hasSecondClassSeats: Boolean,
  hasNoSeats: Boolean,
  prices: Object,
  defaultSeatType: String,     // 默认选择的座位类型
  singlePassengerMode: Boolean, // 是否为单乘客模式
  passengerInfo: Object        // 单乘客信息（改签时使用）
});

const emit = defineEmits(["update:visible", "select-seat", "cancel"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

// 基本状态变量
const loading = ref(false);
const trainModel = ref(null);
const selectedSeat = ref(null);
const selectedNoSeat = ref(false);
const activeSeatType = ref(null);
const activeCarriage = ref(null);

// 乘客相关状态
const passengers = ref([]);
const passengersLoading = ref(false);
const selectedPassengerIds = ref([]);
const selectedPassengers = ref([]);
const currentPassengerIndex = ref(0);
const passengerSelections = ref([]);
const isSelectingSeats = ref(true);
const selectingCompleted = ref(false);

// 获取当前乘客
const currentPassenger = computed(() => {
  if (!selectedPassengers.value || selectedPassengers.value.length === 0 || 
      currentPassengerIndex.value >= selectedPassengers.value.length) {
    return {};
  }
  return selectedPassengers.value[currentPassengerIndex.value];
});

// 判断是否有乘客被选中
const hasPassengersSelected = computed(() => {
  return selectedPassengerIds.value.length > 0;
});

// 判断是否可以确认提交
const canConfirm = computed(() => {
  if (props.singlePassengerMode) {
    // 单乘客模式：只要有选座就可以确认
    return selectedSeat.value || selectedNoSeat.value;
  } else {
    // 普通购票模式：所有乘客都必须选座
    if (!selectedPassengers.value || selectedPassengers.value.length === 0) {
      return false;
    }
    // 检查是否所有乘客都已选座
    return passengerSelections.value.length === selectedPassengers.value.length;
  }
});

// 判断是否所有乘客都完成了选座
const allSelectionsComplete = computed(() => {
  return isSelectingSeats.value && 
         selectedPassengers.value.length > 0 &&
         passengerSelections.value.length === selectedPassengers.value.length;
});

// 选择的座位信息显示
const selectedSeatInfo = computed(() => {
  if (selectedNoSeat.value) {
    return "无座";
  }
  
  if (!selectedSeat.value) {
    return "";
  }
  
  return `${selectedSeat.value.carriageNumber}号车厢 ${selectedSeat.value.seatNumber}号座位`;
});

// 座位类型名称
const getSeatTypeName = (type) => {
  const typeMap = {
    "business": "商务座",
    "firstClass": "一等座",
    "secondClass": "二等座",
    "noSeat": "无座"
  };
  return typeMap[type] || "";
};

// 获取乘客类型对应的标签类型
const getPassengerTagType = (type) => {
  const typeMap = {
    0: "", // 成人
    1: "warning", // 儿童
    2: "success", // 学生
    3: "info" // 老年人
  };
  return typeMap[type] || "";
};

// 获取乘客已选座位信息
const getPassengerSeatInfo = (index) => {
  if (!selectedPassengers.value || index >= selectedPassengers.value.length) {
    return "未选座";
  }
  
  const selection = passengerSelections.value.find(
    s => s.passenger && s.passenger.id === selectedPassengers.value[index].id
  );
  
  if (!selection) return "未选座";
  
  if (!selection.seat) return "无座";
  
  return `${selection.seat.carriageNumber || '未知'}号车厢 ${selection.seat.seatNumber || '未知'}号座位`;
};

// 加载当前用户的乘客
const loadPassengers = async () => {
  passengersLoading.value = true;
  try {
    // 假设有方法获取当前用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo')); // 默认用户ID为1
    passengers.value = await getCurrentUserPassengers(userInfo.userId)
    
    // 如果没有乘客数据，显示提示信息
    if (passengers.value.length === 0) {
      ElMessage.info('您还没有添加乘客，请先添加乘客');
    }
  } catch (error) {
    console.error("获取乘客列表失败:", error);
    ElMessage.error("获取乘客列表失败");
  } finally {
    passengersLoading.value = false;
  }
};

// 导航到添加乘客页面
const goToAddPassenger = () => {
  // 保存当前选择的车次信息
  localStorage.setItem('pendingTrainSelection', JSON.stringify({
    trainId: props.trainId,
    modelId: props.modelId,
    trainInfo: props.trainInfo,
    departureStation: props.departureStation,
    arrivalStation: props.arrivalStation,
    departureTime: props.departureTime,
    arrivalTime: props.arrivalTime,
    date: props.date,
    prices: props.prices
  }));
  
  // 关闭对话框
  dialogVisible.value = false;
  
  // 导航到乘客管理页面
  router.push('/user/profile?from=booking');
  
  // 提示用户添加乘客后返回
  ElMessage.info('请添加乘客信息，添加完成后可返回继续购票');
};

// 确认乘客选择
const confirmPassengerSelection = () => {
  if (selectedPassengerIds.value.length === 0) {
    ElMessage.warning("请至少选择一位乘客");
    return;
  }
  
  // 转换为乘客对象列表
  selectedPassengers.value = selectedPassengerIds.value.map(id => 
    passengers.value.find(p => p.id === id)
  ).filter(Boolean);
  
  // 初始化乘客选择状态
  passengerSelections.value = [];
  currentPassengerIndex.value = 0;
  isSelectingSeats.value = true;
};

// 返回到上一个乘客
const previousPassenger = () => {
  if (currentPassengerIndex.value > 0) {
    try {
      // 保存当前乘客选择
      if (selectedSeat.value || selectedNoSeat.value) {
        saveCurrentPassengerSelection();
      }
      
      // 移动到上一个乘客
      currentPassengerIndex.value--;
      
      // 恢复该乘客之前的选择
      const prevSelection = passengerSelections.value.find(
        s => s.passenger.id === selectedPassengers.value[currentPassengerIndex.value].id
      );
      
      // 确保重置之前的状态，避免异常
      selectedSeat.value = null;
      selectedNoSeat.value = false;
      
      // 延迟设置状态，避免渲染错误
      setTimeout(() => {
        if (prevSelection) {
          if (prevSelection.seat) {
            selectedSeat.value = prevSelection.seat;
            selectedNoSeat.value = false;
            activeSeatType.value = prevSelection.seatType || 'secondClass';
          } else {
            selectedSeat.value = null;
            selectedNoSeat.value = true;
            activeSeatType.value = 'noSeat';
          }
        }
      }, 0);
    } catch (error) {
      console.error("返回上一位乘客时出错:", error);
      ElMessage.error("操作失败，请重试");
    }
  }
};

// 进入下一个乘客选座
const nextPassenger = () => {
  // 检查是否已选择座位
  if (!selectedSeat.value && !selectedNoSeat.value) {
    ElMessage.warning(`请为${currentPassenger.value.realName}选择座位`);
    return;
  }
  
  try {
    // 保存当前乘客选择
    saveCurrentPassengerSelection();
    
    // 移动到下一个乘客
    if (currentPassengerIndex.value < selectedPassengers.value.length - 1) {
      currentPassengerIndex.value++;
      
      // 重置选择状态，避免状态混乱
      selectedSeat.value = null;
      selectedNoSeat.value = false;
      
      // 延迟设置下一个乘客的选择状态
      setTimeout(() => {
        // 检查下一个乘客是否已经有选择
        const nextSelection = passengerSelections.value.find(
          s => s.passenger.id === selectedPassengers.value[currentPassengerIndex.value].id
        );
        
        if (nextSelection) {
          // 恢复已有选择
          if (nextSelection.seat) {
            selectedSeat.value = nextSelection.seat;
            selectedNoSeat.value = false;
            activeSeatType.value = nextSelection.seatType || 'secondClass';
          } else {
            selectedSeat.value = null;
            selectedNoSeat.value = true;
            activeSeatType.value = 'noSeat';
          }
        }
      }, 0);
    } else {
      // 已经是最后一位乘客，标记完成
      selectingCompleted.value = true;
      
      // 显示选择完成通知
      ElMessage.success('所有乘客座位选择完成！');
    }
  } catch (error) {
    console.error("前进到下一位乘客时出错:", error);
    ElMessage.error("操作失败，请重试");
  }
};

// 保存当前乘客的选座结果
const saveCurrentPassengerSelection = () => {
  // 检查当前是否有有效的乘客
  if (!currentPassenger.value || !currentPassenger.value.id) {
    return;
  }
  
  // 检查是否已选择座位
  if (!selectedSeat.value && !selectedNoSeat.value) {
    return;
  }
  
  // 修正票价计算逻辑
  let ticketPrice;
  if (selectedNoSeat.value) {
    // 无座票价
    ticketPrice = props.prices.noSeatPrice;
  } else {
    // 根据座位类型获取票价
    switch(activeSeatType.value) {
      case 'business':
        ticketPrice = props.prices.businessPrice;
        break;
      case 'firstClass':
        ticketPrice = props.prices.firstClassPrice;
        break;
      case 'secondClass':
        ticketPrice = props.prices.secondClassPrice;
        break;
      default:
        ticketPrice = 0;
    }
  }
  
  // 确保票价是有效的数字
  if (typeof ticketPrice !== 'number' || isNaN(ticketPrice)) {
    console.warn(`无效票价: ${ticketPrice}, 使用默认值0`);
    ticketPrice = 0;
  }
  
  // 删除之前的选择（如果有）
  passengerSelections.value = passengerSelections.value.filter(
    s => s.passenger.id !== currentPassenger.value.id
  );
  
  // 添加新的选择
  passengerSelections.value.push({
    passenger: currentPassenger.value,
    seat: selectedNoSeat.value ? null : selectedSeat.value,
    seatType: selectedNoSeat.value ? "noSeat" : activeSeatType.value,
    price: ticketPrice
  });
  
  // 检查是否所有乘客都已完成选座
  checkAllSelectionsComplete();
};

// 检查是否所有乘客都已完成选座并更新状态
const checkAllSelectionsComplete = () => {
  // 如果所有乘客都有了座位选择，则标记为完成
  if (selectedPassengers.value.length > 0 && 
      passengerSelections.value.length === selectedPassengers.value.length) {
    selectingCompleted.value = true;
  }
};

// 获取指定类型的车厢
const getCarriagesOfType = (carriageType) => {
  if (!trainModel.value || !trainModel.value.carriages) {
    return [];
  }
  
  return trainModel.value.carriages
    .filter(carriage => carriage.carriageType === carriageType)
    .sort((a, b) => a.carriageNumber - b.carriageNumber);
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return "";
  return time.split(":").slice(0, 2).join(":");
};

// 获取座位状态
const getSeatDisplayStatus = (seat) => {
  if (!seat) return null;

  // 首先检查是否已被当前用户的其他乘客选择
  if (isSeatAlreadySelected(seat)) {
    return "occupied"; // 使用已占用的样式
  }

  // 获取用户选择的时间区间
  const selectedDate = new Date(props.date);
  
  // 设置起始时间
  const [depHours, depMinutes] = props.departureTime.split(":").map(Number);
  const departureDateTime = new Date(selectedDate);
  departureDateTime.setHours(depHours, depMinutes, 0, 0);
  
  // 设置结束时间
  const [arrHours, arrMinutes] = props.arrivalTime.split(":").map(Number);
  const arrivalDateTime = new Date(selectedDate);
  arrivalDateTime.setHours(arrHours, arrMinutes, 0, 0);
  
  // 处理跨天情况
  if (arrivalDateTime < departureDateTime) {
    arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
  }

  // 默认状态为可用
  if (!seat.lockInfo || seat.lockInfo.length === 0) {
    return seat.status === 1 ? "available" : "disabled";
  }

  // 查找未完成的锁定项
  const unfinishedLocks = seat.lockInfo.filter((lock) => lock.finish === 0);
  if (unfinishedLocks.length === 0) {
    return seat.status === 1 ? "available" : "disabled";
  }

  // 查找与用户选择时间区间有重叠的锁定项
  const conflictingLock = unfinishedLocks.find((lock) => {
    const lockStart = new Date(lock.lockStart);
    const expireTime = new Date(lock.expireTime);
    
    // 检查区间是否有重叠
    return !(expireTime <= departureDateTime || lockStart >= arrivalDateTime);
  });

  if (conflictingLock) {
    // 根据锁定类型返回状态：0为维护，1为占用
    return conflictingLock.type === 1 ? "occupied" : "disabled";
  }

  // 没有冲突的锁定信息，返回可用状态
  return seat.status === 1 ? "available" : "disabled";
};

// 添加函数检查座位是否已被其他乘客选择
const isSeatAlreadySelected = (seat) => {
  // 如果没有座位数据，直接返回false
  if (!seat || !seat.id) return false;
  
  // 检查所有乘客的座位选择
  return passengerSelections.value.some(selection => 
    // 排除当前乘客自己
    selection.passenger.id !== currentPassenger.value.id && 
    // 检查是否有相同的座位
    selection.seat && selection.seat.id === seat.id
  );
};

// 解析座位号
const parseSeatNumber = (seatNumber) => {
  const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return {
      letter: match[1],
      number: parseInt(match[2], 10),
    };
  }
  return null;
};

// 获取某个车厢的所有唯一列号
const getUniqueColumnNumbers = (carriage) => {
  if (!carriage || !carriage.seats || !carriage.seats.length) return [];

  const columnNumbers = new Set();
  carriage.seats.forEach((seat) => {
    const parsed = parseSeatNumber(seat.seatNumber);
    if (parsed) columnNumbers.add(parsed.number);
  });

  return Array.from(columnNumbers).sort((a, b) => a - b);
};

// 获取某个车厢的所有座位按列分组
const getCarriageColumnSeats = (carriage) => {
  if (!carriage || !carriage.seats || !carriage.seats.length) return {};

  const result = {};
  const columnNumbers = getUniqueColumnNumbers(carriage);

  columnNumbers.forEach((colNumber) => {
    // 筛选出当前列的座位
    const seats = carriage.seats.filter((seat) => {
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
};

// 获取车厢分区数
const getColumnSections = (carriage) => {
  const columnSeats = getCarriageColumnSeats(carriage);
  const maxSeatsPerColumn = Math.max(
    ...Object.values(columnSeats).map((seats) => seats.length)
  );

  const sections = Math.ceil(maxSeatsPerColumn / 6);
  return Array.from({ length: sections }, (_, i) => i);
};

// 获取某一列在特定区块的座位
const getSectionColumnSeats = (carriage, colNumber, sectionIndex) => {
  const columnSeats = getCarriageColumnSeats(carriage);
  if (!columnSeats[colNumber]) {
    return Array(6).fill(null);
  }

  const seats = columnSeats[colNumber];
  const startIdx = sectionIndex * 6;
  const endIdx = startIdx + 6;
  const sectionSeats = seats.slice(startIdx, endIdx);

  // 填充到6个座位
  const result = [...sectionSeats];
  while (result.length < 6) {
    result.push(null);
  }

  return result;
};

// 处理座位点击事件
const handleSeatClick = (seat) => {
  const status = getSeatDisplayStatus(seat);

  if (status === "available") {
    // 检查座位是否已被其他乘客选择
    if (isSeatAlreadySelected(seat)) {
      ElMessage.warning("该座位已被其他乘客选择，请选择其他座位");
      return;
    }
    
    // 修改：直接通过carriageId查找车厢，不再依赖carriageType
    const carriage = trainModel.value.carriages.find(
      (c) => c.id === seat.carriageId
    );
    
    selectedSeat.value = {
      ...seat,
      carriageNumber: carriage ? carriage.carriageNumber : "未知",
    };
    selectedNoSeat.value = false;
    
    // 如果是最后一位乘客，直接保存选择并检查完成状态
    if (currentPassengerIndex.value === selectedPassengers.value.length - 1) {
      saveCurrentPassengerSelection();
    }
  } else if (status === "occupied") {
    ElMessage.warning("该座位已被占用");
  } else if (status === "disabled") {
    ElMessage.warning("该座位正在维护中，无法选择");
  }
};

// 选择无座
const selectNoSeat = () => {
  selectedSeat.value = null;
  selectedNoSeat.value = true;
  
  // 如果是最后一位乘客，直接保存选择并检查完成状态
  if (currentPassengerIndex.value === selectedPassengers.value.length - 1) {
    saveCurrentPassengerSelection();
  }
};

// 确认选座
const handleConfirm = () => {
  if (props.singlePassengerMode) {
    if (!selectedSeat.value && !selectedNoSeat.value) {
      ElMessage.warning("请选择座位");
      return;
    }
    
    let price = 0;
    switch(activeSeatType.value) {
      case 'business': price = props.prices.businessPrice; break;
      case 'firstClass': price = props.prices.firstClassPrice; break;
      case 'secondClass': price = props.prices.secondClassPrice; break;
      case 'noSeat': price = props.prices.noSeatPrice; break;
    }
    
    const selection = [{
      passenger: props.passengerInfo,
      seat: selectedNoSeat.value ? null : selectedSeat.value,
      seatType: selectedNoSeat.value ? "noSeat" : activeSeatType.value,
      price: price
    }];
    
    emit("select-seat", selection);
  } else {
    // 多乘客模式：返回所有乘客的选择
    if (passengerSelections.value.length === 0) {
      ElMessage.warning("请至少为一位乘客选择座位");
      return;
    }
    
    emit("select-seat", passengerSelections.value);
  }
  
  dialogVisible.value = false;
};

// 取消选座
const handleCancel = () => {
  emit("cancel");
  dialogVisible.value = false;
};

// 关闭对话框
const handleClose = () => {
  ElMessage.info("已取消选座");
  handleCancel();
};

// 监听对话框可见性变化，当显示时加载数据
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      // 重置状态
      loading.value = true;
      selectedSeat.value = null;
      selectedNoSeat.value = false;
      
      // 加载车型数据
      if (props.modelId) {
        try {
          const model = await getTrainModelById(props.modelId);
          trainModel.value = model;
        } catch (error) {
          ElMessage.error("获取车型数据失败");
          console.error("获取车型数据失败:", error);
        } finally {
          loading.value = false;
        }
      }
    }
  }
);

// 在激活座位类型更改时设置默认值
watch(() => props.defaultSeatType, (newVal) => {
  if (newVal) {
    activeSeatType.value = newVal;
    
    // 延迟设置车厢选择，确保座位类型的车厢列表已加载
    setTimeout(() => {
      // 获取当前座位类型的第一个车厢
      const carriages = getCarriagesOfType(
        newVal === 'business' ? 0 : 
        newVal === 'firstClass' ? 1 : 
        newVal === 'secondClass' ? 2 : -1
      );
      
      if (carriages.length > 0) {
        activeCarriage.value = String(carriages[0].id);
      }
    }, 100);
  }
}, { immediate: true });

// 在单乘客模式下初始化
onMounted(async () => {
  if (props.singlePassengerMode && props.passengerInfo) {
    // 直接跳过乘客选择步骤
    isSelectingSeats.value = true;
    
    // 使用提供的乘客信息
    selectedPassengers.value = [props.passengerInfo];
    currentPassengerIndex.value = 0;
    
    // 设置激活的座位类型
    activeSeatType.value = props.defaultSeatType || getDefaultSeatType();
  } else if (!props.singlePassengerMode) {
    // 普通购票模式，加载乘客列表
    await loadPassengers();
  }
});

// 添加一个新函数，根据车厢可用性获取默认座位类型
const getDefaultSeatType = () => {
  if (props.hasBusinessSeats) return 'business';
  if (props.hasFirstClassSeats) return 'firstClass';
  if (props.hasSecondClassSeats) return 'secondClass';
  if (props.hasNoSeats) return 'noSeat';
  return 'secondClass'; // 默认二等座
};
</script>
  
<style scoped>
.seat-selection-container {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.train-info {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.train-details h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.train-route {
  font-size: 14px;
  margin-bottom: 4px;
}

.train-time {
  color: #606266;
  margin-bottom: 4px;
}

.train-date {
  color: #909399;
  font-size: 14px;
}

.seat-legend {
  display: flex;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.seat-type-tabs {
  margin-bottom: 10px;
}

.carriage-tabs {
  margin-bottom: 10px;
}

.carriage-container {
  padding: 10px 0;
  overflow-y: auto;
  max-height: 350px;
}

.seat-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 10px;
}

.seat-row-group {
  display: flex;
  gap: 10px;
  position: relative;
}

.column-group {
  display: flex;
  gap: 10px;
}

.seat-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.seat-icon,
.seat-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.seat-placeholder {
  opacity: 0.1;
  border: 1px dashed #ccc;
  cursor: default;
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
  cursor: not-allowed;
}

.seat-icon.disabled {
  background-color: #909399 !important;
  color: #dddddd !important;
  border-color: #909399 !important;
  opacity: 0.6;
  cursor: not-allowed;
}

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

.selected-seat-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.info-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.info-content {
  color: #67c23a;
  font-size: 16px;
}

.price-info {
  margin: 5px 0;
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
  text-align: center;
}

.no-seat-info {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-seat-button {
  width: 150px;
}

/* 添加单乘客信息显示样式 */
.single-passenger-info {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f0f9eb;
}

.passenger-detail {
  display: flex;
  align-items: center;
  gap: 10px;
}

.passenger-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

/* 添加或修改乘客相关样式 */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed #d9ecff;
}

.empty-passenger-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.empty-passenger-text {
  margin-bottom: 15px;
  color: #909399;
}

.all-selections-summary {
  margin-top: 20px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.summary-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
  color: #67c23a;
}

.passenger-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>