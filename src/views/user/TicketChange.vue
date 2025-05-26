<template>
  <div class="ticket-change">
    <!-- 原车票信息 -->
    <el-card class="original-ticket-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>原车票信息</span>
        </div>
      </template>
      <div v-if="originalTicket" class="original-ticket-info">
        <div class="train-info">
          <div class="train-number">
            {{ originalTicket.train?.trainNumber || "未知车次" }}
          </div>
          <div class="train-date">{{ originalTicket.date }}</div>
        </div>
        <div class="station-info">
          <div class="departure">
            <div class="time">{{ getActualDepartureTime(originalTicket) }}</div>
            <div class="station">
              {{ originalTicket.departureStation?.stationName || "未知站点" }}
            </div>
          </div>
          <div class="journey">
            <div class="arrow-line"></div>
            <div class="duration">
              {{
                calculateDuration(
                  getActualDepartureTime(originalTicket),
                  getActualArrivalTime(originalTicket)
                )
              }}
            </div>
          </div>
          <div class="arrival">
            <div class="time">{{ getActualArrivalTime(originalTicket) }}</div>
            <div class="station">
              {{ originalTicket.arrivalStation?.stationName || "未知站点" }}
            </div>
          </div>
        </div>
        <div class="passenger-info">
          <div class="passenger-name">
            {{ originalTicket.passenger?.realName || "未知乘客" }}
          </div>
          <div class="passenger-id">
            {{ maskIdCard(originalTicket.passenger?.idCard) }}
          </div>
          <div class="seat-info">
            <template v-if="originalTicket.seatType === 4"> 无座 </template>
            <template v-else>
              {{ originalTicket.carriage?.carriageNumber || "未知" }}车{{
                originalTicket.seat?.seatNumber || "未知"
              }}
              <span class="seat-type"
                >({{ getSeatTypeName(originalTicket.seatType) }})</span
              >
            </template>
          </div>
        </div>
        <div class="price-info">
          <div class="price-label">票价</div>
          <div class="price-value">
            ¥{{ originalTicket.price?.toFixed(2) || "0.00" }}
          </div>
        </div>
      </div>
      <el-empty v-else description="未找到原车票信息"></el-empty>
    </el-card>

    <!-- 搜索新车票 -->
    <el-card class="search-form-card">
      <template #header>
        <div class="card-header">
          <span>搜索新车票</span>
        </div>
      </template>
      <el-form
        :model="searchForm"
        :inline="true"
        class="search-form"
        v-loading="stationsLoading"
      >
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
          <el-button @click="goToNextDay" size="small">
            后一天 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </el-card>

    <!-- 搜索结果 -->
    <el-card
      class="ticket-list-card"
      v-loading="searchLoading"
      v-if="tickets.length > 0 || searchLoading"
    >
      <template #header>
        <div class="ticket-list-header">
          <div>
            查询结果: {{ searchForm.departureStationName || "出发站" }} →
            {{ searchForm.arrivalStationName || "到达站" }}
          </div>
          <div class="ticket-filter">
            <el-radio-group v-model="filter.time" size="small">
              <el-radio-button label="all">全部时间</el-radio-button>
              <el-radio-button label="morning"
                >上午 (6:00-12:00)</el-radio-button
              >
              <el-radio-button label="afternoon"
                >下午 (12:00-18:00)</el-radio-button
              >
              <el-radio-button label="evening"
                >晚上 (18:00-24:00)</el-radio-button
              >
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
                style="width: 100%; margin-top: 10px"
              >
                <el-table-column prop="sequence" label="序号" width="60" />
                <el-table-column label="站点名称" width="200">
                  <template #default="scope">
                    {{ scope.row.stationName }}
                    <el-tag
                      v-if="scope.row.isUserDeparture"
                      type="success"
                      size="small"
                      >出发站</el-tag
                    >
                    <el-tag
                      v-if="scope.row.isUserArrival"
                      type="warning"
                      size="small"
                      >到达站</el-tag
                    >
                  </template>
                </el-table-column>
                <el-table-column
                  prop="arrivalTime"
                  label="到达时间"
                  width="120"
                />
                <el-table-column label="停留时间" width="120">
                  <template #default="scope">
                    {{ scope.row.stopDuration }} 分钟
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="120">
                  <template #default="scope">
                    <span class="station-status">
                      <el-tag
                        v-if="scope.row.type === 'start'"
                        size="small"
                        type="primary"
                        >始发站</el-tag
                      >
                      <el-tag
                        v-else-if="scope.row.type === 'end'"
                        size="small"
                        type="danger"
                        >终点站</el-tag
                      >
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
              <span class="time">{{
                formatTime(scope.row.actualDepartureTime)
              }}</span>
              <span class="station">{{ searchForm.departureStationName }}</span>
            </div>
            <div class="travel-time">
              <el-divider content-position="center">{{
                calculateDuration(
                  scope.row.actualDepartureTime,
                  scope.row.actualArrivalTime
                )
              }}</el-divider>
            </div>
            <div class="station-time">
              <span class="time">{{
                formatTime(scope.row.actualArrivalTime)
              }}</span>
              <span class="station">{{ searchForm.arrivalStationName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="商务座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div
                class="price"
                v-if="scope.row.trainSeatInfo.businessPrice > 0"
              >
                ¥{{ scope.row.sectionPrices.businessPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="一等座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div
                class="price"
                v-if="scope.row.trainSeatInfo.firstClassPrice > 0"
              >
                ¥{{ scope.row.sectionPrices.firstClassPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="二等座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div
                class="price"
                v-if="scope.row.trainSeatInfo.secondClassPrice > 0"
              >
                ¥{{ scope.row.sectionPrices.secondClassPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="无座" align="center" width="120">
          <template #default="scope">
            <div class="seat-info">
              <div
                class="price"
                v-if="
                  scope.row.trainSeatInfo.noSeatPrice > 0 &&
                  scope.row.trainSeatInfo.noSeatTickets > 0
                "
              >
                ¥{{ scope.row.sectionPrices.noSeatPrice.toFixed(2) }}
              </div>
              <div class="no-seat" v-else>--</div>
            </div>
          </template>
        </el-table-column>

        <!-- 新增操作列 -->
        <el-table-column label="操作" align="center" width="120">
          <template #default="scope">
            <el-dropdown @command="(command) => selectSeatType(scope.row, command)">
              <el-button type="primary" size="small">
                选择座位类型 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-if="scope.row.trainSeatInfo.businessPrice > 0"
                    command="business"
                  >
                    商务座
                  </el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.trainSeatInfo.firstClassPrice > 0"
                    command="firstClass"
                  >
                    一等座
                  </el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.trainSeatInfo.secondClassPrice > 0"
                    command="secondClass"
                  >
                    二等座
                  </el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.trainSeatInfo.noSeatPrice > 0 && scope.row.trainSeatInfo.noSeatTickets > 0"
                    command="noSeat"
                  >
                    无座
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 改签信息对比 -->
    <el-card
      class="change-comparison-card"
      v-if="selectedTrain && selectedSeatType"
    >
      <template #header>
        <div class="card-header">
          <span>改签信息对比</span>
        </div>
      </template>
      <div class="comparison-container">
        <div class="comparison-row">
          <div class="comparison-label">原车票</div>
          <div class="comparison-value">
            {{ originalTicket.train?.trainNumber || "未知车次" }}
            {{ originalTicket.date }}
            {{ getActualDepartureTime(originalTicket) }} -
            {{ getActualArrivalTime(originalTicket) }}
            {{ getSeatTypeName(originalTicket.seatType) }}
            ¥{{ originalTicket.price?.toFixed(2) || "0.00" }}
          </div>
        </div>
        <div class="comparison-row">
          <div class="comparison-label">新车票</div>
          <div class="comparison-value">
            {{ selectedTrain.trainNumber }}
            {{ searchForm.departureDate }}
            {{ formatTime(selectedTrain.actualDepartureTime) }} -
            {{ formatTime(selectedTrain.actualArrivalTime) }}
            {{ getSeatTypeName(selectedSeatTypeCode) }}
            ¥{{ getSelectedSeatPrice() }}
          </div>
        </div>
        <div class="comparison-row">
          <div class="comparison-label">价格差额</div>
          <div
            class="comparison-value"
            :class="
              getPriceDifference() >= 0 ? 'price-increase' : 'price-decrease'
            "
          >
            {{ getPriceDifference() >= 0 ? "+" : "" }}¥{{
              getPriceDifference().toFixed(2)
            }}
          </div>
        </div>
      </div>
      <div class="change-actions">
        <el-button type="primary" @click="confirmChange">确认改签</el-button>
        <el-button @click="cancelChange">取消</el-button>
      </div>
    </el-card>

    <!-- 座位选择对话框 -->
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
      :hasBusinessSeats="
        selectedTrain && selectedTrain.trainSeatInfo.businessPrice > 0
      "
      :hasFirstClassSeats="
        selectedTrain && selectedTrain.trainSeatInfo.firstClassPrice > 0
      "
      :hasSecondClassSeats="
        selectedTrain && selectedTrain.trainSeatInfo.secondClassPrice > 0
      "
      :hasNoSeats="
        selectedTrain &&
        selectedTrain.trainSeatInfo.noSeatPrice > 0 &&
        selectedTrain.trainSeatInfo.noSeatTickets > 0
      "
      :prices="selectedTrain ? selectedTrain.sectionPrices : {}"
      :defaultSeatType="selectedSeatType"
      :singlePassengerMode="true"
      :passengerInfo="originalTicket ? originalTicket.passenger : null"
      @select-seat="handleSeatSelected"
      @cancel="handleSeatSelectionCancel"
    />
  </div>
</template>
  
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Search, ArrowLeft, ArrowRight, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import { getOpenStations } from "@/api/station";
import trainAPI from "@/api/train";
import { getTicketDetailById, createTicket } from "@/api/tickets";
import { createChangeRecord } from "@/api/change-records";
import SeatSelectionDialog from "@/components/SeatSelectionDialog.vue";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const stationsLoading = ref(false);
const searchLoading = ref(false);
const ticketId = ref(null);
const originalTicket = ref(null);

// 搜索表单
const searchForm = reactive({
  departureStation: "",
  departureStationName: "",
  arrivalStation: "",
  arrivalStationName: "",
  departureDate: new Date().toISOString().split("T")[0], // 默认为今天
});

// 车站数据
const stations = ref([]);

// 车票查询结果
const tickets = ref([]);

// 筛选条件
const filter = reactive({
  time: "all",
});

// 座位选择相关状态
const seatSelectionVisible = ref(false);
const selectedTrain = ref(null);
const selectedSeatType = ref("");
const selectedSeatTypeCode = ref(0);
const selectedSeat = ref(null);

// 使用计算属性过滤出发站和到达站选项
const departureStations = computed(() => {
  if (!searchForm.arrivalStation) return stations.value;
  return stations.value.filter(
    (station) => station.id !== searchForm.arrivalStation
  );
});

const arrivalStations = computed(() => {
  if (!searchForm.departureStation) return stations.value;
  return stations.value.filter(
    (station) => station.id !== searchForm.departureStation
  );
});

// 监听选择变化，如果一方改变导致冲突，清空另一方
watch(
  () => searchForm.departureStation,
  (newVal) => {
    if (newVal && newVal === searchForm.arrivalStation) {
      searchForm.arrivalStation = "";
      searchForm.arrivalStationName = "";
    }
  }
);

watch(
  () => searchForm.arrivalStation,
  (newVal) => {
    if (newVal && newVal === searchForm.departureStation) {
      searchForm.departureStation = "";
      searchForm.departureStationName = "";
    }
  }
);

// 日期导航栏
const dateNavigationDays = computed(() => {
  const startDate = dayjs(searchForm.departureDate);
  const dates = [];

  for (let i = 0; i < 5; i++) {
    const date = startDate.add(i, "day");
    dates.push({
      value: date.format("YYYY-MM-DD"),
      label: i === 0 ? "今天" : date.format("MM-DD"),
    });
  }

  return dates;
});

// 是否可以选择前一天
const canGoPrevDay = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");
  return searchForm.departureDate > today;
});

// 空数据提示
const emptyText = computed(() => {
  if (searchLoading.value) {
    return "正在加载数据...";
  }

  if (!searchForm.departureStation || !searchForm.arrivalStation) {
    return "请选择出发站和到达站";
  }

  return "暂无符合条件的车次";
});

// 根据时间筛选车次
const filteredTickets = computed(() => {
  if (filter.time === "all") {
    return tickets.value;
  }

  return tickets.value.filter((ticket) => {
    // 使用actualDepartureTime进行过滤
    const hour = parseInt(ticket.actualDepartureTime.split(":")[0]);

    switch (filter.time) {
      case "morning":
        return hour >= 6 && hour < 12;
      case "afternoon":
        return hour >= 12 && hour < 18;
      case "evening":
        return hour >= 18 && hour < 24;
      default:
        return true;
    }
  });
});

// 获取原始车票信息
const loadOriginalTicket = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    if (!id) {
      ElMessage.error("未指定车票ID");
      router.push("/user/orders");
      return;
    }

    ticketId.value = id;
    const ticket = await getTicketDetailById(id);
    originalTicket.value = ticket;

    // 加载完车票后，设置搜索表单的默认值
    if (ticket) {
      searchForm.departureStation = ticket.departureStation?.id;
      searchForm.departureStationName = ticket.departureStation?.stationName;
      searchForm.arrivalStation = ticket.arrivalStation?.id;
      searchForm.arrivalStationName = ticket.arrivalStation?.stationName;
      searchForm.departureDate = dayjs(ticket.date).format("YYYY-MM-DD");
    }
  } catch (error) {
    console.error("获取车票信息失败:", error);
    ElMessage.error("获取车票信息失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 获取车站数据
const fetchStations = async () => {
  stationsLoading.value = true;
  try {
    const response = await getOpenStations();
    // 只取需要的字段
    stations.value = response.map((station) => ({
      id: station.id,
      stationName: station.stationName,
    }));
  } catch (error) {
    console.error("获取车站失败:", error);
    ElMessage.error("获取车站数据失败，请刷新页面重试");
  } finally {
    stationsLoading.value = false;
  }
};

// 格式化时间 - 去掉秒
const formatTime = (time) => {
  if (!time) return "";
  const timeParts = time.split(":");
  return timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : time;
};

// 计算行程时间
const calculateDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return "";

  const [depHours, depMinutes] = departureTime.split(":").map(Number);
  let [arrHours, arrMinutes] = arrivalTime.split(":").map(Number);

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
const disablePastDates = (time) => {
  return time.getTime() < Date.now() - 8.64e7; // 8.64e7 是一天的毫秒数
};

// 前一天
const goToPrevDay = () => {
  const prevDay = dayjs(searchForm.departureDate).subtract(1, "day");
  const today = dayjs();

  if (prevDay.isBefore(today, "day")) {
    ElMessage.warning("不能选择过去的日期");
    return;
  }

  searchForm.departureDate = prevDay.format("YYYY-MM-DD");
  if (searchForm.departureStation && searchForm.arrivalStation) {
    searchTickets();
  }
};

// 后一天
const goToNextDay = () => {
  const nextDay = dayjs(searchForm.departureDate).add(1, "day");
  searchForm.departureDate = nextDay.format("YYYY-MM-DD");
  if (searchForm.departureStation && searchForm.arrivalStation) {
    searchTickets();
  }
};

// 将时间字符串转换为分钟数
const convertTimeToMinutes = (time) => {
  if (!time) return 0;

  const parts = time.split(":");
  if (parts.length < 2) return 0;

  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);

  return hours * 60 + minutes;
};

// 计算区间票价
const calculateSectionPrice = (train, departureTime, arrivalTime) => {
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
    businessPrice:
      train.trainSeatInfo.businessPrice > 0
        ? Math.round(train.trainSeatInfo.businessPrice * ratio * 100) / 100
        : 0,
    firstClassPrice:
      train.trainSeatInfo.firstClassPrice > 0
        ? Math.round(train.trainSeatInfo.firstClassPrice * ratio * 100) / 100
        : 0,
    secondClassPrice:
      train.trainSeatInfo.secondClassPrice > 0
        ? Math.round(train.trainSeatInfo.secondClassPrice * ratio * 100) / 100
        : 0,
    noSeatPrice:
      train.trainSeatInfo.noSeatPrice > 0 &&
      train.trainSeatInfo.noSeatTickets > 0
        ? Math.round(train.trainSeatInfo.noSeatPrice * ratio * 100) / 100
        : 0,
  };
};

// 搜索车票
const searchTickets = async () => {
  // 表单验证
  if (!searchForm.departureStation) {
    ElMessage.warning("请选择出发站");
    return;
  }
  if (!searchForm.arrivalStation) {
    ElMessage.warning("请选择到达站");
    return;
  }
  if (!searchForm.departureDate) {
    ElMessage.warning("请选择出发日期");
    return;
  }

  // 更新站点名称
  const departureStation = stations.value.find(
    (s) => s.id === searchForm.departureStation
  );
  const arrivalStation = stations.value.find(
    (s) => s.id === searchForm.arrivalStation
  );

  if (departureStation) {
    searchForm.departureStationName = departureStation.stationName;
  }
  if (arrivalStation) {
    searchForm.arrivalStationName = arrivalStation.stationName;
  }

  // 使用API获取车次数据
  searchLoading.value = true;
  try {
    const response = await trainAPI.getTrainsByInterval(
      searchForm.departureStation,
      searchForm.arrivalStation,
      searchForm.departureDate
    );

    // 处理返回的车次数据
    tickets.value = response.map((train) => {
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
          arrivalTime: train.departureTime,
        };
      } else {
        // 否则从trainStops中找
        departureStop = train.trainStops.find(
          (stop) => stop.station.id === Number(departureStationId)
        );
      }

      // 如果是终点站，使用train的arrivalTime
      if (train.endStation.id === Number(arrivalStationId)) {
        arrivalStop = {
          station: train.endStation,
          arrivalTime: train.arrivalTime,
        };
      } else {
        // 否则从trainStops中找
        arrivalStop = train.trainStops.find(
          (stop) => stop.station.id === Number(arrivalStationId)
        );
      }

      // 提取实际的出发和到达时间
      const actualDepartureTime = departureStop
        ? departureStop.arrivalTime
        : train.departureTime;
      const actualArrivalTime = arrivalStop
        ? arrivalStop.arrivalTime
        : train.arrivalTime;

      // 计算区间票价
      const sectionPrices = calculateSectionPrice(
        train,
        actualDepartureTime,
        actualArrivalTime
      );

      return {
        ...train,
        actualDepartureTime,
        actualArrivalTime,
        sectionPrices,
      };
    });
  } catch (error) {
    console.error("获取车次数据失败:", error);
    ElMessage.error("获取车次数据失败，请重试");
    tickets.value = [];
  } finally {
    searchLoading.value = false;
  }
};

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
      type: "start",
      isUserDeparture:
        train.startStation.id === Number(searchForm.departureStation),
      isUserArrival:
        train.startStation.id === Number(searchForm.arrivalStation),
    });
  }

  // 中间站点
  if (train.trainStops && Array.isArray(train.trainStops)) {
    const sortedStops = [...train.trainStops].sort(
      (a, b) => a.sequence - b.sequence
    );
    sortedStops.forEach((stop) => {
      if (stop.station) {
        result.push({
          sequence: sequence++,
          stationName: stop.station.stationName,
          arrivalTime: stop.arrivalTime,
          stopDuration: stop.stopDuration || 0,
          type: "middle",
          isUserDeparture:
            stop.station.id === Number(searchForm.departureStation),
          isUserArrival: stop.station.id === Number(searchForm.arrivalStation),
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
      type: "end",
      isUserDeparture:
        train.endStation.id === Number(searchForm.departureStation),
      isUserArrival: train.endStation.id === Number(searchForm.arrivalStation),
    });
  }

  return result;
};

// 选择座位类型
const selectSeatType = (train, seatType) => {
  selectedTrain.value = train;
  selectedSeatType.value = seatType;

  // 设置座位类型代码
  switch (seatType) {
    case "business":
      selectedSeatTypeCode.value = 1; // 商务座
      break;
    case "firstClass":
      selectedSeatTypeCode.value = 2; // 一等座
      break;
    case "secondClass":
      selectedSeatTypeCode.value = 3; // 二等座
      break;
    case "noSeat":
      selectedSeatTypeCode.value = 4; // 无座
      break;
    default:
      selectedSeatTypeCode.value = 0;
  }

  // 如果选择的是无座，直接跳过座位选择
  if (seatType === "noSeat") {
    selectedSeat.value = null;
  } else {
    // 否则显示座位选择对话框
    seatSelectionVisible.value = true;
  }
};

// 获取座位类型名称
const getSeatTypeName = (type) => {
  const typeMap = {
    1: "商务座",
    2: "一等座",
    3: "二等座",
    4: "无座",
  };
  return typeMap[type] || "未知";
};

// 获取选择的座位价格
const getSelectedSeatPrice = () => {
  if (!selectedTrain.value || !selectedSeatType.value) return "0.00";

  switch (selectedSeatType.value) {
    case "business":
      return selectedTrain.value.sectionPrices.businessPrice.toFixed(2);
    case "firstClass":
      return selectedTrain.value.sectionPrices.firstClassPrice.toFixed(2);
    case "secondClass":
      return selectedTrain.value.sectionPrices.secondClassPrice.toFixed(2);
    case "noSeat":
      return selectedTrain.value.sectionPrices.noSeatPrice.toFixed(2);
    default:
      return "0.00";
  }
};

// 计算价格差额
const getPriceDifference = () => {
  if (!originalTicket.value || !selectedTrain.value || !selectedSeatType.value)
    return 0;

  const originalPrice = originalTicket.value.price || 0;
  let newPrice = 0;

  switch (selectedSeatType.value) {
    case "business":
      newPrice = selectedTrain.value.sectionPrices.businessPrice;
      break;
    case "firstClass":
      newPrice = selectedTrain.value.sectionPrices.firstClassPrice;
      break;
    case "secondClass":
      newPrice = selectedTrain.value.sectionPrices.secondClassPrice;
      break;
    case "noSeat":
      newPrice = selectedTrain.value.sectionPrices.noSeatPrice;
      break;
    default:
      newPrice = 0;
  }

  return newPrice - originalPrice;
};

// 获取原票的实际出发时间
const getActualDepartureTime = (ticket) => {
  if (!ticket || !ticket.train) return "00:00";

  // 检查出发站是否是列车的起始站
  if (
    ticket.departureStation &&
    ticket.train.startStation &&
    ticket.departureStation.id === ticket.train.startStation.id
  ) {
    // 如果是起始站，使用列车的departureTime
    return ticket.train.departureTime || "00:00";
  }

  // 否则从trainStops中查找对应站点的时间
  if (ticket.train.trainStops && Array.isArray(ticket.train.trainStops)) {
    const departureStop = ticket.train.trainStops.find(
      (stop) => stop.station && stop.station.id === ticket.departureStation.id
    );

    if (departureStop && departureStop.arrivalTime) {
      return departureStop.arrivalTime;
    }
  }

  // 如果没有找到对应信息，返回默认值
  return ticket.train.departureTime || "00:00";
};

// 获取原票的实际到达时间
const getActualArrivalTime = (ticket) => {
  if (!ticket || !ticket.train) return "00:00";

  // 检查到达站是否是列车的终点站
  if (
    ticket.arrivalStation &&
    ticket.train.endStation &&
    ticket.arrivalStation.id === ticket.train.endStation.id
  ) {
    // 如果是终点站，使用列车的arrivalTime
    return ticket.train.arrivalTime || "00:00";
  }

  // 否则从trainStops中查找对应站点的时间
  if (ticket.train.trainStops && Array.isArray(ticket.train.trainStops)) {
    const arrivalStop = ticket.train.trainStops.find(
      (stop) => stop.station && stop.station.id === ticket.arrivalStation.id
    );

    if (arrivalStop && arrivalStop.arrivalTime) {
      return arrivalStop.arrivalTime;
    }
  }

  // 如果没有找到对应信息，返回默认值
  return ticket.train.arrivalTime || "00:00";
};

// 遮蔽身份证号
const maskIdCard = (idCard) => {
  if (!idCard || idCard.length < 11) return idCard || "未知";
  return idCard.slice(0, 4) + "**********" + idCard.slice(-4);
};

// 处理座位选择完成事件
const handleSeatSelected = (selection) => {
  if (!selection || selection.length === 0) {
    ElMessage.warning("未选择座位");
    return;
  }

  // 由于是单乘客模式，我们只取第一个选择
  const seatSelection = selection[0];

  // 更新选择的座位信息
  if (seatSelection.seat) {
    selectedSeat.value = seatSelection.seat;
  } else {
    selectedSeat.value = null;
  }

  // 关闭座位选择对话框
  seatSelectionVisible.value = false;
};

// 处理取消选座事件
const handleSeatSelectionCancel = () => {
  // 如果取消选座，则不修改已选座位信息
  seatSelectionVisible.value = false;
};

// 修改确认改签功能
const confirmChange = async () => {
  if (!selectedTrain.value || !selectedSeatType.value) {
    ElMessage.warning("请先选择新车次和座位类型");
    return;
  }

  if (!originalTicket.value) {
    ElMessage.warning("未找到原车票信息");
    return;
  }

  try {
    // 显示加载状态
    ElMessageBox.confirm(
      '正在提交改签请求，请确认是否继续？',
      '改签确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        // 获取用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!userInfo || !userInfo.userId) {
          throw new Error('获取用户信息失败，请重新登录');
        }

        // 准备新车票数据
        const newTicketData = {
          orderId: originalTicket.value.orderId,
          passengerId: originalTicket.value.passenger?.id || 0,
          trainId: selectedTrain.value.id,
          date: searchForm.departureDate,
          departureStationId: parseInt(searchForm.departureStation),
          arrivalStationId: parseInt(searchForm.arrivalStation),
          seatType: selectedSeatTypeCode.value,
          carriageId: selectedSeat.value ? selectedSeat.value.carriageId : 0,
          seatId: selectedSeat.value ? selectedSeat.value.id : 0,
          price: parseFloat(getSelectedSeatPrice()),
          status: 4 // 改签待支付状态
        };

        ElMessage.info('正在提交改签请求...');
        
        // 创建改签记录
        const changeRecordData = {
          ticketId: originalTicket.value.id,
          newTicket: newTicketData,  // 直接传递新票数据，不需要创建新票
          orderId: originalTicket.value.orderId,
          userId: userInfo.userId
        };
        
        // 直接调用创建改签记录API
        await createChangeRecord(changeRecordData);
        
        ElMessage.success('改签申请提交成功！');
        
        // 跳转到订单列表页面
        router.push('/user/orders');
      } catch (error) {
        console.error('改签提交失败:', error);
        ElMessage.error('改签提交失败: ' + (error.message || '未知错误'));
      }
    }).catch(() => {
      // 用户取消了确认
      ElMessage.info('已取消改签操作');
    });
  } catch (error) {
    console.error('改签提交失败:', error);
    ElMessage.error('改签提交失败，请重试');
  }
};

