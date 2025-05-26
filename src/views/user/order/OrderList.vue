<template>
  <div class="order-list">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="全部订单" name="all"></el-tab-pane>
      <el-tab-pane label="待支付" name="pending"></el-tab-pane>
      <el-tab-pane label="已出票" name="issued"></el-tab-pane>
      <el-tab-pane label="已退票" name="refunded"></el-tab-pane>
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
            value-format="YYYY-MM-DD"
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
          :class="{ 'order-completed': getOrderStatus(order) === 1, 'order-cancelled': getOrderStatus(order) === 2 }"
        >
          <div class="order-header">
            <div class="order-info">
              <div class="order-number">订单号: {{ order.orderNo }}</div>
              <div class="order-date">下单时间: {{ formatDateTime(order.createTime) }}</div>
            </div>
            <div class="order-status" v-if="order.tickets && order.tickets.length === 1">
              <el-tag :type="getTicketStatusType(order.tickets[0].status)">
                {{ getTicketStatusName(order.tickets[0].status) }}
              </el-tag>
            </div>
          </div>
          
          <el-divider></el-divider>
          
          <div v-for="(ticket, index) in order.tickets" :key="ticket.id" class="ticket-container">
            <div class="ticket-header" v-if="order.tickets.length > 1">
              <span class="ticket-number">车票 {{ index + 1 }}</span>
              <el-tag size="small" :type="getTicketStatusType(ticket.status)">
                {{ getTicketStatusName(ticket.status) }}
              </el-tag>
            </div>
            
            <div class="ticket-info">
              <div class="train-info">
                <div class="train-header">
                  <div class="train-number">{{ ticket.train?.trainNumber || '未知车次' }}</div>
                  <div class="train-date">{{ formatDate(ticket.date) }}</div>
                </div>
                <div class="station-info">
                  <div class="departure">
                    <div class="time">{{ getActualDepartureTime(ticket) }}</div>
                    <div class="station">{{ ticket.departureStation?.stationName || '未知站点' }}</div>
                  </div>
                  <div class="journey">
                    <div class="arrow-line"></div>
                    <div class="duration">{{ calculateDuration(
                      getActualDepartureTime(ticket), 
                      getActualArrivalTime(ticket)
                    ) }}</div>
                  </div>
                  <div class="arrival">
                    <div class="time">{{ getActualArrivalTime(ticket) }}</div>
                    <div class="station">{{ ticket.arrivalStation?.stationName || '未知站点' }}</div>
                  </div>
                </div>
              </div>
              
              <div class="passenger-info">
                <div class="passenger">
                  <div class="passenger-name">{{ ticket.passenger?.realName || '未知乘客' }}</div>
                  <div class="passenger-id">{{ maskIdCard(ticket.passenger?.idCard) }}</div>
                  <div class="seat-info">
                    <template v-if="ticket.seatType === 4">
                      无座
                    </template>
                    <template v-else>
                      {{ ticket.carriage?.carriageNumber || '未知' }}车{{ ticket.seat?.seatNumber || '未知' }} 
                      <span class="seat-type">({{ getSeatTypeName(ticket.seatType) }})</span>
                    </template>
                  </div>
                </div>
              </div>
              
              <div class="price-info">
                <div class="price-label">票价</div>
                <div class="price-value">¥{{ ticket.price?.toFixed(2) || '0.00' }}</div>
              </div>
            </div>
            
            <el-divider v-if="index < order.tickets.length - 1"></el-divider>
          </div>
          
          <div class="order-total">
            <span>总价: </span>
            <span class="total-price">¥{{ order.totalAmount?.toFixed(2) || '0.00' }}</span>
          </div>
          
          <div class="order-actions">
            <!-- 单张车票时直接显示所有操作 -->
            <template v-if="order.tickets && order.tickets.length === 1">
              <template v-if="order.tickets[0].status === 0">
                <!-- 待支付：取消 支付 -->
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="cancelOrder(order.id)"
                >
                  取消
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="payOrder(order.id)"
                >
                  支付
                </el-button>
              </template>
              
              <template v-if="order.tickets[0].status === 1">
                <!-- 已出票：改签 退票 -->
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
              
              <!-- 已退票(2)：无按钮 -->
              
              <!-- 改签处理中(3)：无按钮 -->
              
              <template v-if="order.tickets[0].status === 4">
                <!-- 改签待支付：支付 取消 -->
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="payOrder(order.id)"
                >
                  支付
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="cancelOrder(order.id)"
                >
                  取消
                </el-button>
              </template>
              
              <template v-if="order.tickets[0].status === 5">
                <!-- 已改签：退票 -->
                <el-button 
                  type="info" 
                  size="small" 
                  @click="refundTicket(order.id)"
                >
                  退票
                </el-button>
              </template>
            </template>
            
            <!-- 多张车票时显示操作和全部支付按钮 -->
            <template v-else>
              <!-- 如果有待支付车票，显示全部支付按钮 -->
              <el-button 
                v-if="hasAnyPendingTickets(order)"
                type="success" 
                size="small" 
                @click="payAllTicketsForOrder(order)"
                :loading="order.id === payingOrderId"
              >
                全部支付
              </el-button>
              
              <el-button 
                type="primary" 
                size="small" 
                @click="showTicketOperations(order)"
              >
                操作
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
    
    <!-- 添加多票操作对话框 -->
    <el-dialog
      v-model="ticketOperationsVisible"
      title="车票操作"
      width="600px"
    >
      <div v-if="selectedOrder" class="ticket-operations-container">
        <div v-for="(ticket, index) in selectedOrder.tickets" :key="ticket.id" class="ticket-operation-item">
          <div class="ticket-info-summary">
            <span class="ticket-number">车票 {{ index + 1 }}</span>
            <span class="ticket-train">{{ ticket.train?.trainNumber || '未知车次' }}</span>
            <span class="ticket-passenger">{{ ticket.passenger?.realName || '未知乘客' }}</span>
            <el-tag size="small" :type="getTicketStatusType(ticket.status)">
              {{ getTicketStatusName(ticket.status) }}
            </el-tag>
          </div>
          <div class="ticket-operations">
            <template v-if="ticket.status === 0">
              <!-- 待支付：取消 支付 -->
              <el-button 
                type="danger" 
                size="small" 
                @click="cancelTicket(ticket.id)"
              >
                取消
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="payTicket(ticket.id)"
              >
                支付
              </el-button>
            </template>
            
            <template v-if="ticket.status === 1">
              <!-- 已出票：改签 退票 -->
              <el-button 
                type="warning" 
                size="small" 
                @click="changeTicketSingle(ticket.id)"
              >
                改签
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="refundTicketSingle(ticket.id)"
              >
                退票
              </el-button>
            </template>
            
            <!-- 已退票(2)：无按钮 -->
            
            <!-- 改签处理中(3)：无按钮 -->
            
            <template v-if="ticket.status === 4">
              <!-- 改签待支付：支付 取消 -->
              <el-button 
                type="warning" 
                size="small" 
                @click="payTicket(ticket.id)"
              >
                支付
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="cancelTicket(ticket.id)"
              >
                取消
              </el-button>
            </template>
            
            <template v-if="ticket.status === 5">
              <!-- 已改签：退票 -->
              <el-button 
                type="info" 
                size="small" 
                @click="refundTicketSingle(ticket.id)"
              >
                退票
              </el-button>
            </template>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ticketOperationsVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { getUserOrders } from '@/api/order';
