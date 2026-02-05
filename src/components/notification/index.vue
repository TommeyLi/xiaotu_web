<script setup lang="ts">
import { useNotification } from 'naive-ui'
import { nextTick, onMounted, onUnmounted } from 'vue'

const notification = useNotification()

// 窗口尺寸改变时，重新计算
function handleResize() {
  nextTick(() => {
    const userAvatar = document.querySelector('.user-avatar')
    if (userAvatar) {
      // 获取元素位置信息
      const rect = userAvatar.getBoundingClientRect()
      // 计算距离窗口右边的距离
      const distanceFromRight = (window.innerWidth - rect.right) > 0 ? window.innerWidth - rect.right : 0
      // 创建通知

      // 等待通知DOM渲染完成
      setTimeout(() => {
        // 查找通知容器元素
        const notificationContainers = document.querySelectorAll('.n-notification-container')
        const latestContainer = notificationContainers[notificationContainers.length - 1]

        if (latestContainer && latestContainer instanceof HTMLElement) {
          // 设置right值
          latestContainer.style.right = `${distanceFromRight}px`
        }
      }, 0)
    }
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  notification.create({
    title: '提示',
    content: `您的图片正火速生成中，关闭页面不影响生成，可通过右上角消息通知查看进度`,
    duration: 5000,
  })
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss">
.n-notification-container {
  top: 68px !important;
}
.n-notification-wrapper {
  .n-notification {
    --n-border-radius: 1.5rem !important;
    --n-box-shadow:
      0rem 1.25rem 3.125rem 0rem rgba(0, 0, 0, 0.1), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0) !important;
    --n-padding-left: 1.3125rem !important;
    --n-padding-right: 1.3125rem !important;
    --n-padding-top: 1.3125rem !important;
    --n-padding-bottom: 1.3125rem !important;
    .n-notification__close {
      right: 0.3125rem !important;
      .n-base-icon {
        color: #d1d5db !important;
      }
    }
    .n-notification-main {
      .n-notification-main__header {
        font-family: 'Inter', sans-serif !important;
        font-size: 0.875rem !important;
        font-weight: 900 !important;
        line-height: 1.3125rem !important;
        color: #111111 !important;
      }
      .n-notification-main__content {
        margin-top: 0.625rem;
        font-family: 'Inter', sans-serif !important;
        font-size: 0.75rem;
        font-weight: bold;
        line-height: 1.2188rem;
        color: #6b7280;
      }
    }
  }
}
</style>
