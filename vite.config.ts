import path from 'node:path' 
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { ProNaiveUIResolver } from 'pro-naive-ui-resolver' 
import UnoCSS from 'unocss/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
// import { analyzer } from 'vite-bundle-analyzer'
import { createHtmlPlugin } from 'vite-plugin-html'
import { preferenceConfig } from './preference'

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd())
  return {
    optimizeDeps: {
      include: [
        'vue',
        'pinia',
        'naive-ui',
        'lodash-es',
        'vue-router',
        'pro-naive-ui',
        '@vueuse/core',
      ],
    },
    define: {
      __DEV__: mode === 'development',
    },
    plugins: [
      vue(),
      vueJsx(),
      createHtmlPlugin({
        inject: {
          data: {
            title: preferenceConfig.app.title,
          },
        },
      }),
      Components({
        resolvers: [
          {
            type: 'component',
            resolve: (name: string) => {
              const components = [
                { name: 'ProPage', from: '@/components/page' },
                { name: 'ProIconifyIcons', from: '@/components/iconify-icons' },
              ]
              const comp = components.find(comp => comp.name === name)
              if (comp) {
                return {
                  name: comp.name,
                  from: comp.from,
                }
              }
            },
          },
          NaiveUiResolver(),
          ProNaiveUIResolver(),
        ],
        dirs: [],
        dts: 'typings/components.d.ts',
      }),
      UnoCSS(),
      // vitePluginFakeServer({
      //   logger: false,
      //   include: ['mock'],
      // }),
      // analyzer(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@root': path.resolve(__dirname, './'),
        '@pro/router': path.resolve(__dirname, './packages/router/src/index.ts'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: {
            'naive-ui': ['naive-ui'],
            'lodash-es': ['lodash-es'],
            'vue-router': ['vue-router'],
            'vueuse': ['@vueuse/core'],
            'pro-naive-ui': ['pro-naive-ui'],
            'vue': ['vue'],
            'pinia': ['pinia'],
            'iconify': ['@iconify/vue'],
          },
        },
      },
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
    css: {
      transformer: 'lightningcss',
    },
    server: {
      proxy: {
        '/iconify': {
          target: 'https://api.iconify.design',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/iconify/, ''),
        },
        '^/mj-api': {
          // target: 'https://xiaotu.xtkp.top/api',
          target: 'https://xiaotu-test.pinstyles.cn/api',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/mj-api/, ''),
        },
      },
    },
    // 生产环境配置
    define: {
      __DEV__: mode === 'development',
      'import.meta.env.VITE_API_PREFIX_URL': JSON.stringify(process.env.VITE_API_PREFIX_URL || 'https://www.xtkp.top/api'),
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(process.env.VITE_APP_TITLE || '小兔快跑'),
    },
  }
})
