<template>
  <div class="ticket-refund-container">
    <div class="page-header">
      <el-page-header @back="goBack" title="返回订单详情">
        <template #content>
          <span class="page-title">车票退票</span>
        </template>
      </el-page-header>
    </div>

    <div class="ticket-refund-content" v-loading="loading">
      <template v-if="order">
        <!-- 订单信息卡片 -->
        <el-card class="order-info-card">
          <template #header>
            <div class="card-header">
              <h3>订单信息</h3>
              <el-tag :type="getOrderStatusType(order.status)">
                {{ getOrderStatusName(order.status) }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{
              order.orderNo
            }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{
              formatDateTime(order.createTime)
            }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{
              getPaymentMethodName(order.paymentMethod)
            }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{
              formatDateTime(order.paymentTime)
            }}</el-descriptions-item>
            <el-descriptions-item label="订单金额"
              >¥{{ order.totalPrice.toFixed(2) }}</el-descriptions-item
            >
          </el-descriptions>
        </el-card>

        <!-- 行程信息卡片 -->
        <el-card class="trip-info-card">
          <template #header>
            <div class="card-header">
              <h3>行程信息</h3>
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
        </el-card>

        <!-- 退票信息卡片 -->
        <el-card class="refund-info-card">
          <template #header>
            <div class="card-header">
              <h3>选择退票</h3>
            </div>
          </template>

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

          <div class="refund-notice" v-if="selectedTickets.length > 0">
            <el-alert
              title="退票须知"
              type="warning"
              description="根据铁路退票规定，距离发车时间不同，退票手续费比例也不同。请在确认退票前仔细阅读退票规则。"
              show-icon
              :closable="false"
            ></el-alert>

            <div class="refund-rules">
              <h4>退票规则</h4>
              <ul>
                <li>距离发车时间15天（含）以上的，不收取退票费</li>
                <li>
                  距离发车时间48小时（含）至15天（不含）的，收取票价5%的退票费
                </li>
                <li>
                  距离发车时间24小时（含）至48小时（不含）的，收取票价10%的退票费
                </li>
                <li>
                  距离发车时间15分钟（含）至24小时（不含）的，收取票价20%的退票费
                </li>
                <li>开车前15分钟以内的，收取票价50%的退票费</li>
                <li>开车后的，收取票价100%的退票费（即不予退票）</li>
              </ul>
            </div>
          </div>

          <div class="refund-summary" v-if="selectedTickets.length > 0">
            <div class="refund-item">
              <span class="label">退票乘客：</span>
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
            <div class="refund-item">
              <span class="label">票价合计：</span>
              <span class="value"
                >¥{{ getTicketsTotalPrice().toFixed(2) }}</span
              >
            </div>
            <div class="refund-item">
              <span class="label">退票手续费：</span>
              <span class="value">¥{{ getRefundFee().toFixed(2) }}</span>
            </div>
            <div class="refund-item">
              <span class="label">退票说明：</span>
              <span class="value">{{ getRefundFeeReason() }}</span>
            </div>
            <div class="refund-item total">
              <span class="label">退款金额：</span>
              <span class="value price"
                >¥{{ getRefundAmount().toFixed(2) }}</span
              >
            </div>
          </div>

          <div class="refund-reason" v-if="selectedTickets.length > 0">
            <el-form :model="refundForm" label-width="100px">
              <el-form-item label="退票原因">
                <el-select
                  v-model="refundForm.reason"
                  placeholder="请选择退票原因"
                  style="width: 100%"
                >
                  <el-option label="行程变更" value="行程变更"></el-option>
                  <el-option label="无法出行" value="无法出行"></el-option>
                  <el-option label="票价原因" value="票价原因"></el-option>
                  <el-option
                    label="车次时间不合适"
                    value="车次时间不合适"
                  ></el-option>
                  <el-option label="其他原因" value="其他原因"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item
                label="备注"
                v-if="refundForm.reason === '其他原因'"
              >
                <el-input
                  v-model="refundForm.remark"
                  type="textarea"
                  placeholder="请输入退票原因"
                  :rows="3"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>

          <div class="refund-actions" v-if="selectedTickets.length > 0">
            <el-button @click="cancelRefund">取消</el-button>
            <el-button
              type="danger"
              @click="confirmRefund"
              :disabled="!refundForm.reason"
              >确认退票</el-button
            >
          </div>

          <el-empty
            v-if="selectedTickets.length === 0"
            description="请选择需要退票的乘客"
            :image-size="200"
          ></el-empty>
        </el-card>
      </template>

      <el-empty
        v-else
        description="订单信息不存在或已被删除"
        :image-size="200"
      ></el-empty>
    </div>

    <!-- 退票成功对话框 -->
    <el-dialog
      v-model="successDialogVisible"
      title="退票申请成功"
      width="500px"
    >
      <div class="success-content">
        <el-result
          icon="success"
          title="退票申请已提交"
          sub-title="系统将自动处理您的退票申请，退款将原路返回支付账户"
        >
          <template #extra>
            <div class="success-info">
              <p>退票单号：{{ refundNo }}</p>
              <p>退款金额：¥{{ getRefundAmount().toFixed(2) }}</p>
              <p>预计到账时间：1-7个工作日</p>
            </div>
            <el-button type="primary" @click="goToOrderDetail"
              >查看订单详情</el-button
            >
            <el-button @click="goToOrders">返回订单列表</el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>
  
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const selectedTickets = ref<number[]>([]);
const successDialogVisible = ref(false);
const refundNo = ref("");

