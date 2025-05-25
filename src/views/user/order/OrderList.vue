<template>
  <div class="order-list">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="全部订单" name="all"></el-tab-pane>
      <el-tab-pane label="未出行" name="pending"></el-tab-pane>
      <el-tab-pane label="已完成" name="completed"></el-tab-pane>
      <el-tab-pane label="已取消" name="cancelled"></el-tab-pane>
    </el-tabs>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="订单号">
          <el-input 
            v-model="filterForm.orderNo" 
            placeholder="请输入订单号" 
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="车次">
          <el-input 
            v-model="filterForm.trainNumber" 
            placeholder="请输入车次" 
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="乘车日期">
          <el-date-picker
            v-model="filterForm.travelDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <div class="order-list-container" v-loading="loading">
      <template v-if="filteredOrders.length > 0">
        <el-card 
          v-for="order in filteredOrders" 
          :key="order.id" 
          class="order-card"
          :class="{ 'order-completed': order.status === 1, 'order-cancelled': order.status === 2 }"
        >
          <div class="order-header">
            <div class="order-info">
              <div class="order-number">订单号: {{ order.orderNo }}</div>
              <div class="order-date">下单时间: {{ formatDateTime(order.createTime) }}</div>
            </div>
            <div class="order-status">
              <el-tag :type="getOrderStatusType(order.status)">
                {{ getOrderStatusName(order.status) }}
              </el-tag>
            </div>
          </div>
          
          <el-divider></el-divider>
          
          <div class="ticket-info">
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
            
            <div class="passenger-info">
              <div v-for="(passenger, index) in order.passengers" :key="index" class="passenger">
                <div class="passenger-name">{{ passenger.name }}</div>
                <div class="passenger-id">{{ maskIdCard(passenger.idCard) }}</div>
                <div class="seat-info">
                  {{ passenger.carriageNumber }}车{{ passenger.seatNumber }} 
                  <span class="seat-type">({{ getSeatTypeName(passenger.seatType) }})</span>
                </div>
              </div>
            </div>
            
            <div class="price-info">
              <div class="price-label">总价</div>
              <div class="price-value">¥{{ order.totalPrice.toFixed(2) }}</div>
            </div>
          </div>
          
          <div class="order-actions">
            <template v-if="order.status === 0">
              <el-button 
                type="primary" 
                size="small" 
                @click="showOrderDetail(order.id)"
              >
                详情
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="cancelOrder(order.id)"
              >
                取消订单
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="changeTicket(order.id)"
              >
                改签
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="refundTicket(order.id)"
              >
                退票
              </el-button>
            </template>
            <template v-else>
              <el-button 
                type="primary" 
                size="small" 
                @click="showOrderDetail(order.id)"
              >
                详情
              </el-button>
            </template>
          </div>
        </el-card>
      </template>
      
      <el-empty 
        v-else 
        description="暂无订单记录" 
        :image-size="200"
      ></el-empty>
    </div>
    
    <div class="pagination-container" v-if="filteredOrders.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalOrders"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const router = useRouter();
const loading = ref(false);
const activeTab = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const totalOrders = ref(0);

// 筛选表单
const filterForm = reactive({
  orderNo: '',
  trainNumber: '',
  travelDate: null as null | [Date, Date]
});

// 模拟订单数据
const orders = ref([
  {
    id: 1,
    orderNo: 'O20250525001',
    createTime: '2025-05-24 10:15:30',
    trainNumber: 'G101',
    travelDate: '2025-05-25',
    departureStation: '北京南站',
    departureTime: '08:00',
    arrivalStation: '上海虹桥站',
    arrivalTime: '13:00',
    totalPrice: 900,
    status: 0, // 0-待出行, 1-已完成, 2-已取消
    passengers: [
      {
        name: '张三',
        idCard: '110101199001011234',
        seatType: 1, // 0-商务座, 1-一等座, 2-二等座, 3-无座
        carriageNumber: '3',
        seatNumber: '05A'
      }
    ]
  },
  {
    id: 2,
    orderNo: 'O20250522001',
    createTime: '2025-05-21 15:30:00',
    trainNumber: 'G103',
    travelDate: '2025-05-22',
    departureStation: '北京南站',
    departureTime: '10:30',
    arrivalStation: '杭州东站',
    arrivalTime: '16:45',
    totalPrice: 1520,
    status: 1,
    passengers: [
      {
        name: '张三',
        idCard: '110101199001011234',
        seatType: 0,
        carriageNumber: '1',
        seatNumber: '02C'
      },
      {
        name: '李四',
        idCard: '110101199201021234',
        seatType: 0,
        carriageNumber: '1',
        seatNumber: '02D'
      }
    ]
  },
  {
    id: 3,
    orderNo: 'O20250520001',
    createTime: '2025-05-19 09:45:00',
    trainNumber: 'D31',
    travelDate: '2025-05-20',
    departureStation: '北京南站',
    departureTime: '13:45',
    arrivalStation: '南京南站',
    arrivalTime: '18:30',
    totalPrice: 460,
    status: 2,
    passengers: [
      {
        name: '张三',
        idCard: '110101199001011234',
        seatType: 2,
        carriageNumber: '8',
        seatNumber: '12F'
      }
    ]
  },
  {
    id: 4,
    orderNo: 'O20250526001',
    createTime: '2025-05-25 16:20:00',
    trainNumber: 'G105',
    travelDate: '2025-05-26',
    departureStation: '北京南站',
    departureTime: '16:20',
    arrivalStation: '上海虹桥站',
    arrivalTime: '21:20',
    totalPrice: 530,
    status: 0,
    passengers: [
      {
        name: '张三',
        idCard: '110101199001011234',
        seatType: 2,
        carriageNumber: '10',
        seatNumber: '05A'
      }
    ]
  }
]);

