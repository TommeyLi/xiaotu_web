<script setup lang="ts">
import type { AddAddressItem, AddressItem } from './index.api'
import { codeToText, regionData } from 'element-china-area-data'
import { useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { $t } from '@/locales/locales'
import { Api } from './index.api'

interface Props {
  show: boolean
  isEditMode: boolean
  addressData?: AddressItem | null
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'save', data: AddressItem): void
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  addressData: null,
})

const emit = defineEmits<Emits>()
const message = useMessage()

// 计算属性处理 show 状态
const showModal = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit('update:show', value)
  },
})

// 表单数据
const formData = ref<AddAddressItem & { id?: string, region?: string | null }>({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: 0,
  region: null,
})

// 递归查找树形数组中的节点
function findRegionCode(regions: any[], targetLabel: string): string | null {
  for (const region of regions) {
    if (region.label === targetLabel) {
      return region.value
    }
    if (region.children && region.children.length > 0) {
      const found = findRegionCode(region.children, targetLabel)
      if (found) {
        return found
      }
    }
  }
  return null
}

// 根据省市区名称生成完整的region编码
function generateRegionCode(province: string, city: string, district: string): string | null {
  const provinceCode = findRegionCode(regionData, province)
  if (!provinceCode)
    return null

  const provinceData = regionData.find(item => item.value === provinceCode)
  if (!provinceData?.children)
    return null

  const cityCode = findRegionCode(provinceData.children, city)
  if (!cityCode)
    return null

  const cityData = provinceData.children.find(item => item.value === cityCode)
  if (!cityData?.children)
    return null

  const districtCode = findRegionCode(cityData.children, district)
  if (!districtCode)
    return null

  return districtCode
}

// 监听弹窗显示状态，初始化表单数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.isEditMode && props.addressData) {
      // 根据省市区生成完整的region编码
      const regionCode = generateRegionCode(
        props.addressData.province,
        props.addressData.city,
        props.addressData.district,
      )

      // 编辑模式，填充现有数据
      formData.value = {
        receiverName: props.addressData.receiverName,
        receiverPhone: props.addressData.receiverPhone,
        province: props.addressData.province,
        city: props.addressData.city,
        district: props.addressData.district,
        detailAddress: props.addressData.detailAddress,
        isDefault: props.addressData.isDefault,
        region: regionCode || null, // 使用生成的region编码
      }
    }
    else {
      // 新增模式，重置表单
      resetForm()
    }
  }
})

// 重置表单
function resetForm() {
  formData.value = {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: 0,
    region: null,
  }
}

// 关闭弹窗
function closeModal() {
  emit('update:show', false)
  resetForm()
}

// 监听弹窗显示状态变化
watch(() => props.show, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// 格式化地址为省市区数组
function formatRegionToArr(region: string) {
  return [
    codeToText[region.slice(0, 2)],
    codeToText[region.slice(0, 4)],
    codeToText[region.slice(0, 6)],
  ]
}

// 保存地址
async function saveAddress() {
  // 表单验证
  if (!formData.value.receiverName?.trim()) {
    message.warning($t('addressManage.modal.messages.inputReceiverName'))
    return
  }
  if (formData.value.receiverName.trim().length > 20) {
    message.warning($t('addressManage.modal.messages.receiverNameTooLong'))
    return
  }

  if (!formData.value.receiverPhone?.trim()) {
    message.warning($t('addressManage.modal.messages.inputPhone'))
    return
  }
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(formData.value.receiverPhone.trim())) {
    message.warning($t('addressManage.modal.messages.invalidPhone'))
    return
  }

  if (!formData.value.region) {
    message.warning($t('addressManage.modal.messages.selectRegion'))
    return
  }

  if (!formData.value.detailAddress?.trim()) {
    message.warning($t('addressManage.modal.messages.inputDetailAddress'))
    return
  }
  if (formData.value.detailAddress.trim().length > 200) {
    message.warning($t('addressManage.modal.messages.detailAddressTooLong'))
    return
  }

  try {
    const [province, city, district] = formatRegionToArr(formData.value.region!)

    const addressData: AddAddressItem = {
      receiverName: formData.value.receiverName,
      receiverPhone: formData.value.receiverPhone,
      province,
      city,
      district,
      detailAddress: formData.value.detailAddress,
      isDefault: formData.value.isDefault,
    }

    if (props.isEditMode && props.addressData) {
      // 编辑模式
      await Api.updateAddress({ ...addressData, id: props.addressData.addressId })
      message.success($t('addressManage.modal.messages.updateSuccess'))
    }
    else {
      // 新增模式
      await Api.addAddress(addressData)
      message.success($t('addressManage.modal.messages.addSuccess'))
    }

    emit('save', addressData as any)
    closeModal()
  }
  catch (error: any) {
    console.error('保存地址失败:', error)
    message.error(error.response?.data?.msg || ($t('addressManage.modal.messages.saveFail') as string))
  }
}

// 监听选择变化
function handleChange(val: string) {
  console.log('当前选中编码：', val, regionData)
}
</script>

<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        primaryColor: '#000',
        primaryColorHover: '#000',
      },
    }"
  >
    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEditMode ? $t('addressManage.modal.editTitle') : $t('addressManage.modal.addTitle')"
      style="width: 500px;border-radius: 24px;"
    >
      <div class="space-y-24px">
        <!-- 姓名 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('addressManage.modal.labels.name') }}</label>
          <n-input
            v-model:value="formData.receiverName"
            :placeholder="$t('addressManage.modal.placeholders.receiverName')"
            clearable
            maxlength="20"
          />
        </div>

        <!-- 手机号码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('addressManage.modal.labels.phone') }}</label>
          <n-input
            v-model:value="formData.receiverPhone"
            :placeholder="$t('addressManage.modal.placeholders.phone')"
            clearable
            maxlength="11"
            show-count
          />
        </div>

        <!-- 地址信息 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('addressManage.modal.labels.region') }}</label>
          <n-cascader
            v-model:value="formData.region"
            :placeholder="$t('addressManage.modal.placeholders.region')"
            clearable
            filterable
            :options="regionData as any"
            expand-trigger="hover"
            check-strategy="child"
            @update:value="handleChange"
          />
        </div>

        <!-- 详细地址 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('addressManage.modal.labels.detailAddress') }}</label>
          <n-input
            v-model:value="formData.detailAddress"
            :placeholder="$t('addressManage.modal.placeholders.detailAddress')"
            clearable
            maxlength="200"
            show-count
          />
        </div>

        <!-- 设为默认地址 -->
        <div>
          <n-checkbox
            v-model:checked="formData.isDefault"
            :checked-value="1"
            :unchecked-value="0"
          >
            {{ $t('addressManage.modal.labels.setDefault') }}
          </n-checkbox>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <n-button
            :theme-overrides="{
              textColor: '#000',
              textColorHover: '#000',
              border: '1px solid #000',
              borderHover: '1px solid #000',
            }"
            @click="closeModal"
          >
            {{ $t('common.often.cancel') }}
          </n-button>
          <n-button
            type="primary"
            color="#000"
            @click="saveAddress"
          >
            {{ $t('common.often.save') }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </n-config-provider>
</template>