// 获取路由参数中的订单ID
const orderId = computed(() => {
  return Number(route.params.id) || 0;
});

// 订单数据
const order = ref<any>(null);

// 退票表单
const refundForm = reactive({
  reason: "",
  remark: "",
});

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

      loading.value = false;
    }, 500);
  } catch (error) {
    console.error("获取订单详情失败:", error);
    ElMessage.error("获取订单详情失败，请重试");
    loading.value = false;
  }
};

// 返回订单详情
const goBack = () => {
  router.push(`/user/order/detail/${orderId.value}`);
};

// 跳转到订单详情页
const goToOrderDetail = () => {
  successDialogVisible.value = false;
  router.push(`/user/order/detail/${orderId.value}`);
};

// 跳转到订单列表页
const goToOrders = () => {
  successDialogVisible.value = false;
  router.push('/user/orders');
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

// 获取订单状态类型
const getOrderStatusType = (status: number) => {
  const statusMap: Record<number, string> = {
    0: "warning", // 待支付
    1: "success", // 已支付
    2: "info", // 已取消
  };
  return statusMap[status] || "info";
};

// 获取订单状态名称
const getOrderStatusName = (status: number) => {
  const statusMap: Record<number, string> = {
    0: "待支付",
    1: "已支付",
    2: "已取消",
  };
  return statusMap[status] || "未知状态";
};

// 获取支付方式名称
const getPaymentMethodName = (method: string) => {
  const methodMap: Record<string, string> = {
    alipay: "支付宝",
    wechat: "微信支付",
    card: "银行卡",
    balance: "余额支付",
  };
  return methodMap[method] || "未知方式";
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

// 获取所选车票的总价
const getTicketsTotalPrice = () => {
  if (!order.value || selectedTickets.value.length === 0) return 0;
  return (
    (order.value.ticketPrice / order.value.passengers.length) *
    selectedTickets.value.length
  );
};

// 获取退票手续费
const getRefundFee = () => {
  // 模拟退票手续费计算
  // 假设当前距离发车时间为3天，收取10%的退票费
  return getTicketsTotalPrice() * 0.1;
};

// 获取退票手续费原因
const getRefundFeeReason = () => {
  // 模拟退票手续费原因
  return "距离发车时间3天，按照票价10%收取退票费";
};

// 获取退款金额
const getRefundAmount = () => {
  return getTicketsTotalPrice() - getRefundFee();
};

// 取消退票
const cancelRefund = () => {
  selectedTickets.value = [];
  refundForm.reason = "";
  refundForm.remark = "";
};

// 确认退票
const confirmRefund = () => {
  if (!refundForm.reason) {
    ElMessage.warning("请选择退票原因");
    return;
  }

  ElMessageBox.confirm(
    `确认退票吗？退票后将收取 ¥${getRefundFee().toFixed(
      2
    )} 的手续费，实际退款 ¥${getRefundAmount().toFixed(2)}`,
    "退票确认",
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
        // 生成退票单号
        refundNo.value = "REF" + Date.now().toString().slice(-6);

        loading.value = false;
        successDialogVisible.value = true;
      }, 1000);
    })
    .catch(() => {});
};

// 页面加载时获取订单详情
onMounted(() => {
  fetchOrderDetail();
});
</script>
  
<style scoped>
.ticket-refund-container {
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

.ticket-refund-content > * {
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

.refund-notice {
  margin-top: 30px;
}

.refund-rules {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.refund-rules h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.refund-rules ul {
  margin: 0;
  padding-left: 20px;
}

.refund-rules li {
  margin-bottom: 5px;
  color: #606266;
}

.refund-summary {
  margin-top: 30px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}

.refund-item {
  display: flex;
  margin-bottom: 10px;
}

.refund-item:last-child {
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

.passenger-tag {
  margin-right: 10px;
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

.refund-reason {
  margin: 20px 0;
}

.refund-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.refund-actions button {
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