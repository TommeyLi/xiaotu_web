// 无论图片多奇葩，最终都归一到一组常见比例里
const COMMON_RATIOS = [
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
]

const RATIO_TO_RESOLUTION: Record<string, string> = {
  '1:1': '1000x1000',
  '16:9': '1600x900',
  '9:16': '900x1600',
  '4:3': '1200x900',
  '3:4': '900x1200',
  '3:2': '1500x1000',
  '2:3': '1000x1500',
}

/**
 * 根据图片 URL 获取最接近的常见比例（如 "16:9"）
 */
export function getImageRatio(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight

      if (!w || !h) {
        reject(new Error('Invalid image size'))
        return
      }

      const realRatio = w / h

      let closest = COMMON_RATIOS[0]
      let minDiff = Math.abs(realRatio - closest.value)

      for (const r of COMMON_RATIOS) {
        const diff = Math.abs(realRatio - r.value)
        if (diff < minDiff) {
          minDiff = diff
          closest = r
        }
      }

      resolve(closest.label)
    }

    img.onerror = () => reject(new Error('Image load failed'))

    img.src = url
  })
}

export function getResolutionFromRatioLabel(ratioLabel: string): string {
  return RATIO_TO_RESOLUTION[ratioLabel] || '1600x900'
}
