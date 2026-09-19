# Max 奶油绒团小狗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Max 的现有几何线稿替换为第一眼可识别、四肢可独立运动的原创奶油绒团小狗，并保留现有房间、聊天、记忆、登录和后端行为。

**Architecture:** 继续使用 `MaxDogSprite` 内联 SVG 作为唯一角色资源，使用 `RoomActivity` 驱动 SVG 部件和场景 CSS class。组件只描述分层形体，CSS 负责动作和减少动画分支；`MaxRoom` 只调整场景层级和可见文案，不承载动画逻辑或聊天逻辑。

**Tech Stack:** React、TypeScript、内联 SVG、现有 CSS、Vitest、Testing Library、Electron/Vite、pnpm。

## Global Constraints

- 不修改登录、聊天、记忆、主动消息、Supabase、Render 或 API 数据结构。
- 不加载远程图片、视频或第三方角色资源；角色必须随桌面端构建。
- 角色不能依赖西瓜、头像裁切、帽子或文字才能被认作小狗。
- 保留 `RoomActivity` 的 `idle`、`thinking`、`speaking`，根 SVG 继续保留 `role="img"` 与可访问名称 `Max，线条小狗`。
- 保留现有稳定 `data-testid`，并在新增节点上使用语义清晰且稳定的测试标识。
- 所有动作必须受 `prefers-reduced-motion` 约束，不能加入不可测试的随机定时器。
- 只提交本功能新增/修改的文件；不要把工作树中已有的其他修改一起提交。

---

### Task 1: 锁定奶油绒团小狗的组件契约

**Files:**
- Modify: `apps/desktop/src/renderer/components/MaxDogSprite.test.tsx`
- Test target: `apps/desktop/src/renderer/components/MaxDogSprite.tsx`

**Interfaces:**
- Consumes: `MaxDogSprite` 的现有 `activity?: RoomActivity` 属性。
- Produces: 可由 SVG 组件稳定提供的主体、头部、耳朵、尾巴、四条腿、四只爪、口鼻、鼻子、项圈和新增面部节点。

- [ ] **Step 1: 写出失败测试，先描述用户可见的狗形结构**

在现有测试中增加以下行为断言：

```tsx
it('keeps a readable puppy silhouette without avatar or fruit parts', () => {
  render(<MaxDogSprite activity="idle" />);

  expect(screen.getByRole('img', { name: 'Max，线条小狗' })).toBeInTheDocument();
  expect(screen.getByTestId('dog-head')).toBeVisible();
  expect(screen.getByTestId('dog-body')).toBeVisible();
  expect(screen.getAllByTestId(/^dog-ear-/)).toHaveLength(2);
  expect(screen.getAllByTestId(/^dog-leg-/)).toHaveLength(4);
  expect(screen.getAllByTestId(/^dog-paw-/)).toHaveLength(4);
  expect(screen.getByTestId('dog-muzzle')).toBeVisible();
  expect(screen.getByTestId('dog-nose')).toBeVisible();
  expect(screen.getByTestId('dog-eye-left')).toBeVisible();
  expect(screen.getByTestId('dog-eye-right')).toBeVisible();
  expect(screen.getByTestId('dog-mouth')).toBeVisible();
  expect(screen.getAllByTestId(/^dog-cheek-/)).toHaveLength(2);
  expect(screen.getByTestId('dog-tail')).toBeVisible();
  expect(screen.queryByTestId('dog-watermelon')).not.toBeInTheDocument();
});

it.each(['idle', 'thinking', 'speaking'] as const)('maps %s to the root activity class', (activity) => {
  render(<MaxDogSprite activity={activity} />);
  expect(screen.getByTestId('max-dog-sprite')).toHaveClass(`max-dog-${activity}`);
});
```

- [ ] **Step 2: 运行测试，确认它确实先失败**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx`

Expected: 新增的测试因尚未提供新的结构/状态断言而失败；若测试立即通过，先检查断言是否只覆盖旧行为，再调整为能区分新契约的断言。

- [ ] **Step 3: 只修改测试契约，不在此步骤改生产组件**

保持现有 `data-testid` 的前缀和可访问名称不变；新增断言只描述结构和状态，不把具体路径坐标、动画关键帧或颜色写进测试。

- [ ] **Step 4: 再次运行测试并记录红灯原因**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx`

Expected: 失败原因明确指向即将替换的角色结构或新增行为，而不是导入错误、测试环境错误或拼写错误。

- [ ] **Step 5: 提交测试契约**

```powershell
git add -- apps/desktop/src/renderer/components/MaxDogSprite.test.tsx
git commit -m "test: define Max puppy sprite contract"
```

### Task 2: 用分层 SVG 重画原创奶油绒团小狗

