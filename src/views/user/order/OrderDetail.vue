<template>
  <div class="order-detail-container">
    <div class="page-header">
      <el-page-header @back="goBack" title="返回订单列表">
        <template #content>
          <span class="page-title">订单详情</span>
        </template>
      </el-page-header>
    </div>
    
    <div class="order-detail-content" v-loading="loading">
      <template v-if="order">
        <el-card class="order-info-card">
          <template #header>
            <div class="card-header">
              <h3>订单信息</h3>
              <el-tag :type="getOrderStatusType(order.status)">
                {{ getOrderStatusName(order.status) }}
              </el-tag>
            </div>
          </template>
          
          <div class="order-base-info">
            <div class="info-item">
              <span class="label">订单编号：</span>
              <span class="value">{{ order.orderNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">下单时间：</span>
              <span class="value">{{ formatDateTime(order.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">支付方式：</span>
              <span class="value">{{ getPaymentMethodName(order.paymentMethod) }}</span>
            </div>
            <div class="info-item">
              <span class="label">支付时间：</span>
              <span class="value">{{ order.paymentTime ? formatDateTime(order.paymentTime) : '未支付' }}</span>
            </div>
          </div>
        </el-card>
        
        <el-card class="travel-info-card">
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
                <div class="duration">{{ calculateDuration(order.departureTime, order.arrivalTime) }}</div>
              </div>
              <div class="arrival">
                <div class="time">{{ order.arrivalTime }}</div>
                <div class="station">{{ order.arrivalStation }}</div>
              </div>
            </div>
          </div>
          
          <el-divider>乘客信息</el-divider>
          
          <div class="passenger-list">
            <div 
              v-for="(passenger, index) in order.passengers" 
              :key="index"
              class="passenger-item"
            >
              <div class="passenger-info">
                <div class="passenger-name">{{ passenger.name }}</div>
                <div class="passenger-id">{{ maskIdCard(passenger.idCard) }}</div>
                <div class="passenger-type">{{ getPassengerTypeName(passenger.passengerType) }}</div>
              </div>
              <div class="ticket-info">
                <div class="carriage">{{ passenger.carriageNumber }}车</div>
                <div class="seat">{{ passenger.seatNumber }}号</div>
                <div class="seat-type">{{ getSeatTypeName(passenger.seatType) }}</div>
              </div>
              <div class="ticket-status">
                <el-tag :type="getTicketStatusType(passenger.status)">
                  {{ getTicketStatusName(passenger.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
        
        <el-card class="payment-info-card">
          <template #header>
            <div class="card-header">
              <h3>支付信息</h3>
            </div>
          </template>
          
          <div class="payment-detail">
            <div class="payment-item">
              <span class="label">车票总价：</span>
              <span class="value">¥{{ order.ticketPrice.toFixed(2) }}</span>
            </div>
            <div class="payment-item" v-if="order.insurancePrice > 0">
              <span class="label">保险费用：</span>
              <span class="value">¥{{ order.insurancePrice.toFixed(2) }}</span>
            </div>
            <div class="payment-item" v-if="order.serviceFee > 0">
              <span class="label">服务费用：</span>
              <span class="value">¥{{ order.serviceFee.toFixed(2) }}</span>
            </div>
            <div class="payment-item total">
              <span class="label">应付金额：</span>
              <span class="value price">¥{{ order.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="payment-actions" v-if="order.status === 0">
            <el-button type="primary" @click="payOrder">立即支付</el-button>
          </div>
        </el-card>
        
        <el-card class="order-actions-card">
          <div class="action-buttons">
            <el-button 
              v-if="order.status === 0" 
              type="danger" 
              @click="cancelOrder"
            >
              取消订单
            </el-button>
            <el-button 
              v-if="order.status === 1 && !isExpired(order.travelDate)" 
              type="warning" 
              @click="changeTicket"
            >
              改签
            </el-button>
            <el-button 
              v-if="order.status === 1 && !isExpired(order.travelDate)" 
              type="info" 
              @click="refundTicket"
            >
              退票
            </el-button>
            <el-button 
              v-if="order.status === 1 && !isExpired(order.travelDate)" 
              type="success" 
              @click="printTicket"
            >
              打印车票
            </el-button>
            <el-button @click="goBack">返回列表</el-button>
          </div>
        </el-card>
      </template>
      
      <el-empty 
        v-else 
        description="订单信息不存在或已被删除" 
        :image-size="200"
      ></el-empty>
    </div>
    
    <!-- 打印车票对话框 -->
    <el-dialog
      v-model="printDialogVisible"
      title="打印车票"
      width="800px"
      class="print-dialog"
    >
      <div class="print-content">
        <div class="print-header">
          <div class="logo">铁路订票系统</div>
          <div class="title">电子客票</div>
        </div>
        
        <div class="ticket-header">
          <div class="train-info">
            <div class="train-number">{{ order?.trainNumber }}</div>
            <div class="travel-date">{{ formatDate(order?.travelDate) }}</div>
          </div>
          <div class="qr-code">
            <!-- 二维码占位 -->
            <div class="qr-code-placeholder"></div>
            <div class="qr-code-text">扫码验票</div>
          </div>
        </div>
        
        <div class="ticket-body">
          <div class="station-info">
            <div class="departure">
              <div class="station">{{ order?.departureStation }}</div>
              <div class="time">{{ order?.departureTime }}</div>
            </div>
            <div class="direction">
              <div class="arrow">→</div>
            </div>
            <div class="arrival">
              <div class="station">{{ order?.arrivalStation }}</div>
              <div class="time">{{ order?.arrivalTime }}</div>
            </div>
          </div>
          
          <div class="passenger-tickets">
            <div 
              v-for="(passenger, index) in order?.passengers" 
              :key="index"
              class="passenger-ticket"
            >
              <div class="passenger-info">
                <div class="passenger-name">{{ passenger.name }}</div>
                <div class="passenger-id">{{ maskIdCard(passenger.idCard) }}</div>
                <div class="passenger-type">{{ getPassengerTypeName(passenger.passengerType) }}</div>
              </div>
              <div class="seat-info">
                <div class="carriage">{{ passenger.carriageNumber }}车</div>
                <div class="seat">{{ passenger.seatNumber }}号</div>
                <div class="seat-type">{{ getSeatTypeName(passenger.seatType) }}</div>
              </div>
              <div class="ticket-price">
                ¥{{ (order?.ticketPrice / order?.passengers.length).toFixed(2) }}
              </div>
            </div>
          </div>
          
          <div class="ticket-footer">
            <div class="order-no">订单号: {{ order?.orderNo }}</div>
            <div class="print-time">打印时间: {{ formatDateTime(new Date()) }}</div>
            <div class="notice">请妥善保管车票，乘车时请携带有效身份证件</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="printDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="doPrintTicket">打印</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const printDialogVisible = ref(false);

// 获取路由参数中的订单ID
const orderId = computed(() => {
  return Number(route.params.id) || 0;
});

// 订单数据
const order = ref<any>(null);

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
        orderNo: 'ORD' + ('000000' + orderId.value).slice(-6),
        status: 1, // 已支付
        createTime: '2023-06-15 14:32:56',
        paymentTime: '2023-06-15 14:35:12',
        paymentMethod: 'alipay',
        trainNumber: 'G102',
        travelDate: '2023-06-20',
        departureStation: '北京南站',
        departureTime: '08:05',
        arrivalStation: '上海虹桥站',
        arrivalTime: '13:20',
        ticketPrice: 553.5,
        insurancePrice: 20,
        serviceFee: 10,
        totalPrice: 583.5,
        passengers: [
          {
            name: '张三',
            idCard: '110101199001011234',
            passengerType: 0, // 成人
            carriageNumber: '05',
            seatNumber: '05A',
            seatType: 2, // 一等座
            status: 0 // 未使用
          },
          {
            name: '李四',
            idCard: '110101199201021234',
            passengerType: 0, // 成人
            carriageNumber: '05',
            seatNumber: '05B',
            seatType: 2, // 一等座
            status: 0 // 未使用
          }
        ]
      };
      loading.value = false;
    }, 500);
  } catch (error) {
    console.error('获取订单详情失败:', error);
    ElMessage.error('获取订单详情失败，请重试');
    loading.value = false;
  }
};

// 返回订单列表
const goBack = () => {
  router.push('/user/orders');
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string | Date) => {
  if (!dateTimeStr) return '';
  
  const date = typeof dateTimeStr === 'string' ? new Date(dateTimeStr) : dateTimeStr;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

// 计算行程时长
const calculateDuration = (departureTime: string, arrivalTime: string) => {
  if (!departureTime || !arrivalTime) return '';
  
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
  
  let hoursDiff = arrHours - depHours;
  let minutesDiff = arrMinutes - depMinutes;
  
  if (minutesDiff < 0) {
    minutesDiff += 60;
    hoursDiff -= 1;
  }
  
  if (hoursDiff < 0) {
    hoursDiff += 24; // 跨天
  }
  
  return `${hoursDiff}h${minutesDiff.toString().padStart(2, '0')}m`;
};

// 获取订单状态类型
const getOrderStatusType = (status: number) => {
  const statusMap: Record<number, string> = {
    0: 'warning',  // 待支付
    1: 'success',  // 已支付
    2: 'info',     // 已取消
    3: 'success',  // 已完成
    4: 'info'      // 已退款
  };
  return statusMap[status] || 'info';
};

// 获取订单状态名称
const getOrderStatusName = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已完成',
    4: '已退款'
  };
  return statusMap[status] || '未知状态';
};

// 获取支付方式名称
const getPaymentMethodName = (method: string) => {
  const methodMap: Record<string, string> = {
    'alipay': '支付宝',
    'wechat': '微信支付',
    'unionpay': '银联支付',
    'balance': '余额支付'
  };
  return methodMap[method] || '未知方式';
};

// 获取乘客类型名称
const getPassengerTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '成人',
    1: '儿童',
    2: '学生',
    3: '老年人'
  };
  return typeMap[type] || '未知';
};

// 获取座位类型名称
const getSeatTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '商务座',
    2: '一等座',
    3: '二等座',
    4: '无座'
  };
  return typeMap[type] || '未知';
};

