# Max 分层 SVG 房间设计

## 目标

把当前单层 PNG 小狗替换为保持白色线稿、西瓜和珊瑚色气质的内联分层 SVG，让身体、头、耳朵、尾巴和四条腿可以独立获得动画 class；同时把房间背景从单一色块扩展为有窗景、墙面层次、植物、架子、桌面和环境微动的“小世界”。

## 边界

- 不改变登录、聊天、记忆和 API 数据结构。
- 不引入新的图片服务或运行时网络请求；SVG 和场景装饰随桌面端构建。
- 保留 `RoomActivity` 的 idle/thinking/speaking 状态，并让它驱动小狗和环境的动作强度。
- 所有装饰为 `aria-hidden`，小狗保留 `role="img"` 和中文可访问名称。
- `prefers-reduced-motion` 下仍保留静态可读画面。

## 结构

`MaxDogSprite` 输出一个带稳定 `data-testid` 的 SVG：`dog-tail`、`dog-body`、`dog-head`、两个耳朵、四条腿和 `dog-watermelon`。根元素继续使用 `max-dog` 与活动状态 class，以兼容现有房间测试和布局。

`MaxRoom` 在原有房间状态之上增加背景层：墙面渐变、窗框与窗外云/植物剪影、挂画、层板和桌面小物；现有便签、书、本子、杯子、蒸汽、地毯和尘埃继续保留。所有层都用 CSS class 控制，不把动画逻辑塞进聊天组件。

## 动作

- idle：身体呼吸、尾巴轻摆、耳朵偶尔抖动、四肢小幅交替。
- thinking：头部轻点、前腿靠近西瓜、尾巴减慢。
- speaking：头部和耳朵短促回应，四肢有一次轻弹。
- 环境：窗光漂移、云/植物轻摆、蒸汽上升、尘埃漂浮；减少动作模式统一降为静态。

## 验证

- 先写 `MaxDogSprite`/`MaxRoom` 组件测试，证明每个部件都存在且 activity class 正确。
- 通过桌面端测试、lint、typecheck、build、secret 检查和 Windows 打包。
- 安装后检查构建产物包含 SVG 部件与环境 class，再启动已安装程序做一次可见验收。
