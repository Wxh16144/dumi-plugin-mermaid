---
title: 程序员的日常
---

用 Mermaid 记录程序员的日常。每种图都是 `mermaid` 代码块，直接复制到支持 Mermaid 的编辑器里就能渲染。

## 修 Bug 循环

```mermaid
flowchart TD
  A["早上：被闹钟叫醒"] --> B{"今天上班吗？"}
  B -- 否 --> C["继续睡"]
  B -- 是 --> D["咖啡续命"]
  D --> E{"有 Bug？"}
  E -- 是 --> F["打开 IDE"]
  E -- 否 --> G["打开摸鱼网站"]
  F --> H["改一行代码"]
  H --> I["出现十个新 Bug"]
  I --> E
  G --> J["老板来了"]
  J --> F
  C --> K["梦里什么都有"]
```

## 产品经理 vs 程序员

```mermaid
sequenceDiagram
  autonumber
  participant PM as 产品经理
  participant Dev as 程序员
  participant Ops as 运维
  PM->>Dev: 这个需求很简单吧？
  Dev-->>PM: 理论上可以
  PM->>Dev: 明天能上线吗？
  Dev-->>PM: 我尽量
  PM->>Dev: 再加个“小”功能
  Dev->>Dev: 沉默
  Dev->>Ops: 准备上线
  Ops-->>Dev: 生产环境炸了
  Dev-->>PM: 需要延期
  PM->>Dev: 为什么？
  Dev-->>PM: 因为“小”功能
```

## 猫奴的类图

```mermaid
classDiagram
    class Human {
        +String name
        +Decimal salary
        +payBill() void
        +begForSleep() void
    }
    class Cat {
        +String nickname
        +bool chubby
        +meow() void
        +knockOffDesk() void
        +runAt3AM() void
    }
    class LitterBox {
        +int stinkLevel
        +clean() void
    }

    Human "1" --> "*" Cat : serves
    Cat "1" --> "1" LitterBox : rules
    Cat --> Human : ignores
```

## 打工人状态机

```mermaid
stateDiagram-v2
  state "周一到周四" as MonThu
  state "周五" as Fri
  state "周末" as Weekend
  state "周日晚上" as SunNight
  [*] --> MonThu
  MonThu --> Fri: 熬
  Fri --> Weekend: 下班
  Weekend --> SunNight: 快乐
  SunNight --> MonThu: 焦虑
  Fri --> Fri: 摸鱼
  MonThu --> MonThu: 想辞职
  Weekend --> Weekend: 熬夜
```

## 猫奴的资产

```mermaid
erDiagram
    OWNER ||--o{ CAT : 铲屎
    CAT ||--o{ TOY : 玩坏
    CAT }o--|| FOOD : 干饭

    OWNER {
        string id PK
        string name "铲屎官"
        decimal salary "工资"
        bool allergic "嘴上说不"
    }
    CAT {
        string id PK
        string nickname "主子名"
        bool chubby "胖不胖"
        int sleep_hours "每天睡多久"
    }
    TOY {
        string id PK
        string title
        bool survived
    }
    FOOD {
        string brand PK
        decimal price "比我吃饭贵"
    }
```

## 咖啡续命计划

```mermaid
gantt
  title 咖啡续命计划
  dateFormat HH:mm
  axisFormat %H:%M
  section 上午
  起床 :a1, 08:00, 15m
  第一杯咖啡 :a2, after a1, 30m
  假装工作 :a3, after a2, 2h
  section 下午
  午餐 :b1, 12:00, 1h
  第二杯咖啡 :b2, after b1, 30m
  会议 :b3, after b2, 2h
  第三杯咖啡 :b4, after b3, 30m
  下班 :b5, after b4, 1h
```

## 周末时间分配

```mermaid
pie title 周末时间分配
  "睡觉" : 40
  "刷手机" : 25
  "吃饭" : 15
  "想学习" : 10
  "实际学习" : 5
  "焦虑" : 5
```