**Files:**
- Modify: `apps/desktop/src/renderer/components/MaxDogSprite.tsx`
- Test: `apps/desktop/src/renderer/components/MaxDogSprite.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 `MaxDogSprite` 测试和 `RoomActivity`。
- Produces: 一个内联 SVG 根节点 `max-dog-sprite`，包含可独立变换的头、身体、耳朵、尾巴、四肢、口鼻和面部节点。

- [ ] **Step 1: 设计并写入最小分层结构**

替换 `MaxDogSprite` 的 SVG 路径，保持组件签名和可访问标题不变。结构必须按以下顺序分层，避免后腿、尾巴和身体互相遮蔽：

```tsx
<svg className={`max-dog max-dog-${activity}`} viewBox="0 0 360 300" role="img" aria-labelledby="max-dog-title" data-testid="max-dog-sprite">
  <title id="max-dog-title">Max，线条小狗</title>
  <g className="dog-tail" data-testid="dog-tail" />
  <g className="dog-leg dog-leg-back-left" data-testid="dog-leg-back-left"><path /><path className="dog-paw" data-testid="dog-paw-back-left" /></g>
  <g className="dog-leg dog-leg-back-right" data-testid="dog-leg-back-right"><path /><path className="dog-paw" data-testid="dog-paw-back-right" /></g>
  <g className="dog-body" data-testid="dog-body" />
  <g className="dog-leg dog-leg-front-left" data-testid="dog-leg-front-left"><path /><path className="dog-paw" data-testid="dog-paw-front-left" /></g>
  <g className="dog-leg dog-leg-front-right" data-testid="dog-leg-front-right"><path /><path className="dog-paw" data-testid="dog-paw-front-right" /></g>
  <g className="dog-ear dog-ear-left" data-testid="dog-ear-left" />
  <g className="dog-ear dog-ear-right" data-testid="dog-ear-right" />
  <g className="dog-head" data-testid="dog-head" />
  <g className="dog-muzzle" data-testid="dog-muzzle"><ellipse className="dog-nose" data-testid="dog-nose" /></g>
  <g className="dog-collar" data-testid="dog-collar" />
  <g className="dog-face" aria-hidden="true">
    <ellipse className="dog-eye" data-testid="dog-eye-left" />
    <ellipse className="dog-eye" data-testid="dog-eye-right" />
    <path className="dog-mouth" data-testid="dog-mouth" />
    <ellipse className="dog-cheek" data-testid="dog-cheek-left" />
    <ellipse className="dog-cheek" data-testid="dog-cheek-right" />
  </g>
</svg>
```

形体要求：大圆头、短而圆的口鼻、两只下垂耳、紧凑身体、四只清楚落地的小爪和独立可辨认的短卷尾；不保留西瓜节点或头像图片引用。路径使用圆角线帽/连接，内部细节少于旧版本。

- [ ] **Step 2: 运行组件测试，确认生产实现达到绿色**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx`

Expected: `MaxDogSprite.test.tsx` 全部 PASS，且不出现 React key、SVG 属性或可访问名称警告。

- [ ] **Step 3: 检查类型和静态约束**

Run: `pnpm --filter @max/desktop typecheck`

Expected: TypeScript 通过；`activity` 的联合类型和组件属性不发生漂移。

- [ ] **Step 4: 提交 SVG 结构**

```powershell
git add -- apps/desktop/src/renderer/components/MaxDogSprite.tsx apps/desktop/src/renderer/components/MaxDogSprite.test.tsx
git commit -m "feat: redraw Max as a chibi puppy"
```

### Task 3: 调整动作、场景层级与减少动画分支

**Files:**
- Modify: `apps/desktop/src/renderer/styles/app.css`
- Modify: `apps/desktop/src/renderer/components/MaxRoom.tsx` only if rendered layer order or visible caption needs the smallest supporting change
- Test: `apps/desktop/src/renderer/components/MaxRoom.test.tsx` only if the supporting DOM contract changes

**Interfaces:**
- Consumes: Task 2 的 SVG class 和 `MaxRoom` 现有 `scene-${activity}` 状态。
- Produces: 可读的 idle/thinking/speaking 动作、低干扰环境动效和 `prefers-reduced-motion` 静态退化。

- [ ] **Step 1: 先补一个能区分状态的失败测试**

如果现有 `MaxRoom.test.tsx` 没有覆盖三种状态，添加以下结构断言；不测试具体 CSS 像素值：

```tsx
it('exposes the room activity state to the dog and scene', () => {
  const { rerender } = render(<MaxRoom memoryCount={0} activity="idle" />);
  expect(screen.getByTestId('max-dog-sprite')).toHaveClass('max-dog-idle');
  expect(screen.getByTestId('room-backdrop').parentElement).toHaveClass('scene-idle');

  rerender(<MaxRoom memoryCount={0} activity="thinking" />);
  expect(screen.getByTestId('max-dog-sprite')).toHaveClass('max-dog-thinking');
  expect(screen.getByTestId('room-backdrop').parentElement).toHaveClass('scene-thinking');
});
```

