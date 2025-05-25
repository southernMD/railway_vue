<template>
    <div class="waitlist-container">
      <div class="page-header">
        <h2 class="page-title">候补订单</h2>
        <div class="page-actions">
          <el-button type="primary" @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>
      
      <!-- 筛选卡片 -->
      <el-card class="filter-card">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
          </div>
        </template>
        
        <el-form :model="filterForm" label-width="80px" class="filter-form">
          <el-form-item label="候补号">
            <el-input v-model="filterForm.waitlistNo" placeholder="输入候补单号" clearable></el-input>
          </el-form-item>
          <el-form-item label="出发站">
            <el-select v-model="filterForm.departureStation" placeholder="选择出发站" clearable filterable>
              <el-option
                v-for="station in stations"
                :key="station.id"
                :label="station.stationName"
                :value="station.stationName"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="到达站">
            <el-select v-model="filterForm.arrivalStation" placeholder="选择到达站" clearable filterable>
              <el-option
                v-for="station in stations"
                :key="station.id"
                :label="station.stationName"
                :value="station.stationName"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
              <el-option
                v-for="(value, key) in waitlistStatusOptions"
                :key="key"
                :label="value"
                :value="Number(key)"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 候补列表卡片 -->
      <el-card class="waitlist-card">
        <template #header>
          <div class="card-header">
            <span>候补订单列表</span>
            <span class="record-count" v-if="waitlistOrders.length > 0">
              共 {{ waitlistOrders.length }} 条记录
            </span>
          </div>
        </template>
        
        <div class="waitlist-list" v-loading="loading">
          <template v-if="filteredWaitlistOrders.length > 0">
            <el-card 
              v-for="order in filteredWaitlistOrders" 
              :key="order.id"
              class="waitlist-item"
              :class="{ 
                'waitlist-success': order.status === 1,
                'waitlist-cancelled': order.status === 2
              }"
            >
              <div class="waitlist-header">
                <div class="waitlist-info">
                  <div class="waitlist-number">候补单号: {{ order.waitlistNo }}</div>
                  <div class="waitlist-date">申请时间: {{ formatDateTime(order.createTime) }}</div>
                </div>
                <div class="waitlist-status">
                  <el-tag :type="getWaitlistStatusType(order.status)">
                    {{ waitlistStatusOptions[order.status] }}
                  </el-tag>
                </div>
              </div>
              
              <div class="trip-info">
                <div class="trip-date">{{ order.travelDate }}</div>
                <div class="train-number">{{ order.trainNumber }}</div>
                <div class="station-info">
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
              </div>
              
              <div class="passengers-info">
                <div class="section-title">乘客信息</div>
                <el-tag 
                  v-for="(passenger, index) in order.passengers" 
                  :key="index"
                  class="passenger-tag"
                >
                  {{ passenger.name }} ({{ getSeatTypeName(passenger.seatType) }})
                </el-tag>
              </div>
              
              <div class="waitlist-details">
                <div class="detail-item">
                  <span class="label">候补位置:</span>
                  <span class="value">{{ order.queuePosition }} / {{ order.totalInQueue }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预计成功率:</span>
                  <span class="value success-rate">{{ getSuccessRate(order.queuePosition) }}</span>
                </div>
                <div class="detail-item" v-if="order.deadline">
                  <span class="label">截止时间:</span>
                  <span class="value">{{ formatDateTime(order.deadline) }}</span>
                </div>
                <div class="detail-item" v-if="order.successTime">
                  <span class="label">成功时间:</span>
                  <span class="value">{{ formatDateTime(order.successTime) }}</span>
                </div>
                <div class="detail-item" v-if="order.cancelTime">
                  <span class="label">取消时间:</span>
                  <span class="value">{{ formatDateTime(order.cancelTime) }}</span>
                </div>
              </div>
              
              <div class="waitlist-actions">
                <template v-if="order.status === 0">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="viewWaitlistDetail(order.id)"
                  >
                    详情
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="cancelWaitlist(order.id)"
                  >
                    取消候补
                  </el-button>
                </template>
                <template v-else-if="order.status === 1">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="viewOrderDetail(order.orderId)"
                  >
                    查看订单
                  </el-button>
                </template>
                <template v-else>
                  <el-button 
                    type="info" 
                    size="small" 
                    @click="viewWaitlistDetail(order.id)"
                  >
                    详情
                  </el-button>
                </template>
              </div>
            </el-card>
          </template>
          
          <el-empty 
            v-else 
            description="暂无候补订单记录" 
            :image-size="200"
          ></el-empty>
        </div>
      </el-card>
      
      <!-- 详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="候补详情"
        width="700px"
      >
        <div class="waitlist-detail-content" v-if="selectedWaitlist">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="候补单号">{{ selectedWaitlist.waitlistNo }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDateTime(selectedWaitlist.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getWaitlistStatusType(selectedWaitlist.status)">
                {{ waitlistStatusOptions[selectedWaitlist.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="截止时间" v-if="selectedWaitlist.deadline">
              {{ formatDateTime(selectedWaitlist.deadline) }}
            </el-descriptions-item>
            <el-descriptions-item label="候补位置">{{ selectedWaitlist.queuePosition }} / {{ selectedWaitlist.totalInQueue }}</el-descriptions-item>
            <el-descriptions-item label="预计成功率">{{ getSuccessRate(selectedWaitlist.queuePosition) }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="detail-section">
            <div class="section-title">行程信息</div>
            <div class="train-info">
              <div class="train-header">
                <div class="train-number">{{ selectedWaitlist.trainNumber }}</div>
                <div class="train-date">{{ selectedWaitlist.travelDate }}</div>
              </div>
              <div class="station-info">
                <div class="departure">
                  <div class="time">{{ selectedWaitlist.departureTime }}</div>
                  <div class="station">{{ selectedWaitlist.departureStation }}</div>
                </div>
                <div class="journey">
                  <div class="arrow-line"></div>
                  <div class="duration">{{ calculateDuration(selectedWaitlist.departureTime, selectedWaitlist.arrivalTime) }}</div>
                </div>
                <div class="arrival">
                  <div class="time">{{ selectedWaitlist.arrivalTime }}</div>
                  <div class="station">{{ selectedWaitlist.arrivalStation }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">乘客信息</div>
            <el-table :data="selectedWaitlist.passengers" border style="width: 100%">
              <el-table-column label="姓名" prop="name"></el-table-column>
              <el-table-column label="证件号码">
                <template #default="scope">
                  {{ maskIdCard(scope.row.idCard) }}
                </template>
              </el-table-column>
              <el-table-column label="乘客类型">
                <template #default="scope">
                  {{ getPassengerTypeName(scope.row.passengerType) }}
                </template>
              </el-table-column>
              <el-table-column label="座位类型">
                <template #default="scope">
                  {{ getSeatTypeName(scope.row.seatType) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="detail-section" v-if="selectedWaitlist.status === 1">
            <div class="section-title">成功信息</div>
            <el-alert
              title="候补成功通知"
              type="success"
              description="您的候补订单已成功，系统已自动为您出票。"
              show-icon
              :closable="false"
            ></el-alert>
            <div class="success-info">
              <p>成功时间: {{ formatDateTime(selectedWaitlist.successTime) }}</p>
              <p>订单号: {{ selectedWaitlist.orderNo }}</p>
              <p>支付金额: ¥{{ selectedWaitlist.totalPrice.toFixed(2) }}</p>
            </div>
            <div class="detail-actions">
              <el-button type="primary" @click="viewOrderDetail(selectedWaitlist.orderId)">查看订单详情</el-button>
            </div>
          </div>
          
          <div class="detail-section" v-if="selectedWaitlist.status === 2">
            <div class="section-title">取消信息</div>
            <el-alert
              title="候补已取消"
              type="info"
              :description="getCancelReason(selectedWaitlist)"
              show-icon
              :closable="false"
            ></el-alert>
          </div>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { Refresh } from '@element-plus/icons-vue';
  
  const router = useRouter();
  const loading = ref(false);
  const dateRange = ref<string[] | null>(null);
  const detailDialogVisible = ref(false);
  const selectedWaitlist = ref<any>(null);
  const waitlistOrders = ref<any[]>([]);
  
  // 筛选表单
  const filterForm = reactive({
    waitlistNo: '',
    departureStation: '',
    arrivalStation: '',
    status: null as number | null
  });
  
  // 候补状态选项
  const waitlistStatusOptions = {
    0: "候补中",
    1: "候补成功",
    2: "已取消"
  };
  
  // 模拟站点数据
  const stations = ref([
    { id: 1, stationName: '北京南站' },
    { id: 2, stationName: '上海虹桥站' },
    { id: 3, stationName: '广州南站' },
    { id: 4, stationName: '深圳北站' },
    { id: 5, stationName: '杭州东站' }
  ]);
  
  // 过滤后的候补订单
  const filteredWaitlistOrders = computed(() => {
    return waitlistOrders.value.filter(order => {
      // 筛选候补单号
      if (filterForm.waitlistNo && !order.waitlistNo.includes(filterForm.waitlistNo)) {
        return false;
      }
      
      // 筛选出发站
      if (filterForm.departureStation && order.departureStation !== filterForm.departureStation) {
        return false;
      }
      
      // 筛选到达站
      if (filterForm.arrivalStation && order.arrivalStation !== filterForm.arrivalStation) {
        return false;
      }
      
      // 筛选状态
      if (filterForm.status !== null && order.status !== filterForm.status) {
        return false;
      }
      
      // 筛选日期范围
      if (dateRange.value && dateRange.value.length === 2) {
        const travelDate = order.travelDate;
        const startDate = dateRange.value[0];
        const endDate = dateRange.value[1];
        
        if (travelDate < startDate || travelDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  });
  
  // 获取候补状态标签类型
  const getWaitlistStatusType = (status: number) => {
    const typeMap: Record<number, string> = {
      0: 'warning',  // 候补中
      1: 'success',  // 候补成功
      2: 'info'      // 已取消
    };
    return typeMap[status] || 'info';
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
  
  // 格式化日期时间
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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
  
  // 遮蔽身份证号
  const maskIdCard = (idCard: string) => {
    if (!idCard || idCard.length < 11) return idCard;
    return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
  };
  
  // 获取成功率
  const getSuccessRate = (position: number) => {
    if (position <= 3) return '很高';
    if (position <= 10) return '中等';
    return '较低';
  };
  
  // 获取取消原因
  const getCancelReason = (waitlist: any) => {
    if (waitlist.cancelReason) {
      return waitlist.cancelReason;
    }
    return '候补已取消，取消时间: ' + formatDateTime(waitlist.cancelTime);
  };
  
  // 刷新数据
  const refreshData = async () => {
    loading.value = true;
    
    try {
      // 实际项目中应该调用API获取候补订单数据
      // const result = await waitlistApi.getWaitlistOrders();
      
      // 模拟数据
      setTimeout(() => {
        waitlistOrders.value = [
          {
            id: 1001,
            waitlistNo: 'WL20230615001',
            status: 0, // 候补中
            createTime: '2023-06-15 10:32:56',
            deadline: '2023-06-18 18:00:00',
            trainNumber: 'G102',
            travelDate: '2023-06-20',
            departureStation: '北京南站',
            departureTime: '08:05',
            arrivalStation: '上海虹桥站',
            arrivalTime: '13:20',
            queuePosition: 3,
            totalInQueue: 15,
            passengers: [
              {
                name: '张三',
                idCard: '110101199001011234',
                passengerType: 0, // 成人
                seatType: 2 // 一等座
              }
            ]
          },
          {
            id: 1002,
            waitlistNo: 'WL20230610002',
            status: 1, // 候补成功
            createTime: '2023-06-10 14:12:36',
            deadline: '2023-06-13 18:00:00',
            successTime: '2023-06-11 09:45:21',
            trainNumber: 'G106',
            travelDate: '2023-06-15',
            departureStation: '北京南站',
            departureTime: '14:05',
            arrivalStation: '南京南站',
            arrivalTime: '16:52',
            queuePosition: 1,
            totalInQueue: 8,
            orderId: 5001,
            orderNo: 'ORD005001',
            totalPrice: 432.5,
            passengers: [
              {
                name: '张三',
                idCard: '110101199001011234',
                passengerType: 0, // 成人
                seatType: 3 // 二等座
              }
            ]
          },
          {
            id: 1003,
            waitlistNo: 'WL20230605003',
            status: 2, // 已取消
            createTime: '2023-06-05 09:23:45',
            deadline: '2023-06-08 18:00:00',
            cancelTime: '2023-06-06 16:32:12',
            cancelReason: '用户主动取消',
            trainNumber: 'G110',
            travelDate: '2023-06-10',
            departureStation: '上海虹桥站',
            departureTime: '10:12',
            arrivalStation: '杭州东站',
            arrivalTime: '11:03',
            queuePosition: 5,
            totalInQueue: 12,
            passengers: [
              {
                name: '张三',
                idCard: '110101199001011234',
                passengerType: 0, // 成人
                seatType: 2 // 一等座
              },
              {
                name: '李四',
                idCard: '110101199201021234',
                passengerType: 0, // 成人
                seatType: 2 // 一等座
              }
            ]
          }
        ];
        
        loading.value = false;
      }, 500);
    } catch (error) {
      console.error('获取候补订单失败:', error);
      ElMessage.error('获取候补订单失败，请重试');
      loading.value = false;
    }
  };
  
  // 应用筛选
  const applyFilter = () => {
    // 筛选逻辑已经在计算属性中实现
  };
  
  // 重置筛选
  const resetFilter = () => {
    filterForm.waitlistNo = '';
    filterForm.departureStation = '';
    filterForm.arrivalStation = '';
    filterForm.status = null;
    dateRange.value = null;
  };
  
  // 查看候补详情
  const viewWaitlistDetail = (id: number) => {
    const waitlist = waitlistOrders.value.find(item => item.id === id);
    if (waitlist) {
      selectedWaitlist.value = waitlist;
      detailDialogVisible.value = true;
    }
  };
  
  // 查看订单详情
  const viewOrderDetail = (orderId: number) => {
    router.push(`/user/order/detail/${orderId}`);
  };
  
  // 取消候补
  const cancelWaitlist = (id: number) => {
    ElMessageBox.confirm('确定要取消该候补订单吗？取消后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      loading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        // 更新本地数据
        const waitlist = waitlistOrders.value.find(item => item.id === id);
        if (waitlist) {
          waitlist.status = 2; // 已取消
          waitlist.cancelTime = new Date().toISOString();
          waitlist.cancelReason = '用户主动取消';
        }
        
        loading.value = false;
        ElMessage.success('候补订单已取消');
      }, 500);
    }).catch(() => {});
  };
  
  // 页面加载时获取候补订单数据
  onMounted(() => {
    refreshData();
  });
  </script>
  
  <style scoped>
  .waitlist-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .page-title {
    margin: 0;
    color: #303133;
  }
  
  .filter-card, .waitlist-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .record-count {
    color: #909399;
    font-size: 14px;
  }
  
  .filter-form {
    display: flex;
    flex-wrap: wrap;
  }
  
  .waitlist-list {
    margin-top: 10px;
  }
  
  .waitlist-item {
    margin-bottom: 20px;
    transition: all 0.3s;
  }
  
  .waitlist-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .waitlist-success {
    border-left: 4px solid #67c23a;
  }
  
  .waitlist-cancelled {
    border-left: 4px solid #909399;
    opacity: 0.8;
  }
  
  .waitlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .waitlist-number {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }
  
  .waitlist-date {
    margin-top: 5px;
    font-size: 14px;
    color: #909399;
  }
  
  .trip-info {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .trip-date {
    margin-right: 15px;
    color: #606266;
  }
  
  .train-number {
    margin-right: 15px;
    font-weight: bold;
    color: #303133;
  }
  
  .station-info {
    display: flex;
    flex: 1;
    align-items: center;
  }
  
  .departure, .arrival {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .time {
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
    align-items: center;
    padding: 0 15px;
  }
  
  .arrow-line {
    width: 100%;
    height: 2px;
    background-color: #dcdfe6;
    position: relative;
  }
  
  .arrow-line::after {
    content: "";
    position: absolute;
    top: -4px;
    right: 0;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid #dcdfe6;
  }
  
  .passengers-info {
    margin-bottom: 15px;
  }
  
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #606266;
    margin-bottom: 10px;
  }
  
  .passenger-tag {
    margin-right: 10px;
    margin-bottom: 5px;
  }
  
  .waitlist-details {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .detail-item {
    flex: 1;
    min-width: 200px;
    margin-bottom: 5px;
  }
  
  .label {
    color: #909399;
  }
  
  .value {
    margin-left: 5px;
    color: #303133;
  }
  
  .success-rate {
    color: #67c23a;
    font-weight: bold;
  }
  
  .waitlist-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .waitlist-actions button {
    margin-left: 10px;
  }
  
  .detail-section {
    margin-top: 20px;
  }
  
  .train-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  .duration {
    margin-top: 5px;
    font-size: 14px;
    color: #909399;
  }
  
  .success-info {
    margin: 15px 0;
    padding: 10px;
    background-color: #f0f9eb;
    border-radius: 4px;
  }
  
  .success-info p {
    margin: 5px 0;
  }
  
  .detail-actions {
    margin-top: 20px;
    text-align: center;
  }
  </style>