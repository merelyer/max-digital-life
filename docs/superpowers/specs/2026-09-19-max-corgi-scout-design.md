# Max Corgi Scout 动态角色设计

## 背景

当前 Max 使用的手绘 SVG 经过多轮调整仍然不像用户想要的狗。用户已确认改用现成的动态卡通角色，不再继续重画角色轮廓。本规格将角色资源改为 OpenPets 目录中的 Corgi Scout 精灵表；聊天、记忆、登录、主动消息、Supabase、Render 和房间数据流保持不变。

素材来源：OpenPets Corgi Scout 目录条目（包含本地 zip 和 spritesheet 链接）。OpenPets 的提交规则要求公开目录中的宠物使用原创、已获授权或 CC0/公版素材；项目会把来源与获取日期写入本地说明文件，便于追溯。

## 目标

- Max 左侧画面显示一个第一眼可识别的动态柯基，而不是手绘几何形体。
- 角色资源随桌面端构建进入本地，不在运行时请求外部图片。
- 继续由 `RoomActivity` 的 `idle`、`thinking`、`speaking` 驱动角色动作。
- 保留房间环境动效、聊天面板、记忆和登录行为。
- 角色加载失败时显示稳定的可读占位状态，不让房间布局塌陷。

## 非目标与边界

- 不复制抖音视频中的角色、画面、文字或动作编排。
- 不引入远程 CDN、运行时下载、第三方脚本或新后端接口。
- 不修改聊天、记忆、登录、Supabase、Render、主动消息和 API 数据结构。
- 不修改当前 `RoomActivity` 联合类型；本次只替换角色渲染和状态映射。
- 不把现有工作树中与本功能无关的修改一起提交。

## 视觉与动画方案

Corgi Scout 的 `1536×1872` WebP 精灵表按 OpenPets 标准排布为 8 列、9 行。行顺序采用官方格式：`idle`、`run right`、`run left`、`waving`、`jumping`、`failed`、`waiting`、`running`、`review`。每格按 `192×208` 计算；透明背景保留，使用 `image-rendering: pixelated` 保持像素边缘清晰。

Max 组件用一个本地精灵容器呈现角色：

- `idle`：循环第一行动画，保持轻微呼吸和眨眼感。
- `thinking`：循环第七行 `waiting`，表现等待/思考。
- `speaking`：循环第四行 `waving`，表现回应用户。

CSS 仅负责精灵表的 `background-position`、步进帧数、尺寸和 `prefers-reduced-motion` 退化，不再对 SVG 部件做假肢体变换。场景背景继续使用现有环境动效；角色层级高于背景、低于状态文字。

## 组件与可访问性契约

`MaxDogSprite` 保留 `activity?: RoomActivity` 属性，根节点改为：

- `role="img"`；可访问名称为 `Max，动态小狗`。
- `data-testid="max-dog-sprite"`。
- 根 class 继续包含 `max-dog` 与 `max-dog-${activity}`。
- `data-testid="max-dog-sprite"` 的元素设置固定宽高比例和背景图，避免精灵加载时布局跳动。

`MaxRoom` 的可见标题改为“动态小狗，住在你的屏幕里”，不再声称角色是线条 SVG；活动标签和聊天语义保持原样。角色图片属于装饰性实现，但根节点仍提供清晰名称，方便用户和测试确认 Max 在场。

## 资源与许可记录

桌面端资源放在 `apps/desktop/public/assets/max/corgi-scout/`：

- `spritesheet.webp`：从 OpenPets Corgi Scout zip 提取的精灵表。
- `SOURCE.md`：来源 URL、素材包 URL、目录条目 URL、获取日期、SHA-256 和本地使用说明。

不把 API key、Supabase 密钥或其他凭据写入资源说明或提交记录。

## 错误与减少动画

- 资源路径是构建时本地路径；不做网络重试。
- 如果背景图无法加载，显示带有 `Max` 名称的简洁占位块，并保持房间和聊天可用。
- `prefers-reduced-motion: reduce` 下固定显示 idle 的第一帧，不执行步进动画或场景位移动画。
- 角色容器始终保留宽高，避免加载/错误状态造成 CLS。

## 验收标准

1. 左侧第一眼能认出是柯基，四肢、耳朵、尾巴和脸部在帧中清楚可见。
2. `idle`、`thinking`、`speaking` 三种活动状态使用不同精灵行，状态 class 稳定可测。
3. 应用离线打开时角色仍显示，不产生外部资源请求。
4. 聊天输入、发送、记忆和登录回归测试不受影响。
5. 桌面端 test、lint、typecheck、build 和 `verify:secrets` 通过。
6. 减少动画设置下角色仍完整可读，聊天仍可操作。