## 分支灾难

```mermaid
gitGraph
  commit id: "初始"
  branch feature
  checkout feature
  commit id: "写功能"
  commit id: "改 Bug"
  checkout main
  commit id: "热修"
  merge feature
  commit id: "解决冲突"
  branch bugfix
  checkout bugfix
  commit id: "又改"
  checkout main
  merge bugfix
  commit id: "上线"
  commit id: "回滚"
```

## 代码评审之旅

```mermaid
journey
  title 代码评审之旅
  section 提交 PR
    写代码: 5: 我
    自信提交: 4: 我
  section 等待评审
    等待: 2: 我
    被指出拼写错误: 1: 我
    发现逻辑漏洞: 0: 我
  section 修改
    改代码: 3: 我
    再提交: 4: 我
    被批准: 5: 我
    合并冲突: 1: 我
```

## 学习新技术

```mermaid
mindmap
  root((学习新技术))
    看文档
      收藏
      吃灰
    看视频
      2 倍速
      走神
    动手写
      报错
      搜索
      复制粘贴
      跑通
    总结
      写博客
      烂尾
```

## 打工人的一年

```mermaid
timeline
  title 打工人的一年
  1月 : 立下新年 flag
  3月 : flag 倒了
  6月 : 618 囤货
  9月 : 又想起健身
  11月 : 双十一清空购物车
  12月 : 明年一定
```

## 摸鱼的性价比

```mermaid
quadrantChart
  title 摸鱼的性价比
  x-axis 风险低 --> 风险高
  y-axis 收获少 --> 收获多
  quadrant-1 立刻上手
  quadrant-2 谨慎尝试
  quadrant-3 直接放弃
  quadrant-4 偶尔为之
  看技术博客: [0.2, 0.85]
  写开源项目: [0.35, 0.9]
  群里吹水: [0.6, 0.35]
  刷短视频: [0.75, 0.2]
```

## 咖啡与代码

```mermaid
xychart-beta
  title "一周的咖啡与代码"
  x-axis ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  y-axis "杯数 / 百行" 0 --> 10
  bar [6, 5, 7, 6, 8, 3, 2]
  line [2, 3, 1, 4, 2, 0, 0]
```

## 工资都去哪了

`sankey-beta` 的语法来自 RFC 4180 CSV，标签只接受可打印 ASCII，所以这张图的节点只能用英文。

```mermaid
sankey-beta

Salary,Rent,3000
Salary,Food,2000
Salary,Loan,2500
Salary,Savings,1500
Salary,Shopping,1000
Savings,Trip,500
Savings,Emergency,1000
```

## 一条流水线

```mermaid
block-beta
  columns 3
  需求["老板：需求很简单"] 开发["开发：理论上可以"] 测试["测试：本地没问题"]
  上线["上线：稳住"] 报错["生产：炸了"] 回滚["回滚：从入门到跑路"]
  需求 --> 开发
  开发 --> 测试
  测试 --> 上线
  上线 --> 报错
  报错 --> 回滚
```

## 需求转移

```mermaid
sequenceDiagram
  participant 老板
  participant 产品
  participant 后端
  participant 数据库

  老板->>产品: 加个小功能
  产品->>后端: 明天上线可以吧
  后端->>数据库: 加个字段
  数据库-->>后端: 锁表了
  后端-->>产品: 需要一周
  产品-->>老板: 排到下个迭代
```

## Bug 流转

```mermaid
flowchart LR
  A[代码写完] --> B{能跑吗}
  B -->|能| C[上线]
  B -->|不能| D[加个 try]
  C --> E[生产炸了]
  D --> E
  E --> F[回滚]
  F --> A

  classDef good fill:#e6f7e6,stroke:#2e7d32,color:#1b5e20
  classDef bad fill:#fdecea,stroke:#c62828,color:#b71c1c
  class C,F good
  class D,E bad
  style A stroke-width:2px
  linkStyle 0 stroke:#2e7d32,stroke-width:2px
```
