<script setup lang="tsx">
import type { ProDataTableColumns } from 'pro-naive-ui'
import type { AllocateParams, FlowItem, FlowTotalResponse, UserItem } from './index.api'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useNDataTable } from 'pro-naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { Api } from './index.api'

const message = useMessage()
const { openContactServiceModal } = useContactServiceModal()
const {
  user,
} = storeToRefs(useUserStore())
const showAssignModal = ref(false)
const values = ref({
  targetUserId: '',
  amount: 0,
  flowType: 'increase',
  assetType: 1,
  remark: '',
})
const isManager = computed(() => user.value.role === 1)
const columns = ref<ProDataTableColumns<FlowItem>>([
  {
    title: $t('myPoint.table.project') as string,
    render: row => row.remark ? row.remark : row.bizTypeName,
  },
  {
    title: $t('myPoint.table.account') as string,
    path: 'userName',
  },
  {
    title: $t('myPoint.table.time') as string,
    path: 'createTime',
  },
  {
    title: $t('myPoint.table.incomeExpense') as string,
    render: row => renderNumber(row),
  },
])

const userList = ref<UserItem[]>([])

// 计算选中用户的兔点
const selectedUserPoints = computed(() => {
  const selectedUser = userList.value.find(user => user.userId === values.value.targetUserId)
  return (selectedUser as any)?.points || 0
})

function renderNumber(row: FlowItem) {
  if (row.flowType === 2) {
    return (
      <span class="c-#19C906">
        -
        {row.amount}
      </span>
    )
  }
  return (
    <span class="c-#FF4E47">
      +
      {row.amount}
    </span>
  )
}

const { table: { tableProps } } = useNDataTable(({
  current,
  pageSize,
  sorter,
  filters,
}) => fetchList({ current, pageSize, sorter, filters }))

async function fetchList(params: any) {
  try {
    const { data } = await Api.getFlowList({ enterpriseId: user.value.enterpriseId!, assetType: 1, pageNum: params.current, pageSize: params.pageSize })
    return { list: data.records, total: Number(data.total) }
  }
  catch (error: any) {
    console.error('获取兔点明细失败:', error)
    message.error(error.response?.data?.msg || ($t('myPoint.messages.fetchFail') as string))
    return { list: [], total: 0, pageNum: 1, pageSize: 10 }
  }
}

function recharge() {
  // 管理员：点击充值拉起客服弹窗
  if (user.value.role === 1) {
    openContactServiceModal()
    return
  }
  if (user.value.role === 2) {
    message.warning($t('myPoint.messages.contactManager'))
  }
}

async function getUserList() {
  try {
    const { data = [] } = await Api.getUserList({ enterpriseId: user.value.enterpriseId! })
    userList.value = data.filter(t => t.role !== 1)
    if (userList.value.length > 0) {
      values.value.targetUserId = userList.value[0].userId
    }
  }
  catch (error: any) {
    console.error('获取用户列表失败:', error)
    message.error(error.response?.data?.msg || ($t('myPoint.messages.fetchUserListFail') as string))
    userList.value = []
  }
}

async function assign() {
  showAssignModal.value = true
  await getUserList()
}

async function handleConfirm() {
  // 验证分配数量
  if (!values.value.amount || values.value.amount <= 0) {
    message.warning($t('myPoint.messages.inputAmount'))
    return
  }

  try {
    const operateType = values.value.flowType === 'increase' ? 1 : 2
    const params: AllocateParams = {
      operateType,
      amount: values.value.amount,
      targetUserId: values.value.targetUserId,
      remark: '',
    }
    await Api.allocate(params, { enterpriseId: user.value.enterpriseId! })
    message.success($t('myPoint.messages.assignSuccess'))
    resetAll()
    useUserStore().fetchUpdateUserInfo()
  }
  catch (error: any) {
    console.error('兔点分配失败:', error)
    message.error(error.response?.data?.msg || ($t('myPoint.messages.assignFail') as string))
  }
}

function resetAll() {
  showAssignModal.value = false
  values.value = {
    targetUserId: '',
    amount: 0,
    flowType: 'increase',
    assetType: 1,
    remark: '',
  }
}

const totalFlowInfo = ref<FlowTotalResponse>({
  balanceExpense: 0,
  balanceIncome: 0,
  pointsExpense: 0,
  pointsIncome: 0,
})
async function getFlowTotal() {
  try {
    const { data } = await Api.getFlowTotal()
    totalFlowInfo.value = data
  }
  catch (error: any) {
    console.error('获取流水汇总失败:', error)
    message.error(error.response?.data?.msg || ($t('myPoint.messages.fetchTotalFail') as string))
  }
}