- [ ] **Step 2: 运行目标测试，确认失败原因正确**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxRoom.test.tsx`

Expected: 只有新增断言在结构没有对应支持时失败；若现有实现已经满足，则保留测试作为回归契约，不伪造失败。

- [ ] **Step 3: 替换角色 CSS 动作**

在现有 `.max-dog` 规则体系内更新，不另起一套方法论：

- 根节点继续居中并保留完整比例，避免缩放时裁掉四只爪。
- `dog-body`、`dog-head`、`dog-ear`、`dog-tail`、`dog-leg`、`dog-paw`、`dog-muzzle` 使用 `transform-box: fill-box` 和稳定的 transform origin。
- idle 使用慢速呼吸、尾巴摆动、耳朵错峰轻抖和四肢微小重心变化。
- thinking 只让头部轻偏、单侧前爪靠近身体、尾巴减速，后腿保持落地。
- speaking 使用一次短促前倾/回弹、耳朵和前爪各一次回应；失败状态不触发 speaking 动作。
- 动画时长保持在可感知但不烦躁的范围，避免闪烁和连续高频跳动。

- [ ] **Step 4: 调整场景层级和视觉重心**

只在可见验收发现遮挡时修改 `MaxRoom.tsx` 的层级；优先在 CSS 调整背景、窗光、尘埃、植物、蒸汽和地毯的 z-index、透明度与对比度。小狗保持高于背景装饰，聊天面板不受影响，场景装饰继续 `aria-hidden`。

- [ ] **Step 5: 保持减少动画语义**

在现有 `@media (prefers-reduced-motion: reduce)` 分支中覆盖新增关键帧和过渡，确保静态画面仍能辨认头、耳朵、四爪、口鼻和尾巴。

- [ ] **Step 6: 运行目标测试和 lint**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx src/renderer/components/MaxRoom.test.tsx`，然后运行 `pnpm --filter @max/desktop lint`。

Expected: 目标测试全绿，lint 无错误或警告。

- [ ] **Step 7: 提交动作和场景调整**

```powershell
git add -- apps/desktop/src/renderer/styles/app.css apps/desktop/src/renderer/components/MaxRoom.tsx apps/desktop/src/renderer/components/MaxRoom.test.tsx
git commit -m "feat: animate Max puppy room states"
```

### Task 4: 完成桌面端回归、打包和可见验收

**Files:**
- Read-only verification: `apps/desktop/src/renderer/components/MaxDogSprite.tsx`, `apps/desktop/src/renderer/styles/app.css`, built output and installer output
- No unrelated source edits

**Interfaces:**
- Consumes: Tasks 1–3 的测试、组件和 CSS。
- Produces: 可运行的 Windows 安装包与一次已安装程序的可见检查记录。

- [ ] **Step 1: 跑桌面端全量测试、lint、类型检查和构建**

Run:

```powershell
pnpm --filter @max/desktop test
pnpm --filter @max/desktop lint
pnpm --filter @max/desktop typecheck
pnpm --filter @max/desktop build
```

Expected: 四条命令都成功；测试覆盖组件结构和三种状态，构建产物包含内联 SVG，不产生远程角色资源请求。

- [ ] **Step 2: 运行仓库级密钥检查**

Run: `pnpm verify:secrets`

Expected: 检查通过；不读取、输出或提交任何 API key、密码或 Supabase secret。

- [ ] **Step 3: 打包 Windows 安装程序**

Run: `pnpm package:win`

Expected: `@max/desktop` 的 Windows 打包命令成功生成安装产物；若旧进程锁住安装目录，先只结束本次 Max 进程，再重新运行打包，不删除用户数据目录。

- [ ] **Step 4: 启动已安装程序做可见验收**

检查以下画面：

1. 左侧第一眼是白色小狗，而不是兔子、团子或抽象拼接物。
2. 四只爪、两只耳、短口鼻和卷尾都完整可见。
3. 待机动作自然，思考和回复动作有明显区别但不抖动。
4. 背景有层次但不抢主体，窗口缩放不裁掉小狗。
5. 登录后聊天输入仍可用；本次改动不影响记忆和主动消息显示。

- [ ] **Step 5: 在减少动画设置下复查**

启用系统减少动画设置后重新打开画面，确认角色静止但完整可读，聊天交互仍然可用。

- [ ] **Step 6: 做最终工作树与提交检查**

Run: `git status --short --branch; git log -3 --oneline`

Expected: 功能提交只包含本计划涉及的文件；之前已有的未提交文件仍保留，不被覆盖或误提交。

## Verification Checklist

- [ ] `MaxDogSprite` 测试先红后绿，覆盖稳定结构、四肢和三种 activity class。
- [ ] `MaxRoom` 测试覆盖 scene/activity 传递，未改变聊天或记忆契约。
- [ ] 桌面端 test、lint、typecheck、build 均通过。
- [ ] `verify:secrets` 通过且没有输出密钥。
- [ ] Windows 打包成功并完成已安装程序可见验收。
- [ ] 减少动画模式下角色和聊天仍可用。
- [ ] 未提交工作树中的无关改动保持原样。
