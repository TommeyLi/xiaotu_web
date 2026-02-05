<script setup lang="ts">
import Decimal from 'decimal.js'
import { computed, ref, watch } from 'vue'

interface Props {
  title: string
  modeOptions: Array<{ label: string, value: string }>
  // legacy dual-value API
  upValue?: number
  downValue?: number
  // new single signed value API (-negMax..0..posMax)
  value?: number
  upKey: string
  downKey: string
  max?: number
  step?: number
  precision?: number
  dynamicMax?: boolean
  upMax?: number
  downMax?: number
}

interface Emits {
  (e: 'update:upValue', value: number): void
  (e: 'update:downValue', value: number): void
  (e: 'update:value', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 是否使用单值模式（新API）
const isSingle = computed(() => props.value !== undefined)

// 当前模式，单值模式根据正负值自动选择；否则默认为第一个选项
const initialMode: string = (() => {
  if (props.value !== undefined) {
    const v = props.value ?? 0
    return v < 0 ? props.upKey : props.downKey
  }
  return props.modeOptions[0]?.value || ''
})()
const currentMode = ref<string>(initialMode)

// 当前最大值，根据模式动态计算
const currentMax = computed(() => {
  // 新单值模式：根据正负分别取最大绝对值
  if (isSingle.value) {
    // 优先使用 upMax/downMax（可非对称），否则回退到统一 max
    if (currentMode.value === props.upKey && props.upMax !== undefined) {
      return Math.abs(props.upMax)
    }
    if (currentMode.value === props.downKey && props.downMax !== undefined) {
      return Math.abs(props.downMax)
    }
    const m = props.max ?? 100
    return Math.abs(m)
  }
  // 兼容旧的动态最大值逻辑
  if (props.dynamicMax) {
    return currentMode.value === props.upKey ? (props.upMax || 100) : (props.downMax || 100)
  }
  return props.max || 100
})

// 当前值，根据模式动态计算
const currentValue = computed({
  get: () => {
    if (isSingle.value) {
      const raw = props.value ?? 0
      // UI 始终展示非负的幅度值
      return Math.min(Math.abs(raw), currentMax.value)
    }
    return currentMode.value === props.upKey ? (props.upValue ?? 0) : (props.downValue ?? 0)
  },
  set: (value: number) => {
    if (isSingle.value) {
      const clamped = Math.max(0, Math.min(value, currentMax.value))
      let signed = currentMode.value === props.upKey ? -clamped : clamped
      // 规避 -0，统一输出 0
      if (Object.is(signed, -0))
        signed = 0
      emit('update:value', signed)
      return
    }
    if (currentMode.value === props.upKey) {
      emit('update:upValue', value)
    }
    else {
      emit('update:downValue', value)
    }
  },
})

// 监听模式变化，确保数据同步
watch(currentMode, (newMode) => {
  // 单值模式：切换时反转符号
  if (isSingle.value) {
    const v = props.value ?? 0
    if (v === 0) {
      emit('update:value', 0)
    }
    else {
      emit('update:value', -v)
    }
    return
  }
  // 旧模式：模式切换时，保持当前值不变到对应通道
  const value = currentValue.value
  if (newMode === props.upKey) {
    emit('update:upValue', value)
  }
  else {
    emit('update:downValue', value)
  }
})

// 处理输入
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value)

  // 如果输入为空或无效值，重置为0
  if (Number.isNaN(value)) {
    currentValue.value = 0
    return
  }

  // 限制在最小值和最大值之间
  const minValue = 0
  const maxValue = currentMax.value
  const clampedValue = Math.max(minValue, Math.min(value, maxValue))

  // 如果输入值被限制，更新输入框显示值
  if (clampedValue !== value) {
    target.value = clampedValue.toString()
  }

  currentValue.value = clampedValue
}

// 处理失焦
function handleBlur(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value)

  // 如果输入为空或无效值，重置为0
  if (Number.isNaN(value)) {
    currentValue.value = 0
    target.value = '0'
    return
  }

  // 限制在最小值和最大值之间
  const minValue = 0
  const maxValue = currentMax.value
  const clampedValue = Math.max(minValue, Math.min(value, maxValue))

  // 更新输入框显示值和当前值
  target.value = clampedValue.toString()
  currentValue.value = clampedValue
}

