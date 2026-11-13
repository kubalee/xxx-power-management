# XXX用电管理本地原型

基于 Vue 3、Vue Router、Vite 和 ECharts 的用电管理演示项目，包含用电概览、监测中心、异常中心、设备中心和配置管理。

## 启动

在项目根目录使用 Node.js 20.19+ 或 22.12+。

~~~powershell
npm ci
npm run dev
~~~

开发地址为 [127.0.0.1:4173](http://127.0.0.1:4173/newlogin)。生产构建和本地预览使用以下命令。

~~~powershell
npm run build
npm run preview
~~~

生产预览地址为 [127.0.0.1:4174](http://127.0.0.1:4174/newlogin)。

部署到子路径时，为构建指定访问前缀，例如 `npm run build -- --base=/electrical/`。静态服务器需要将该前缀下的页面路由回退到同目录的 `index.html`。

## 演示流程

使用预填的本地账号 **demo** 和密码 **demo2026** 登录。勾选「保持登录」会延长本地模拟会话，仅保存登录标记。右上角用户菜单可退出。找回密码可用示例手机号 **13800138000** 和演示验证码 **123456**。

- 首页切换异常与能耗时间段，点击待处置告警进入事件列表。
- 监测中心查询监测点并打开详情，选择监测点后可编辑、分类、挪动或删除。
- 异常中心按时间、事件类型、单位和状态筛选用电告警，查看事件、处理和模拟同步。
- 设备中心筛选设备、新增主机、查看设备、同步设备和生成监测点。导入模板和导出使用本地 CSV。
- 配置管理支持按用户名和组织筛选，新增、编辑、删除用户以及演示密码修改。
- 侧栏提供各模块的二级页面。表格和空态页面支持相应的筛选、查询或重置操作。

所有业务操作读写页面内存中的示例数据，刷新后恢复初始数据。站内导航和界面资源由本地服务提供。

## 视口

桌面登录页以 16:9 构图居中。首页以 16:9 为布局基准，按桌面视口的可用宽高展开。管理页按实际可用空间布局。手机视口会重排导航、筛选、卡片和图表，宽表在自己的容器内滚动。

## 界面资源

界面图标使用 [Element UI](https://github.com/ElemeFE/element/tree/v2.15.14) 的图标字体，附带 [MIT 许可证](src/assets/element-icons.LICENSE.txt)。

配电室图片由内置 ImageGen 生成，以 JPEG 格式随项目运行。[图片文件](src/assets/login-distribution-room.jpg)

> Use case: photorealistic-natural. Asset type: left-side image for the desktop sign-in page of a modern electricity management application. Create a vertical architectural photograph of a modern electrical distribution room. A row of tall graphite-gray metal switchgear cabinets with restrained teal indicator lights and fine ventilation details recedes into the distance, lit with soft blue daylight and a narrow cyan edge. The setting is orderly and credible, photographed at eye level with an editorial architectural lens. Deep navy, slate gray and muted teal, with no glowing floor graphics or futuristic effects. Keep the top-left softly shaded for a small white product wordmark overlay and reserve the brightest detail for the center-right. Portrait 4:5 framing. No lettering, numbers, brand marks, interfaces, people, sparks, or watermarks.
