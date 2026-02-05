<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 999,
  disabled: false,
})

const emit = defineEmits<Emits>()

// 内部输入值，用于处理用户输入过程中的显示
const inputValue = ref(props.modelValue.toString())

// 监听外部 modelValue 变化，同步到内部输入值
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue.toString()
})

/** 处理输入框失去焦点事件 */
function handleBlur() {
  const value = Number(inputValue.value)
  console.log('handleBlur', value, inputValue.value)

  // 处理空值、非数字输入或小于最小值的情况
  if (Number.isNaN(value) || inputValue.value === '' || value < props.min) {
    emit('update:modelValue', props.min)
    inputValue.value = props.min.toString()
    return
  }

  // 确保数量在有效范围内
  if (value > props.max) {
    emit('update:modelValue', props.max)
    inputValue.value = props.max.toString()
  }
  else {
    const finalValue = Math.floor(value)
    emit('update:modelValue', finalValue)
    inputValue.value = finalValue.toString()
  }
}

function decrease() {
  if (props.modelValue > props.min && !props.disabled)
    emit('update:modelValue', props.modelValue - 1)
}

function increase() {
  if (props.modelValue < props.max && !props.disabled)
    emit('update:modelValue', props.modelValue + 1)
}

/** 检查减号按钮是否应该禁用 */
const isDecreaseDisabled = computed(() => props.modelValue <= props.min || props.disabled)

/** 检查加号按钮是否应该禁用 */
const isIncreaseDisabled = computed(() => props.modelValue >= props.max || props.disabled)
</script>

<template>
  <div class="flex items-center">
    <!-- 减号按钮 -->
    <button
      class="w-37px h-33px rounded-l-8px rounded-r-0px border-solid border-0.5px border-#CCCCCC flex items-center justify-center transition-all duration-200"
      :class="[
        isDecreaseDisabled
          ? 'bg-#f5f5f5 border-#e0e0e0 cursor-not-allowed opacity-50'
          : 'bg-white border-#ddd hover:border-#ff6a00 hover:bg-#fff3ea cursor-pointer',
      ]"
      :disabled="isDecreaseDisabled"
      @click="decrease"
    >
      <icon
        icon="fluent:subtract-28-filled"
        class="size-16px"
        :class="isDecreaseDisabled ? 'text-#999' : 'text-#333'"
      />
    </button>

    <!-- 数量输入框 -->
    <input
      v-model="inputValue"
      type="number"
      :min="min"
      :max="max"
      :disabled="disabled"
      class="w-79px h-33px box-border rounded-0px border-0.5px border-solid border-#CCCCCC border-x-none text-center text-14px focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
      @blur="handleBlur"
    >

    <!-- 加号按钮 -->
    <button
      class="w-37px h-33px rounded-r-8px rounded-l-0px border-0.5px border-solid border-#CCCCCC flex items-center justify-center transition-all duration-200"
      :class="[
        isIncreaseDisabled
          ? 'bg-#f5f5f5 border-#e0e0e0 cursor-not-allowed opacity-50'
          : 'bg-white border-#ddd hover:border-#ff6a00 hover:bg-#fff3ea cursor-pointer',
      ]"
      :disabled="isIncreaseDisabled"
      @click="increase"
    >
      <icon
        icon="material-symbols:add"
        class="size-16px"
        :class="isIncreaseDisabled ? 'text-#999' : 'text-#333'"
      />
    </button>
  </div>
</template>