// 增加数值
function increment() {
  const step = props.step || 0.1
  const current = new Decimal(currentValue.value)
  const stepDecimal = new Decimal(step)
  const maxValue = new Decimal(currentMax.value)

  const newValue = current.plus(stepDecimal)
  const clampedValue = Decimal.min(newValue, maxValue)

  // 如果有 precision，保留相应的小数位数
  if (props.precision !== undefined) {
    currentValue.value = Number(clampedValue.toDecimalPlaces(props.precision))
  }
  else {
    currentValue.value = clampedValue.toNumber()
  }
}

// 减少数值
function decrement() {
  const step = props.step || 0.1
  const current = new Decimal(currentValue.value)
  const stepDecimal = new Decimal(step)
  const minValue = new Decimal(0)

  const newValue = current.minus(stepDecimal)
  const clampedValue = Decimal.max(newValue, minValue)

  // 如果有 precision，保留相应的小数位数
  if (props.precision !== undefined) {
    currentValue.value = Number(clampedValue.toDecimalPlaces(props.precision))
  }
  else {
    currentValue.value = clampedValue.toNumber()
  }
}
</script>

<template>
  <div class="w-full h-99px rounded-12px border-1px border-solid border-#E7E7E7 p-16px flex flex-col gap-8px box-border">
    <div class="flex items-center justify-between">
      <div class="text-14px font-bold c-#000000">
        {{ title }}
      </div>
      <div class="number-input-wrapper relative">
        <input
          :value="currentValue"
          type="number"
          :min="0"
          :max="currentMax"
          :step="props.step || 0.1"
          class="number-input w-30px h-20px px-4px pr-20px text-14px border-1px border-solid border-#EAEAEA rounded-4px outline-none"
          @input="handleInput"
          @blur="handleBlur"
        >
        <div class="absolute right-2px top-0 h-full flex flex-col justify-center gap-1px">
          <button
            type="button"
            class="flex items-center justify-center w-12px h-8px p-0 border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity"
            @click="increment"
          >
            <img
              src="@/assets/icon/up.svg"
              class="w-full h-5px object-contain"
              alt="increase"
            >
          </button>
          <button
            type="button"
            class="flex items-center justify-center w-12px h-8px p-0 border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity"
            @click="decrement"
          >
            <img
              src="@/assets/icon/down.svg"
              class="w-full h-5px object-contain"
              alt="decrease"
            >
          </button>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-12px">
      <n-select
        v-model:value="currentMode"
        :options="modeOptions"
        size="small"
        class="w-72px h-full text-12px"
        :theme-overrides="{
          peers: {
            InternalSelection: {
              color: '#eeeeee',
              colorActive: '#eeeeee',
              border: 'none',
              borderFocus: '0px solid transparent',
              borderHover: '0px solid transparent',
              borderActive: '0px solid transparent',
              boxShadowFocus: '0 0 0 0px #eeeeee',
              boxShadowHover: '0 0 0 0px #eeeeee',
              boxShadowActive: '0 0 0 0px #eeeeee',
              arrowColor: '#000',
            },
          },
        }"
      />
      <n-slider
        v-model:value="currentValue"
        :min="0"
        :max="currentMax"
        :step="props.step || 0.1"
        class="flex-1 h-full flex items-center justify-center"
        :theme-overrides="{
          handleSize: '12px',
          railColor: 'rgba(255, 106, 0, 0.1)',
          railColorHover: 'rgba(255, 106, 0, 0.1)',
        }"
      >
        <template #thumb>
          <img
            src="@/assets/icon/circle.svg"
            class="size-12px"
          >
        </template>
      </n-slider>
    </div>
  </div>
</template>

<style scoped>
/* 隐藏原生 spin button */
.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* Firefox 隐藏 spin button */
.number-input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.number-input-wrapper {
  position: relative;
}

.number-input-wrapper button {
  -webkit-tap-highlight-color: transparent;
}
</style>
