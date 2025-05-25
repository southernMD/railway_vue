<template>
  <div class="ticket-search">
    <el-card class="search-form-card">
      <el-form :model="searchForm" :inline="true" class="search-form" v-loading="stationsLoading">
        <el-form-item label="出发站">
          <el-select
            v-model="searchForm.departureStation"
            filterable
            placeholder="请选择出发站"
          >
            <el-option
              v-for="item in departureStations"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到达站">
          <el-select
            v-model="searchForm.arrivalStation"
            filterable
            placeholder="请选择到达站"
          >
            <el-option
              v-for="item in arrivalStations"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker
            v-model="searchForm.departureDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disablePastDates"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTickets">
            <el-icon><Search /></el-icon> 查询
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="date-navigator">
        <el-button-group>
          <el-button 
            :disabled="!canGoPrevDay" 
            @click="goToPrevDay" 
            size="small"
          >
            <el-icon><ArrowLeft /></el-icon> 前一天
          </el-button>
          <el-button 
            v-for="date in dateNavigationDays" 
            :key="date.value"
            :type="date.value === searchForm.departureDate ? 'primary' : ''"
            @click="searchForm.departureDate = date.value"
            size="small"
          >
            {{ date.label }}
          </el-button>
          <el-button 
            @click="goToNextDay" 
            size="small"
          >
            后一天 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </el-card>
    
    <el-card class="ticket-list-card" v-loading="loading">
      <template #header>
        <div class="ticket-list-header">
          <div>
            查询结果: {{ searchForm.departureStationName || '出发站' }} → {{ searchForm.arrivalStationName || '到达站' }}
          </div>
          <div class="ticket-filter">
            <el-radio-group v-model="filter.time" size="small">
              <el-radio-button label="all">全部时间</el-radio-button>
              <el-radio-button label="morning">上午 (6:00-12:00)</el-radio-button>
              <el-radio-button label="afternoon">下午 (12:00-18:00)</el-radio-button>
              <el-radio-button label="evening">晚上 (18:00-24:00)</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="filteredTickets" 
        style="width: 100%"
        :empty-text="emptyText"
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="stops-container">
              <div class="train-info">
                <span class="train-number">车次: {{ row.trainNumber }}</span>
                <span class="train-route">
                  路线: {{ row.departureStation }} → {{ row.arrivalStation }}
                </span>
              </div>
              
              <el-table
                :data="getStationDetails(row)"
                stripe
                style="width: 100%; margin-top: 10px;"
              >
                <el-table-column prop="sequence" label="序号" width="60" />
                <el-table-column label="站点名称" width="200">
                  <template #default="scope">
                    {{ scope.row.stationName }}
                    <el-tag v-if="scope.row.isUserDeparture" type="success" size="small">出发站</el-tag>
                    <el-tag v-if="scope.row.isUserArrival" type="warning" size="small">到达站</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="arrivalTime" label="到达时间" width="120" />
                <el-table-column label="停留时间" width="120">
                  <template #default="scope">
                    {{ scope.row.stopDuration }} 分钟
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="120">
                  <template #default="scope">
                    <span class="station-status">
                      <el-tag v-if="scope.row.type === 'start'" size="small" type="primary">始发站</el-tag>
                      <el-tag v-else-if="scope.row.type === 'end'" size="small" type="danger">终点站</el-tag>
                      <el-tag v-else size="small" type="info">途径站</el-tag>
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="车次" width="100">
          <template #default="scope">
            <div class="train-number">{{ scope.row.trainNumber }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="出发/到达" width="250">
          <template #default="scope">
            <div class="station-time">
              <span class="time">{{ formatTime(scope.row.actualDepartureTime) }}</span>
              <span class="station">{{ searchForm.departureStationName }}</span>
            </div>
            <div class="travel-time">
              <el-divider content-position="center">{{ calculateDuration(scope.row.actualDepartureTime, scope.row.actualArrivalTime) }}</el-divider>
            </div>
            <div class="station-time">
              <span class="time">{{ formatTime(scope.row.actualArrivalTime) }}</span>
              <span class="station">{{ searchForm.arrivalStationName }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="商务座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div class="price" v-if="scope.row.trainSeatInfo.businessPrice > 0">
                ¥{{ scope.row.sectionPrices.businessPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="一等座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div class="price" v-if="scope.row.trainSeatInfo.firstClassPrice > 0">
                ¥{{ scope.row.sectionPrices.firstClassPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="二等座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div class="price" v-if="scope.row.trainSeatInfo.secondClassPrice > 0">
                ¥{{ scope.row.sectionPrices.secondClassPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="无座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div class="price" v-if="scope.row.trainSeatInfo.noSeatPrice > 0 && scope.row.trainSeatInfo.noSeatTickets > 0">
                ¥{{ scope.row.sectionPrices.noSeatPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" align="center" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="bookTicket(scope.row)"
            >
              购买
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加座位选择对话框 -->
    <seat-selection-dialog
      v-model:visible="seatSelectionVisible"
      :modelId="selectedTrain ? selectedTrain.model?.id : null"
      :trainId="selectedTrain ? selectedTrain.id : null"
      :trainInfo="selectedTrain || {}"
      :departureStation="searchForm.departureStationName"
      :arrivalStation="searchForm.arrivalStationName"
      :departureTime="selectedTrain ? selectedTrain.actualDepartureTime : ''"
      :arrivalTime="selectedTrain ? selectedTrain.actualArrivalTime : ''"
      :date="searchForm.departureDate"
      :hasBusinessSeats="selectedTrain && selectedTrain.trainSeatInfo.businessPrice > 0"
      :hasFirstClassSeats="selectedTrain && selectedTrain.trainSeatInfo.firstClassPrice > 0"
      :hasSecondClassSeats="selectedTrain && selectedTrain.trainSeatInfo.secondClassPrice > 0"
      :hasNoSeats="selectedTrain && selectedTrain.trainSeatInfo.noSeatPrice > 0 && selectedTrain.trainSeatInfo.noSeatTickets > 0"
      :prices="selectedTrain ? selectedTrain.sectionPrices : {}"
      @select-seat="handleSeatSelected"
      @cancel="handleSeatSelectionCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { getOpenStations } from '@/api/station'; // 导入车站API
import trainAPI from '@/api/train'; // 导入车次API
import SeatSelectionDialog from '@/components/SeatSelectionDialog.vue';
import { deepToRaw } from '@/utils/deepToRaw';
import { createOrder } from '@/api/order';
import { createTicket } from '@/api/tickets';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const stationsLoading = ref(false);

// 搜索表单
const searchForm = reactive({
  departureStation: '',
  departureStationName: '',
  arrivalStation: '',
  arrivalStationName: '',
  departureDate: new Date().toISOString().split('T')[0] // 默认为今天
});

// 车站数据 - 从API获取
const stations = ref<{ id: number, stationName: string }[]>([]);

// 车票查询结果
const tickets = ref<any[]>([]);

// 座位选择相关状态
const seatSelectionVisible = ref(false);
const selectedTrain = ref(null);
const selectedSeatType = ref('');
const selectedSeatPrice = ref(0);

// 使用计算属性过滤出发站和到达站选项
const departureStations = computed(() => {
  if (!searchForm.arrivalStation) return stations.value;
  return stations.value.filter(station => station.id !== searchForm.arrivalStation);
});

const arrivalStations = computed(() => {
  if (!searchForm.departureStation) return stations.value;
  return stations.value.filter(station => station.id !== searchForm.departureStation);
});

// 监听选择变化，如果一方改变导致冲突，清空另一方
watch(() => searchForm.departureStation, (newVal) => {
  if (newVal && newVal === searchForm.arrivalStation) {
    searchForm.arrivalStation = '';
    searchForm.arrivalStationName = '';
  }
});

watch(() => searchForm.arrivalStation, (newVal) => {
  if (newVal && newVal === searchForm.departureStation) {
    searchForm.departureStation = '';
    searchForm.departureStationName = '';
  }
});

// 获取车站数据
const fetchStations = async () => {
  stationsLoading.value = true;
  try {
    const response = await getOpenStations();
    // 只取需要的字段
    stations.value = response.map(station => ({
      id: station.id,
      stationName: station.stationName
    }));
  } catch (error) {
    console.error('获取车站失败:', error);
    ElMessage.error('获取车站数据失败，请刷新页面重试');
  } finally {
    stationsLoading.value = false;
  }
};

// 座位类型
const seatTypes = [
  { type: 'business', name: '商务座' },
  { type: 'firstClass', name: '一等座' },
  { type: 'secondClass', name: '二等座' },
  { type: 'noSeat', name: '无座' }
];

// 筛选条件
const filter = reactive({
  time: 'all'
});

// 显示的日期导航栏
const dateNavigationDays = computed(() => {
  const startDate = dayjs(searchForm.departureDate);
  const dates = [];
  
  for (let i = 0; i < 5; i++) {
    const date = startDate.add(i, 'day');
    dates.push({
      value: date.format('YYYY-MM-DD'),
      label: i === 0 ? '今天' : date.format('MM-DD')
    });
  }
  
  return dates;
});

// 是否可以选择前一天
const canGoPrevDay = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  return searchForm.departureDate > today;
});

// 空数据提示
const emptyText = computed(() => {
  if (loading.value) {
    return '正在加载数据...';
  }
  
  if (!searchForm.departureStation || !searchForm.arrivalStation) {
    return '请选择出发站和到达站';
  }
  
  return '暂无符合条件的车次';
});

// 获取车次类型
const getTrainType = (trainNumber: string) => {
  const prefix = trainNumber.charAt(0);
  
  switch (prefix) {
    case 'G': return '高铁';
    case 'D': return '动车';
    case 'C': return '城际';
    case 'Z': return '直达';
    case 'T': return '特快';
    case 'K': return '快速';
    default: return '普通';
  }
};

// 格式化时间 - 去掉秒
const formatTime = (time: string) => {
  if (!time) return '';
  const timeParts = time.split(':');
  return timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : time;
};

// 计算行程时间
const calculateDuration = (departureTime: string, arrivalTime: string) => {
  if (!departureTime || !arrivalTime) return '';
  
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  let [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
  
  // 处理跨天情况
  if (arrHours < depHours) {
    arrHours += 24;
  }
  
  const totalMinutes = (arrHours - depHours) * 60 + (arrMinutes - depMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours}小时${minutes}分钟`;
};

// 禁用过去的日期
const disablePastDates = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 8.64e7 是一天的毫秒数
};

// 前一天
const goToPrevDay = () => {
  const prevDay = dayjs(searchForm.departureDate).subtract(1, 'day');
  const today = dayjs();
  
  if (prevDay.isBefore(today, 'day')) {
    ElMessage.warning('不能选择过去的日期');
    return;
  }
  
  searchForm.departureDate = prevDay.format('YYYY-MM-DD');
  if (searchForm.departureStation && searchForm.arrivalStation) {
    searchTickets();
  }
};

// 后一天
const goToNextDay = () => {
  const nextDay = dayjs(searchForm.departureDate).add(1, 'day');
  searchForm.departureDate = nextDay.format('YYYY-MM-DD');
  if (searchForm.departureStation && searchForm.arrivalStation) {
    searchTickets();
  }
};

// 计算区间票价
const calculateSectionPrice = (train: any, departureTime: string, arrivalTime: string) => {
  // 获取整个列车行程的始发和终到时间
  const trainFullDepartureTime = train.departureTime;
  const trainFullArrivalTime = train.arrivalTime;
  
  // 将时间转换为分钟计算
  const fullStartMinutes = convertTimeToMinutes(trainFullDepartureTime);
  const fullEndMinutes = convertTimeToMinutes(trainFullArrivalTime);
  
  // 用户选择区间的始发和终到时间
  const sectionStartMinutes = convertTimeToMinutes(departureTime);
  const sectionEndMinutes = convertTimeToMinutes(arrivalTime);
  
  // 计算整个行程的总时间（考虑跨天情况）
  let totalMinutes = fullEndMinutes - fullStartMinutes;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // 跨天情况
  }
  
  // 计算用户选择区间的时间（考虑跨天情况）
  let sectionMinutes = sectionEndMinutes - sectionStartMinutes;
  if (sectionMinutes < 0) {
    sectionMinutes += 24 * 60; // 跨天情况
  }
  
  // 计算时间占比
  const ratio = sectionMinutes / totalMinutes;
  
  // 计算各类座位的区间票价
  return {
    businessPrice: train.trainSeatInfo.businessPrice > 0 
      ? Math.round(train.trainSeatInfo.businessPrice * ratio * 100) / 100 
      : 0,
    firstClassPrice: train.trainSeatInfo.firstClassPrice > 0 
      ? Math.round(train.trainSeatInfo.firstClassPrice * ratio * 100) / 100 
      : 0,
    secondClassPrice: train.trainSeatInfo.secondClassPrice > 0 
      ? Math.round(train.trainSeatInfo.secondClassPrice * ratio * 100) / 100 
      : 0,
    noSeatPrice: train.trainSeatInfo.noSeatPrice > 0 && train.trainSeatInfo.noSeatTickets > 0
      ? Math.round(train.trainSeatInfo.noSeatPrice * ratio * 100) / 100
      : 0
  };
};

// 将时间字符串转换为分钟数
const convertTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  
  return hours * 60 + minutes;
};

// 修改searchTickets函数，添加区间票价计算
const searchTickets = async () => {
  // 表单验证
  if (!searchForm.departureStation) {
    ElMessage.warning('请选择出发站');
    return;
  }
  if (!searchForm.arrivalStation) {
    ElMessage.warning('请选择到达站');
    return;
  }
  if (!searchForm.departureDate) {
    ElMessage.warning('请选择出发日期');
    return;
  }
  
  // 更新站点名称
  const departureStation = stations.value.find(s => s.id === searchForm.departureStation);
  const arrivalStation = stations.value.find(s => s.id === searchForm.arrivalStation);
  
  if (departureStation) {
    searchForm.departureStationName = departureStation.stationName;
  }
  if (arrivalStation) {
    searchForm.arrivalStationName = arrivalStation.stationName;
  }
  
  // 使用API获取车次数据
  loading.value = true;
  try {
    const response = await trainAPI.getTrainsByInterval(
      searchForm.departureStation, 
      searchForm.arrivalStation, 
      searchForm.departureDate
    );
    
    // 处理返回的车次数据
    tickets.value = response.map(train => {
      // 从trainStops中找出用户查询的出发站和到达站信息
      const departureStationId = searchForm.departureStation;
      const arrivalStationId = searchForm.arrivalStation;
      
      // 查找出发站和到达站的信息
      let departureStop = null;
      let arrivalStop = null;
      
      // 如果是起始站，使用train的departureTime
      if (train.startStation.id === Number(departureStationId)) {
        departureStop = { 
          station: train.startStation, 
          arrivalTime: train.departureTime 
        };
      } else {
        // 否则从trainStops中找
        departureStop = train.trainStops.find(
          stop => stop.station.id === Number(departureStationId)
        );
      }
      
      // 如果是终点站，使用train的arrivalTime
      if (train.endStation.id === Number(arrivalStationId)) {
        arrivalStop = { 
          station: train.endStation, 
          arrivalTime: train.arrivalTime 
        };
      } else {
        // 否则从trainStops中找
        arrivalStop = train.trainStops.find(
          stop => stop.station.id === Number(arrivalStationId)
        );
      }
      
      // 提取实际的出发和到达时间
      const actualDepartureTime = departureStop ? departureStop.arrivalTime : train.departureTime;
      const actualArrivalTime = arrivalStop ? arrivalStop.arrivalTime : train.arrivalTime;
      
      // 计算区间票价
      const sectionPrices = calculateSectionPrice(train, actualDepartureTime, actualArrivalTime);
      
      return {
        ...train,
        actualDepartureTime,
        actualArrivalTime,
        sectionPrices
      };
    });
    
  } catch (error) {
    console.error('获取车次数据失败:', error);
    ElMessage.error('获取车次数据失败，请重试');
    tickets.value = [];
  } finally {
    loading.value = false;
  }
};

// 根据时间筛选车次
const filteredTickets = computed(() => {
  if (filter.time === 'all') {
    return tickets.value;
  }
  
  return tickets.value.filter(ticket => {
    // 使用actualDepartureTime进行过滤
    const hour = parseInt(ticket.actualDepartureTime.split(':')[0]);
    
    switch (filter.time) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 24;
      default:
        return true;
    }
  });
});

// 修改购票函数，不再需要座位类型参数
const bookTicket = (train: any) => {
  selectedTrain.value = train;
  selectedSeatType.value = ''; // 不再预先选择座位类型
  seatSelectionVisible.value = true;
};

// 处理座位选择完成事件
const handleSeatSelected = async (selection) => {
  try {
    // 防止重复提交
    loading.value = true;
    
    const noRefSelection = deepToRaw(selection);
    console.log("座位选择数据:", noRefSelection);
    
    // 1. 计算订单总金额（所有票价之和）
    const totalAmount = noRefSelection.reduce((sum, item) => sum + item.price, 0);
    
    // 2. 获取当前用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.error('获取用户信息失败，请重新登录');
      return;
    }
    
    // 3. 准备车票数据
    const ticketsData = noRefSelection.map(item => ({
      passengerId: item.passenger.id,
      trainId: selectedTrain.value.id,
      date: searchForm.departureDate,
      departureStationId: searchForm.departureStation,
      arrivalStationId: searchForm.arrivalStation,
      seatType: getSeatTypeCode(item.seatType),
      carriageId: item.seat ? item.seat.carriageId : 0,
      seatId: item.seat ? item.seat.id : 0,
      price: item.price,
      status: 0  // 待支付状态
    }));
    
    // 4. 创建订单（同时包含车票信息）
    const orderParams = {
      userId: userId,
      totalAmount: totalAmount,
      tickets: ticketsData
    };
    
    // 调用创建订单API
    const orderResponse = await createOrder(orderParams);
    console.log("订单创建成功:", orderResponse);
    
    // 5. 提示成功并关闭弹窗
    ElMessage.success('订单创建成功，请前往订单页面完成支付');
    seatSelectionVisible.value = false;
    
    // 跳转到订单页面
    router.push(`/user/orders`);
    
  } catch (error) {
    console.error('创建订单失败:', error);
    ElMessage.error('创建订单失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 根据座位类型名称获取座位类型代码
const getSeatTypeCode = (seatType) => {
  const seatTypeMap = {
    'business': 1,    // 商务座
    'firstClass': 2,  // 一等座
    'secondClass': 3, // 二等座
    'noSeat': 4       // 无座
  };
  return seatTypeMap[seatType] || 4; // 默认无座
};

// 处理取消选座事件
const handleSeatSelectionCancel = () => {
  selectedTrain.value = null;
};

// 从URL参数中获取初始值
onMounted(async () => {
  // 页面加载时获取车站数据
  await fetchStations();
  
  const { departure, arrival, date } = route.query;
  
  if (departure) {
    const departureId = Number(departure);
    searchForm.departureStation = departureId;
    // 从加载好的站点数据中查找匹配的站点名称
    const departureStationObj = stations.value.find(s => s.id === departureId);
    if (departureStationObj) {
      searchForm.departureStationName = departureStationObj.stationName;
    }
  }
  
  if (arrival) {
    const arrivalId = Number(arrival);
    searchForm.arrivalStation = arrivalId;
    // 从加载好的站点数据中查找匹配的站点名称
    const arrivalStationObj = stations.value.find(s => s.id === arrivalId);
    if (arrivalStationObj) {
      searchForm.arrivalStationName = arrivalStationObj.stationName;
    }
  }
  
  if (date) {
    searchForm.departureDate = String(date);
  }
  
  // 如果有足够的参数，自动执行搜索
  if (departure && arrival && date) {
    searchTickets();
  }
});

// 获取站点详细信息
const getStationDetails = (train) => {
  const result = [];
  let sequence = 1;
  
  // 始发站
  if (train.startStation) {
    result.push({
      sequence: sequence++,
      stationName: train.startStation.stationName,
      arrivalTime: train.departureTime,
      stopDuration: 0,
      type: 'start',
      isUserDeparture: train.startStation.id === Number(searchForm.departureStation),
      isUserArrival: train.startStation.id === Number(searchForm.arrivalStation)
    });
  }
  
  // 中间站点
  if (train.trainStops && Array.isArray(train.trainStops)) {
    const sortedStops = [...train.trainStops].sort((a, b) => a.sequence - b.sequence);
    sortedStops.forEach(stop => {
      if (stop.station) {
        result.push({
          sequence: sequence++,
          stationName: stop.station.stationName,
          arrivalTime: stop.arrivalTime,
          stopDuration: stop.stopDuration || 0,
          type: 'middle',
          isUserDeparture: stop.station.id === Number(searchForm.departureStation),
          isUserArrival: stop.station.id === Number(searchForm.arrivalStation)
        });
      }
    });
  }
  
  // 终点站
  if (train.endStation) {
    result.push({
      sequence: sequence++,
      stationName: train.endStation.stationName,
      arrivalTime: train.arrivalTime,
      stopDuration: 0,
      type: 'end',
      isUserDeparture: train.endStation.id === Number(searchForm.departureStation),
      isUserArrival: train.endStation.id === Number(searchForm.arrivalStation)
    });
  }
  
  return result;
};
</script>

<style scoped>
.ticket-search {
  max-width: 1200px;
  margin: 0 auto;
}

.search-form-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.date-navigator {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.ticket-list-card {
  margin-bottom: 20px;
}

.ticket-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.train-number {
  font-size: 16px;
  font-weight: bold;
  color: #0052cc;
}

.train-type {
  font-size: 12px;
  color: #909399;
}

.station-time {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.time {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.station {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.travel-time {
  margin: 5px 0;
  font-size: 12px;
  color: #909399;
}

.seat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.price {
  font-size: 15px;
  color: #f56c6c;
  font-weight: bold;
}

.no-seat {
  font-size: 14px;
  color: #909399;
  height: 19px; /* 确保与价格高度一致，保持布局对齐 */
}

/* 调整按钮样式 */
.seat-info .el-button {
  padding: 5px 12px;
  margin: 0;
}

/* 确保所有列宽度一致 */
:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

/* 确保展开后内容有足够空间 */
.stops-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 10px;
}

.train-info {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.train-route {
  color: #666;
  font-size: 14px;
}

.station-status {
  display: flex;
  align-items: center;
}
</style> 