import { updateTicketStatus } from '@/api/tickets'

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
  travelDate: null as null | [string, string]
});

// 订单数据
const orders = ref([]);

// 添加辅助函数以检查票状态
// 检查订单的所有车票是否都有指定状态
const allTicketsHaveStatus = (order, status) => {
  if (!order.tickets || order.tickets.length === 0) return false;
  return order.tickets.every(ticket => ticket.status === status);
};

// 检查订单是否有任何车票具有指定状态
const hasTicketsWithStatus = (order, status) => {
  if (!order.tickets || order.tickets.length === 0) return false;
  return order.tickets.some(ticket => ticket.status === status);
};

// 根据当前标签和筛选条件过滤订单
const filteredOrders = computed(() => {
  let result = [...orders.value];
  
  // 根据标签筛选
  if (activeTab.value !== 'all') {
    const statusMap = {
      pending: 0,  // 待支付
      issued: 1,   // 已出票
      refunded: 2  // 已退票
    };
    
    // 筛选符合状态的订单
    const statusValue = statusMap[activeTab.value as keyof typeof statusMap];
    result = result.filter(order => {
      if (activeTab.value === 'pending') {
        // 如果任何票是待支付状态，订单显示在待支付标签
        return hasTicketsWithStatus(order, 0);
      } else if (activeTab.value === 'refunded') {
        // 只有当所有票都是已退票状态，订单才显示在已退票标签
        return allTicketsHaveStatus(order, 2);
      } else if (activeTab.value === 'issued') {
        // 没有待支付票，且不是全部退票的订单显示在已出票标签
        return !hasTicketsWithStatus(order, 0) && !allTicketsHaveStatus(order, 2);
      }
      return false;
    });
  }
  
  // 根据订单号筛选
  if (filterForm.orderNo) {
    result = result.filter(order => order.orderNo.includes(filterForm.orderNo));
  }
  
  // 根据车次筛选
  if (filterForm.trainNumber) {
    result = result.filter(order => {
      // 检查订单中是否有车票匹配车次号
      return order.tickets.some(ticket => 
        ticket.train?.trainNumber?.includes(filterForm.trainNumber)
      );
    });
  }
  
  // 根据乘车日期筛选
  if (filterForm.travelDate && filterForm.travelDate.length === 2) {
    const startDate = filterForm.travelDate[0];
    const endDate = filterForm.travelDate[1];
    
    result = result.filter(order => {
      // 检查订单中是否有车票匹配日期范围
      return order.tickets.some(ticket => {
        const ticketDate = ticket.date;
        return ticketDate >= startDate && ticketDate <= endDate;
      });
    });
  }
  
  // 更新总订单数
  totalOrders.value = result.length;
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return result.slice(start, end);
});

