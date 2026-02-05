<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ========== 类型定义 ==========
interface Point {
  x: number
  y: number
}

interface RectShape {
  type: 'rect'
  x: number
  y: number
  w: number
  h: number
  text?: string
  index?: number
  id: number
}

interface CircleShape {
  type: 'circle'
  x: number
  y: number
  w: number
  h: number
  text?: string
  index?: number
  id: number
}

interface PolygonShape {
  type: 'polygon'
  points: Point[]
  text?: string
  index?: number
  id?: number
}

export type Annotation = RectShape | CircleShape | PolygonShape

type ToolType = 'rect' | 'circle' | 'polygon' | 'move'

// ========== Props ==========
interface Props {
  showActionPanel: boolean
  imageUrl: string
  index: number
  annotations: Annotation[]
  images: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:annotations': [annotations: Annotation[]]
  'switch-image': [index: number]
  'undo': []
  'clearCurrent': []
}>()

// ========== 响应式状态 ==========
const originalImageObj = ref<HTMLImageElement | null>(null)
const toastMsg = ref<string>('')

// Canvas 相关
const canvasWrapper = ref<HTMLDivElement | null>(null)
const mainCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const transform = ref({
  x: 0,
  y: 0,
  scale: 1,
})

// 工具状态
const currentTool = ref<ToolType>('rect')
const isPanning = ref<boolean>(false)
const panStart = ref<Point>({ x: 0, y: 0 })
const isSpacePressed = ref<boolean>(false)
const isDrawing = ref<boolean>(false)
const drawStart = ref<Point>({ x: 0, y: 0 })
const currentShape = ref<Annotation | null>(null)
const polygonPoints = ref<Point[]>([])
const annotations = ref<Annotation[]>([])

// 预览
const previewUrl = ref<string>('')

const signBgImg = ref<HTMLImageElement | null>(null)

// ========== 计算属性 ==========
const cursorClass = computed(() => {
  if (isPanning.value)
    return 'cursor-grabbing'
  if (currentTool.value === 'move' || isSpacePressed.value)
    return 'cursor-grab'
  return 'cursor-crosshair'
})

// ========== 工具函数 ==========
function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => (toastMsg.value = ''), 2000)
}

function processImage(url: string) {
  const img = new Image()
  img.crossOrigin = 'anonymous' // 如果图片跨域，需要设置
  img.onload = () => {
    originalImageObj.value = img
    // annotations.value = []
    polygonPoints.value = []
    nextTick(() => {
      resetView()
      currentTool.value = 'rect'
    })
  }
  img.src = url
}

function clearAnnotations() {
  emit('clearCurrent')
}

// ========== 视图操作 ==========
function resetView() {
  if (!originalImageObj.value || !canvasWrapper.value)
    return
  const cw = canvasWrapper.value.clientWidth
  const ch = canvasWrapper.value.clientHeight
  const iw = originalImageObj.value.width
  const ih = originalImageObj.value.height
  const s = Math.min((cw - 40) / iw, (ch - 40) / ih)
  transform.value = {
    scale: s,
    x: (cw - iw * s) / 2,
    y: (ch - ih * s) / 2,
  }
  draw()
}

function handleWheel(e: WheelEvent) {
  if (!props.imageUrl || !mainCanvas.value)
    return
  e.preventDefault()
  const rect = mainCanvas.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const ns = transform.value.scale - e.deltaY * 0.001
  applyZoom(cx, cy, Math.min(Math.max(0.1, ns), 10))
}

function applyZoom(cx: number, cy: number, ns: number) {
  const r = ns / transform.value.scale
  transform.value.x = cx - (cx - transform.value.x) * r
  transform.value.y = cy - (cy - transform.value.y) * r
  transform.value.scale = ns
  draw()
}

function screenToImg(sx: number, sy: number): Point {
  return {
    x: (sx - transform.value.x) / transform.value.scale,
    y: (sy - transform.value.y) / transform.value.scale,
  }
}

