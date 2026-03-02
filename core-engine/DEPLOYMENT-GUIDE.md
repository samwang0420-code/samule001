# 部署到 dashboard.gspr-hub.site

## 🚀 快速部署步骤

### 前提条件

1. **服务器访问权限** - 可以SSH到 gspr-hub.site 服务器
2. **sudo权限** - 需要root权限安装依赖
3. **域名DNS** - dashboard.gspr-hub.site 指向服务器IP

---

## 部署命令

### 方法一：直接在服务器上运行

```bash
# 1. SSH到服务器
ssh root@gspr-hub.site

# 2. 克隆代码 (或从本地复制)
git clone https://github.com/yourrepo/geo-engine.git /tmp/geo-engine
cd /tmp/geo-engine/core-engine

# 3. 运行部署脚本
sudo ./deploy-to-production.sh
```

### 方法二：从本地一键部署

```bash
# 在本地运行
scp -r core-engine root@gspr-hub.site:/tmp/
ssh root@gspr-hub.site 'cd /tmp/core-engine && ./deploy-to-production.sh'
```

---

## 部署脚本会做什么

| 步骤 | 操作 | 时间 |
|------|------|------|
| 1 | 安装Node.js 20, Nginx, Certbot | ~2分钟 |
| 2 | 复制应用到 `/var/www/geo-dashboard` | ~30秒 |
| 3 | 安装npm依赖 | ~1分钟 |
| 4 | 创建systemd服务 | ~10秒 |
| 5 | 配置Nginx反向代理 | ~10秒 |
| 6 | 申请SSL证书 | ~1分钟 |
| 7 | 设置定时任务 | ~10秒 |
| 8 | 启动服务 | ~10秒 |

**总计: ~5-6分钟**

---

## 部署后配置

### 1. 编辑环境变量

```bash
ssh root@gspr-hub.site
nano /var/www/geo-dashboard/.env
```

**必须配置的变量：**
```env
# API Keys
APIFY_TOKEN=your_apify_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# For AI content generation (optional)
OPENAI_API_KEY=sk-your-key

# For email reports (optional)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password

# API access keys
API_KEYS=your-secret-api-key
```

### 2. 重启服务

```bash
sudo systemctl restart geo-dashboard
```

### 3. 检查状态

```bash
# 查看服务状态
sudo systemctl status geo-dashboard

# 查看日志
sudo journalctl -u geo-dashboard -f

# 测试API
curl https://dashboard.gspr-hub.site/api/health
```

---

## 部署后的URL

| 地址 | 用途 |
|------|------|
| `https://dashboard.gspr-hub.site` | 主页/仪表盘 |
| `https://dashboard.gspr-hub.site/api/health` | API健康检查 |
| `https://dashboard.gspr-hub.site/api/analyze` | 运行GEO分析 |
| `https://dashboard.gspr-hub.site/api/monitoring/rankings/:clientId` | 排名数据 |

---

## 管理命令

```bash
# 查看服务状态
sudo systemctl status geo-dashboard

# 重启服务
sudo systemctl restart geo-dashboard

# 停止服务
sudo systemctl stop geo-dashboard

# 查看日志
sudo journalctl -u geo-dashboard -f -n 100

# 查看nginx日志
sudo tail -f /var/log/nginx/geo-dashboard-error.log

# 手动运行分析
sudo su - www-data -c 'cd /var/www/geo-dashboard && ./geo-ai-pipeline.js "Test Clinic" "Houston, TX" "Medical Spa" "Botox"'
```

---

## 定时任务

部署后自动配置的定时任务：

```cron
# 每天6点 - 排名监控
0 6 * * * cd /var/www/geo-dashboard && ./scheduler.sh daily

# 每周一8点 - 生成周报
0 8 * * 1 cd /var/www/geo-dashboard && ./scheduler.sh weekly

# 每天9点 - AI引用监控
0 9 * * * cd /var/www/geo-dashboard && node lib/ai-citation-monitor.js monitor-all

# 每周清理日志
0 0 * * 0 cd /var/www/geo-dashboard && find logs -name "*.log" -mtime +30 -delete
```

---

## 故障排除

### 服务无法启动

```bash
# 检查日志
sudo journalctl -u geo-dashboard -n 50

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 手动测试
sudo su - www-data -c 'cd /var/www/geo-dashboard && node lib/api-server.js'
```

### Nginx 502错误

```bash
# 检查nginx配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx

# 检查后端服务
sudo systemctl status geo-dashboard
```

### SSL证书问题

```bash
# 重新申请证书
sudo certbot --nginx -d dashboard.gspr-hub.site

# 检查证书状态
sudo certbot certificates
```

---

## 更新部署

```bash
# SSH到服务器
ssh root@gspr-hub.site

# 进入应用目录
cd /var/www/geo-dashboard

# 拉取最新代码
git pull origin main

# 更新依赖
npm install --production

# 重启服务
sudo systemctl restart geo-dashboard

# 测试
curl https://dashboard.gspr-hub.site/api/health
```

---

## 安全建议

1. **防火墙配置**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

2. **定期更新**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **备份数据**
   ```bash
   # 备份outputs目录
   sudo tar -czf /backup/geo-$(date +%Y%m%d).tar.gz /var/www/geo-dashboard/outputs
   ```

---

## 完成！

部署完成后，访问：
**https://dashboard.gspr-hub.site**

你应该能看到GEO Dashboard主页。

API文档和状态检查：https://dashboard.gspr-hub.site/api/health