// 获取订单状态 - 基于车票状态
const getOrderStatus = (order) => {
  if (!order.tickets || order.tickets.length === 0) return 0;
  
  // 检查所有车票状态
  const allTicketsStatus = order.tickets.map(ticket => ticket.status);
  
  // 如果有任何待支付车票，订单为待支付
  if (allTicketsStatus.includes(0)) return 0;
  
  // 如果所有车票都已退票，订单为已退票
  if (allTicketsStatus.every(status => status === 2)) return 2;
  
  // 其他情况，订单为已出票
  return 1;
};

// 获取订单状态名称
const getOrderStatusName = (order) => {
  const status = getOrderStatus(order);
  const statusMap = {
    0: '待支付',
    1: '已出票',
    2: '已退票'
  };
  return statusMap[status] || '未知';
};

// 获取订单状态标签类型
const getOrderStatusType = (order) => {
  const status = getOrderStatus(order);
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info'
  };
  return typeMap[status] || 'info';
};

// 获取车票状态名称
const getTicketStatusName = (status) => {
  const statusMap = {
    0: '待支付',
    1: '已出票',
    2: '已退票',
    3: '改签处理中',
    4: '改签待支付',
    5: '已改签'
  };
  return statusMap[status] || '未知';
};

// 获取车票状态标签类型
const getTicketStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'primary',
    4: 'warning',
    5: 'success'
  };
  return typeMap[status] || 'info';
};

// 获取座位类型名称
const getSeatTypeName = (type) => {
  const typeMap = {
    1: '商务座',
    2: '一等座',
    3: '二等座',
    4: '无座'
  };
  return typeMap[type] || '未知';
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '未知时间';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知日期';
  return dayjs(dateStr).format('YYYY年MM月DD日');
};

// 计算行程时间
const calculateDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return '未知';
  
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
const maskIdCard = (idCard) => {
  if (!idCard || idCard.length < 11) return idCard || '未知';
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
  
  // 执行加载
  fetchOrders();
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
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
};

