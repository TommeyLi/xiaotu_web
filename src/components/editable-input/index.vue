<script setup lang="ts">
import type { InputProps } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { $t } from '@/locales/locales'

interface Props {
  modelValue: string
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
  size?: InputProps['size']
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  readonly: false,
  disabled: false,
  size: 'medium',
})

const emit = defineEmits<Emits>()

const isEditing = ref(false)
const editValue = ref('')

// 同步外部 modelValue
watchEffect(() => {
  if (!isEditing.value) {
    editValue.value = props.modelValue
  }
})

// 展示内容
const displayValue = computed(() => props.modelValue || (props.placeholder || $t('components.editableInput.placeholder')))

function startEdit() {
  if (props.disabled || props.readonly)
    return
  isEditing.value = true
  emit('edit')
}

function saveEdit() {
  if (editValue.value !== props.modelValue) {
    emit('update:modelValue', editValue.value)
    emit('change', editValue.value)
  }
  isEditing.value = false
  emit('save')
}

function cancelEdit() {
  editValue.value = props.modelValue
  isEditing.value = false
  emit('cancel')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    saveEdit()
  }
  else if (event.key === 'Escape') {
    cancelEdit()
  }
}

function handleBlur() {
  saveEdit()
}
</script>

<template>
  <div class="size-full">
    <!-- 只读模式 -->
    <div
      v-if="!isEditing"
      class="flex items-center justify-center gap-8px w-full min-h-32px px-12px py-6px rounded-6px group/input"
      :class=" props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
    >
      <span
        class="text"
      >
        {{ displayValue }}
      </span>
      <img
        v-if="!disabled && !readonly"
        src="@/assets/icon/edit.svg"
        class="size-18px opacity-0 group-hover/input:opacity-100 transition-opacity"
        @click="startEdit"
      >
    </div>

    <!-- 编辑模式 -->
    <n-input
      v-else
      v-model:value="editValue"
      :placeholder="placeholder || $t('components.editableInput.placeholder')"
      :size="size"
      :disabled="disabled"
      maxlength="20"
      show-count
      class="w-full"
      autofocus
      @keydown="handleKeydown"
      @blur="handleBlur"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.n-input) {
  border-radius: 6px;
}
.text {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: bold;
  line-height: 19.5px;
  color: #111111;
}
</style>