// 获取车票状态类型
const getTicketStatusType = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '',        // 未使用
    1: 'success', // 已使用
    2: 'info',    // 已退票
    3: 'warning'  // 已改签
  };
  return statusMap[status] || '';
};

// 获取车票状态名称
const getTicketStatusName = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '未使用',
    1: '已使用',
    2: '已退票',
    3: '已改签'
  };
  return statusMap[status] || '未知状态';
};

// 遮蔽身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 11) return idCard;
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
};

// 判断日期是否已过期
const isExpired = (dateStr: string) => {
  if (!dateStr) return true;
  const travelDate = new Date(dateStr);
  travelDate.setHours(23, 59, 59); // 设置为当天最后一秒
  return travelDate < new Date();
};

// 支付订单
const payOrder = () => {
  ElMessageBox.confirm('确定要支付该订单吗？', '支付确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟支付过程
    loading.value = true;
    setTimeout(() => {
      order.value.status = 1; // 更新为已支付
      order.value.paymentTime = formatDateTime(new Date());
      loading.value = false;
      ElMessage.success('订单支付成功');
    }, 1000);
  }).catch(() => {});
};

// 取消订单
const cancelOrder = () => {
  ElMessageBox.confirm('确定要取消该订单吗？取消后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true;
    // 模拟API调用
    setTimeout(() => {
      order.value.status = 2; // 已取消
      loading.value = false;
      ElMessage.success('订单已取消');
    }, 500);
  }).catch(() => {});
};

