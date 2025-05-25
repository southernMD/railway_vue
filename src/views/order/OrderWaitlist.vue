<!--
 * @Description: 订单候补页面
-->
<template>
  <div class="order-waitlist-container">
    <!-- 搜索筛选卡片 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="候补编号">
          <el-input
            v-model="filterForm.waitlistNo"
            placeholder="请输入候补编号"
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
        <el-form-item label="候补状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(text, value) in waitlistStatusOptions"
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
          <el-button type="primary" @click="fetchWaitlistData">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 候补列表卡片 -->
    <el-card class="waitlist-card">
      <template #header>
        <div class="card-header">
          <span>订单候补列表</span>
          <el-button
            type="primary"
            @click="fetchWaitlistData"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <!-- 候补订单表格 -->
      <el-table
        v-if="filteredWaitlistItems.length > 0"
        :data="filteredWaitlistItems"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="120">
          <template #default="scope">
            {{ scope.row.user.username }}
          </template>
        </el-table-column>
        <el-table-column label="车次" width="100">
          <template #default="scope">
            {{ scope.row.train.trainNumber }}
          </template>
        </el-table-column>
        <el-table-column label="出发/到达站" min-width="180">
          <template #default="scope">
            <div>
              {{ scope.row.departureStation.stationName }} → 
              {{ scope.row.arrivalStation.stationName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="乘车日期" width="120">
          <template #default="scope">
            {{ scope.row.date }}
          </template>
        </el-table-column>
        <el-table-column label="座位类型" width="100">
          <template #default="scope">
            {{ getSeatTypeName(scope.row.seatType) }}
          </template>
        </el-table-column>
        <el-table-column label="乘客数量" width="100" align="center">
          <template #default="scope">
            {{ scope.row.passengerCount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ waitlistStatusOptions[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.expireTime) }}
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
        description="暂无候补订单数据"
        :image-size="200"
      >
        <template #image>
          <el-icon style="font-size: 60px; color: #909399"><Timer /></el-icon>
        </template>
      </el-empty>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="候补订单详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="候补ID">{{ selectedWaitlist?.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ selectedWaitlist?.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="车次">{{ selectedWaitlist?.train?.trainNumber }}</el-descriptions-item>
        <el-descriptions-item label="乘车日期">{{ selectedWaitlist?.date }}</el-descriptions-item>
        <el-descriptions-item label="出发站">{{ selectedWaitlist?.departureStation?.stationName }}</el-descriptions-item>
        <el-descriptions-item label="到达站">{{ selectedWaitlist?.arrivalStation?.stationName }}</el-descriptions-item>
        <el-descriptions-item label="座位类型">{{ getSeatTypeName(selectedWaitlist?.seatType) }}</el-descriptions-item>
        <el-descriptions-item label="乘客数量">{{ selectedWaitlist?.passengerCount }}</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="getStatusTagType(selectedWaitlist?.status)">
            {{ waitlistStatusOptions[selectedWaitlist?.status || 0] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(selectedWaitlist?.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(selectedWaitlist?.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="过期时间" :span="2">{{ formatDateTime(selectedWaitlist?.expireTime) }}</el-descriptions-item>
      </el-descriptions>
      
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
import { Refresh, Timer } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getWaitingOrders, type WaitingOrder } from "@/api/waiting-orders";

// 候补列表数据
const waitlistItems = ref<WaitingOrder[]>([]);
const loading = ref(false);
const dateRange = ref<[string, string] | null>(null);
const detailDialogVisible = ref(false);
const selectedWaitlist = ref<WaitingOrder | null>(null);

// 筛选表单数据
const filterForm = reactive({
  waitlistNo: "",
  username: "",
  status: null as number | null,
});

// 候补状态选项
const waitlistStatusOptions = {
  0: "等待中",
  1: "已成功",
  2: "已取消",
  3: "已过期",
};

// 本地筛选后的数据（实现前端筛选）
const filteredWaitlistItems = computed(() => {
  return waitlistItems.value.filter(item => {
    // 筛选ID
    if (filterForm.waitlistNo && item.id.toString() !== filterForm.waitlistNo) {
      return false;
    }
    
    // 筛选用户名
    if (filterForm.username && 
        !item.user.username.toLowerCase().includes(filterForm.username.toLowerCase())) {
      return false;
    }
    
    // 筛选状态
    if (filterForm.status !== null && item.status !== filterForm.status) {
      return false;
    }
    
    // 筛选乘车日期
    if (dateRange.value && dateRange.value.length === 2) {
      // 获取候补订单的乘车日期（格式通常为 "YYYY-MM-DD"）
      const rideDate = item.date;
      
      // 确保日期格式一致，以便比较
      const startDate = dateRange.value[0];
      const endDate = dateRange.value[1];
      
      // 字符串比较，确保乘车日期在所选范围内
      if (rideDate < startDate || rideDate > endDate) {
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

// 获取状态标签类型
const getStatusTagType = (status: number | undefined) => {
  if (status === undefined) return "";
  const typeMap = {
    0: "primary",   // 等待中
    1: "success",   // 已成功
    2: "danger",    // 已取消
    3: "info",      // 已过期
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string | undefined) => {
  if (!dateTimeStr) return "";
  try {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    return dateTimeStr;
  }
};

// 获取候补列表数据（从服务器加载所有数据，然后在前端进行筛选）
const fetchWaitlistData = async () => {
  loading.value = true;
  try {
    // 获取所有数据，不传筛选参数
    const result = await getWaitingOrders();
    
    // 更新数据
    waitlistItems.value = result || [];
    
  } catch (error: any) {
    console.error("获取候补列表失败:", error);
    ElMessage.error(`获取候补列表失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.waitlistNo = "";
  filterForm.username = "";
  filterForm.status = null;
  dateRange.value = null;
};

// 查看详情
const handleViewDetail = (waitlist: WaitingOrder) => {
  selectedWaitlist.value = waitlist;
  detailDialogVisible.value = true;
};

// 页面加载时获取候补列表
onMounted(() => {
  fetchWaitlistData();
});
</script>
  
<style scoped>
.order-waitlist-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.waitlist-card {
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
</style>