// ========== 鼠标事件 ==========
function handleMouseDown(e: MouseEvent) {
  if (!props.imageUrl || !mainCanvas.value)
    return
  // 如果点击的是工具栏，不处理
  if ((e.target as HTMLElement).closest('.toolbar'))
    return
  const rect = mainCanvas.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  if (isSpacePressed.value || e.button === 1 || currentTool.value === 'move') {
    isPanning.value = true
    panStart.value = { x: mx - transform.value.x, y: my - transform.value.y }
    return
  }

  const ip = screenToImg(mx, my)
  if (currentTool.value === 'polygon') {
    if (polygonPoints.value.length > 0) {
      const first = polygonPoints.value[0]
      const screenFirst = {
        x: first.x * transform.value.scale + transform.value.x,
        y: first.y * transform.value.scale + transform.value.y,
      }
      if (Math.hypot(mx - screenFirst.x, my - screenFirst.y) < 15) {
        finishPolygon()
        return
      }
    }
    polygonPoints.value.push(ip)
    draw()
  }
  else {
    isDrawing.value = true
    drawStart.value = ip
    currentShape.value = {
      type: currentTool.value,
      x: ip.x,
      y: ip.y,
      w: 0,
      h: 0,
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!props.imageUrl || !mainCanvas.value)
    return
  const rect = mainCanvas.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  if (isPanning.value) {
    transform.value.x = mx - panStart.value.x
    transform.value.y = my - panStart.value.y
    draw()
  }
  else if (isDrawing.value && currentShape.value) {
    const ip = screenToImg(mx, my)
    currentShape.value.w = ip.x - drawStart.value.x
    currentShape.value.h = ip.y - drawStart.value.y
    draw()
  }
}

function handleMouseUp() {
  if (isPanning.value) {
    isPanning.value = false
    return
  }
  if (isDrawing.value && currentShape.value) {
    isDrawing.value = false
    const shape = currentShape.value
    const valid
      = Math.abs((shape as any).w) > 5 || Math.abs((shape as any).h) > 5

    if (valid) {
      // Normalize rect
      if (shape.type === 'rect') {
        if (shape.w < 0) {
          shape.x += shape.w
          shape.w = Math.abs(shape.w)
        }
        if (shape.h < 0) {
          shape.y += shape.h
          shape.h = Math.abs(shape.h)
        }
      }
      annotations.value = [...annotations.value, { ...shape, text: '', index: props.index }]
      console.log('added annotation, emitting', annotations.value)
      emit('update:annotations', annotations.value)
    }
    currentShape.value = null
    draw()
  }
}

function finishPolygon() {
  if (polygonPoints.value.length < 3)
    return
  annotations.value = [...annotations.value, {
    type: 'polygon',
    points: [...polygonPoints.value],
    text: '',
    index: props.index,
  }]
  emit('update:annotations', annotations.value)
  polygonPoints.value = []
  draw()
}

// ========== 绘制逻辑 ==========
function draw() {
  if (!ctx.value || !mainCanvas.value || !canvasWrapper.value) {
    if (mainCanvas.value && canvasWrapper.value) {
      mainCanvas.value.width = canvasWrapper.value.clientWidth
      mainCanvas.value.height = canvasWrapper.value.clientHeight
      ctx.value = mainCanvas.value.getContext('2d')
    }
    else {
      return
    }
  }

  const c = ctx.value!
  const t = transform.value
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  c.save()
  c.translate(t.x, t.y)
  c.scale(t.scale, t.scale)

  if (originalImageObj.value) {
    c.drawImage(originalImageObj.value, 0, 0)
  }

  c.lineWidth = 2 / t.scale
  c.font = `bold ${14 / t.scale}px Arial`
  c.textAlign = 'center'
  c.textBaseline = 'middle'

  // 已保存标注
  annotations.value.forEach(a => drawShape(c, a, a.id!))

  // 正在绘制的形状
  if (currentShape.value) {
    drawShape(c, currentShape.value, annotations.value.length + 1, true)
  }

  // 多边形辅助线
  if (polygonPoints.value.length > 0) {
    c.beginPath()
    c.strokeStyle = '#FF5500'
    c.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
    polygonPoints.value.forEach(p => c.lineTo(p.x, p.y))
    c.stroke()

    polygonPoints.value.forEach((p, i) => {
      c.beginPath()
      c.fillStyle = i === 0 ? 'rgba(241,196,15,0.6)' : '#fff'
      const radius = (i === 0 ? 8 : 4) / t.scale
      c.arc(p.x, p.y, radius, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    })
  }

  c.restore()
}

function drawShape(c: CanvasRenderingContext2D, s: Annotation, idx: number, isDrawingNow = false) {
  c.strokeStyle = '#FF5500'
  c.beginPath()
  let lx = 0
  let ly = 0

  if (s.type === 'rect') {
    c.rect(s.x, s.y, s.w, s.h)
    lx = s.x
    ly = s.y
  }
  else if (s.type === 'circle') {
    c.ellipse(
      s.x + s.w / 2,
      s.y + s.h / 2,
      Math.abs(s.w / 2),
      Math.abs(s.h / 2),
      0,
      0,
      Math.PI * 2,
    )
    lx = s.x
    ly = s.y
  }
  else if (s.type === 'polygon') {
    c.moveTo(s.points[0].x, s.points[0].y)
    s.points.forEach(p => c.lineTo(p.x, p.y))
    c.closePath()
    lx = s.points[0].x
    ly = s.points[0].y
  }

  c.stroke()

  // if (!isDrawingNow) {
  //   const scale = transform.value.scale
  //   c.beginPath()
  //   c.arc(lx, ly, 10 / scale, 0, Math.PI * 2)
  //   c.fillStyle = '#2c3e50'
  //   c.fill()
  //   c.fillStyle = '#fff'
  //   c.fillText(idx.toString(), lx, ly)
  // }
  if (!isDrawingNow) {
    const scale = transform.value.scale
    // 橙色背景圆形
    const radius = 12 / scale // 24px 直径的一半，按比例缩放
    c.beginPath()
    c.arc(lx, ly, radius, 0, Math.PI * 2)
    c.fillStyle = '#ff5500' // 橙色背景
    c.fill()

    c.fillStyle = '#FFFFFF'
    c.font = `bold ${12 / scale}px Arial`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(idx.toString(), lx, ly)
  }
}

// ========== 预览生成 ==========
function generatePreview() {
  if (!originalImageObj.value)
    return
  showToast('正在生成...')

  const cvs = document.createElement('canvas')
  cvs.width = originalImageObj.value.width
  cvs.height = originalImageObj.value.height
  const gc = cvs.getContext('2d')!
  gc.drawImage(originalImageObj.value, 0, 0)

  gc.lineWidth = 5
  gc.font = 'bold 24px Arial'

  annotations.value.forEach((a, i) => {
    gc.strokeStyle = '#FF5500'
    gc.beginPath()
    let lx = 0
    let ly = 0

    if (a.type === 'rect') {
      gc.rect(a.x, a.y, a.w, a.h)
      lx = a.x
      ly = a.y
    }
    else if (a.type === 'circle') {
      gc.ellipse(
        a.x + a.w / 2,
        a.y + a.h / 2,
        Math.abs(a.w / 2),
        Math.abs(a.h / 2),
        0,
        0,
        Math.PI * 2,
      )
      lx = a.x
      ly = a.y
    }
    else if (a.type === 'polygon') {
      gc.moveTo(a.points[0].x, a.points[0].y)
      a.points.forEach(p => gc.lineTo(p.x, p.y))
      gc.closePath()
      lx = a.points[0].x
      ly = a.points[0].y
    }

    gc.stroke()

    // 序号
    gc.beginPath()
    gc.arc(lx, ly, 20, 0, Math.PI * 2)
    gc.fillStyle = '#2c3e50'
    gc.fill()
    gc.fillStyle = '#fff'
    gc.textAlign = 'center'
    gc.textBaseline = 'middle'
    gc.fillText((i + 1).toString(), lx, ly)

    // 文字标签
    if (a.text) {
      gc.textAlign = 'left'
      const w = gc.measureText(a.text).width
      gc.fillStyle = 'rgba(0,0,0,0.7)'
      gc.fillRect(lx + 25, ly - 15, w + 20, 30)
      gc.fillStyle = '#fff'
      gc.fillText(a.text, lx + 35, ly)
    }
  })

  previewUrl.value = cvs.toDataURL('image/jpeg', 0.9)
}

// ========== 生命周期 ==========
onMounted(() => {
  const img = new Image()
  img.src = new URL('@/assets/icon/sign-bg.svg', import.meta.url).href
  console.log(img.src, '123')
  img.onload = () => {
    signBgImg.value = img
  }
  window.addEventListener('resize', resetView)
  // window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetView)
  // window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// 监听 props.annotations 变化，同步到本地
watch(() => props.annotations, (newVal) => {
  annotations.value = newVal
  if (originalImageObj.value) {
    draw()
  }
}, { immediate: true })

// 监听 showActionPanel 变化
watch(() => props.showActionPanel, (newVal) => {
  if (newVal && props.imageUrl) {
    processImage(props.imageUrl)
  }
}, { immediate: true })

// 监听 imageUrl 变化，重新加载图像
watch(() => props.imageUrl, (newUrl) => {
  if (newUrl && props.showActionPanel) {
    processImage(newUrl)
  }
})

// function handleKeyDown(e: KeyboardEvent) {
//   console.log('111',e.key)
//   if (e.code === 'Space')
//     isSpacePressed.value = true
//   if (e.key === 'h')
//     currentTool.value = 'move'
//   if (e.key === 'r')
//     currentTool.value = 'rect'
//   if (e.key === 'c')
//     currentTool.value = 'circle'
//   if (e.key === 'p')
//     currentTool.value = 'polygon'
// }

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space')
    isSpacePressed.value = false
}

// ========== 暴露方法 ==========
function setTool(tool: ToolType) {
  console.log('222', tool)
  currentTool.value = tool
  polygonPoints.value = []
}

function undo() {
  if (annotations.value.length === 0) {
    showToast('当前图片没有可撤销的标记')
    return
  }
  emit('undo')
}

function removeAnnotation(index: number) {
  annotations.value = annotations.value.filter((_, i) => i !== index)
  emit('update:annotations', annotations.value)
  draw()
}

// 暴露给父组件
defineExpose({
  previewUrl,
  generatePreview,
  clearAnnotations,
  setTool,
  undo,
  removeAnnotation,
})
</script>

<template>
  <div class="size-full box-border">
    <div
      ref="canvasWrapper"
      class="canvas-wrapper"
      :class="cursorClass"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div
        v-if="!imageUrl"
        style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888"
      >
        请传入图片地址
      </div>

      <canvas ref="mainCanvas" />

      <div
        v-if="imageUrl"
        class="zoom-info"
      >
        缩放: {{ Math.round(transform.scale * 100) }}%
      </div>

      <div
        v-if="imageUrl"
        class="toolbar"
      >
        <div
          class="tool-btn"
          :class="{ active: currentTool === 'move' }"
          @click="setTool('move')"
        >
          <img
            class="icon"
            src="@/assets/icon/drag.png"
          >
        </div>
        <div
          class="tool-btn"
          :class="{ active: currentTool === 'rect' }"
          @click="setTool('rect')"
        >
          <img
            class="icon"
            src="@/assets/icon/square.png"
          >
        </div>
        <div
          class="tool-btn"
          :class="{ active: currentTool === 'circle' }"
          @click="setTool('circle')"
        >
          <img
            class="icon"
            src="@/assets/icon/round.png"
          >
        </div>
        <div
          class="tool-btn"
          :class="{ active: currentTool === 'polygon' }"
          @click="setTool('polygon')"
        >
          <img
            class="icon"
            src="@/assets/icon/triangle.png"
          >
        </div>
        <div
          class="tool-btn"
          @click="resetView"
        >
          <img
            class="icon"
            src="@/assets/icon/inSitu.png"
          >
        </div>
        <div
          class="tool-btn"
          @click="undo"
        >
          <img
            class="icon"
            src="@/assets/icon/rollback.png"
          >
        </div>
        <div
          class="tool-btn"
          style="color:var(--error)"
          @click="clearAnnotations"
        >
          <img
            class="icon"
            src="@/assets/icon/delete.png"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 复用原有样式，去除上传相关 */
:root {
  --primary: #332f1f;
  --accent: #2c3e50;
  --bg: #f5f6fa;
  --border: #e0e0e0;
  --error: #d63031;
}
* {
  box-sizing: border-box;
  margin: 0;
  /* padding: 0; */
  outline: none;
  user-select: none;
}
.main-container {
  display: flex;
  height: 100%;
  width: 100%;
}
.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
  flex-shrink: 0;
  z-index: 20;
}
.btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
}
.btn-primary {
  background: var(--primary);
  color: #2c3e50;
}
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #e0e0e0;
  position: relative;
}
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #fff;
}
.canvas-wrapper.cursor-crosshair {
  cursor: crosshair;
}
.canvas-wrapper.cursor-grab {
  cursor: grab;
}
.canvas-wrapper.cursor-grabbing {
  cursor: grabbing;
}
.toolbar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 48px;
  background: #ffffff;
  padding: 17px;
  border-radius: 24px;
  box-shadow:
    0px 20px 50px 0px rgba(0, 0, 0, 0.12),
    0px 0px 0px 0px rgba(0, 0, 0, 0),
    0px 0px 0px 0px rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 50;
}
.tool-btn {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #555;
  .icon {
    width: 20px;
    height: 20px;
  }
}
.tool-btn:hover {
  background: #f0f0f0;
}
.tool-btn.active {
  background: var(--primary);
  color: #2c3e50;
}
.zoom-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  pointer-events: none;
}
.panel-header {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  font-weight: 700;
  font-size: 14px;
  background: #fafafa;
}
.anno-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.anno-idx {
  width: 20px;
  height: 20px;
  background: var(--accent);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.anno-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.anno-remove {
  cursor: pointer;
  color: var(--error);
  font-weight: bold;
}
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.nav-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.nav-btn.active {
  background: var(--primary);
  color: #fff;
}
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 24px;
  border-radius: 50px;
  font-size: 14px;
  z-index: 6000;
}
</style>