// 改签车票
const changeTicket = () => {
  router.push(`/user/order/change/${orderId.value}`);
};

// 退票
const refundTicket = () => {
  router.push(`/user/order/refund/${orderId.value}`);
};

// 打印车票
const printTicket = () => {
  printDialogVisible.value = true;
};

// 执行打印
const doPrintTicket = () => {
  // 在实际应用中，这里可以调用浏览器的打印功能
  // 也可以调用第三方打印库
  printDialogVisible.value = false;
  ElMessage.success('车票打印成功');
};

// 页面加载时获取订单详情
onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped>
.order-detail-container {
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

.order-detail-content > * {
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

.order-base-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
}

.label {
  color: #909399;
  width: 100px;
}

.value {
  color: #303133;
  font-weight: 500;
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

.departure, .arrival {
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
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.passenger-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.passenger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.passenger-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.passenger-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.passenger-id, .passenger-type {
  font-size: 14px;
  color: #909399;
}

.ticket-info {
  display: flex;
  gap: 10px;
  color: #606266;
}

.payment-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
}

.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.payment-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 打印样式 */
.print-dialog .el-dialog__body {
  padding: 20px;
}

.print-content {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
}

.print-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #dcdfe6;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #0052cc;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.qr-code {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code-placeholder {
  width: 100px;
  height: 100px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.qr-code-text {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.passenger-tickets {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.passenger-ticket {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.ticket-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #909399;
  font-size: 14px;
}

.notice {
  margin-top: 10px;
  color: #f56c6c;
}
</style> 