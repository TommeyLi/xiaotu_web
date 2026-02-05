import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'

interface UseFullScreenScaleOptions {
  designWidth: number
  designHeight: number
}

export function useFullScreenScale(
  containerRef: Ref<HTMLElement | null>,
  options: UseFullScreenScaleOptions,
) {
  const { designWidth, designHeight } = options
  const resizeHandler = () => {
    if (!containerRef.value)
      return
    // 计算屏幕实际分辨率宽高比例为 R
    const R = window.innerWidth / window.innerHeight
    // 计算设计稿分辨率宽度与屏幕实际分辨率宽度比 Rw
    const Rw = designWidth / window.innerWidth
    // 计算设计稿分辨率高度与屏幕实际分辨率高度比 为 Rh
    const Rh = designHeight / window.innerHeight
    let width = designWidth
    let height = (designWidth / R)
    let scale = 1 / Rw
    if (Rw < Rh) {
      width = (designHeight * R)
      height = designHeight
      scale = 1 / Rh
    }
    containerRef.value.style.width = `${width}px`
    containerRef.value.style.height = `${height}px`
    containerRef.value.style.transform = `scale(${scale})`
    containerRef.value.style.overflow = `hidden`
    containerRef.value.style.transformOrigin = '0 0'
    document.body.style.overflow = `hidden`
    containerRef.value.style.setProperty('--design-vh', `${height}px`)
    document.documentElement.style.setProperty('--global-transform', `scale(${scale})`)
  }

  onMounted(() => {
    window.addEventListener('resize', resizeHandler)
    resizeHandler()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler)
  })
}
