<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/* ======================
 * 数据结构
 * ====================== */
type EditorNode
  = | { type: 'text', value: string }
    | { type: 'marker', id: number }

export interface MarkerType {
  id: number
  text: string
  imageIndex: number
  point: number
}

const props = defineProps<{
  markers: MarkerType[]
}>()

console.log('marker-editor props.markers:', props.markers)

/* ======================
 * 基础状态
 * ====================== */
const model = ref<EditorNode[]>([])
const editorRef = ref<HTMLDivElement | null>(null)

/* ======================
 * 中文输入法处理
 * ====================== */
const isComposing = ref(false)

/* ======================
 * 编辑器光标 Range
 * ====================== */
const savedRange = ref<Range | null>(null)

/* ======================
 * 已使用的 marker
 * ====================== */
const usedMarkers = computed(() => {
  return new Set(
    model.value
      .filter(n => n.type === 'marker')
      .map(n => n.id),
  )
})

const editorContent = ref('')

/* ======================
 * 创建 marker DOM
 * ====================== */
function createMarkerNode(id: number) {
  const span = document.createElement('span')
  span.className = 'marker-token'
  span.contentEditable = 'false'
  span.dataset.id = String(id)
  const inner = document.createElement('span')
  inner.textContent = String(id)

  // 组装
  span.appendChild(inner)
  return span
}

/* ======================
 * 保存编辑器内光标
 * ====================== */
function saveRange() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0)
    return

  const range = sel.getRangeAt(0)
  if (editorRef.value?.contains(range.startContainer)) {
    savedRange.value = range.cloneRange()
  }
}

/* ======================
 * 插入 marker 到光标
 * ====================== */
function insertMarkerAtCursor(id: number) {
  const el = editorRef.value
  if (!el)
    return

  el.focus()

  const sel = window.getSelection()
  let range = savedRange.value

  // 没有有效光标，插到末尾
  if (!range) {
    range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
  }

  sel?.removeAllRanges()
  sel?.addRange(range)

  range.deleteContents()

  const marker = createMarkerNode(id)
  // 不再插入空格
  range.insertNode(marker)

  // 把光标放到 marker 后面
  range.setStartAfter(marker)
  range.collapse(true)

  sel?.removeAllRanges()
  sel?.addRange(range)
  savedRange.value = range.cloneRange()
}

/* ======================
 * 点击插入 marker
 * ====================== */
function insertMarker(id: number) {
  if (usedMarkers.value.has(id))
    return

  insertMarkerAtCursor(id)
  syncModelFromDOM()
}

/* ======================
 * DOM → AST
 * ====================== */
function syncModelFromDOM() {
  if (isComposing.value)
    return

  const el = editorRef.value
  if (!el)
    return
  editorContent.value = el.textContent?.trim() || ''

  const nodes: EditorNode[] = []

  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      nodes.push({ type: 'text', value: node.textContent })
    }
    else if (
      node.nodeType === Node.ELEMENT_NODE
      && (node as HTMLElement).classList.contains('marker-token')
    ) {
      nodes.push({
        type: 'marker',
        id: Number((node as HTMLElement).dataset.id),
      })
    }
  })

  model.value = nodes
}

/* ======================
 * AST → DOM
 * ====================== */
function renderModelToDOM() {
  const el = editorRef.value
  if (!el)
    return

  // 清空现有内容
  el.innerHTML = ''

  model.value.forEach((node) => {
    if (node.type === 'text') {
      const textNode = document.createTextNode(node.value)
      el.appendChild(textNode)
    }
    else if (node.type === 'marker') {
      const markerNode = createMarkerNode(node.id)
      el.appendChild(markerNode)
    }
  })

  // 更新 editorContent
  editorContent.value = el.textContent?.trim() || ''
}

/* ======================
 * Backspace 删除 marker
 * ====================== */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Backspace')
    return

  const sel = window.getSelection()
  const node = sel?.anchorNode

  if (node?.parentElement?.classList.contains('marker-token')) {
    const markerEl = node.parentElement
    const prev = markerEl.previousSibling

    markerEl.remove()

    if (prev) {
      const range = document.createRange()
      range.setStartAfter(prev)
      range.collapse(true)
      sel?.removeAllRanges()
      sel?.addRange(range)
      savedRange.value = range.cloneRange()
    }

    syncModelFromDOM()
    e.preventDefault()
  }
}

/* ======================
 * 中文输入法
 * ====================== */
function onCompositionStart() {
  isComposing.value = true
}

function onCompositionEnd() {
  isComposing.value = false
  syncModelFromDOM()
}

function finalPointsIndex() {
  let index = 1
  model.value.forEach((n) => {
    if (n.type !== 'text') {
      index = props.markers.find(t => t.id === n.id)?.imageIndex || 1
    }
  })
  return index
}

