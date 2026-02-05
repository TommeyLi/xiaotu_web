<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { AddressItem } from './index.api'
import { useDialog, useMessage } from 'naive-ui'
import { computed, h, onMounted, ref, watch } from 'vue'
import { $t } from '@/locales/locales'
import AddressModal from './address-modal.vue'
import { Api } from './index.api'

const message = useMessage()
const dialog = useDialog()

const isCheckedAll = ref(false)
const selectedAddressIds = ref<string[]>([])
const showAddressModal = ref(false)
const isEditMode = ref(false)
const editingAddress = ref<AddressItem | null>(null)
const loading = ref(false)

const addressList = ref<AddressItem[]>([])

// 获取地址列表
async function getAddressList() {
  try {
    loading.value = true
    const { data } = await Api.getCollectedTemplateList()
    addressList.value = data
  }
  catch (error: any) {
    console.error('获取地址列表失败:', error)
    message.error(error.response?.data?.msg || ($t('addressManage.messages.fetchFail') as string))
    addressList.value = []
  }
  finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  getAddressList()
})

// 计算属性：是否全选
const isAllSelected = computed(() => {
  return addressList.value.length > 0 && selectedAddressIds.value.length === addressList.value.length
})

// 监听选中项变化，更新全选状态
watch(selectedAddressIds, () => {
  // 只有当选中项数量等于总数量时才显示为全选状态
  // 如果用户取消其中任何一个，全选按钮就会变为未选中状态
  isCheckedAll.value = isAllSelected.value
}, { deep: true })

function createColumns(): DataTableColumns<AddressItem> {
  return [
    {
      type: 'selection',
    },
    {
      title: $t('addressManage.table.receiver') as string,
      key: 'receiverName',
      width: 120,
    },
    {
      title: $t('addressManage.table.region') as string,
      key: 'province',
      width: 160,
      render: (row: AddressItem) => {
        return h('span', {}, `${row.province}${row.city}${row.district}`)
      },
    },
    {
      title: $t('addressManage.table.detailAddress') as string,
      key: 'detailAddress',
    },
    {
      title: $t('addressManage.table.phone') as string,
      key: 'receiverPhone',
      width: 120,
    },
    {
      title: $t('addressManage.table.actions') as string,
      key: 'actions',
      width: 200,
      render: (row: AddressItem) => {
        const isDefault = row.isDefault === 1
        return h('div', { class: 'flex gap-8px' }, [
          h('span', {
            class: isDefault ? 'text-#999 cursor-not-allowed font-["PingFang_SC"]' : 'text-#000 cursor-pointer font-["PingFang_SC"]',
            onClick: isDefault ? undefined : () => setAsDefault(row.addressId),
          }, isDefault ? $t('addressManage.actions.default') : $t('addressManage.actions.setDefault')),
          h('span', {
            class: 'text-#000 cursor-pointer font-["PingFang_SC"]',
            onClick: () => editAddress(row),
          }, $t('addressManage.actions.edit')),
          h('span', {
            class: 'text-#FF4E47 cursor-pointer font-["PingFang_SC"]',
            onClick: () => deleteSingleAddress(row),
          }, $t('common.often.delete')),
        ])
      },
    },
  ]
}

function addAddress() {
  isEditMode.value = false
  editingAddress.value = null
  showAddressModal.value = true
}

// 设为默认地址
async function setAsDefault(addressId: string) {
  try {
    // 先将所有地址设为非默认
    addressList.value.forEach((item) => {
      item.isDefault = 0
    })
    // 设置当前地址为默认
    const address = addressList.value.find(item => item.addressId === addressId)
    if (address) {
      address.isDefault = 1
      // 调用API更新默认地址
      await Api.updateAddress({
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        province: address.province,
        city: address.city,
        district: address.district,
        detailAddress: address.detailAddress,
        isDefault: 1,
        id: address.addressId,
      })
      message.success($t('addressManage.messages.setDefaultSuccess'))
    }
  }
  catch (error: any) {
    console.error('设置默认地址失败:', error)
    message.error(error.response?.data?.msg || ($t('addressManage.messages.setDefaultFail') as string))
    // 恢复原状态
    await getAddressList()
  }
}

