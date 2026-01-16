# 테트리스 게임 프로세스 개념도 (Process Flow)

## 1. 개요
본 문서는 테트리스 게임의 전체적인 실행 흐름과 핵심 로직의 처리 과정을 순서도(Flowchart) 형태로 기술합니다. `Game Initialization`, `Game Loop`, `Update`, `Render` 각 단계의 상호작용을 시각화합니다.

## 2. 게임 실행 순서도 (Game Flowchart)

```mermaid
flowchart TD
    %% 노드 스타일 정의
    classDef startend fill:#f9f,stroke:#333,stroke-width:2px,color:black,font-weight:bold
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:black
    classDef decision fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:black
    classDef io fill:#dcedc8,stroke:#558b2f,stroke-width:2px,color:black
    classDef sub fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5,color:black

    Start([게임 시작]) --> IsGameLoaded{리소스 로드 완료?}
    class Start startend
    
    IsGameLoaded -- No --> Loading[로딩 화면]
    Loading --> IsGameLoaded
    IsGameLoaded -- Yes --> InitGame[게임 초기화\n(변수 설정, 이벤트 리스너 등록)]
    class InitGame process

    InitGame --> GameStart
    GameStart{게임 루프 시작}
    class GameStart decision

    %% 메인 게임 루프 서브그래프
    subgraph GameLoop [메인 게임 루프 (requestAnimationFrame)]
        direction TB
        
        Input[입력 감지\n(키보드: 이동, 회전, 드롭)]
        class Input io

        UpdateProcess[[상태 업데이트\n(Update Logic)]]
        class UpdateProcess sub
        
        RenderProcess[[화면 그리기\n(Render Logic)]]
        class RenderProcess sub

        Input --> UpdateProcess
        UpdateProcess --> RenderProcess
    end

    GameStart --> Input
    RenderProcess --> GameOverCheck{게임 오버?}
    class GameOverCheck decision

    GameOverCheck -- No --> GameStart
    GameOverCheck -- Yes --> GameOverScreen[게임 오버 화면 출력\n(최종 점수, 재시작 버튼)]
    class GameOverScreen process

    GameOverScreen --> RestartWait{재시작 요청?}
    class RestartWait decision
    
    RestartWait -- Yes --> InitGame
    RestartWait -- No --> Exit([종료])
    class Exit startend

```

## 3. 세부 로직 흐름 (Detailed Logic)

### 3.1. 상태 업데이트 처리 (Update Process)

```mermaid
flowchart TD
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:black
    classDef decision fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:black
    
    Start([Update 시작]) --> TimerCheck{낙하 타이머 경과?}
    class Start process
    class TimerCheck decision

    TimerCheck -- Yes --> MoveDown[블록 한 칸 내리기]
    class MoveDown process
    
    TimerCheck -- No --> UserAction{사용자 입력 있음?}
    class UserAction decision

    MoveDown --> Collision{바닥/블록 충돌?}
    class Collision decision

    Collision -- Yes --> LockBlock[블록 고정\n(Lock Delay 적용)]
    class LockBlock process

    LockBlock --> CheckLines{완성된 줄 있음?}
    class CheckLines decision

    CheckLines -- Yes --> ClearLines[줄 삭제 및 점수 추가]
    class ClearLines process

    ClearLines --> MoveLinesDown[위쪽 블록들 내리기]
    MoveLinesDown --> CheckGameEnd{블록이 천장에 닿았나?}

    CheckLines -- No --> CheckGameEnd{블록이 천장에 닿았나?}
    class CheckGameEnd decision

    CheckGameEnd -- Yes --> SetGameOver[상태: Game Over 설정]
    CheckGameEnd -- No --> SpawnBlock[새 블록 생성]
    class SpawnBlock process

    SpawnBlock --> End([Update 종료])
    SetGameOver --> End
    
    Collision -- No --> End

    UserAction -- Yes --> HandleInput[이동/회전 처리]
    HandleInput --> CollisionCheck{이동 가능?}
    CollisionCheck -- Yes --> UpdatePos[좌표 갱신]
    CollisionCheck -- No --> CancelInput[입력 무시]
    
    UpdatePos --> End
    CancelInput --> End
```
