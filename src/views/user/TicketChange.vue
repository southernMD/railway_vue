<template>
  <div class="ticket-change-container">
    <div class="page-header">
      <el-page-header @back="goBack" title="返回订单详情">
        <template #content>
          <span class="page-title">车票改签</span>
        </template>
      </el-page-header>
    </div>

    <div class="ticket-change-content" v-loading="loading">
      <template v-if="order">
        <!-- 原行程信息 -->
        <el-card class="original-trip-card">
          <template #header>
            <div class="card-header">
              <h3>原行程信息</h3>
            </div>
          </template>

          <div class="train-info">
            <div class="train-header">
              <div class="train-number">{{ order.trainNumber }}</div>
              <div class="train-date">{{ formatDate(order.travelDate) }}</div>
            </div>
            <div class="station-info">
              <div class="departure">
                <div class="time">{{ order.departureTime }}</div>
                <div class="station">{{ order.departureStation }}</div>
              </div>
              <div class="journey">
                <div class="arrow-line"></div>
                <div class="duration">
                  {{
                    calculateDuration(order.departureTime, order.arrivalTime)
                  }}
                </div>
              </div>
              <div class="arrival">
                <div class="time">{{ order.arrivalTime }}</div>
                <div class="station">{{ order.arrivalStation }}</div>
              </div>
            </div>
          </div>

          <el-divider>车票信息</el-divider>

          <div class="ticket-list">
            <el-checkbox-group v-model="selectedTickets">
              <div
                v-for="(passenger, index) in order.passengers"
                :key="index"
                class="ticket-item"
              >
                <el-checkbox :label="index" :disabled="passenger.status !== 0">
                </el-checkbox>
                <div class="passenger-info">
                  <div class="passenger-name">{{ passenger.name }}</div>
                  <div class="passenger-id">
                    {{ maskIdCard(passenger.idCard) }}
                  </div>
                  <div class="passenger-type">
                    {{ getPassengerTypeName(passenger.passengerType) }}
                  </div>
                </div>
                <div class="ticket-info">
                  <div class="carriage">{{ passenger.carriageNumber }}车</div>
                  <div class="seat">{{ passenger.seatNumber }}号</div>
                  <div class="seat-type">
                    {{ getSeatTypeName(passenger.seatType) }}
                  </div>
                </div>
                <div class="ticket-status">
                  <el-tag :type="getTicketStatusType(passenger.status)">
                    {{ getTicketStatusName(passenger.status) }}
                  </el-tag>
                </div>
                <div class="ticket-price">
                  ¥{{
                    (order.ticketPrice / order.passengers.length).toFixed(2)
                  }}
                </div>
              </div>
            </el-checkbox-group>
          </div>
        </el-card>

        <!-- 搜索新车次 -->
        <el-card class="search-card" v-if="selectedTickets.length > 0">
          <template #header>
            <div class="card-header">
              <h3>选择新车次</h3>
            </div>
          </template>

          <div class="search-form">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="出发站">
                <el-input
                  v-model="searchForm.departureStation"
                  disabled
                ></el-input>
              </el-form-item>
              <el-form-item label="到达站">
                <el-input
                  v-model="searchForm.arrivalStation"
                  disabled
                ></el-input>
              </el-form-item>
              <el-form-item label="出发日期">
                <el-date-picker
                  v-model="searchForm.departureDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disablePastDates"
                ></el-date-picker>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchTrains"
                  >搜索车次</el-button
                >
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="train-list" v-if="trains.length > 0">
            <el-table
              :data="trains"
              border
              style="width: 100%"
              :highlight-current-row="true"
              @row-click="handleRowClick"
              :row-class-name="getRowClass"
            >
              <el-table-column
                label="车次"
                prop="trainNumber"
                width="100"
                align="center"
              ></el-table-column>
              <el-table-column label="出发站" width="160" align="center">
                <template #default="scope">
                  <div class="station-time">
                    <div class="time">{{ scope.row.departureTime }}</div>
                    <div class="station">{{ scope.row.departureStation }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="到达站" width="160" align="center">
                <template #default="scope">
                  <div class="station-time">
                    <div class="time">{{ scope.row.arrivalTime }}</div>
                    <div class="station">{{ scope.row.arrivalStation }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="历时" width="100" align="center">
                <template #default="scope">
                  {{
                    calculateDuration(
                      scope.row.departureTime,
                      scope.row.arrivalTime
                    )
                  }}
                </template>
              </el-table-column>
              <el-table-column
                v-for="seat in seatTypes"
                :key="seat.type"
                :label="seat.name"
                align="center"
              >
                <template #default="scope">
                  <div
                    v-if="scope.row.seats[seat.type].count > 0"
                    class="seat-info"
                  >
                    <div class="price">
                      ¥{{ scope.row.seats[seat.type].price }}
                    </div>
                    <div class="count">
                      余 {{ scope.row.seats[seat.type].count }}
                    </div>
                    <el-button
                      type="primary"
                      size="small"
                      @click.stop="selectSeat(scope.row, seat.type)"
                      :disabled="
                        selectedTrain &&
                        selectedTrain.trainNumber === scope.row.trainNumber &&
                        selectedSeatType === seat.type
                      "
                    >
                      选择
                    </el-button>
                  </div>
                  <div v-else class="seat-info">
                    <div class="price">
                      ¥{{ scope.row.seats[seat.type].price }}
                    </div>
                    <div class="no-seat">无票</div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty
            v-else-if="searchedOnce"
            description="未找到符合条件的车次"
            :image-size="200"
          ></el-empty>
        </el-card>

        <!-- 改签确认 -->
        <el-card class="confirm-card" v-if="selectedTrain">
          <template #header>
            <div class="card-header">
              <h3>改签确认</h3>
            </div>
          </template>

          <div class="change-comparison">
            <div class="original-trip">
              <div class="comparison-title">原行程</div>
              <div class="trip-info">
                <div class="train-number">{{ order.trainNumber }}</div>
                <div class="train-date">{{ formatDate(order.travelDate) }}</div>
                <div class="trip-stations">
                  <div class="departure">
                    <div class="time">{{ order.departureTime }}</div>
                    <div class="station">{{ order.departureStation }}</div>
                  </div>
                  <div class="journey">
                    <div class="arrow-line"></div>
                  </div>
                  <div class="arrival">
                    <div class="time">{{ order.arrivalTime }}</div>
                    <div class="station">{{ order.arrivalStation }}</div>
                  </div>
                </div>
                <div class="seat-info">
                  <span>{{
                    getSeatTypeName(
                      order.passengers[selectedTickets[0]].seatType
                    )
                  }}</span>
                  <span
                    >¥{{
                      (order.ticketPrice / order.passengers.length).toFixed(2)
                    }}</span
                  >
                </div>
              </div>
            </div>

            <div class="change-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="new-trip">
              <div class="comparison-title">新行程</div>
              <div class="trip-info">
                <div class="train-number">{{ selectedTrain.trainNumber }}</div>
                <div class="train-date">{{ searchForm.departureDate }}</div>
                <div class="trip-stations">
                  <div class="departure">
                    <div class="time">{{ selectedTrain.departureTime }}</div>
                    <div class="station">
                      {{ selectedTrain.departureStation }}
                    </div>
                  </div>
                  <div class="journey">
                    <div class="arrow-line"></div>
                  </div>
                  <div class="arrival">
                    <div class="time">{{ selectedTrain.arrivalTime }}</div>
                    <div class="station">
                      {{ selectedTrain.arrivalStation }}
                    </div>
                  </div>
                </div>
                <div class="seat-info">
                  <span>{{ getSeatTypeName(selectedSeatType) }}</span>
                  <span
                    >¥{{
                      selectedTrain.seats[selectedSeatType].price.toFixed(2)
                    }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="change-summary">
            <div class="change-item">
              <span class="label">改签乘客：</span>
              <span class="value">
                <el-tag
                  v-for="index in selectedTickets"
                  :key="index"
                  class="passenger-tag"
                >
                  {{ order.passengers[index].name }}
                </el-tag>
              </span>
            </div>
            <div class="change-item">
              <span class="label">原票价：</span>
              <span class="value">¥{{ getOriginalPrice().toFixed(2) }}</span>
            </div>
            <div class="change-item">
              <span class="label">新票价：</span>
              <span class="value">¥{{ getNewPrice().toFixed(2) }}</span>
            </div>
            <div class="change-item">
              <span class="label">改签手续费：</span>
              <span class="value">¥{{ getChangeFee().toFixed(2) }}</span>
            </div>
            <div class="change-item total">
              <span class="label">应付金额：</span>
              <span class="value price"
                >¥{{ getTotalAmount().toFixed(2) }}</span
              >
            </div>
          </div>

          <div class="change-reason">
            <el-form :model="changeForm" label-width="100px">
              <el-form-item label="改签原因">
                <el-select
                  v-model="changeForm.reason"
                  placeholder="请选择改签原因"
                  style="width: 100%"
                >
                  <el-option label="行程变更" value="行程变更"></el-option>
                  <el-option label="时间变更" value="时间变更"></el-option>
                  <el-option label="座位调整" value="座位调整"></el-option>
                  <el-option label="其他原因" value="其他原因"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item
                label="备注"
                v-if="changeForm.reason === '其他原因'"
              >
                <el-input
                  v-model="changeForm.remark"
                  type="textarea"
                  placeholder="请输入改签原因"
                  :rows="3"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>

          <div class="change-actions">
            <el-button @click="cancelChange">取消改签</el-button>
            <el-button
              type="primary"
              @click="confirmChange"
              :disabled="!changeForm.reason"
              >确认改签</el-button
            >
          </div>
        </el-card>
      </template>

      <el-empty
        v-else
        description="订单信息不存在或已被删除"
        :image-size="200"
      ></el-empty>
    </div>

    <!-- 改签成功对话框 -->
    <el-dialog
      v-model="successDialogVisible"
      title="改签申请成功"
      width="500px"
    >
      <div class="success-content">
        <el-result
          icon="success"
          title="改签申请已提交"
          sub-title="系统将自动处理您的改签申请，请耐心等待"
        >
          <template #extra>
            <div class="success-info">
              <p>改签单号：{{ changeNo }}</p>
              <p>改签状态：处理中</p>
              <p>应付金额：¥{{ getTotalAmount().toFixed(2) }}</p>
            </div>
            <el-button type="primary" @click="goToOrderDetail"
              >查看订单详情</el-button
            >
            <el-button @click="goToChangeRecords">查看改签记录</el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>
  
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ArrowRight } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const selectedTickets = ref<number[]>([]);
const trains = ref<any[]>([]);
const selectedTrain = ref<any>(null);
const selectedSeatType = ref<number | null>(null);
const searchedOnce = ref(false);
const successDialogVisible = ref(false);
const changeNo = ref("");

// 获取路由参数中的订单ID
const orderId = computed(() => {
  return Number(route.params.id) || 0;
});

// 订单数据
const order = ref<any>(null);

// 搜索表单
const searchForm = reactive({
  departureStation: "",
  arrivalStation: "",
  departureDate: "",
});

// 改签表单
const changeForm = reactive({
  reason: "",
  remark: "",
});

// 座位类型
const seatTypes = [
  { type: 1, name: "商务座" },
  { type: 2, name: "一等座" },
  { type: 3, name: "二等座" },
  { type: 4, name: "无座" },
];

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true;
  try {
    // 实际项目中应该调用API获取订单详情
    // const result = await orderApi.getOrderById(orderId.value);

    // 模拟数据
    setTimeout(() => {
      order.value = {
        id: orderId.value,
        orderNo: "ORD" + ("000000" + orderId.value).slice(-6),
        status: 1, // 已支付
        createTime: "2023-06-15 14:32:56",
        paymentTime: "2023-06-15 14:35:12",
        paymentMethod: "alipay",
        trainNumber: "G102",
        travelDate: "2023-06-20",
        departureStation: "北京南站",
        departureTime: "08:05",
        arrivalStation: "上海虹桥站",
        arrivalTime: "13:20",
        ticketPrice: 553.5,
        insurancePrice: 20,
        serviceFee: 10,
        totalPrice: 583.5,
        passengers: [
          {
            name: "张三",
            idCard: "110101199001011234",
            passengerType: 0, // 成人
            carriageNumber: "05",
            seatNumber: "05A",
            seatType: 2, // 一等座
            status: 0, // 未使用
          },
          {
            name: "李四",
            idCard: "110101199201021234",
            passengerType: 0, // 成人
            carriageNumber: "05",
            seatNumber: "05B",
            seatType: 2, // 一等座
            status: 0, // 未使用
          },
        ],
      };

      // 初始化搜索表单
      searchForm.departureStation = order.value.departureStation;
      searchForm.arrivalStation = order.value.arrivalStation;
      searchForm.departureDate = order.value.travelDate;

      loading.value = false;
    }, 500);
  } catch (error) {
    console.error("获取订单详情失败:", error);
    ElMessage.error("获取订单详情失败，请重试");
    loading.value = false;
  }
};

// 禁用过去的日期
const disablePastDates = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 8.64e7 是一天的毫秒数
};