// 修改地址
function editAddress(address: AddressItem) {
  isEditMode.value = true
  editingAddress.value = address
  showAddressModal.value = true
}

// 单个删除地址
function deleteSingleAddress(address: AddressItem) {
  dialog.warning({
    title: $t('addressManage.dialogs.deleteTitle'),
    content: $t('addressManage.dialogs.deleteContent'),
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        await Api.deleteAddress({ addressId: address.addressId.toString() })
        const index = addressList.value.findIndex(item => item.addressId === address.addressId)
        if (index > -1) {
          addressList.value.splice(index, 1)
          // 从选中列表中移除
          const selectedIndex = selectedAddressIds.value.findIndex(id => id === address.addressId)
          if (selectedIndex > -1) {
            selectedAddressIds.value.splice(selectedIndex, 1)
          }
          message.success($t('addressManage.messages.deleteSuccess'))
        }
      }
      catch (error: any) {
        console.error('删除地址失败:', error)
        message.error(error.response?.data?.msg || ($t('addressManage.messages.deleteFail') as string))
      }
    },
  })
}

// 批量删除
function batchDelete() {
  if (selectedAddressIds.value.length === 0) {
    message.warning($t('addressManage.messages.selectToDelete'))
    return
  }

  dialog.warning({
    title: $t('addressManage.dialogs.batchDeleteTitle'),
    content: $t('addressManage.dialogs.batchDeleteContent', { count: selectedAddressIds.value.length }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        await Api.batchDeleteAddress(selectedAddressIds.value)
        // 从地址列表中移除选中的地址
        addressList.value = addressList.value.filter(item => !selectedAddressIds.value.includes(item.addressId))
        message.success($t('addressManage.messages.batchDeleteSuccess', { count: selectedAddressIds.value.length }) as string)
        selectedAddressIds.value = []
      }
      catch (error: any) {
        console.error('批量删除地址失败:', error)
        message.error(error.response?.data?.msg || ($t('addressManage.messages.batchDeleteFail') as string))
      }
    },
  })
}

// 处理表格选中状态变化
function handleCheck(rowKeys: (string | number)[]) {
  selectedAddressIds.value = rowKeys.map(key => key.toString())
}

// 处理地址保存
function handleAddressSave() {
  // 重新获取地址列表
  showAddressModal.value = false
  getAddressList()
  editingAddress.value = null
}
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] bg-#FFF rounded-16px p-24px box-border flex flex-col">
    <n-scrollbar
      :x-scrollable="false"
      class="w-full h-full"
    >
      <div class="size-full rounded-16px min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
        <div class="w-full flex justify-end sticky top-0 left-0 bg-#FFF z-10 outline outline-1 outline-white ">
          <div class="flex gap-16px items-center justify-center">
            <n-button @click="batchDelete">
              {{ $t('addressManage.actions.batchDelete') }}
            </n-button>
            <n-button
              color="#000"
              class="rounded-10px"
              @click="addAddress"
            >
              <template #icon>
                <img src="@/assets/icon/add-white.svg">
              </template>
              {{ $t('addressManage.actions.add') }}
            </n-button>
          </div>
        </div>
        <div class="flex mt-24px">
          <n-data-table
            :columns="createColumns()"
            :data="addressList"
            :row-key="(row: AddressItem) => row.addressId"
            :checked-row-keys="selectedAddressIds"
            :loading="loading"
            row-class-name="font-['PingFang_SC']"
            :theme-overrides="{
              tdTextColor: 'rgba(0,0,0,0.75)',
            }"
            @update:checked-row-keys="handleCheck"
          />
        </div>
      </div>
    </n-scrollbar>

    <!-- 地址弹窗组件 -->
    <address-modal
      v-model:show="showAddressModal"
      :is-edit-mode="isEditMode"
      :address-data="editingAddress"
      @save="handleAddressSave"
    />
  </div>
</template>
