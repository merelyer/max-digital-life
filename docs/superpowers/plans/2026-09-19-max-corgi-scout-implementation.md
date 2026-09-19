# Max Corgi Scout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Max 的手绘 SVG 替换为本地 OpenPets Corgi Scout 动态精灵表，同时保持现有聊天、记忆、登录和房间逻辑。

**Architecture:** 下载并固化 Corgi Scout 的 WebP 精灵表与来源记录；`MaxDogSprite` 只负责把 `RoomActivity` 映射为精灵行和可访问容器，CSS 负责步进帧动画与减少动画退化。`MaxRoom` 只更新角色可见文案，聊天和数据层不改。

**Tech Stack:** React、TypeScript、CSS sprite animation、Vitest、Testing Library、Electron/Vite、pnpm。

## Global Constraints

- 不修改登录、聊天、记忆、主动消息、Supabase、Render 或 API 数据结构。
- 不在运行时加载远程图片；角色资源必须随桌面端构建。
- 只提交本功能资源、组件、样式、测试和来源文档；保留其他已有工作树修改。
- 所有角色动效必须在 `prefers-reduced-motion: reduce` 下静态可读。

---

### Task 1: 固化 Corgi Scout 资源与来源

**Files:**
- Create: `apps/desktop/public/assets/max/corgi-scout/spritesheet.webp`
- Create: `apps/desktop/public/assets/max/corgi-scout/SOURCE.md`

**Interfaces:**
- Consumes: `https://zip.openpets.dev/pets/corgi-scout-openpets/corgi-scout.zip`
- Produces: 构建时可读取的 `/assets/max/corgi-scout/spritesheet.webp` 和可审计的来源说明。

- [ ] **Step 1: 下载并校验素材包**

```powershell
$assetUrl = 'https://zip.openpets.dev/pets/corgi-scout-openpets/corgi-scout.zip'
$tempZip = Join-Path $env:TEMP 'max-corgi-scout.zip'
Invoke-WebRequest -Uri $assetUrl -OutFile $tempZip
Get-FileHash -Algorithm SHA256 $tempZip
```

Expected: zip 下载完成并得到 SHA-256；不把 zip 提交到仓库。

- [ ] **Step 2: 提取精灵表到 public 目录**

将 zip 中的 `spritesheet.webp` 复制到 `apps/desktop/public/assets/max/corgi-scout/spritesheet.webp`，确认图片尺寸为 `1536×1872`，不改变二进制内容。

- [ ] **Step 3: 写入来源说明**

创建 `SOURCE.md`，记录目录条目 URL、素材包 URL、获取日期 `2026-09-19`、SHA-256 和“本地随桌面端构建使用，不运行时联网加载”的说明；不写入任何密钥。

- [ ] **Step 4: 检查资源路径和来源文件**

Run: `Get-ChildItem apps/desktop/public/assets/max/corgi-scout; Get-Content apps/desktop/public/assets/max/corgi-scout/SOURCE.md`

Expected: 只有精灵表和来源说明，路径大小写与代码引用完全一致。

- [ ] **Step 5: Commit**

```powershell
git add -- apps/desktop/public/assets/max/corgi-scout
git commit -m "chore: add local Corgi Scout sprite asset"
```

### Task 2: 先写失败测试并替换角色组件

**Files:**
- Modify: `apps/desktop/src/renderer/components/MaxDogSprite.test.tsx`
- Modify: `apps/desktop/src/renderer/components/MaxDogSprite.tsx`

**Interfaces:**
- Consumes: `RoomActivity` 联合类型。
- Produces: `MaxDogSprite({ activity })`，根节点 `max-dog-sprite`、`role="img"`、活动 class 和稳定 sprite-state 属性。

- [ ] **Step 1: 写新的失败测试**

将测试契约改为检查本地精灵渲染，而不是旧 SVG 部件：

```tsx
it('renders the local Corgi Scout sprite with an accessible Max name', () => {
  render(<MaxDogSprite activity="idle" />);

  const sprite = screen.getByRole('img', { name: 'Max，动态小狗' });
  expect(sprite).toHaveClass('max-dog', 'max-dog-idle');
  expect(sprite).toHaveAttribute('data-sprite-row', 'idle');
  expect(sprite).toHaveAttribute('data-sprite-src', '/assets/max/corgi-scout/spritesheet.webp');
});

it.each([
  ['idle', 'idle'],
  ['thinking', 'waiting'],
  ['speaking', 'waving'],
] as const)('maps %s activity to the %s sprite row', (activity, row) => {
  render(<MaxDogSprite activity={activity} />);
  expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-sprite-row', row);
});
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx`

Expected: 由于组件仍然输出旧 SVG 名称和结构，测试失败，失败原因指向可访问名称或 sprite 属性，而不是测试环境错误。

- [ ] **Step 3: 写最小组件实现**

`MaxDogSprite.tsx` 使用精确的行映射和本地路径：