// 获取订单数据
const fetchOrders = async () => {
  loading.value = true;
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 调用API获取用户订单
    const response = await getUserOrders(userId);
    orders.value = response;
  } catch (error) {
    console.error('获取订单失败:', error);
    ElMessage.error('获取订单数据失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 改签车票 - 对于单票订单
const changeTicket = (orderId) => {
  try {
    // 查找对应订单
    const targetOrder = orders.value.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.tickets || targetOrder.tickets.length !== 1) {
      ElMessage.error('未找到有效订单信息');
      return;
    }
    
    const ticket = targetOrder.tickets[0];
    
    // 只有状态为已出票(1)或已改签(5)的票才能改签
    if (ticket.status !== 1 && ticket.status !== 5) {
      ElMessage.warning('只有已出票或已改签的车票可以进行改签');
      return;
    }
    
    // 跳转到改签页面，传递车票ID
    router.push(`/user/ticket/change/${ticket.id}`);
  } catch (error) {
    console.error('改签操作失败:', error);
    ElMessage.error('改签操作失败，请重试');
  }
};

// 获取实际出发时间
const getActualDepartureTime = (ticket) => {
  if (!ticket || !ticket.train) return '00:00';
  
  // 检查出发站是否是列车的起始站
  if (ticket.departureStation && ticket.train.startStation && 
      ticket.departureStation.id === ticket.train.startStation.id) {
    // 如果是起始站，使用列车的departureTime
    return ticket.train.departureTime || '00:00';
  }
  
  // 否则从trainStops中查找对应站点的时间
  if (ticket.train.trainStops && Array.isArray(ticket.train.trainStops)) {
    const departureStop = ticket.train.trainStops.find(
      stop => stop.station && stop.station.id === ticket.departureStation.id
    );
    
    if (departureStop && departureStop.arrivalTime) {
      return departureStop.arrivalTime;
    }
  }
  
  // 如果没有找到对应信息，返回默认值
  return ticket.train.departureTime || '00:00';
};

// 获取实际到达时间
const getActualArrivalTime = (ticket) => {
  if (!ticket || !ticket.train) return '00:00';
  
  // 检查到达站是否是列车的终点站
  if (ticket.arrivalStation && ticket.train.endStation && 
      ticket.arrivalStation.id === ticket.train.endStation.id) {
    // 如果是终点站，使用列车的arrivalTime
    return ticket.train.arrivalTime || '00:00';
  }
  
  // 否则从trainStops中查找对应站点的时间
  if (ticket.train.trainStops && Array.isArray(ticket.train.trainStops)) {
    const arrivalStop = ticket.train.trainStops.find(
      stop => stop.station && stop.station.id === ticket.arrivalStation.id
    );
    
    if (arrivalStop && arrivalStop.arrivalTime) {
      return arrivalStop.arrivalTime;
    }
  }
  
  // 如果没有找到对应信息，返回默认值
  return ticket.train.arrivalTime || '00:00';
};

// 添加到script setup部分
const ticketOperationsVisible = ref(false);
const selectedOrder = ref(null);

// 显示车票操作对话框
const showTicketOperations = (order) => {
  selectedOrder.value = order;
  ticketOperationsVisible.value = true;
};

// 改签单个车票 - 对于多票订单中的单张车票
const changeTicketSingle = (ticketId) => {
  try {
    // 查找对应车票
    const targetOrder = selectedOrder.value;
    const targetTicket = targetOrder.tickets.find(t => t.id === ticketId);
    
    if (!targetTicket) {
      ElMessage.error('未找到车票信息');
      return;
    }
    
    // 只有状态为已出票(1)或已改签(5)的票才能改签
    if (targetTicket.status !== 1 && targetTicket.status !== 5) {
      ElMessage.warning('只有已出票或已改签的车票可以进行改签');
      return;
    }
    
    // 关闭操作对话框
    ticketOperationsVisible.value = false;
    
    // 跳转到改签页面
    router.push(`/user/ticket/change/${ticketId}`);
  } catch (error) {
    console.error('改签操作失败:', error);
    ElMessage.error('改签操作失败，请重试');
  }
};

const refundTicketSingle = async (ticketId) => {
  try {
    // 获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 获取订单ID和车票
    const targetOrder = selectedOrder.value;
    const targetTicket = targetOrder.tickets.find(t => t.id === ticketId);
    
    if (!targetTicket) {
      ElMessage.error('未找到车票信息');
      return;
    }
    
    // 确认退票操作
    await ElMessageBox.confirm('确定要退票吗？退票后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 直接更新车票状态为已退票
    await updateTicketStatus({
      id: ticketId,
      status: 2, // 已退票
      orderId: targetOrder.id,
      userId: userId
    });
    
    ElMessage.success('退票成功');
    ticketOperationsVisible.value = false;
    
    // 刷新数据
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退票失败:', error);
      ElMessage.error('退票失败，请重试');
    }
  }
};

const cancelOrder = async (orderId) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 查找对应订单
    const targetOrder = orders.value.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.tickets || targetOrder.tickets.length !== 1) {
      ElMessage.error('未找到有效订单信息');
      return;
    }
    
    const ticket = targetOrder.tickets[0];
    
    // 根据车票状态决定取消后的状态
    let newStatus;
    if (ticket.status === 0) { // 待支付
      newStatus = 2; // 已退票
    } else if (ticket.status === 4) { // 改签待支付
      newStatus = 1; // 已出票
    } else {
      ElMessage.error('当前状态不支持取消操作');
      return;
    }
    
    // 确认取消操作
    await ElMessageBox.confirm('确定要取消该订单吗？取消后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 调用API更新车票状态
    await updateTicketStatus({
      id: ticket.id,
      status: newStatus,
      orderId: orderId,
      userId: userId
    });
    
    ElMessage.success('订单已取消');
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error);
      ElMessage.error('取消订单失败，请重试');
    }
  }
};

