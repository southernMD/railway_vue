<template>
  <div class="user-home">
    <!-- 车票查询区域 -->
    <el-card class="ticket-search-card">
      <div class="card-title">
        <h2>车票查询</h2>
      </div>
      <el-form :model="ticketForm" label-width="100px" class="ticket-form" v-loading="stationsLoading">
        <el-form-item label="出发站">
          <el-select
            v-model="ticketForm.departureStation"
            filterable
            placeholder="请选择出发站"
            class="full-width"
          >
            <el-option
              v-for="item in departureStations"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到达站">
          <el-select
            v-model="ticketForm.arrivalStation"
            filterable
            placeholder="请选择到达站"
            class="full-width"
          >
            <el-option
              v-for="item in arrivalStations"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker
            v-model="ticketForm.departureDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="full-width"
            :disabled-date="disablePastDates"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTickets" class="search-btn">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 快捷操作区域 -->
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="action-card" @click="goToOrders">
            <el-icon class="action-icon"><Tickets /></el-icon>
            <div class="action-title">我的订单</div>
            <div class="action-desc">查看全部订单记录</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" @click="goToWaitlist">
            <el-icon class="action-icon"><Timer /></el-icon>
            <div class="action-title">候补订单</div>
            <div class="action-desc">查看候补购票记录</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" @click="goToChangeRecords">
            <el-icon class="action-icon"><SetUp /></el-icon>
            <div class="action-title">改签记录</div>
            <div class="action-desc">查看车票改签记录</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" @click="goToProfile">
            <el-icon class="action-icon"><UserFilled /></el-icon>
            <div class="action-title">个人中心</div>
            <div class="action-desc">管理个人资料信息</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 常见问题区域 -->
    <el-card class="faq-card">
      <div class="card-title">
        <h2>常见问题</h2>
      </div>
      <el-collapse>
        <el-collapse-item title="如何购买车票？" name="1">
          <div>1. 在首页或车票查询页面输入出发站、到达站和出发日期</div>
          <div>2. 点击查询按钮获取符合条件的车次</div>
          <div>3. 在车次列表中选择合适的车次和座位类型</div>
          <div>4. 选择乘车人并确认订单信息</div>
          <div>5. 完成支付后即可获得电子车票</div>
        </el-collapse-item>
        <el-collapse-item title="如何改签车票？" name="2">
          <div>1. 进入"我的订单"页面</div>
          <div>2. 找到需要改签的订单，点击"改签"按钮</div>
          <div>3. 选择新的车次和座位类型</div>
          <div>4. 确认改签信息并支付差价（如有）</div>
          <div>5. 改签成功后，原车票自动作废，新车票生效</div>
        </el-collapse-item>
        <el-collapse-item title="如何退票？" name="3">
          <div>1. 进入"我的订单"页面</div>
          <div>2. 找到需要退票的订单，点击"退票"按钮</div>
          <div>3. 确认退票信息</div>
          <div>4. 根据退票规则，系统会计算退款金额</div>
          <div>5. 确认后，退款将原路返回支付账户</div>
        </el-collapse-item>
        <el-collapse-item title="候补购票是什么？" name="4">
          <div>当您想要购买的车次暂时无票时，可以选择候补购票。系统会自动监控余票情况，一旦有余票，将按照候补顺序自动为您购票。</div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Tickets, Timer, SetUp, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getOpenStations } from '@/api/station'; // 导入车站API

const router = useRouter();

// 车票查询表单
const ticketForm = reactive({
  departureStation: '',
  arrivalStation: '',
  departureDate: new Date().toISOString().split('T')[0] // 默认为今天
});

// 车站数据 - 替换成从API获取
const stations = ref<{ id: number, stationName: string }[]>([]);
const stationsLoading = ref(false);

// 使用计算属性过滤出发站和到达站选项
const departureStations = computed(() => {
  if (!ticketForm.arrivalStation) return stations.value;
  return stations.value.filter(station => station.id !== ticketForm.arrivalStation);
});

const arrivalStations = computed(() => {
  if (!ticketForm.departureStation) return stations.value;
  return stations.value.filter(station => station.id !== ticketForm.departureStation);
});

// 监听选择变化，如果一方改变导致冲突，清空另一方
watch(() => ticketForm.departureStation, (newVal) => {
  if (newVal && newVal === ticketForm.arrivalStation) {
    ticketForm.arrivalStation = '';
  }
});

watch(() => ticketForm.arrivalStation, (newVal) => {
  if (newVal && newVal === ticketForm.departureStation) {
    ticketForm.departureStation = '';
  }
});

// 获取车站数据
const fetchStations = async () => {
  stationsLoading.value = true;
  try {
    const response = await getOpenStations();
    // 只取需要的字段
    stations.value = response.map(station => ({
      id: station.id,
      stationName: station.stationName
    }));
  } catch (error) {
    console.error('获取车站失败:', error);
    ElMessage.error('获取车站数据失败，请刷新页面重试');
  } finally {
    stationsLoading.value = false;
  }
};

// 禁用过去的日期
const disablePastDates = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 8.64e7 是一天的毫秒数
};

// 车票查询
const searchTickets = () => {
  // 表单验证
  if (!ticketForm.departureStation) {
    ElMessage.warning('请选择出发站');
    return;
  }
  if (!ticketForm.arrivalStation) {
    ElMessage.warning('请选择到达站');
    return;
  }
  if (!ticketForm.departureDate) {
    ElMessage.warning('请选择出发日期');
    return;
  }
  
  // 跳转到车票查询页面并传递查询参数
  router.push({
    path: '/user/tickets',
    query: {
      departure: ticketForm.departureStation,
      arrival: ticketForm.arrivalStation,
      date: ticketForm.departureDate
    }
  });
};

// 页面跳转函数
const goToOrders = () => router.push('/user/orders');
const goToWaitlist = () => router.push('/user/orders/waitlist');
const goToChangeRecords = () => router.push('/user/orders/changes');
const goToProfile = () => router.push('/user/profile');
const goToTicketSearch = () => router.push('/user/tickets');

onMounted(() => {
  // 页面加载时获取车站数据
  fetchStations();
});
</script>

<style scoped>
.user-home {
  max-width: 1200px;
  margin: 0 auto;
}

.ticket-search-card {
  margin-bottom: 20px;
}

.card-title {
  margin-bottom: 20px;
}

.card-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  border-left: 4px solid #0052cc;
  padding-left: 10px;
}

.ticket-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}

.ticket-form .el-form-item {
  margin-right: 20px;
  margin-bottom: 10px;
  flex: 1;
  min-width: 200px;
}

.full-width {
  width: 100%;
}

.search-btn {
  width: 100%;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-card {
  height: 140px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 36px;
  color: #0052cc;
  margin-bottom: 10px;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.action-desc {
  font-size: 12px;
  color: #909399;
}

.faq-card {
  margin-bottom: 20px;
}
</style> 