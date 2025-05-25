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
        v-if="filteredChangeRecords.length > 0"
        :data="filteredChangeRecords"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="乘客信息" width="120">
          <template #default="scope">
            {{ scope.row.ticket.passenger.realName }}
          </template>
        </el-table-column>
        <el-table-column label="原车次/日期" width="160">
          <template #default="scope">
            <div>{{ scope.row.ticket.train.trainNumber }}</div>
            <div class="text-muted">{{ scope.row.ticket.date }}</div>
          </template>
        </el-table-column>
        <el-table-column label="原行程" min-width="180">
          <template #default="scope">
            <div>
              {{ scope.row.ticket.departureStation.stationName }} → 
              {{ scope.row.ticket.arrivalStation.stationName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="新车次/日期" width="160">
          <template #default="scope">
            <div>{{ scope.row.newTicket.train.trainNumber }}</div>
            <div class="text-muted">{{ scope.row.newTicket.date }}</div>
          </template>
        </el-table-column>
        <el-table-column label="新行程" min-width="180">
          <template #default="scope">
            <div>
              {{ scope.row.newTicket.departureStation.stationName }} → 
              {{ scope.row.newTicket.arrivalStation.stationName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="座位类型" width="140">
          <template #default="scope">
            <div class="seat-change">
              <span>{{ getSeatTypeName(scope.row.ticket.seatType) }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              <span>{{ getSeatTypeName(scope.row.newTicket.seatType) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="费用信息" width="150">
          <template #default="scope">
            <div>票价差: <span :class="{'text-positive': scope.row.priceDifference >= 0, 'text-negative': scope.row.priceDifference < 0}">
              {{ scope.row.priceDifference >= 0 ? '+' : '' }}{{ scope.row.priceDifference.toFixed(2) }}
            </span></div>
            <div>手续费: ¥{{ scope.row.changeFee.toFixed(2) }}</div>
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
          <el-descriptions-item label="乘客姓名">{{ selectedRecord.ticket.passenger.realName }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ selectedRecord.ticket.passenger.idCard }}</el-descriptions-item>
          <el-descriptions-item label="改签原因" :span="2">
            {{ selectedRecord.reason || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="ticket-comparison">
          <h3>车票对比</h3>
          <div class="comparison-container">
            <div class="ticket-card original">
              <div class="ticket-header">
                <h4>原车票</h4>
                <el-tag type="info">已改签</el-tag>
              </div>
              <div class="ticket-body">
                <div class="ticket-info">
                  <div class="ticket-row">
                    <span class="label">车票号:</span>
                    <span class="value">{{ selectedRecord.ticket.ticketNo }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">车次:</span>
                    <span class="value">{{ selectedRecord.ticket.train.trainNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">日期:</span>
                    <span class="value">{{ selectedRecord.ticket.date }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">出发站:</span>
                    <span class="value">{{ selectedRecord.ticket.departureStation.stationName }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">到达站:</span>
                    <span class="value">{{ selectedRecord.ticket.arrivalStation.stationName }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">座位类型:</span>
                    <span class="value">{{ getSeatTypeName(selectedRecord.ticket.seatType) }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">座位号:</span>
                    <span class="value">{{ selectedRecord.ticket.carriage.carriageNumber }}车{{ selectedRecord.ticket.seat.seatNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">票价:</span>
                    <span class="value">¥{{ selectedRecord.ticket.price.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="comparison-arrows">
              <el-icon><ArrowRight /></el-icon>
            </div>
            
            <div class="ticket-card new">
              <div class="ticket-header">
                <h4>新车票</h4>
                <el-tag :type="getTicketStatusType(selectedRecord.newTicket.status)">
                  {{ getTicketStatusName(selectedRecord.newTicket.status) }}
                </el-tag>
              </div>
              <div class="ticket-body">
                <div class="ticket-info">
                  <div class="ticket-row">
                    <span class="label">车票号:</span>
                    <span class="value">{{ selectedRecord.newTicket.ticketNo }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">车次:</span>
                    <span class="value">{{ selectedRecord.newTicket.train.trainNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">日期:</span>
                    <span class="value">{{ selectedRecord.newTicket.date }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">出发站:</span>
                    <span class="value">{{ selectedRecord.newTicket.departureStation.stationName }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">到达站:</span>
                    <span class="value">{{ selectedRecord.newTicket.arrivalStation.stationName }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">座位类型:</span>
                    <span class="value">{{ getSeatTypeName(selectedRecord.newTicket.seatType) }}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">座位号:</span>
                    <span class="value">{{ selectedRecord.newTicket.carriage.carriageNumber }}车{{ selectedRecord.newTicket.seat.seatNumber }}</span>
                  </div>
                  <div class="ticket-row highlight">
                    <span class="label">票价:</span>
                    <span class="value">¥{{ selectedRecord.newTicket.price.toFixed(2) }}</span>
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
                {{ selectedRecord.priceDifference >= 0 ? '+' : '' }}¥{{ selectedRecord.priceDifference.toFixed(2) }}
              </span>
            </div>
            <div class="fee-row">
              <span class="label">改签手续费:</span>
              <span class="value">¥{{ selectedRecord.changeFee.toFixed(2) }}</span>
            </div>
            <div class="fee-row total">
              <span class="label">合计:</span>
              <span class="value">¥{{ (selectedRecord.priceDifference + selectedRecord.changeFee).toFixed(2) }}</span>
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
import { getChangeRecords, type ChangeRecord } from "@/api/change-records";

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

// 伪造的数据
const mockChangeRecord = {
  id: 1001,
  ticket: {
    createTime: "2025-05-25T05:31:58.391Z",
    updateTime: "2025-05-25T05:31:58.391Z",
    id: 2001,
    ticketNo: "T20250525001",
    orderId: 3001,
    passenger: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 4001,
      user: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 5001,
        username: "zhangsan",
        email: "zhangsan@example.com",
        userType: 0,
        status: 0
      },
      realName: "张三",
      idCard: "110101199001011234",
      phone: "13800138000",
      passengerType: 0,
      isDefault: 1
    },
    train: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 6001,
      trainNumber: "G101",
      model: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 7001,
        modelName: "复兴号",
        modelCode: "CR400AF",
        maxCapacity: 576
      },
      startStation: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 8001,
        stationName: "北京南站",
        city: "北京",
        province: "北京",
        address: "北京市丰台区永外大街",
        status: 0
      },
      endStation: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 8002,
        stationName: "上海虹桥站",
        city: "上海",
        province: "上海",
        address: "上海市闵行区申虹路",
        status: 0
      },
      date: "2025-05-25",
      departureTime: {
        hour: 8,
        minute: 0,
        second: 0,
        nano: 0
      },
      arrivalTime: {
        hour: 13,
        minute: 0,
        second: 0,
        nano: 0
      },
      trainSeatInfo: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 9001,
        noSeatTickets: 10,
        businessPrice: 1500,
        firstClassPrice: 900,
        secondClassPrice: 550,
        noSeatPrice: 300
      },
      trainStops: []
    },
    date: "2025-05-25",
    departureStation: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 8001,
      stationName: "北京南站",
      city: "北京",
      province: "北京",
      address: "北京市丰台区永外大街",
      status: 0
    },
    arrivalStation: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 8002,
      stationName: "上海虹桥站",
      city: "上海",
      province: "上海",
      address: "上海市闵行区申虹路",
      status: 0
    },
    seatType: 1, // 一等座
    carriage: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 10001,
      modelId: 7001,
      carriageNumber: 3,
      carriageType: 1
    },
    seat: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 11001,
      carriageId: 10001,
      seatNumber: "5A",
      status: 0,
      lockInfo: []
    },
    price: 900,
    status: 3, // 已改签
    refundAmount: 0,
    refundTime: null
  },
  newTicket: {
    createTime: "2025-05-25T05:31:58.391Z",
    updateTime: "2025-05-25T05:31:58.391Z",
    id: 2002,
    ticketNo: "T20250526001",
    orderId: 3001,
    passenger: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 4001,
      user: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 5001,
        username: "zhangsan",
        email: "zhangsan@example.com",
        userType: 0,
        status: 0
      },
      realName: "张三",
      idCard: "110101199001011234",
      phone: "13800138000",
      passengerType: 0,
      isDefault: 1
    },
    train: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 6002,
      trainNumber: "G103",
      model: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 7001,
        modelName: "复兴号",
        modelCode: "CR400AF",
        maxCapacity: 576
      },
      startStation: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 8001,
        stationName: "北京南站",
        city: "北京",
        province: "北京",
        address: "北京市丰台区永外大街",
        status: 0
      },
      endStation: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 8002,
        stationName: "上海虹桥站",
        city: "上海",
        province: "上海",
        address: "上海市闵行区申虹路",
        status: 0
      },
      date: "2025-05-26", // 改签到第二天
      departureTime: {
        hour: 9,
        minute: 30,
        second: 0,
        nano: 0
      },
      arrivalTime: {
        hour: 14,
        minute: 30,
        second: 0,
        nano: 0
      },
      trainSeatInfo: {
        createTime: "2025-05-25T05:31:58.391Z",
        updateTime: "2025-05-25T05:31:58.391Z",
        id: 9002,
        noSeatTickets: 5,
        businessPrice: 1600,
        firstClassPrice: 950,
        secondClassPrice: 580,
        noSeatPrice: 320
      },
      trainStops: []
    },
    date: "2025-05-26",
    departureStation: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 8001,
      stationName: "北京南站",
      city: "北京",
      province: "北京",
      address: "北京市丰台区永外大街",
      status: 0
    },
    arrivalStation: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 8002,
      stationName: "上海虹桥站",
      city: "上海",
      province: "上海",
      address: "上海市闵行区申虹路",
      status: 0
    },
    seatType: 0, // 商务座
    carriage: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 10002,
      modelId: 7001,
      carriageNumber: 1,
      carriageType: 0
    },
    seat: {
      createTime: "2025-05-25T05:31:58.391Z",
      updateTime: "2025-05-25T05:31:58.391Z",
      id: 11002,
      carriageId: 10002,
      seatNumber: "2C",
      status: 0,
      lockInfo: []
    },
    price: 1600,
    status: 0, // 未使用
    refundAmount: 0,
    refundTime: null
  },
  orderId: 3001,
  changeFee: 50, // 改签手续费
  priceDifference: 700, // 票价差额，正数表示需要补票价差
  status: 1, // 改签成功
  reason: "行程变更，需要推迟一天出行"
};

// 本地筛选后的数据（实现前端筛选）
const filteredChangeRecords = computed(() => {
  return changeRecords.value.filter(item => {
    // 筛选改签ID
    if (filterForm.changeNo && item.id.toString() !== filterForm.changeNo) {
      return false;
    }
    
    // 筛选用户名
    if (filterForm.username && 
        !item.ticket.passenger.user.username.toLowerCase().includes(filterForm.username.toLowerCase())) {
      return false;
    }
    
    // 筛选状态
    if (filterForm.status !== null && item.status !== filterForm.status) {
      return false;
    }
    
    // 筛选乘车日期
    if (dateRange.value && dateRange.value.length === 2) {
      // 获取原车票和新车票的日期
      const originalDate = item.ticket.date;
      const newDate = item.newTicket.date;
      
      const startDate = dateRange.value[0];
      const endDate = dateRange.value[1];
      
      // 检查原车票或新车票的日期是否在所选范围内
      if ((originalDate < startDate || originalDate > endDate) && 
          (newDate < startDate || newDate > endDate)) {
        return false;
      }
    }
    
    return true;
  });
});

// 座位类型名称
const getSeatTypeName = (type: number | undefined) => {
  if (type === undefined) return "";
  const typeMap = {
    0: "商务座",
    1: "一等座",
    2: "二等座",
    3: "无座",
  };
  return typeMap[type as keyof typeof typeMap] || "未知";
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

// 获取车票状态名称
const getTicketStatusName = (status: number | undefined) => {
  if (status === undefined) return "";
  const statusMap = {
    0: "未使用",
    1: "已使用",
    2: "已退票",
    3: "已改签",
    4: "已取消"
  };
  return statusMap[status as keyof typeof statusMap] || "未知";
};

// 获取车票状态标签类型
const getTicketStatusType = (status: number | undefined) => {
  if (status === undefined) return "";
  const typeMap = {
    0: "primary",   // 未使用
    1: "success",   // 已使用
    2: "info",      // 已退票
    3: "warning",   // 已改签
    4: "danger",    // 已取消
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

// 获取改签记录数据
const fetchChangeRecordsData = async () => {
  loading.value = true;
  try {
    // 保留原有的获取数据方式
    setTimeout(() => {
      // 使用伪造的数据
      changeRecords.value = [mockChangeRecord];
      loading.value = false;
    }, 500);
  } catch (error: any) {
    console.error("获取改签记录失败:", error);
    ElMessage.error(`获取改签记录失败: ${error.message || '未知错误'}`);
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.changeNo = "";
  filterForm.username = "";
  filterForm.status = null;
  dateRange.value = null;
};

// 查看详情
const handleViewDetail = (record: ChangeRecord) => {
  selectedRecord.value = record;
  detailDialogVisible.value = true;
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