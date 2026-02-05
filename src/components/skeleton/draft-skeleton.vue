<template>
  <div
    v-for="n in 15"
    :key="n"
    class="skeleton-item"
    :style="{ animationDelay: `${n * 50}ms` }"
  >
    <!-- 图片骨架 -->
    <div class="skeleton-image">
      <div class="skeleton-shimmer" />
    </div>

    <!-- 名称骨架 -->
    <div class="skeleton-name">
      <div class="skeleton-shimmer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
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