```tsx
const spriteRows: Record<RoomActivity, 'idle' | 'waiting' | 'waving'> = {
  idle: 'idle',
  thinking: 'waiting',
  speaking: 'waving',
};

export function MaxDogSprite({ activity = 'idle' }: MaxDogSpriteProps): ReactElement {
  const row = spriteRows[activity];
  return (
    <div
      className={`max-dog max-dog-${activity}`}
      role="img"
      aria-label="Max，动态小狗"
      data-testid="max-dog-sprite"
      data-sprite-row={row}
      data-sprite-src="/assets/max/corgi-scout/spritesheet.webp"
      style={{ backgroundImage: "url('/assets/max/corgi-scout/spritesheet.webp')" }}
    />
  );
}
```

- [ ] **Step 4: 运行组件测试和类型检查**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx; pnpm --filter @max/desktop typecheck`

Expected: 新测试全部 PASS，TypeScript 无错误。

- [ ] **Step 5: Commit**

```powershell
git add -- apps/desktop/src/renderer/components/MaxDogSprite.tsx apps/desktop/src/renderer/components/MaxDogSprite.test.tsx
git commit -m "feat: render Max with Corgi Scout sprite"
```

### Task 3: 接入 sprite 动画和文案

**Files:**
- Modify: `apps/desktop/src/renderer/styles/app.css`
- Modify: `apps/desktop/src/renderer/components/MaxRoom.tsx`
- Modify: `apps/desktop/src/renderer/components/MaxRoom.test.tsx`

**Interfaces:**
- Consumes: Task 2 的 `max-dog-${activity}`、`data-sprite-row` 和本地图片路径。
- Produces: 8×9 精灵表的稳定步进动画、减少动画分支和新的角色文案。

- [ ] **Step 1: 写活动文案回归测试**

在 `MaxRoom.test.tsx` 增加：

```tsx
it('labels the imported animated character without changing activity state', () => {
  render(<MaxRoom memoryCount={0} activity="speaking" />);
  expect(screen.getByRole('img', { name: 'Max，动态小狗' })).toHaveClass('max-dog-speaking');
  expect(screen.getByText('动态小狗，住在你的屏幕里。')).toBeVisible();
});
```

- [ ] **Step 2: 运行测试确认文案红灯**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxRoom.test.tsx`

Expected: 仅新的角色名称/标题断言失败。

- [ ] **Step 3: 写 sprite CSS**

在现有 `.max-dog` 规则位置替换旧 SVG 专属规则：容器尺寸固定为 `min(72%, 384px)` 宽、`aspect-ratio: 192 / 208`，背景尺寸为 `800% 900%`，每格步进 8 帧；通过 `data-sprite-row` 选择行偏移，`idle` 与 `waiting` 使用慢速循环，`waving` 使用短循环。保留 `filter`、z-index 和场景定位。

- [ ] **Step 4: 添加减少动画退化**

在现有 `@media (prefers-reduced-motion: reduce)` 中把 `.max-dog` 的动画设为 `none`，固定 `background-position: 0 0`，保留容器尺寸、阴影和可访问名称。

- [ ] **Step 5: 更新 MaxRoom 可见标题**

只把 `h2` 文案从“线条小狗，住在你的屏幕里。”改成“动态小狗，住在你的屏幕里。”；不改活动标签、房间时间和数据逻辑。

- [ ] **Step 6: 运行目标测试和 lint**

Run: `pnpm --filter @max/desktop test -- src/renderer/components/MaxDogSprite.test.tsx src/renderer/components/MaxRoom.test.tsx; pnpm --filter @max/desktop lint`

Expected: 目标测试全绿，lint 无错误或警告。

- [ ] **Step 7: Commit**

```powershell
git add -- apps/desktop/src/renderer/styles/app.css apps/desktop/src/renderer/components/MaxRoom.tsx apps/desktop/src/renderer/components/MaxRoom.test.tsx
git commit -m "feat: animate Corgi Scout room states"
```

### Task 4: 桌面端回归与可见验收

**Files:**
- Read-only verification: `apps/desktop/src/renderer`, `apps/desktop/public/assets/max/corgi-scout`
- No unrelated source edits

- [ ] **Step 1: 运行桌面端全量验证**

```powershell
pnpm --filter @max/desktop test
pnpm --filter @max/desktop lint
pnpm --filter @max/desktop typecheck
pnpm --filter @max/desktop build
pnpm verify:secrets
```

Expected: 全部成功；构建产物包含本地精灵表路径，不产生远程角色资源。

- [ ] **Step 2: 打开本机预览**

使用现有 Electron/Vite 开发入口打开房间，依次观察 idle、thinking、speaking；确认柯基完整、动作可见、背景不遮挡、缩放不裁切。

- [ ] **Step 3: 最终工作树检查**

Run: `git status --short --branch; git log -5 --oneline`

Expected: 本功能提交仅包含资源、来源说明、组件、样式、测试和文档；已有无关修改仍保持原样。
