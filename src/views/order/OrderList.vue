<!--
 * @Description: create by southernMD
-->
<template>
  <div class="order-list-container">
    <!-- 搜索筛选卡片 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="订单号">
          <el-input v-model="filterForm.orderNo" placeholder="请输入订单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable></el-input>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px;">
            <el-option
              v-for="(text, value) in OrderStatusTextMap"
              :key="value"
              :label="text"
              :value="Number(value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchOrders">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表卡片 -->
    <el-card class="order-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="fetchOrders" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <!-- 订单表格 -->
      <el-table
        v-loading="loading"
        :data="filteredOrders"
        style="width: 100%"
        border
        stripe
        row-key="id"
      >
        <el-table-column prop="orderNo" label="订单号" min-width="120"></el-table-column>
        <el-table-column prop="user.username" label="用户名" min-width="100"></el-table-column>
        <el-table-column prop="user.email" label="邮箱" min-width="180"></el-table-column>
        <el-table-column prop="totalAmount" label="金额" min-width="80">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="OrderStatusTagTypeMap[row.status]" effect="light">
              {{ OrderStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentTime" label="支付时间" min-width="150">
          <template #default="{ row }">
            <span v-if="row.paymentTime">{{ formatDateTime(row.paymentTime) }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="150">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="150">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="showTicketDetails(row)"
              :disabled="!row.tickets || row.tickets.length === 0"
            >
              车票详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空数据显示 -->
      <el-empty v-if="filteredOrders.length === 0 && !loading" description="暂无订单数据"></el-empty>
    </el-card>

    <!-- 添加车票详情对话框 -->
    <el-dialog
      v-model="ticketDialogVisible"
      title="车票详情"
      width="80%"
      destroy-on-close
    >
      <el-tabs v-model="activeTicketTab">
        <el-tab-pane 
          v-for="(ticket, index) in currentOrderTickets" 
          :key="ticket.id"
          :label="`车票 ${index + 1}`"
          :name="String(index)"
        >
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车票编号" :span="2">{{ ticket.ticketNo }}</el-descriptions-item>
            <el-descriptions-item label="乘客姓名">{{ ticket.passenger?.realName }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ ticket.passenger?.idCard }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ ticket.passenger?.phone }}</el-descriptions-item>
            <el-descriptions-item label="乘客类型">
              {{ ticket.passenger?.passengerType === 1 ? '成人' : '儿童' }}
            </el-descriptions-item>
            <el-descriptions-item label="车次" :span="2">{{ ticket.train?.trainNumber }}</el-descriptions-item>
            <el-descriptions-item label="出发站">{{ ticket.departureStation?.stationName }}</el-descriptions-item>
            <el-descriptions-item label="到达站">{{ ticket.arrivalStation?.stationName }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ ticket.date }}</el-descriptions-item>
            <el-descriptions-item label="座位类型">
              {{ getSeatTypeName(ticket.seatType) }}
            </el-descriptions-item>
            <el-descriptions-item label="车厢号" v-if="ticket.carriage">{{ ticket.carriage?.carriageNumber }}</el-descriptions-item>
            <el-descriptions-item label="座位号" v-if="ticket.seat">{{ ticket.seat?.seatNumber }}</el-descriptions-item>
            <el-descriptions-item label="票价">¥{{ ticket.price?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="车票状态">
              <el-tag :type="getTicketStatusType(ticket.status)">
                {{ getTicketStatusText(ticket.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款金额" v-if="ticket.refundAmount">
              ¥{{ ticket.refundAmount?.toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="退款时间" v-if="ticket.refundTime">
              {{ formatDateTime(ticket.refundTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 列车运行信息 -->
          <div class="train-info-section">
            <h3>列车运行信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="车型">{{ ticket.train?.model?.modelName }}</el-descriptions-item>
              <el-descriptions-item label="车型编号">{{ ticket.train?.model?.modelCode }}</el-descriptions-item>
              <el-descriptions-item label="始发站">{{ ticket.train?.startStation?.stationName }}</el-descriptions-item>
              <el-descriptions-item label="终点站">{{ ticket.train?.endStation?.stationName }}</el-descriptions-item>
              <el-descriptions-item label="发车时间">{{ ticket.train?.departureTime }}</el-descriptions-item>
              <el-descriptions-item label="到达时间">{{ ticket.train?.arrivalTime }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 列车停靠站信息 -->
          <div class="stops-section" v-if="ticket.train?.trainStops && ticket.train.trainStops.length > 0">
            <h3>停靠站信息</h3>
            <el-table :data="ticket.train.trainStops" style="width: 100%" border>
              <el-table-column type="index" label="序号" width="60"></el-table-column>
              <el-table-column prop="station.stationName" label="站点名称"></el-table-column>
              <el-table-column prop="arrivalTime" label="到达时间"></el-table-column>
              <el-table-column prop="stopDuration" label="停留时间(分钟)"></el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { getOrders, Order, OrderStatus, OrderStatusTextMap, OrderStatusTagTypeMap } from '@/api/order';

// 订单列表数据
const orders = ref<Order[]>([]);
const loading = ref(false);

// 筛选表单数据
const filterForm = reactive({
  orderNo: '',
  username: '',
  status: null as number | null
});

// 根据筛选条件过滤订单
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    // 订单号筛选
    if (filterForm.orderNo && !order.orderNo.toLowerCase().includes(filterForm.orderNo.toLowerCase())) {
      return false;
    }
    // 用户名筛选
    if (filterForm.username && !order.user.username.toLowerCase().includes(filterForm.username.toLowerCase())) {
      return false;
    }
    // 状态筛选
    if (filterForm.status !== null && order.status !== filterForm.status) {
      return false;
    }
    return true;
  });
});

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true;
  try {
    orders.value = await getOrders();
  } catch (error) {
    console.error('获取订单列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.orderNo = '';
  filterForm.username = '';
  filterForm.status = null;
  fetchOrders();
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr) return '-';
  
  const date = new Date(dateTimeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

// 页面加载时获取订单列表
onMounted(() => {
  fetchOrders();
});

// 订单状态选项
const statusOptions = [
  { value: OrderStatus.PENDING_PAYMENT, label: OrderStatusTextMap[OrderStatus.PENDING_PAYMENT] },
  { value: OrderStatus.PAID, label: OrderStatusTextMap[OrderStatus.PAID] },
  { value: OrderStatus.CANCELLED, label: OrderStatusTextMap[OrderStatus.CANCELLED] },
  { value: OrderStatus.COMPLETED, label: OrderStatusTextMap[OrderStatus.COMPLETED] },
  { value: OrderStatus.REFUNDED, label: OrderStatusTextMap[OrderStatus.REFUNDED] }
];

// 车票详情对话框
const ticketDialogVisible = ref(false);
const currentOrderTickets = ref([]);
const activeTicketTab = ref('0');

// 显示车票详情
const showTicketDetails = (order) => {
  currentOrderTickets.value = order.tickets || [];
  activeTicketTab.value = '0';
  ticketDialogVisible.value = true;
};

// 座位类型名称映射
const seatTypeMap = {
  1: '商务座',
  2: '一等座',
  3: '二等座',
  4: '无座'
};

// 获取座位类型名称
const getSeatTypeName = (type) => {
  return seatTypeMap[type] || '未知';
};

// 车票状态映射
const ticketStatusMap = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已出票', type: 'success' },
  2: { text: '已退票', type: 'info' },
  3: { text: '改签处理中', type: 'primary' },
  4: { text: '改签待支付', type: 'warning' },
  5: { text: '已改签', type: 'success' }
};

// 获取车票状态文本
const getTicketStatusText = (status) => {
  return ticketStatusMap[status]?.text || '未知状态';
};

// 获取车票状态标签类型
const getTicketStatusType = (status) => {
  return ticketStatusMap[status]?.type || 'info';
};
</script>

<style scoped>
.order-list-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-weight: bold;
  color: #67c23a;
}

.no-data {
  color: #909399;
}

.train-info-section, .stops-section {
  margin-top: 20px;
}

.train-info-section h3, .stops-section h3 {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}
</style> 