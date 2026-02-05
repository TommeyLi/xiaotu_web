import type { updateImageResultBody } from './index.api'
import COS from 'cos-js-sdk-v5'
import { ref } from 'vue'
import { useProRequest } from '@/composables/use-pro-request'
import { compressImageToLimit } from '@/utils/file'
import { Api } from './index.api'

export type UploadStatus
  = | 'waiting'
    | 'checking'
    | 'uploading'
    | 'error'
    | 'paused'
    | 'canceled'
    | 'success'

export interface UploadTask {
  id: string
  filename: string
  file: File | Blob
  percent: number
  Key: string
  state: UploadStatus
  url?: string
  error?: string
}

// 全局状态，确保所有组件使用同一个 tasks 引用
let globalTasks: ReturnType<typeof ref<UploadTask[]>> | null = null
let globalCos: COS | null = null
let globalSigned: any = null

export function useUploadImage() {
  // 使用全局的 tasks，确保所有组件共享同一个引用
  if (!globalTasks) {
    globalTasks = ref<UploadTask[]>([])
  }

  const {
    runAsync: runAsyncQuerySigned,
  } = useProRequest(Api.queryPreSignedUrl, {
    manual: true,
  })

  const {
    run: runUpdateImageResult,
  } = useProRequest(Api.updateImageResult, {
    manual: true,
  })

  async function initCos() {
    if (globalCos)
      return globalCos

    const { data } = await runAsyncQuerySigned()
    globalSigned = data
    globalCos = new COS({
      SecretId: globalSigned.tmpSecretId,
      SecretKey: globalSigned.tmpSecretKey,
      SecurityToken: globalSigned.sessionToken,
      StartTime: +globalSigned.startTime,
      ExpiredTime: +globalSigned.expiredTime,
    })

    // 注册全局事件监听器
    globalCos.on('list-update', (data) => {
      if (globalTasks?.value) {
        globalTasks.value.splice(0, globalTasks.value.length, ...data.list)
      }
    })

    return globalCos
  }

  /**
   * 上传图片
   * @param body 图片文件
   * @param isTemp 是否模板图片
   * @returns 上传结果
   * @description 如果isTemp为true，则上传到模板图片文件夹，否则上传到用户上传的图片文件夹
   */
  async function upload(body: File | File[], isTemp: boolean = false) {
    const cos = await initCos()
    let failedList: any[] = []
    let successList: any[] = []
    const originFiles = (Array.isArray(body) ? body : [body])
    // 先压缩
    const processedFiles = await Promise.all(
      originFiles.map(file => compressImageToLimit(file, 10)),
    )
    const fileList = processedFiles.map((f) => {
      // 如果文件名过长，取前几个和后几个字符串组成新的文件名
      const timestamp = Date.now()
      let fileName = f.name.length > 15 ? `${f.name.slice(0, 5)}_${f.name.slice(-5)}` : f.name
      // 在文件扩展名前添加时间戳
      const lastDotIndex = fileName.lastIndexOf('.')
      fileName = lastDotIndex > -1
        ? `${fileName.slice(0, lastDotIndex)}_${timestamp}${fileName.slice(lastDotIndex)}`
        : `${fileName}_${timestamp}`
      // 如果是temp文件，将uploadPath路径的 /user/ 替换成 /user/temp
      const newKey = `${isTemp ? globalSigned.uploadPath.replace('/user/', '/user/temp/') : globalSigned.uploadPath}${fileName}`
      return {
        Bucket: `${globalSigned.bucket}-${globalSigned.appId}`,
        Region: globalSigned.region,
        Key: newKey,
        Body: f,
        SliceSize: 1024 * 1024 * 5,
      }
    })
    await cos.uploadFiles({
      files: fileList,
    }).then(async (data) => {
      failedList = data.files.filter(item => item.error)
      const finallySuccessList = data.files
        .filter(item => !item.error)
        .map((item) => {
          const imageName = item.data.Location.split('/').pop()
          return {
            imageName,
            imageFormat: imageName?.split('.').pop(),
            imageUrl: `${globalSigned.domain}${item.data.Location.substring(item.data.Location.indexOf('/'))}`,
            imageSize: fileList.find(f => f.Body.name === imageName)?.Body.size,
          }
        })
      successList = finallySuccessList
      if (!isTemp) {
        await runUpdateImageResult(finallySuccessList as updateImageResultBody[])
      }
    })
    return { failedList, successList }
  }

  function pause(task: UploadTask) {
    globalCos?.pauseTask(task.id)
  }

  function restart(task: UploadTask) {
    globalCos?.restartTask(task.id)
  }

  function cancel(task: UploadTask) {
    globalCos?.cancelTask(task.id)
  }

  return {
    globalTasks,
    upload,
    pause,
    restart,
    cancel,
  }
}
