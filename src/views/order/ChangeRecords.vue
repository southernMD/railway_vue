<!--
 * @Description: 改签记录页面
-->
<template>
  <div class="change-records-container">
    <!-- 搜索筛选卡片 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="改签编号">
          <el-input
            v-model="filterForm.changeNo"
            placeholder="请输入改签编号"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="filterForm.username"
            placeholder="请输入用户名"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="改签状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(text, value) in changeStatusOptions"
              :key="value"
              :label="text"
              :value="Number(value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="乘车日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchChangeRecordsData">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 改签列表卡片 -->
    <el-card class="records-card">
      <template #header>
        <div class="card-header">
          <span>改签记录列表</span>
          <el-button
            type="primary"
            @click="fetchChangeRecordsData"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <!-- 改签记录表格 -->
      <el-table
        v-if="changeRecords.length > 0"
        :data="changeRecords"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="乘客信息" width="120">
          <template #default="scope">
            {{ scope.row.newTicket?.passenger?.realName || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="原车次/日期" width="160">
          <template #default="scope">
            <div v-if="scope.row.originalTicket">
              <div>{{ scope.row.originalTicket.train.trainNumber }}</div>
              <div class="text-muted">{{ scope.row.originalTicket.date }}</div>
            </div>
            <div v-else class="text-muted">无原始车票信息</div>
          </template>
        </el-table-column>
        <el-table-column label="原行程" min-width="180">
          <template #default="scope">
            <div v-if="scope.row.originalTicket">
              {{ scope.row.originalTicket.departureStation.stationName }} → 
              {{ scope.row.originalTicket.arrivalStation.stationName }}
            </div>
            <div v-else class="text-muted">无原始行程信息</div>
          </template>
        </el-table-column>
        <el-table-column label="新车次/日期" width="160">
          <template #default="scope">
            <div>{{ scope.row.newTicket?.train?.trainNumber || '未知' }}</div>
            <div class="text-muted">{{ scope.row.newTicket?.date || '未知' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="新行程" min-width="180">
          <template #default="scope">
            <div>
              {{ scope.row.newTicket?.departureStation?.stationName || '未知' }} → 
              {{ scope.row.newTicket?.arrivalStation?.stationName || '未知' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="座位类型" width="140">
          <template #default="scope">
            <div class="seat-change">
              <span v-if="scope.row.originalTicket">{{ getSeatTypeName(scope.row.originalTicket.seatType) }}</span>
              <span v-else class="text-muted">未知</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              <span>{{ getSeatTypeName(scope.row.newTicket?.seatType) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="费用信息" width="150">
          <template #default="scope">
            <div>票价差: <span :class="{'text-positive': scope.row.priceDifference >= 0, 'text-negative': scope.row.priceDifference < 0}">
              {{ scope.row.priceDifference >= 0 ? '+' : '' }}¥{{ formatPrice(scope.row.priceDifference) }}
            </span></div>
            <div>手续费: ¥{{ formatPrice(scope.row.changeFee) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ changeStatusOptions[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无数据提示 -->
      <el-empty
        v-else
        description="暂无改签记录数据"
        :image-size="200"
      >
        <template #image>
          <el-icon style="font-size: 60px; color: #909399"><SetUp /></el-icon>
        </template>
      </el-empty>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="改签详情"
      width="800px"
    >
      <template v-if="selectedRecord">
        <div class="detail-header">
          <h3>基本信息</h3>
          <el-tag :type="getStatusTagType(selectedRecord.status)" class="status-tag">
            {{ changeStatusOptions[selectedRecord.status] }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="改签ID">{{ selectedRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="订单ID">{{ selectedRecord.orderId }}</el-descriptions-item>
          <el-descriptions-item label="乘客姓名">{{ selectedRecord.newTicket?.passenger?.realName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ selectedRecord.newTicket?.passenger?.idCard || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="改签原因" :span="2">
            {{ selectedRecord.reason || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="ticket-comparison">
          <h3>车票对比</h3>
          <div class="comparison-container">
            <!-- 原车票信息 -->
            <div class="ticket-card original" v-if="selectedRecord.originalTicket">
              <div class="ticket-header">
                <h4>原车票</h4>
                <el-tag type="info">已改签</el-tag>
              </div>
              <div class="ticket-body">
                <div class="ticket-info">
                  <div class="ticket-row">
                    <span class="label">车票号:</span>
                    <span class="value">{{ selectedRecord.originalTicket.ticketNo }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">车次:</span>
                    <span class="value">{{ selectedRecord.originalTicket.train.trainNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">日期:</span>
                    <span class="value">{{ selectedRecord.originalTicket.date }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">出发站:</span>
                    <span class="value">{{ selectedRecord.originalTicket.departureStation.stationName }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">到达站:</span>
                    <span class="value">{{ selectedRecord.originalTicket.arrivalStation.stationName }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">座位类型:</span>
                    <span class="value">{{ getSeatTypeName(selectedRecord.originalTicket.seatType) }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">座位号:</span>
                    <span class="value">{{ selectedRecord.originalTicket.carriage.carriageNumber }}车{{ selectedRecord.originalTicket.seat.seatNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">票价:</span>
                    <span class="value">¥{{ formatPrice(selectedRecord.originalTicket.price) }}</span>
                  </div>
                  <div class="ticket-row" v-if="selectedRecord.originalTicket.refundAmount !== null">
                    <span class="label">退款金额:</span>
                    <span class="value">¥{{ formatPrice(selectedRecord.originalTicket.refundAmount) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 如果没有原车票信息，显示提示 -->
            <div class="ticket-card original" v-else>
              <div class="ticket-header">
                <h4>原车票</h4>
              </div>
              <div class="ticket-body empty">
                <div class="empty-message">无原始车票信息</div>
              </div>
            </div>
            
            <div class="comparison-arrows">
              <el-icon><ArrowRight /></el-icon>
            </div>
            
            <!-- 新车票信息 -->
            <div class="ticket-card new">
              <div class="ticket-header">
                <h4>新车票</h4>
                <el-tag :type="getTicketStatusType(selectedRecord.newTicket?.status)">
                  {{ getTicketStatusName(selectedRecord.newTicket?.status) }}
                </el-tag>
              </div>
              <div class="ticket-body">
                <div class="ticket-info">
                  <div class="ticket-row">
                    <span class="label">车票号:</span>
                    <span class="value">{{ selectedRecord.newTicket?.ticketNo || '未知' }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">车次:</span>
                    <span class="value">{{ selectedRecord.newTicket?.train?.trainNumber || '未知' }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">日期:</span>
                    <span class="value">{{ selectedRecord.newTicket?.date || '未知' }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">出发站:</span>
                    <span class="value">{{ selectedRecord.newTicket?.departureStation?.stationName || '未知' }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">到达站:</span>
                    <span class="value">{{ selectedRecord.newTicket?.arrivalStation?.stationName || '未知' }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">座位类型:</span>
                    <span class="value">{{ getSeatTypeName(selectedRecord.newTicket?.seatType) }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">座位号:</span>
                    <span class="value">{{ selectedRecord.newTicket?.carriage?.carriageNumber || '未知' }}车{{ selectedRecord.newTicket?.seat?.seatNumber || '未知' }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">票价:</span>
                    <span class="value">¥{{ formatPrice(selectedRecord.newTicket?.price) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="fee-summary">
          <h3>费用信息</h3>
          <div class="fee-details">
            <div class="fee-row">
              <span class="label">票价差额:</span>
              <span class="value" :class="{'text-positive': selectedRecord.priceDifference >= 0, 'text-negative': selectedRecord.priceDifference < 0}">
                {{ selectedRecord.priceDifference >= 0 ? '+' : '' }}¥{{ formatPrice(selectedRecord.priceDifference) }}
              </span>
            </div>
            <div class="fee-row">
              <span class="label">改签手续费:</span>
              <span class="value">¥{{ formatPrice(selectedRecord.changeFee) }}</span>
            </div>
            <div class="fee-row total">
              <span class="label">合计:</span>
              <span class="value">¥{{ formatPrice(selectedRecord.priceDifference + selectedRecord.changeFee) }}</span>
            </div>
          </div>
        </div>
      </template>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
  
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { Refresh, SetUp, ArrowRight, Timer } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getChangeRecords } from "@/api/change-records";

// 定义新的数据结构，与API实际返回匹配
interface ChangeRecord {
  id: number;
  originalTicket: Ticket | null; // 原车票
  newTicket: Ticket;            // 新车票
  orderId: number;              // 订单ID
  changeFee: number;            // 改签费用
  priceDifference: number;      // 票价差额
  status: number;               // 状态：0-处理中，1-改签成功，2-改签取消
  reason: string | null;        // 改签原因
}

// 车票接口定义
interface Ticket {
  id: number;
  ticketNo: string;
  orderId: number;
  passenger: {
    id: number;
    realName: string;
    idCard: string;
    phone: string;
    passengerType: number;
  };
  train: {
    id: number;
    trainNumber: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
  };
  date: string;
  departureStation: {
    id: number;
    stationName: string;
  };
  arrivalStation: {
    id: number;
    stationName: string;
  };
  seatType: number;
  carriage: {
    id: number;
    carriageNumber: number;
  };
  seat: {
    id: number;
    seatNumber: string;
  };
  price: number;
  status: number;
  refundAmount: number | null;
  refundTime: string | null;
}

// 改签记录列表数据
const changeRecords = ref<ChangeRecord[]>([]);
const loading = ref(false);
const dateRange = ref<[string, string] | null>(null);
const detailDialogVisible = ref(false);
const selectedRecord = ref<ChangeRecord | null>(null);

// 筛选表单数据
const filterForm = reactive({
  changeNo: "",
  username: "",
  status: null as number | null,
});

// 改签状态选项
const changeStatusOptions = {
  0: "处理中",
  1: "改签成功",
  2: "改签取消"
};

// 获取改签记录数据
const fetchChangeRecordsData = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const queryParams: any = {};
    
    // 转换改签编号到ID
    if (filterForm.changeNo) {
      queryParams.id = Number(filterForm.changeNo);
    }
    
    // 添加用户名筛选
    if (filterForm.username) {
      queryParams.username = filterForm.username;
    }
    
    // 添加状态筛选
    if (filterForm.status !== null) {
      queryParams.status = filterForm.status;
    }
    
    // 添加日期范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startDate = dateRange.value[0];
      queryParams.endDate = dateRange.value[1];
    }
    
    // 调用API获取数据
    const response = await getChangeRecords(queryParams);
    
    // 处理响应格式，提取data数组
    if (response && Array.isArray(response)) {
      changeRecords.value = response;
    } else if (response && response.data) {
      changeRecords.value = response.data;
    } else {
      changeRecords.value = [];
      console.warn('API返回数据格式异常:', response);
    }
  } catch (error: any) {
    console.error("获取改签记录失败:", error);
    ElMessage.error(`获取改签记录失败: ${error.message || '未知错误'}`);
    changeRecords.value = [];
  } finally {
    loading.value = false;
  }
};

// 座位类型名称
const getSeatTypeName = (type: number | undefined) => {
  if (type === undefined) return "";
  const typeMap = {
    0: "商务座",
    1: "一等座",
    2: "二等座",
    3: "无座",
    4: "无座"
  };
  return typeMap[type as keyof typeof typeMap] || "未知";
};

// 获取车票状态名称
const getTicketStatusName = (status: number | undefined) => {
  if (status === undefined) return "";
  const statusMap = {
    0: "待支付",
    1: "已出票",
    2: "已退票",
    3: "改签处理中",
    4: "改签待支付",
    5: "已改签"
  };
  return statusMap[status as keyof typeof statusMap] || "未知";
};

// 获取车票状态标签类型
const getTicketStatusType = (status: number | undefined) => {
  if (status === undefined) return "";
  const typeMap = {
    0: "warning",   // 待支付
    1: "success",   // 已出票
    2: "info",      // 已退票
    3: "primary",   // 改签处理中
    4: "warning",   // 改签待支付
    5: "success",   // 已改签
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

// 获取改签状态标签类型
const getStatusTagType = (status: number | undefined) => {
  if (status === undefined) return "";
  const typeMap = {
    0: "warning",   // 处理中
    1: "success",   // 改签成功
    2: "danger",    // 改签取消
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.changeNo = "";
  filterForm.username = "";
  filterForm.status = null;
  dateRange.value = null;
  
  // 重置后重新获取数据
  fetchChangeRecordsData();
};

// 查看详情
const handleViewDetail = (record: ChangeRecord) => {
  selectedRecord.value = record;
  detailDialogVisible.value = true;
};

// 格式化金额
const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null) return "0.00";
  return price.toFixed(2);
};

// 页面加载时获取改签记录
onMounted(() => {
  fetchChangeRecordsData();
});
</script>
  
<style scoped>
.change-records-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.records-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.el-empty {
  padding: 40px 0;
}

.text-muted {
  color: #909399;
  font-size: 0.9em;
}

.text-positive {
  color: #67c23a;
}

.text-negative {
  color: #f56c6c;
}

.seat-change {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow-icon {
  margin: 0 5px;
  color: #909399;
}

/* 详情对话框样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-tag {
  font-size: 14px;
}

.ticket-comparison {
  margin-top: 30px;
}

.ticket-comparison h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.comparison-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ticket-card {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.ticket-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ticket-body {
  padding: 15px;
}

.ticket-body.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-message {
  color: #909399;
  font-style: italic;
}

.ticket-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ticket-row {
  display: flex;
}

.ticket-row.highlight {
  font-weight: 600;
}

.label {
  flex: 0 0 80px;
  color: #606266;
}

.value {
  flex: 1;
  color: #303133;
}

.comparison-arrows {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409eff;
}

.fee-summary {
  margin-top: 30px;
}

.fee-summary h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.fee-details {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  background-color: #f5f7fa;
}

.fee-row {
  display: flex;
  margin-bottom: 10px;
}

.fee-row.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
  font-weight: bold;
}

.fee-row .label {
  flex: 0 0 100px;
}

.fee-row .value {
  flex: 1;
  text-align: right;
}
</style> 