// 返回订单详情
const goBack = () => {
  router.push(`/user/order/detail/${orderId.value}`);
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";

  const date = new Date(dateTimeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds()
  ).padStart(2, "0")}`;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return dayjs(dateStr).format("YYYY-MM-DD");
};

// 计算行程时长
const calculateDuration = (departureTime: string, arrivalTime: string) => {
  if (!departureTime || !arrivalTime) return "";

  const [depHours, depMinutes] = departureTime.split(":").map(Number);
  const [arrHours, arrMinutes] = arrivalTime.split(":").map(Number);

  let hoursDiff = arrHours - depHours;
  let minutesDiff = arrMinutes - depMinutes;

  if (minutesDiff < 0) {
    minutesDiff += 60;
    hoursDiff -= 1;
  }

  if (hoursDiff < 0) {
    hoursDiff += 24; // 跨天
  }

  return `${hoursDiff}h${minutesDiff.toString().padStart(2, "0")}m`;
};

// 获取乘客类型名称
const getPassengerTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    0: "成人",
    1: "儿童",
    2: "学生",
    3: "老年人",
  };
  return typeMap[type] || "未知";
};

// 获取座位类型名称
const getSeatTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: "商务座",
    2: "一等座",
    3: "二等座",
    4: "无座",
  };
  return typeMap[type] || "未知";
};

// 获取车票状态类型
const getTicketStatusType = (status: number) => {
  const statusMap: Record<number, string> = {
    0: "", // 未使用
    1: "success", // 已使用
    2: "info", // 已退票
    3: "warning", // 已改签
  };
  return statusMap[status] || "";
};

// 获取车票状态名称
const getTicketStatusName = (status: number) => {
  const statusMap: Record<number, string> = {
    0: "未使用",
    1: "已使用",
    2: "已退票",
    3: "已改签",
  };
  return statusMap[status] || "未知状态";
};

// 遮蔽身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 11) return idCard;
  return idCard.slice(0, 4) + "**********" + idCard.slice(-4);
};

// 搜索车次
const searchTrains = () => {
  if (!searchForm.departureDate) {
    ElMessage.warning("请选择出发日期");
    return;
  }

  loading.value = true;

  // 模拟API调用
  setTimeout(() => {
    trains.value = [
      {
        trainNumber: "G101",
        departureStation: "北京南站",
        departureTime: "07:00",
        arrivalStation: "上海虹桥站",
        arrivalTime: "12:30",
        seats: {
          1: { price: 1299, count: 5 },
          2: { price: 653, count: 8 },
          3: { price: 363, count: 12 },
          4: { price: 203, count: 0 },
        },
      },
      {
        trainNumber: "G103",
        departureStation: "北京南站",
        departureTime: "09:10",
        arrivalStation: "上海虹桥站",
        arrivalTime: "14:15",
        seats: {
          1: { price: 1199, count: 3 },
          2: { price: 553, count: 6 },
          3: { price: 323, count: 10 },
          4: { price: 193, count: 5 },
        },
      },
      {
        trainNumber: "G105",
        departureStation: "北京南站",
        departureTime: "10:05",
        arrivalStation: "上海虹桥站",
        arrivalTime: "15:20",
        seats: {
          1: { price: 1129, count: 0 },
          2: { price: 523, count: 0 },
          3: { price: 303, count: 5 },
          4: { price: 183, count: 8 },
        },
      },
    ];

    loading.value = false;
    searchedOnce.value = true;
  }, 500);
};

// 重置搜索条件
const resetSearch = () => {
  searchForm.departureDate = order.value.travelDate;
  trains.value = [];
  searchedOnce.value = false;
  selectedTrain.value = null;
  selectedSeatType.value = null;
};

// 处理行点击
const handleRowClick = (row: any) => {
  // 不做任何操作，只是为了高亮显示
};

// 获取行的样式类
const getRowClass = (row: any) => {
  if (
    selectedTrain.value &&
    row.trainNumber === selectedTrain.value.trainNumber
  ) {
    return "selected-row";
  }
  return "";
};

// 选择座位
const selectSeat = (train: any, seatType: number) => {
  selectedTrain.value = train;
  selectedSeatType.value = seatType;
};

// 获取原票价
const getOriginalPrice = () => {
  if (!order.value || selectedTickets.value.length === 0) return 0;
  return (
    (order.value.ticketPrice / order.value.passengers.length) *
    selectedTickets.value.length
  );
};

// 获取新票价
const getNewPrice = () => {
  if (
    !selectedTrain.value ||
    selectedSeatType.value === null ||
    selectedTickets.value.length === 0
  )
    return 0;
  return (
    selectedTrain.value.seats[selectedSeatType.value].price *
    selectedTickets.value.length
  );
};

// 获取改签手续费
const getChangeFee = () => {
  // 模拟改签手续费计算规则：原票价的5%
  return getOriginalPrice() * 0.05;
};

// 获取总金额
const getTotalAmount = () => {
  const originalPrice = getOriginalPrice();
  const newPrice = getNewPrice();
  const changeFee = getChangeFee();

  // 如果新票价高于原票价，需要补差价
  if (newPrice > originalPrice) {
    return newPrice - originalPrice + changeFee;
  } else {
    // 如果新票价低于原票价，退还差价，但仍需支付手续费
    return changeFee;
  }
};

// 取消改签
const cancelChange = () => {
  selectedTrain.value = null;
  selectedSeatType.value = null;
};

// 确认改签
const confirmChange = () => {
  if (!changeForm.reason) {
    ElMessage.warning("请选择改签原因");
    return;
  }

  ElMessageBox.confirm(
    `确认提交改签申请吗？改签后将产生 ¥${getTotalAmount().toFixed(2)} 的费用`,
    "改签确认",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      loading.value = true;

      // 模拟API调用
      setTimeout(() => {
        // 生成改签单号
        changeNo.value = "CHG" + Date.now().toString().slice(-6);

        loading.value = false;
        successDialogVisible.value = true;
      }, 1000);
    })
    .catch(() => {});
};

// 跳转到订单详情页
const goToOrderDetail = () => {
  successDialogVisible.value = false;
  router.push(`/user/order/detail/${orderId.value}`);
};

// 跳转到改签记录页
const goToChangeRecords = () => {
  successDialogVisible.value = false;
  router.push('/user/orders/changes');
};

// 页面加载时获取订单详情
onMounted(() => {
  fetchOrderDetail();
});
</script>
  
<style scoped>
.ticket-change-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.ticket-change-content > * {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.train-info {
  margin-bottom: 20px;
}

.train-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.train-number {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.train-date {
  color: #909399;
}

.station-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.departure,
.arrival {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
}

.time {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.station {
  margin-top: 5px;
  color: #606266;
}

.journey {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 15px;
}

.arrow-line {
  width: 100%;
  height: 2px;
  background-color: #dcdfe6;
  position: relative;
}

.arrow-line::before,
.arrow-line::after {
  content: "";
  position: absolute;
  top: -4px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

.arrow-line::before {
  left: 0;
  border-right: 8px solid #dcdfe6;
}

.arrow-line::after {
  right: 0;
  border-left: 8px solid #dcdfe6;
}

.duration {
  margin-top: 5px;
  font-size: 14px;
  color: #909399;
}

.ticket-list {
  margin-top: 20px;
}

.ticket-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.ticket-item:last-child {
  border-bottom: none;
}

.passenger-info {
  margin-left: 15px;
  width: 180px;
}

.passenger-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.passenger-id,
.passenger-type {
  margin-top: 5px;
  font-size: 14px;
  color: #909399;
}

.ticket-info {
  display: flex;
  flex: 1;
}

.ticket-info > div {
  margin-right: 15px;
}

.ticket-status {
  width: 80px;
  text-align: center;
}

.ticket-price {
  width: 100px;
  text-align: right;
  font-weight: bold;
  color: #f56c6c;
}

.search-form {
  margin-bottom: 20px;
}

.train-list {
  margin-top: 20px;
}

.station-time {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price {
  font-weight: bold;
  color: #f56c6c;
}

.count {
  margin: 5px 0;
  color: #67c23a;
}

.no-seat {
  margin: 5px 0;
  color: #909399;
}

.selected-row {
  background-color: #f0f9eb !important;
}

.change-comparison {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.original-trip,
.new-trip {
  width: 45%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.comparison-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
  text-align: center;
}

.trip-info {
  display: flex;
  flex-direction: column;
}

.trip-stations {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
}

.change-arrow {
  font-size: 24px;
  color: #409eff;
}

.seat-info {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.change-summary {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.change-item {
  display: flex;
  margin-bottom: 10px;
}

.change-item:last-child {
  margin-bottom: 0;
}

.label {
  width: 120px;
  color: #606266;
}

.value {
  flex: 1;
  color: #303133;
}

.total {
  font-weight: bold;
  font-size: 16px;
  border-top: 1px solid #dcdfe6;
  padding-top: 10px;
  margin-top: 10px;
}

.price {
  color: #f56c6c;
}

.passenger-tag {
  margin-right: 10px;
}

.change-reason {
  margin: 20px 0;
}

.change-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.change-actions button {
  margin: 0 10px;
  min-width: 120px;
}

.success-content {
  text-align: center;
}

.success-info {
  text-align: left;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.success-info p {
  margin: 10px 0;
}
</style>