const payOrder = async (orderId) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 查找对应订单
    const targetOrder = orders.value.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.tickets || targetOrder.tickets.length !== 1) {
      ElMessage.error('未找到有效订单信息');
      return;
    }
    
    const ticket = targetOrder.tickets[0];
    
    // 根据车票状态决定支付后的状态
    let newStatus;
    if (ticket.status === 0) { // 待支付
      newStatus = 1; // 已出票
    } else if (ticket.status === 4) { // 改签待支付
      newStatus = 5; // 已改签
    } else {
      ElMessage.error('当前状态不支持支付操作');
      return;
    }
    
    // 调用API更新车票状态
    await updateTicketStatus({
      id: ticket.id,
      status: newStatus,
      orderId: orderId,
      userId: userId
    });
    
    ElMessage.success('支付成功');
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    console.error('支付失败:', error);
    ElMessage.error('支付失败，请重试');
  }
};

const refundTicket = async (orderId) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 查找对应订单
    const targetOrder = orders.value.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.tickets || targetOrder.tickets.length !== 1) {
      ElMessage.error('未找到有效订单信息');
      return;
    }
    
    const ticket = targetOrder.tickets[0];
    
    // 确认退票操作
    await ElMessageBox.confirm('确定要退票吗？退票后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 调用API更新车票状态
    await updateTicketStatus({
      id: ticket.id,
      status: 2, // 已退票
      orderId: orderId,
      userId: userId
    });
    
    ElMessage.success('退票成功');
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退票失败:', error);
      ElMessage.error('退票失败，请重试');
    }
  }
};

// 单个车票操作方法 - 弹窗中使用
const cancelTicket = async (ticketId) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 查找对应的ticket和order
    const targetOrder = selectedOrder.value;
    const targetTicket = targetOrder.tickets.find(t => t.id === ticketId);
    
    if (!targetTicket) {
      ElMessage.error('未找到车票信息');
      return;
    }
    
    // 根据当前状态决定取消后的状态
    let newStatus;
    if (targetTicket.status === 0) { // 待支付
      newStatus = 2; // 已退票
    } else if (targetTicket.status === 4) { // 改签待支付
      newStatus = 1; // 已出票
    } else {
      ElMessage.error('当前状态不支持取消操作');
      return;
    }
    
    // 调用API更新车票状态
    await updateTicketStatus({
      id: ticketId,
      status: newStatus,
      orderId: targetOrder.id,
      userId: userId
    });
    
    ElMessage.success('车票已取消');
    ticketOperationsVisible.value = false;
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    console.error('取消车票失败:', error);
    ElMessage.error('取消车票失败，请重试');
  }
};

const payTicket = async (ticketId) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 查找对应的ticket和order
    const targetOrder = selectedOrder.value;
    const targetTicket = targetOrder.tickets.find(t => t.id === ticketId);
    
    if (!targetTicket) {
      ElMessage.error('未找到车票信息');
      return;
    }
    
    // 根据当前状态决定支付后的状态
    let newStatus;
    if (targetTicket.status === 0) { // 待支付
      newStatus = 1; // 已出票
    } else if (targetTicket.status === 4) { // 改签待支付
      newStatus = 5; // 已改签
    } else {
      ElMessage.error('当前状态不支持支付操作');
      return;
    }
    
    // 调用API更新车票状态
    await updateTicketStatus({
      id: ticketId,
      status: newStatus,
      orderId: targetOrder.id,
      userId: userId
    });
    
    ElMessage.success('支付成功');
    ticketOperationsVisible.value = false;
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    console.error('支付失败:', error);
    ElMessage.error('支付失败，请重试');
  }
};

