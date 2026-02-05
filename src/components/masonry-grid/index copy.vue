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
  loadMore: () => Promise<void> // 父组件提供加载下一页方法
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
const isLoading = ref(false)
const threshold = 200 // 提前触发加载

// ------------------ Masonry & 渐入 ------------------
function calcColumns(width: number) {
  const { minColumnWidth, gutter } = props
  const col = Math.floor((width + gutter) / (minColumnWidth + gutter))
  columns.value = Math.max(1, col)
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
}

async function renderItem(itemEl: HTMLElement) {
  const id = itemEl.dataset.id
  if (!id || renderedIds.has(id))
    return
  renderedIds.add(id)

  itemEl.style.opacity = '0'
  const img = itemEl.querySelector('img')

  if (img) {
    await new Promise<void>((resolve) => {
      imagesLoaded(img, () => {
        masonry?.appended?.([itemEl])
        masonry?.layout?.()
        itemEl.style.transition = 'opacity 0.3s'
        itemEl.style.opacity = '1'
        resolve()
      })
    })
  }
  else {
    masonry?.appended?.([itemEl])
    masonry?.layout?.()
    itemEl.style.transition = 'opacity 0.3s'
    itemEl.style.opacity = '1'
  }
}

// ------------------ 懒加载 ------------------
function initIntersectionObserver() {
  if (!containerRef.value)
    return
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement
        if (entry.isIntersecting) {
          renderItem(target)
          io?.unobserve(target)
        }
      })
    },
    { root: null, rootMargin: '200px', threshold: 0.1 },
  )

  const items = containerRef.value.querySelectorAll<HTMLElement>('.masonry-item')
  items.forEach(item => io?.observe(item))
}

watch(
  () => props.list,
  async () => {
    await nextTick()
    const items = containerRef.value?.querySelectorAll<HTMLElement>('.masonry-item')
    items?.forEach((item) => {
      const id = item.dataset.id
      if (id && !renderedIds.has(id))
        io?.observe(item)
    })
  },
  { deep: true },
)

// ------------------ 滚动到底部自动加载 ------------------
function onScroll() {
  if (!containerRef.value || isLoading.value)
    return

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const viewportHeight = window.innerHeight
  const containerBottom = containerRef.value.getBoundingClientRect().bottom + scrollTop

  if (scrollTop + viewportHeight + threshold >= containerBottom) {
    isLoading.value = true
    props.loadMore().finally(() => {
      isLoading.value = false
    })
  }
}

onMounted(async () => {
  await nextTick()
  const el = containerRef.value
  if (!el)
    return

  calcColumns(el.clientWidth)
  initMasonry()
  initIntersectionObserver()

  ro = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width
    calcColumns(width)
    masonry?.layout?.()
  })
  ro.observe(el)

  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  ro?.disconnect()
  io?.disconnect()
  masonry?.destroy?.()
  masonry = null
  window.removeEventListener('scroll', onScroll)
})
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
      class="masonry-item mb-24px"
      :data-id="item.id ?? index"
    >
      <slot :item="item" />
    </div>
  </div>
</template>

<style scoped>
.grid-sizer,
.masonry-item {
  width: calc((100% - (var(--columns) - 1) * var(--gutter)) / var(--columns));
}

.gutter-sizer {
  width: var(--gutter);
}

.masonry-item {
  opacity: 0;
  transition: opacity 0.3s;
}
</style>
