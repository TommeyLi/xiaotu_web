<script setup lang="ts">
import imagesLoaded from 'imagesloaded'
import Masonry from 'masonry-layout'
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

interface Props {
  list: any[]
  minColumnWidth?: number
  gutter?: number
}

const props = withDefaults(defineProps<Props>(), {
  minColumnWidth: 260,
  gutter: 24,
})

const containerRef = ref<HTMLDivElement | null>(null)
const columns = ref<number | null>(null)

let masonry: Masonry | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null

const renderedIds = new Set<any>()
const loadedMap = ref(new Map<any, boolean>())

/** 用于区分「整表替换」与「仅追加」 */
const prevListLength = ref(0)
const prevFirstId = ref<unknown>(undefined)

/* ------------------ 工具方法 ------------------ */
function calcColumns(width: number) {
  const { minColumnWidth, gutter } = props
  const col = Math.floor((width + gutter) / (minColumnWidth + gutter))
  columns.value = Math.max(1, col)
}

function destroyAll() {
  // 销毁 Masonry
  masonry?.destroy?.()
  masonry = null

  // 销毁 IO
  io?.disconnect()
  io = null

  // 清空已渲染记录
  renderedIds.clear()

  // 清理 DOM 残留样式
  const items = containerRef.value?.querySelectorAll<HTMLElement>('.masonry-item')
  items?.forEach((el) => {
    el.style.opacity = '0'
    el.style.position = ''
    el.style.top = ''
    el.style.left = ''
    el.style.transform = ''
  })
}

function initMasonry() {
  if (!containerRef.value || masonry || !columns.value)
    return

  masonry = new Masonry(containerRef.value, {
    itemSelector: '.masonry-item',
    columnWidth: '.grid-sizer',
    gutter: '.gutter-sizer',
    percentPosition: true,
    transitionDuration: '0s',
  })

  masonry?.reloadItems?.()
  masonry?.layout?.()
}

async function renderItem(itemEl: HTMLElement) {
  const id = itemEl.dataset.id
  if (!id || renderedIds.has(id))
    return

  renderedIds.add(id)
  console.log('开始渲染', id)
  loadedMap.value.set(id, false)
  itemEl.style.opacity = '0'

  const img = itemEl.querySelector('img')!

  // await new Promise<void>((resolve) => {
  //   if (!img) {
  //     resolve()
  //     return
  //   }
  //   imagesLoaded(img, () => resolve())
  // })

  const imgLoad = imagesLoaded(img)

  imgLoad.on('done', () => {
    console.log('所有图片加载完成')
    loadedMap.value.set(id, true)
    nextTick(() => {
      masonry?.layout?.()
    })
  })

  // masonry?.appended?.([itemEl])
  masonry?.layout?.()

  itemEl.style.transition = 'opacity 0.3s'
  itemEl.style.opacity = '1'
}

/* ------------------ 懒渲染 ------------------ */
function initIntersectionObserver() {
  if (!containerRef.value)
    return

  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          renderItem(entry.target as HTMLElement)
          io?.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '200px', threshold: 0.1 },
  )

  const items = containerRef.value.querySelectorAll<HTMLElement>('.masonry-item')
  items.forEach(item => io?.observe(item))
}

function layoutAfterImagesLoaded() {
  if (!containerRef.value || !masonry)
    return

  imagesLoaded(containerRef.value, () => {
    masonry?.reloadItems?.()
    masonry?.layout?.()
  })
}

/** 仅对尚未观察的新 item 做 IntersectionObserver 观察（用于追加场景） */
function observeNewItems() {
  if (!containerRef.value || !io)
    return

  const items = containerRef.value.querySelectorAll<HTMLElement>('.masonry-item')
  items.forEach((el) => {
    const id = el.dataset.id
    if (id != null && !renderedIds.has(id))
      io?.observe(el)
  })
}

/* ------------------ 监听 list：区分整表替换 vs 仅追加 ------------------ */
watch(
  () => props.list,
  async (value) => {
    if (!containerRef.value)
      return

    const len = value.length
    const firstId = value[0]?.id ?? value[0] ?? 0
    const isReplace
      = len < prevListLength.value
        || (prevFirstId.value !== undefined && firstId !== prevFirstId.value)
        || (prevListLength.value === 0 && len > 0)

    if (isReplace) {
      destroyAll()
      await nextTick()

      initMasonry()
      layoutAfterImagesLoaded()
      initIntersectionObserver()

      prevListLength.value = len
      prevFirstId.value = firstId
      return
    }

    if (len > prevListLength.value && masonry) {
      await nextTick()

      masonry?.reloadItems?.()
      masonry?.layout?.()
      observeNewItems()

      prevListLength.value = len
    }
  },
  { immediate: true, deep: true },
)

/* ------------------ 生命周期 ------------------ */
onMounted(async () => {
  console.log('mounted')
  await nextTick()
  const el = containerRef.value
  if (!el)
    return

  calcColumns(el.clientWidth)
  initMasonry()
  layoutAfterImagesLoaded()
  initIntersectionObserver()

  const list = props.list
  if (list.length > 0) {
    prevListLength.value = list.length
    prevFirstId.value = list[0]?.id ?? list[0] ?? 0
  }

  ro = new ResizeObserver((entries) => {
    calcColumns(entries[0].contentRect.width)
    masonry?.reloadItems?.()
    masonry?.layout?.()
  })
  ro.observe(el)
})

onBeforeUnmount(() => {
  destroyAll()
  ro?.disconnect()
})

function findLoadingImg(item: any, index: number) {
  return loadedMap.value.get(item.id ?? index)
}
</script>

<template>
  <div
    v-show="columns !== null"
    ref="containerRef"
    class="w-full"
    :style="{
      '--columns': columns || 4,
      '--gutter': `${gutter}px`,
    }"
  >
    <div class="grid-sizer" />
    <div class="gutter-sizer" />

    <div
      v-for="(item, index) in list"
      :key="item.id ?? index"
      class="masonry-item mb-18px"
      :data-id="item.id ?? index"
    >
      <div
        class="item-inner"
        :style="{
          paddingTop: `${(item.height / item.width) * 100 || 100}%`,
        }"
      >
        <div
          v-if="!findLoadingImg(item, index)"
          class="skeleton"
        />

        <div
          v-show="findLoadingImg(item, index)"
          class="real-content"
        >
          <slot
            :item="item"
            :index="index"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-sizer,
.masonry-item {
  width: calc((100% - 50px) / 4);
}

.gutter-sizer {
  width: var(--gutter);
}

.masonry-item {
  opacity: 0;
  transition: opacity 0.3s;
}

.item-inner {
  position: relative;
  width: 100%;
}

/* 骨架假高度，比如 4:3 */
.skeleton {
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
  border-radius: 8px;
}

/* 真内容覆盖骨架 */
.skeleton,
.real-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