// 页面加载时获取订单数据
onMounted(() => {
  fetchOrders();
});

// 添加到script setup部分
const batchLoading = ref(false);

// 计算属性：判断当前订单是否有待支付票
const hasPendingTickets = computed(() => {
  if (!selectedOrder.value || !selectedOrder.value.tickets) return false;
  return selectedOrder.value.tickets.some(ticket => 
    ticket.status === 0 || ticket.status === 4
  );
});

// 全部支付方法
const payAllTickets = async () => {
  try {
    batchLoading.value = true;
    
    // 获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 确认支付操作
    await ElMessageBox.confirm('确定要支付所有待支付车票吗？', '批量支付', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    });
    
    // 筛选出待支付和改签待支付的票
    const pendingTickets = selectedOrder.value.tickets.filter(ticket => 
      ticket.status === 0 || ticket.status === 4
    );
    
    if (pendingTickets.length === 0) {
      ElMessage.info('没有待支付的车票');
      return;
    }
    
    // 构建支付请求
    const paymentPromises = pendingTickets.map(ticket => {
      // 根据当前状态决定支付后的状态
      const newStatus = ticket.status === 0 ? 1 : 5; // 0->1(待支付->已出票), 4->5(改签待支付->已改签)
      
      // 调用API更新车票状态
      return updateTicketStatus({
        id: ticket.id,
        status: newStatus,
        orderId: selectedOrder.value.id,
        userId: userId
      });
    });
    
    // 使用Promise.all并行处理所有支付请求
    await Promise.all(paymentPromises);
    
    ElMessage.success(`成功支付 ${pendingTickets.length} 张车票`);
    ticketOperationsVisible.value = false;
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量支付失败:', error);
      ElMessage.error('批量支付失败，请重试');
    }
  } finally {
    batchLoading.value = false;
  }
};

// 添加到script setup部分
const payingOrderId = ref(null); // 记录当前正在支付的订单ID

// 判断订单是否有待支付车票
const hasAnyPendingTickets = (order) => {
  if (!order || !order.tickets) return false;
  return order.tickets.some(ticket => 
    ticket.status === 0 || ticket.status === 4
  );
};

// 全部支付订单中的车票
const payAllTicketsForOrder = async (order) => {
  try {
    payingOrderId.value = order.id;
    
    // 获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId;
    
    if (!userId) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 确认支付操作
    await ElMessageBox.confirm('确定要支付所有待支付车票吗？', '批量支付', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    });
    
    // 筛选出待支付和改签待支付的票
    const pendingTickets = order.tickets.filter(ticket => 
      ticket.status === 0 || ticket.status === 4
    );
    
    if (pendingTickets.length === 0) {
      ElMessage.info('没有待支付的车票');
      return;
    }
    
    // 构建支付请求
    const paymentPromises = pendingTickets.map(ticket => {
      // 根据当前状态决定支付后的状态
      const newStatus = ticket.status === 0 ? 1 : 5; // 0->1(待支付->已出票), 4->5(改签待支付->已改签)
      
      // 调用API更新车票状态
      return updateTicketStatus({
        id: ticket.id,
        status: newStatus,
        orderId: order.id,
        userId: userId
      });
    });
    
    // 使用Promise.all并行处理所有支付请求
    await Promise.all(paymentPromises);
    
    ElMessage.success(`成功支付 ${pendingTickets.length} 张车票`);
    
    // 刷新订单数据
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量支付失败:', error);
      ElMessage.error('批量支付失败，请重试');
    }
  } finally {
    payingOrderId.value = null;
  }
};
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

.ticket-container {
  margin-bottom: 15px;
  border-radius: 4px;
  background-color: #fafafa;
  padding: 10px;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.ticket-number {
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}

.ticket-info {
  display: flex;
  margin-top: 0;
  margin-bottom: 0;
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
  margin-bottom: 5px;
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

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 16px;
  color: #606266;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.total-price {
  font-size: 22px;
  font-weight: bold;
  color: #f56c6c;
  margin-left: 5px;
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

.ticket-operations-container {
  max-height: 400px;
  overflow-y: auto;
}

.ticket-operation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.ticket-info-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ticket-number {
  font-weight: bold;
}

.ticket-train {
  color: #0052cc;
}

.ticket-passenger {
  color: #606266;
}

.ticket-operations {
  display: flex;
  gap: 8px;
}

.batch-operations {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
}
</style> 