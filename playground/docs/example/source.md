<!-- expected -->

# Mermaid Examples

Classic examples for the diagram types supported by Mermaid.

## Flowchart

<!-- #region flowchart -->

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Ship it]
    B -- No --> D[Fix it]
    D --> B
    C --> E([Done])
```

<!-- #endregion flowchart -->

## Sequence Diagram

<!-- #region sequence -->

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant W as Web
    participant S as Server
    participant DB as Database

    U->>W: Click login
    W->>S: POST /login
    S->>DB: Query user
    DB-->>S: User row
    alt Credentials valid
        S-->>W: 200 + token
        W-->>U: Redirect to home
    else Invalid
        S-->>W: 401
        W-->>U: Show error
    end
    Note over S,DB: Session is cached for 7 days
```

<!-- #endregion sequence -->

## Class Diagram

<!-- #region class -->

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    class Cat {
        +bool indoor
        +scratch() void
    }
    class Owner {
        +String name
    }

    Animal <|-- Dog
    Animal <|-- Cat
    Owner "1" --> "*" Animal : owns
```

<!-- #endregion class -->

## State Diagram

<!-- #region state -->

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : fetch
    Loading --> Success : 200
    Loading --> Error : 4xx / 5xx
    Success --> Idle : reset
    Error --> Loading : retry
    Error --> [*] : abort

    state Loading {
        [*] --> Pending
        Pending --> Streaming
        Streaming --> [*]
    }
```

<!-- #endregion state -->

## ER Diagram

<!-- #region er -->

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"

    CUSTOMER {
        string id PK
        string name
        string email
    }
    ORDER {
        string id PK
        datetime created_at
        string status
    }
    PRODUCT {
        string sku PK
        string title
        decimal price
    }
```

<!-- #endregion er -->

## Gantt Chart

<!-- #region gantt -->

```mermaid
gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    axisFormat %m-%d
    excludes weekends

    section Design
        Research      :done,    des1, 2024-01-01, 7d
        Wireframes    :active,  des2, after des1, 5d
    section Development
        Backend API   :         dev1, after des2, 10d
        Frontend UI   :         dev2, after des2, 12d
    section Release
        QA            :         qa1, after dev1, 5d
        Launch        :milestone, m1, after qa1, 0d
```

<!-- #endregion gantt -->

## Pie Chart

<!-- #region pie -->

```mermaid
pie showData
    title Traffic Sources
    "Organic Search" : 45
    "Direct" : 25
    "Referral" : 18
    "Social" : 12
```

<!-- #endregion pie -->

## Git Graph

<!-- #region git-graph -->

```mermaid
gitGraph
    commit id: "init"
    branch develop
    commit id: "feat: a"
    commit id: "feat: b"
    checkout main
    commit id: "hotfix"
    merge develop tag: "v1.0.0"
    commit id: "chore: release"
```

<!-- #endregion git-graph -->

## User Journey

<!-- #region journey -->

```mermaid
journey
    title Checkout Experience
    section Browse
        Visit home: 5: User
        Search item: 4: User
        Open product: 5: User
    section Pay
        Add to cart: 3: User
        Fill address: 2: User
        Pay: 4: User, Payment
```

<!-- #endregion journey -->

## Mindmap

<!-- #region mindmap -->

```mermaid
mindmap
    root((mermaid))
        Diagram
            Flowchart
            Sequence
            Class
        Usage
            Markdown
            Web
        Theme
            Light
            Dark
```

<!-- #endregion mindmap -->

## Timeline

<!-- #region timeline -->

```mermaid
timeline
    title Mermaid Release History
    2014 : v0.1
    2019 : v8
    2021 : v8.10
    2022 : v9
    2023 : v10
    2024 : v11
```

<!-- #endregion timeline -->

## Quadrant Chart

<!-- #region quadrant -->

```mermaid
quadrantChart
    title Priority Matrix
    x-axis Low effort --> High effort
    y-axis Low impact --> High impact
    quadrant-1 Do first
    quadrant-2 Plan
    quadrant-3 Skip
    quadrant-4 Delegate
    Feature A: [0.2, 0.8]
    Feature B: [0.7, 0.6]
    Feature C: [0.3, 0.2]
    Feature D: [0.8, 0.3]
```

<!-- #endregion quadrant -->

## XY Chart

<!-- #region xy-chart -->

```mermaid
xychart-beta
    title "Monthly Revenue"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Revenue (k$)" 0 --> 100
    bar [30, 45, 60, 55, 80, 95]
    line [25, 40, 58, 60, 78, 92]
```

<!-- #endregion xy-chart -->

## Sankey Diagram

<!-- #region sankey -->

```mermaid
sankey-beta

Agricultural waste,Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Solid,26.862
Bio-conversion,Gas,280.322
Bio-conversion,Electricity,100.0
Liquid,Electricity,0.597
Solid,Electricity,26.862
Gas,Electricity,280.322
Electricity,Grid,407.781
```

<!-- #endregion sankey -->

## Block Diagram

<!-- #region block -->

```mermaid
block-beta
    columns 3
    client["Client"] gateway["Gateway"] service["Service"]
    client --> gateway
    gateway --> service
```

<!-- #endregion block -->

## Multibyte Labels

<!-- #region multibyte -->

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库

    用户->>前端: 浏览商品
    前端->>后端: 请求商品列表
    后端->>数据库: 查询商品信息
    数据库-->>后端: 返回商品数据
    后端-->>前端: 返回商品列表
    前端-->>用户: 显示商品
```

<!-- #endregion multibyte -->

## Style and Class

<!-- #region style -->

```mermaid
flowchart LR
    A[Request] --> B{Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Reject]
    C --> E[(Cache)]
    D --> E

    classDef ok fill:#e6f7e6,stroke:#2e7d32,color:#1b5e20
    classDef bad fill:#fdecea,stroke:#c62828,color:#b71c1c
    class C ok
    class D bad
    style A stroke-width:2px
    linkStyle 0 stroke:#2e7d32,stroke-width:2px
```

<!-- #endregion style -->
