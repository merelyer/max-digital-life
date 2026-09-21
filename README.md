# Max

Max 是住在 Windows 桌面里的白色小狗：你可以主动找他聊天，他会记住经过确认的长期信息，也会在开启后偶尔主动出现。桌面端是 Electron + React，API 是 Fastify，长期数据存 Supabase，模型请求只从 API 服务端转发到 Tokendance。

## 本地准备

- Node.js `24.19.0`
- pnpm `11.19.0`（仓库会通过 Corepack 使用）
- 一个 Supabase 项目
- 一个 Tokendance 账户和从其模型页“复制模型 ID”得到的真实模型标识

在 Supabase 中创建项目，并在 SQL Editor 中依次执行 [`apps/api/supabase/migrations/0001_max.sql`](apps/api/supabase/migrations/0001_max.sql) 与 [`apps/api/supabase/migrations/0002_random_proactive_reason.sql`](apps/api/supabase/migrations/0002_random_proactive_reason.sql)。已有项目只需补执行 0002。在 Authentication 中启用 Email 登录。然后复制根目录的 `.env.example` 为 `.env`，填写服务端变量：

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOKENDANCE_API_KEY=
TOKENDANCE_MODEL_ID=
API_CRON_SECRET=
API_HOST=0.0.0.0
VITE_API_BASE_URL=http://127.0.0.1:3100
```

`TOKENDANCE_API_KEY`、`TOKENDANCE_MODEL_ID`、`SUPABASE_SERVICE_ROLE_KEY` 和 `API_CRON_SECRET` 只放在 API 服务端环境中。桌面端只需要能读取 `VITE_API_BASE_URL`、`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`；不要把服务端变量复制进桌面端环境。

打包桌面端前，在 `apps/desktop/.env` 中填入这三个公共值（它们会在构建时写入渲染页）：

```text
VITE_API_BASE_URL=http://127.0.0.1:3100
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 运行

```powershell
corepack pnpm install
corepack pnpm --filter @max/api dev
corepack pnpm --filter @max/desktop dev
```

首次打开桌面端时使用你在 Supabase 中允许的邮箱注册或登录。聊天失败时，界面会显示 API 返回的原始中文错误，不会伪造 Max 的回复。

## 验证与构建

```powershell
corepack pnpm lint
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm verify:secrets
```

生成 Windows 安装程序：

```powershell
corepack pnpm package:win
```

安装包会出现在 `apps/desktop/release/`。安装包使用构建时写入的这三个公共值；如果 API 地址或 Supabase 项目改变，需要在打包前更新 `apps/desktop/.env` 并重新构建。

## Windows 云端更新

Max 使用 GitHub Releases 检查 Windows 更新。发布新版本时，上传下面三个构建产物到同版本的 Release：

- `Max-Setup-<version>.exe`
- `Max-Setup-<version>.exe.blockmap`
- `latest.yml`

已安装的 Max 会在启动、窗口重新回到前台以及运行期间定期检查更新；发现版本后会显示下载按钮，下载完成后可直接重启安装。仓库里的 GitHub Actions 工作流可在 Actions 页面手动运行；它需要先在仓库 Secrets 中设置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 和 `VITE_API_BASE_URL`。

## Docker API

本地构建 API 镜像：

```powershell
docker build -f deploy/Dockerfile -t max-api .
docker compose -f deploy/docker-compose.local.yml up --build
```

Compose 从根目录 `.env` 读取变量，`.env` 不应提交到 Git。

把 Docker 镜像部署到可从互联网访问的 Node 主机、配置域名/HTTPS、在该主机填写 Supabase 与 Tokendance 凭据，都是需要你自己确认并执行的外部操作；本仓库不会替你创建云项目、登录第三方账户或上传密钥。