// 根据当前标签和筛选条件过滤订单
const filteredOrders = computed(() => {
  let result = [...orders.value];
  
  // 根据标签筛选
  if (activeTab.value !== 'all') {
    const statusMap = {
      pending: 0,
      completed: 1,
      cancelled: 2
    };
    result = result.filter(order => order.status === statusMap[activeTab.value as keyof typeof statusMap]);
  }
  
  // 根据订单号筛选
  if (filterForm.orderNo) {
    result = result.filter(order => order.orderNo.includes(filterForm.orderNo));
  }
  
  // 根据车次筛选
  if (filterForm.trainNumber) {
    result = result.filter(order => order.trainNumber.includes(filterForm.trainNumber));
  }
  
  // 根据乘车日期筛选
  if (filterForm.travelDate && filterForm.travelDate.length === 2) {
    const startDate = dayjs(filterForm.travelDate[0]).format('YYYY-MM-DD');
    const endDate = dayjs(filterForm.travelDate[1]).format('YYYY-MM-DD');
    result = result.filter(order => {
      const travelDate = order.travelDate;
      return travelDate >= startDate && travelDate <= endDate;
    });
  }
  
  // 更新总订单数
  totalOrders.value = result.length;
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return result.slice(start, end);
});

// 获取订单状态名称
const getOrderStatusName = (status: number) => {
  const statusMap = {
    0: '待出行',
    1: '已完成',
    2: '已取消'
  };
  return statusMap[status as keyof typeof statusMap] || '未知';
};

// 获取订单状态标签类型
const getOrderStatusType = (status: number) => {
  const typeMap = {
    0: 'primary',
    1: 'success',
    2: 'info'
  };
  return typeMap[status as keyof typeof typeMap] || 'info';
};

// 获取座位类型名称
const getSeatTypeName = (type: number) => {
  const typeMap = {
    0: '商务座',
    1: '一等座',
    2: '二等座',
    3: '无座'
  };
  return typeMap[type as keyof typeof typeMap] || '未知';
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  return dateTimeStr;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY年MM月DD日');
};

// 计算行程时间
const calculateDuration = (departureTime: string, arrivalTime: string) => {
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

// 遮蔽身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 11) return idCard;
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
};

// 处理标签切换
const handleTabChange = () => {
  // 重置分页
  currentPage.value = 1;
};

// 搜索订单
const searchOrders = () => {
  // 重置分页
  currentPage.value = 1;
  
  // 模拟加载过程
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.orderNo = '';
  filterForm.trainNumber = '';
  filterForm.travelDate = null;
  
  // 刷新数据
  searchOrders();
};

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 查看订单详情
const showOrderDetail = (orderId: number) => {
  router.push(`/user/order/detail/${orderId}`);
};

// 取消订单
const cancelOrder = (orderId: number) => {
  ElMessageBox.confirm('确定要取消该订单吗？取消后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    loading.value = true;
    setTimeout(() => {
      // 更新本地数据
      const order = orders.value.find(o => o.id === orderId);
      if (order) {
        order.status = 2; // 已取消
      }
      
      loading.value = false;
      ElMessage.success('订单已取消');
    }, 500);
  }).catch(() => {});
};

// 改签车票
const changeTicket = (orderId: number) => {
  router.push(`/user/order/change/${orderId}`);
};

// 退票
const refundTicket = (orderId: number) => {
  router.push(`/user/order/refund/${orderId}`);
};

// 获取订单数据
onMounted(() => {
  // 模拟API调用
  loading.value = true;
  setTimeout(() => {
    // 实际应用中会调用API获取订单数据
    loading.value = false;
  }, 500);
});
</script>

<style scoped>
.order-list {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.order-list-container {
  margin-bottom: 20px;
}

.order-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-completed {
  border-left: 4px solid #67c23a;
}

.order-cancelled {
  border-left: 4px solid #909399;
  opacity: 0.8;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.order-date {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.ticket-info {
  display: flex;
  margin-top: 10px;
}

.train-info {
  flex: 3;
}

.train-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.train-number {
  font-size: 16px;
  font-weight: bold;
  color: #0052cc;
  margin-right: 10px;
}

.train-date {
  font-size: 14px;
  color: #606266;
}

.station-info {
  display: flex;
  align-items: center;
}

.departure, .arrival {
  flex: 1;
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
  content: '';
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

.passenger-info {
  flex: 2;
  padding: 0 20px;
  border-left: 1px dashed #dcdfe6;
  border-right: 1px dashed #dcdfe6;
}

.passenger {
  margin-bottom: 15px;
}

.passenger:last-child {
  margin-bottom: 0;
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
  justify-content: center;
  align-items: center;
  padding-left: 20px;
}

.price-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.price-value {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.order-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style> 