// 取消改签
const cancelChange = () => {
  // 重置选择状态
  selectedTrain.value = null;
  selectedSeatType.value = "";
  selectedSeatTypeCode.value = 0;
  selectedSeat.value = null;
};

// 页面加载时获取原车票信息和车站数据
onMounted(async () => {
  await fetchStations();
  await loadOriginalTicket();

  // 如果原车票信息加载成功，自动搜索车票
  if (
    originalTicket.value &&
    searchForm.departureStation &&
    searchForm.arrivalStation
  ) {
    searchTickets();
  }
});
</script>
  
<style scoped>
.ticket-change {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.original-ticket-card,
.search-form-card,
.ticket-list-card,
.change-comparison-card {
  margin-bottom: 20px;
}

.original-ticket-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.train-info {
  flex: 1;
  min-width: 150px;
}

.train-number {
  font-size: 16px;
  font-weight: bold;
  color: #0052cc;
}

.train-date {
  margin-top: 5px;
  color: #606266;
}

.station-info {
  flex: 3;
  display: flex;
  align-items: center;
}

.departure,
.arrival {
  flex: 1;
}

.journey {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
}

.arrow-line {
  height: 2px;
  width: 100%;
  background-color: #dcdfe6;
  position: relative;
}

.arrow-line::after {
  content: "";
  position: absolute;
  right: 0;
  top: -4px;
  border: 5px solid transparent;
  border-left-color: #dcdfe6;
}

.duration {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
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

.passenger-info {
  flex: 2;
  padding: 0 20px;
  border-left: 1px dashed #dcdfe6;
  border-right: 1px dashed #dcdfe6;
}

.passenger-name {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.passenger-id {
  font-size: 12px;
  color: #909399;
  margin: 5px 0;
}

.seat-info {
  font-size: 14px;
  color: #606266;
}

.seat-type {
  color: #0052cc;
}

.price-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.price-value {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
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

.ticket-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comparison-container {
  margin-bottom: 20px;
}

.comparison-row {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.comparison-label {
  width: 80px;
  font-weight: bold;
  color: #606266;
}

.comparison-value {
  flex: 1;
  color: #303133;
}

.price-increase {
  color: #f56c6c;
}

.price-decrease {
  color: #67c23a;
}

.change-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.stops-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 10px;
}

.train-route {
  color: #666;
  font-size: 14px;
}

.station-status {
  display: flex;
  align-items: center;
}

.seat-info {
  display: flex;
  justify-content: center;
}

.price {
  font-size: 15px;
  color: #f56c6c;
  font-weight: bold;
}

.no-seat {
  font-size: 14px;
  color: #909399;
  height: 19px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .original-ticket-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .passenger-info,
  .price-info {
    padding: 10px 0;
    border-left: none;
    border-right: none;
    border-top: 1px dashed #dcdfe6;
    border-bottom: 1px dashed #dcdfe6;
    width: 100%;
  }

  .price-info {
    align-items: flex-start;
  }
}
</style>