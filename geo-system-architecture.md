# GEO Delivery System Architecture

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Law Firm A  │  │ Law Firm B  │  │ Law Firm C  │  ...        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA COLLECTION LAYER                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Apify Actors                           │    │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐   │    │
│  │  │ SERP Scrap │ │ GMB Scrap  │ │ Website Crawler  │   │    │
│  │  └────────────┘ └────────────┘ └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROCESSING LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  n8n Workflow Engine                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ 坐标解析 │ │Schema生成│ │竞品分析  │ │报告生成  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STORAGE LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Supabase    │  │  Static JSON │  │  Time-Series │           │
│  │  (Metadata)  │  │  (Schema)    │  │  (Rankings)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VISUALIZATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Grafana Dashboards                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ 排名追踪 │ │ 竞品监控 │ │ 地理热力 │ │ KPI看板  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 核心算法模块

### 1. 地理精度评分算法
```python
def calculate_geo_precision_score(law_firm_data):
    """
    计算律所的地理精度评分（0-100）
    """
    scores = {
        'coordinate_precision': 0,  # 坐标精度（到入口级别=25分）
        'parking_info': 0,          # 停车信息完整度（25分）
        'transit_access': 0,        # 公共交通可达性（20分）
        'nearby_poi_density': 0,    # 周边POI密度（15分）
        'elevation_data': 0         # 海拔数据（高层建筑，15分）
    }
    
    # 坐标精度判断
    if law_firm_data.get('entrance_coordinates'):
        scores['coordinate_precision'] = 25
    elif law_firm_data.get('building_coordinates'):
        scores['coordinate_precision'] = 15
    else:
        scores['coordinate_precision'] = 5  # 仅街道级别
    
    # 停车信息
    if law_firm_data.get('parking_schema_markup'):
        scores['parking_info'] = 25
    elif law_firm_data.get('parking_mentioned'):
        scores['parking_info'] = 10
    
    # ... 其他评分逻辑
    
    return sum(scores.values()), scores
```

### 2. 动态Schema生成器
```javascript
// 根据律所数据动态生成Schema.org JSON-LD
function generateLegalServiceSchema(firmData, geoContext) {
    return {
        "@context": "https://schema.org",
        "@type": "LegalService",
        "name": firmData.name,
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": geoContext.entrance.lat,
            "longitude": geoContext.entrance.lng,
            "elevation": geoContext.elevation  // 毫米级：海拔
        },
        "hasMap": firmData.gmb_url,
        "parkingFacility": {
            "@type": "ParkingFacility",
            "name": geoContext.parking.nearest.name,
            "distance": geoContext.parking.nearest.distance,
            "priceRange": geoContext.parking.nearest.price
        },
        "nearby": geoContext.pois.map(poi => ({
            "@type": poi.type,
            "name": poi.name,
            "distance": poi.distance,
            "walkTime": poi.walk_time
        }))
    };
}
```

### 3. 竞品监控引擎
```python
class CompetitorMonitor:
    def __init__(self, client_location, keywords):
        self.client_location = client_location
        self.keywords = keywords
        self.baseline = None
    
    def capture_snapshot(self):
        """抓取当前SERP快照"""
        pass
    
    def detect_changes(self):
        """检测排名变化"""
        pass
    
    def correlate_signals(self):
        """关联外部信号（天气、新闻、事件）"""
        pass
```

## 交付自动化脚本

### 1. 客户onboarding脚本
```bash
# ./scripts/onboard-client.sh <client_id> <law_firm_name> <city>
./scripts/onboard-client.sh lf001 "Smith Law Firm" "Houston"
```
自动执行：
- 创建客户数据目录
- 启动Apify抓取任务
- 初始化监控数据库
- 生成初始审计报告框架

### 2. 日报生成脚本
```bash
# ./scripts/daily-report.sh <client_id>
./scripts/daily-report.sh lf001
```
自动执行：
- 抓取最新排名数据
- 对比昨日变化
- 生成Markdown报告
- 推送到客户看板

### 3. Schema部署脚本
```bash
# ./scripts/deploy-schema.sh <client_id> <website_url>
./scripts/deploy-schema.sh lf001 https://smithlaw.com
```
自动执行：
- 抓取现有页面
- 注入Schema标记
- 验证标记有效性
- 生成部署报告

## 成本估算（单个客户）

| 项目 | 月成本 | 说明 |
|------|--------|------|
| Apify计算单元 | $5-10 | 取决于抓取频率 |
| 存储/传输 | $1-2 | Supabase免费档内 |
| 服务器 | $5 | 共享基础设施 |
| **总计** | **$6-12/客户/月** | Retainer $500，毛利率>95% |

## 扩展路径

### 10个客户时
- 升级到DigitalOcean $10/月套餐
- Apify预算增至$80/月
- 增加自动化工作流并行度

### 50个客户时
- 需要专职服务器（$50/月）
- 考虑自建SERP抓取（住宅代理轮换）
- 引入数据库分片
