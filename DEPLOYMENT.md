# Vercel 部署指南

## 部署前准备

### 1. 环境变量配置
在 Vercel 项目设置中添加以下环境变量：

```bash
VITE_API_PREFIX_URL=https://www.xtkp.top/api
VITE_ICONIFY_API_PREFIX_URL=https://api.iconify.design
VITE_APP_TITLE=小兔快跑
NODE_ENV=production
```

### 2. 构建配置
确保使用正确的构建命令：
```bash
pnpm build
# 或
npm run build
```

## 常见问题解决

### API 404 问题
- 确认后端 API 服务正常运行
- 检查 API 地址配置是否正确
- 验证网络连接和防火墙设置

### CORS 跨域问题
- 后端需要配置正确的 CORS 头部
- 确保 `Access-Control-Allow-Origin` 包含你的域名
- 检查是否需要携带认证信息

### JavaScript 错误处理
- 确保异步操作有适当的错误处理
- 验证 API 响应数据结构
- 添加必要的空值检查

## 本地测试命令

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 生产构建
pnpm build

# 本地预览
pnpm preview
```

## 监控和调试

部署后建议监控：
- 控制台错误日志
- 网络请求状态
- 用户行为分析
- 性能指标

如遇问题，请检查浏览器开发者工具的 Network 和 Console 标签页。