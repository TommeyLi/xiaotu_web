<script setup lang="ts">
import { computed } from 'vue'

// 网格样式
const gridStyle = computed(() => ({
  gridTemplateColumns: 'repeat(auto-fill,minmax(264px,1fr))',
  gap: '15px',
}))
</script>

<template>
  <div class="image-library-skeleton">
    <div
      class="grid"
      :style="gridStyle"
    >
      <div
        v-for="n in 15"
        :key="n"
        class="skeleton-item"
        :style="{ animationDelay: `${n * 50}ms` }"
      >
        <!-- 图片骨架 -->
        <div class="skeleton-image">
          <div class="skeleton-shimmer" />
          <!-- 模拟图片内容的骨架 -->
          <div class="skeleton-image-content">
            <div
              v-for="i in 3"
              :key="i"
              class="skeleton-icon"
              :style="{ animationDelay: `${i * 0.2}s` }"
            />
          </div>
        </div>

        <!-- 名称骨架 -->
        <div class="skeleton-name">
          <div class="skeleton-shimmer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.image-library-skeleton {
  .grid {
    display: grid;
  }

  .skeleton-item {
    opacity: 0;
    animation: fadeIn 0.6s ease-out forwards;

    .skeleton-image {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      height: 264px;
      background: #f8f9fa;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .skeleton-shimmer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);
        background-size: 200% 100%;
        animation: shimmer 2s ease-in-out infinite;
      }

      .skeleton-image-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        gap: 8px;
        opacity: 0.3;

        .skeleton-icon {
          width: 24px;
          height: 24px;
          background: #dee2e6;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
      }
    }

    .skeleton-name {
      position: relative;
      margin-top: 8px;
      padding: 0 4px;
      height: 20px;
      background: #f8f9fa;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .skeleton-shimmer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);
        background-size: 200% 100%;
        animation: shimmer 2s ease-in-out infinite;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* 响应式网格布局 */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
    gap: 12px !important;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
    gap: 10px !important;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
    gap: 8px !important;
  }
}
</style>