const outputText = computed(() => {
  // const preWord = model.value
  //   .map((n) => {
  //     if (n.type === 'text') {
  //       return ''
  //     }
  //     else {
  //       const marker = props.markers.find(t => t.id === n.id)
  //       if (marker) {
  //         return `标记${marker.point}在图片${marker.imageIndex}上,`
  //       }
  //       return ''
  //     }
  //   })
  //   .join('')
  const mainText = model.value
    .map(n => (n.type === 'text' ? n.value : `${props.markers.find(t => t.id === n.id)?.text}的内容`) || '')
    .join('')
  return `去掉图片上面标注的数字和框选,${mainText}`
})
function setModel(value: EditorNode[]) {
  model.value = value
  renderModelToDOM()
}

defineExpose({ outputText, model, setModel, finalPointsIndex })

/* ======================
 * 监听 markers 变化，移除不存在的 marker
 * ====================== */
watch(() => props.markers, (newMarkers) => {
  console.log('marker-editor markers changed:', newMarkers)
  const newIds = new Set(newMarkers.map(m => m.id))
  const currentUsed = new Set(
    model.value
      .filter(n => n.type === 'marker')
      .map(n => n.id),
  )
  const toRemove = [...currentUsed].filter(id => !newIds.has(id))

  if (toRemove.length > 0) {
    const el = editorRef.value
    if (el) {
      // 移除 DOM 中的 marker-token
      const markersToRemove = el.querySelectorAll('.marker-token')
      markersToRemove.forEach((markerEl) => {
        if (markerEl instanceof HTMLElement) {
          const id = Number(markerEl.dataset.id)
          if (toRemove.includes(id)) {
            markerEl.remove()
          }
        }
      })
      // 同步 model
      syncModelFromDOM()
    }
  }
}, { deep: true })
</script>

<template>
  <div class="flex flex-col">
    <!-- 标记点 -->
    <div
      v-show="markers.length"
      class="marker-list"
    >
      <div
        v-for="marker in markers"
        :key="marker.id"
        :class="usedMarkers.has(marker.id) ? 'border-#000!' : ''"
        class="flex items-center justify-center border-#E7E7E7 border-1px border-solid border-#E7E7E7 cursor-pointer marker-item"
        @click="insertMarker(marker.id)"
      >
        <div class="marker-sign">
          <span>{{ marker.id }}</span>
        </div>
      </div>
    </div>

    <div class="relative w-full min-h-[190px]">
      <div
        v-show="!editorContent"
        class="absolute z-11 top-16px left-16px pointer-events-none whitespace-pre-line select-none instance"
      >
        <div class="flex flex-col gap-8px">
          <div>示例：</div>
          <div class="flex items-center">
            1、
            <div class="marker-sign">
              1
            </div>
            替换成
            <div class="marker-sign">
              2
            </div>
          </div>
          <div class="flex items-center">
            2、
            <div class="marker-sign">
              1
            </div>
            的表情参考图1中的表情
          </div>
        </div>
      </div>

      <!-- 编辑区 -->
      <div
        ref="editorRef"
        contenteditable
        class="editor relative z-10 min-h-[190px] outline-none"
        @input="syncModelFromDOM"
        @keydown="onKeydown"
        @mouseup="saveRange"
        @keyup="saveRange"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
      />
    </div>

    <!-- 输出 -->
    <div class="output-content">
      输出：{{ outputText }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor {
  min-height: 190px;
  padding: 12px;
  border: 1px solid #e7e7e7;
  border-radius: 12px;
  outline: none;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 16px;
}

.sign {
  width: 20px;
  height: 24px;
  background-image: url('@/assets/icon/sign-bg.svg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    color: #fff;
    font-size: 12px;
    margin-bottom: 4px;
  }
}
</style>

<style lang="scss">
.marker-token {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.25rem;
  user-select: none;
  margin-right: 0.25rem;
  span {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 624.9375rem;
    background: #ff5500;
    box-shadow:
      0rem 0.25rem 0.375rem -0.25rem rgba(255, 85, 0, 0.2),
      0rem 0.625rem 0.9375rem -0.1875rem rgba(255, 85, 0, 0.2),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    font-weight: 900;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.marker-list {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  .marker-item {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    .marker-sign {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 624.9375rem;
      background: #ff5500;
      box-shadow:
        0rem 0.25rem 0.375rem -0.25rem rgba(255, 85, 0, 0.2),
        0rem 0.625rem 0.9375rem -0.1875rem rgba(255, 85, 0, 0.2),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
.instance {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: bold;
  line-height: 1.75rem;
  color: #757575;
  .marker-sign {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 624.9375rem;
    background: #cccccc;
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    font-weight: 900;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 10px;
  }
}
.editor {
  background: #f9fafb;
  border: 0.125rem solid #f9fafb !important;
  padding: 1rem !important;
  &.editor-active,
  &:focus {
    border: 0.125rem solid #ffeee5 !important;
    box-shadow:
      0rem 0.5rem 0.625rem -0.375rem rgba(0, 0, 0, 0.05),
      /* 从 0.1 改为 0.05 */ 0rem 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.05),
      /* 从 0.1 改为 0.05 */ 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    background: white;
  }
}
.output-content {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem;
  color: #6b7280;
  margin-top: 0.75rem;
}
</style>