onMounted(async () => {
  await getFlowTotal()
})
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] flex flex-col gap-16px rounded-16px font-['PingFang_SC'] min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <div class="p-24px box-border flex flex-col items-start rounded-16px bg-#FFFFFF">
      <div class="flex items-center justify-center">
        <img
          src="@/assets/icon/rabbit-dot.svg"
          class="size-24px"
        >
        <div class="text-16px text-#000000 font-bold ml-2px">
          {{ $t('myPoint.title') }}
        </div>
      </div>
      <div class="mt-12px flex items-center w-950px gap-180px">
        <template v-if="isManager">
          <div class="flex flex-col">
            <div class="text-12px text-#606060">
              {{ $t('myPoint.labels.totalPoints') }}
            </div>
            <div class="text-33px text-#000000 font-bold font-din">
              {{ user.enterpriseTotalPoints }}
            </div>
          </div>
          <div class="flex flex-col">
            <div class="text-12px text-#606060">
              {{ $t('myPoint.labels.allocatablePoints') }}
            </div>
            <div class="text-33px text-#000000 font-bold font-din">
              {{ user.enterpriseUnallocatedPoints }}
            </div>
          </div>
          <div class="flex flex-col">
            <div class="text-12px text-#606060">
              {{ $t('myPoint.labels.employeeTotalPoints') }}
            </div>
            <div class="text-33px text-#000000 font-bold font-din">
              {{ Number(user.enterpriseTotalPoints) - Number(user.enterpriseUnallocatedPoints) }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col">
            <div class="text-33px text-#000000 font-bold font-din">
              {{ Number(user.points ?? 0) }}
            </div>
          </div>
        </template>
      </div>
      <div
        v-if="isManager"
        class="mt-12px flex gap-8px"
      >
        <n-button
          size="large"
          ghost
          color="#000000"
          class="w-76px h-36px rounded-8px"
          @click="assign"
        >
          {{ $t('myPoint.actions.assign') }}
        </n-button>
        <n-button
          size="large"
          type="primary"
          color="#FF6A00"
          class="w-76px h-36px rounded-8px"
          @click="recharge"
        >
          {{ $t('myPoint.actions.recharge') }}
        </n-button>
      </div>
    </div>
    <div class="flex flex-col flex-1 rounded-16px p-24px box-border gap-16px bg-#FFFFFF">
      <div class="w-full flex items-center justify-between">
        <div class="c-#000000 text-16px font-bold font-['PingFang_SC']">
          {{ $t('myPoint.labels.detail') }}
        </div>
        <div class="flex gap-6px">
          <div class="font-['PingFang_SC']">
            {{ $t('myPoint.labels.income') }}:
            <span class="c-#FF4E47">
              {{ totalFlowInfo.pointsIncome }}
            </span>
          </div>
          <div class="font-['PingFang_SC']">
            {{ $t('myPoint.labels.expense') }}:
            <span class="c-#19C906">
              {{ totalFlowInfo.pointsExpense }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex-1">
        <pro-data-table
          class="size-full"
          :columns="columns"
          row-key="no"
          v-bind="tableProps"
          row-class-name="font-['PingFang_SC']"
          :theme-overrides="{
            tdTextColor: 'rgba(0,0,0,0.75)',
          }"
          :pagination="{
            ...tableProps.pagination,
            showQuickJumper: true,
          }"
        />
      </div>
    </div>
  </div>
  <n-modal
    v-model:show="showAssignModal"
    :bordered="false"
    :title="$t('myPoint.modal.title')"
    preset="card"
    :auto-focus="false"
    class="w-460px h-410px bg-#FFF rounded-24px"
    @cancel="resetAll"
  >
    <n-scrollbar class="w-full h-280px px-5px">
      <div class="size-full w-95% flex flex-col gap-8px px-5px">
        <div class="font-['PingFang_SC']">
          <span class="c-red">*</span>
          {{ $t('myPoint.modal.selectEmployee') }}
        </div>
        <n-config-provider
          :theme-overrides="{
            common: {
              primaryColor: '#000',
            },
          }"
        >
          <n-radio-group
            v-model:value="values.targetUserId"
            name="radiogroup"
          >
            <n-space wrap>
              <n-radio
                v-for="user in userList"
                :key="user.userId"
                :value="user.userId"
              >
                {{ user.nickname }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-config-provider>
        <div class="mt-4px flex-col flex rounded-8px bg-#F7F7F7 px-8px py-4px box-border">
          <div class="text-12px c-#606060">
            {{ $t('myPoint.modal.employeeAvailablePoints') }}：<span class="c-#000">{{ selectedUserPoints }}</span>
          </div>
          <div class="text-12px c-#606060">
            {{ $t('myPoint.modal.allocatablePoints') }}：<span class="c-#000">{{ user.enterpriseUnallocatedPoints }}</span>
          </div>
        </div>
        <div class="mt-8px">
          <span class="c-red">*</span>
          {{ $t('myPoint.modal.assign') }}
        </div>
        <n-input-group>
          <n-select
            v-model:value="values.flowType"
            :style="{ width: '33%' }"
            :options="[
              { label: $t('myPoint.modal.increase'), value: 'increase' },
              { label: $t('myPoint.modal.decrease'), value: 'decrease' },
            ]"
          />
          <n-input-number
            v-model:value="values.amount"
            clearable
            :style="{ width: '66%' }"
            :min="0"
            :placeholder="$t('myPoint.modal.amountPlaceholder')"
          />
        </n-input-group>
        <div class="mt-8px">
          {{ $t('myPoint.modal.remark') }}
        </div>
        <n-input
          v-model:value="values.remark"
          :placeholder="$t('myPoint.modal.remarkPlaceholder')"
          class="mb-10px"
        />
      </div>
    </n-scrollbar>
    <template #footer>
      <div class="w-full flex justify-end gap-x-8px">
        <n-button
          type="tertiary"
          size="small"
          @click="resetAll"
        >
          {{ $t('common.often.cancel') }}
        </n-button>
        <n-button
          color="#000"
          size="small"
          @click="handleConfirm"
        >
          {{ $t('myPoint.modal.confirmAssign') }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
:deep(.n-data-table__pagination) {
  justify-content: center !important;
}
</style>
