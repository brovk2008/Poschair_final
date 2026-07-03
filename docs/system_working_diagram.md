# PosChair V3 System Working Diagram

This document shows the full PosChair V3 system from every user, sensor, software, BLE, firmware, driver, motor, actuator, and feedback input to every output.

## 1. End-to-End System Flow

```mermaid
flowchart LR
  User["User sitting on chair"]
  Camera["Browser camera input"]
  Light["Lighting / camera angle"]
  Browser["Chrome or Edge dashboard"]
  Pose["MediaPipe Pose WASM"]
  Analyzer["Posture Analyzer"]
  Decision["V3 Decision Engine"]
  BLEClient["Web Bluetooth Manager"]
  BLEAir["BLE radio link"]
  ESP32["ESP32-C3 firmware"]
  MotorCtrl["MotorController timed-position model"]
  Drivers["6x BTS7960 H-bridge drivers"]
  Motors["6x DC geared motors"]
  WormRack["6x worm-rack actuators"]
  FoamPads["6x foam pads"]
  Back["User paraspinal muscles"]
  Status["BLE status notify"]
  UI["Dashboard UI"]
  Backend["FastAPI backend"]
  DB["PostgreSQL database"]

  User --> Camera
  Light --> Camera
  Camera --> Browser
  Browser --> Pose
  Pose --> Analyzer
  Analyzer --> Decision
  Decision --> BLEClient
  BLEClient --> BLEAir
  BLEAir --> ESP32
  ESP32 --> MotorCtrl
  MotorCtrl --> Drivers
  Drivers --> Motors
  Motors --> WormRack
  WormRack --> FoamPads
  FoamPads --> Back
  Back --> User

  ESP32 --> Status
  Status --> BLEAir
  BLEAir --> BLEClient
  BLEClient --> UI
  Analyzer --> UI
  Decision --> UI
  UI --> Backend
  Backend --> DB
  DB --> Backend
  Backend --> UI
```

## 2. Inputs and Outputs

```mermaid
flowchart TB
  subgraph Inputs["Inputs"]
    CameraFrames["Camera frames"]
    UserMode["Mode selection: office / gaming / study / relax"]
    Calibration["Calibration baseline"]
    ManualOverride["Manual position sliders"]
    BLEStatusIn["ESP32 status notifications"]
    MotorSpeedCal["MOTOR_SPEED_MM_PER_MS calibration"]
    PowerOn["Power-on / reset"]
    BLEDisconnect["BLE disconnect or silent packets"]
  end

  subgraph Processing["Processing"]
    PoseDetection["Pose landmark detection"]
    ConfidenceGate["Confidence gate >= 0.65"]
    Geometry["Spine, lateral, head-offset geometry"]
    Velocity["Spine and lateral velocity calculation"]
    PositionMapping["0-100mm target mapping"]
    PacketBuild["8-byte BLE command packet"]
    PacketParse["ESP32 checksum validation"]
    TimedMotion["Timed motor run duration"]
    Homing["Startup homing to 0mm"]
    Failsafe["2-second BLE failsafe"]
  end

  subgraph Outputs["Outputs"]
    TargetPositions["Target positions: UL UR ML MR LL LR"]
    Dashboard["Live dashboard state"]
    BLEPacket["BLE write without response"]
    PWMOut["RPWM / LPWM PWM output"]
    MotorMotion["Motor extend / retract / brake / coast"]
    PadTravel["Foam pad travel: 0-100mm"]
    SessionLogs["Session analytics logs"]
    SafetyRetract["All modules retract to 0mm"]
  end

  CameraFrames --> PoseDetection
  PoseDetection --> ConfidenceGate
  ConfidenceGate --> Geometry
  Geometry --> Velocity
  Velocity --> PositionMapping
  UserMode --> PositionMapping
  Calibration --> Geometry
  ManualOverride --> TargetPositions
  PositionMapping --> TargetPositions
  TargetPositions --> PacketBuild
  PacketBuild --> BLEPacket
  BLEPacket --> PacketParse
  PacketParse --> TimedMotion
  MotorSpeedCal --> TimedMotion
  TimedMotion --> PWMOut
  PWMOut --> MotorMotion
  MotorMotion --> PadTravel
  BLEStatusIn --> Dashboard
  Geometry --> Dashboard
  PositionMapping --> Dashboard
  Dashboard --> SessionLogs
  PowerOn --> Homing
  Homing --> SafetyRetract
  BLEDisconnect --> Failsafe
  Failsafe --> SafetyRetract
```

## 3. Browser App Processing Loop

```mermaid
flowchart TD
  Start["User clicks Enable Tracking"]
  CameraPermission["Request camera permission"]
  LoadModel["Load MediaPipe Pose Landmarker"]
  FrameLoop["requestAnimationFrame loop"]
  Detect["Detect 33 pose landmarks"]
  HasLandmarks{"Landmarks found?"}
  Analyze["Analyze posture geometry"]
  ComputeVelocity["Compute velocity deg/sec"]
  Confidence{"Confidence >= 0.65?"}
  Hold["Hold previous target positions"]
  ComputeTargets["Compute V3 target positions"]
  Hysteresis["Apply 3-unit hysteresis"]
  UpdateUI["Update score, confidence, velocity, grid UI"]
  SendAllowed{"BLE connected and Active BLE Loop?"}
  Throttle{"100ms send interval elapsed?"}
  SendBLE["Send 8-byte position packet"]
  LogScore{"1s score log interval?"}
  SaveHistory["Append score to session history"]
  NextFrame["Next animation frame"]

  Start --> CameraPermission
  CameraPermission --> LoadModel
  LoadModel --> FrameLoop
  FrameLoop --> Detect
  Detect --> HasLandmarks
  HasLandmarks -- "No" --> NextFrame
  HasLandmarks -- "Yes" --> Analyze
  Analyze --> ComputeVelocity
  ComputeVelocity --> Confidence
  Confidence -- "No" --> Hold
  Confidence -- "Yes" --> ComputeTargets
  ComputeTargets --> Hysteresis
  Hold --> UpdateUI
  Hysteresis --> UpdateUI
  UpdateUI --> SendAllowed
  SendAllowed -- "No" --> LogScore
  SendAllowed -- "Yes" --> Throttle
  Throttle -- "No" --> LogScore
  Throttle -- "Yes" --> SendBLE
  SendBLE --> LogScore
  LogScore -- "Yes" --> SaveHistory
  LogScore -- "No" --> NextFrame
  SaveHistory --> NextFrame
  NextFrame --> FrameLoop
```

## 4. Decision Engine Mapping

```mermaid
flowchart LR
  SpineDeviation["spineDeviation or spineAngleDeg"]
  LateralDeviation["lateralDeviation or lateralLeanDeg"]
  SpineVelocity["velocitySpine"]
  Mode["Mode scale"]
  Confidence["confidence"]

  Gate{"confidence < 0.65?"}
  Prev["Return previous positions"]
  ForwardMap["Forward proportional map"]
  VelocityBonus["Velocity anticipation bonus"]
  LateralSplit["Lateral opposite-column boost"]
  Scale["Apply mode scale"]
  Clamp["Clamp each value 0-100"]
  Hysteresis["Only change if delta >= 3"]
  Positions["[UL, UR, ML, MR, LL, LR] positions"]

  Confidence --> Gate
  Gate -- "Yes" --> Prev
  Prev --> Positions
  Gate -- "No" --> ForwardMap
  SpineDeviation --> ForwardMap
  SpineVelocity --> VelocityBonus
  VelocityBonus --> ForwardMap
  LateralDeviation --> LateralSplit
  ForwardMap --> Scale
  LateralSplit --> Scale
  Mode --> Scale
  Scale --> Clamp
  Clamp --> Hysteresis
  Hysteresis --> Positions
```

## 5. BLE Packet Path

```mermaid
sequenceDiagram
  participant App as Browser App
  participant BLE as Web Bluetooth
  participant ESP as ESP32-C3 NimBLE
  participant FW as Firmware Parser
  participant MC as MotorController
  participant UI as Dashboard UI

  App->>App: Clamp positions to 0-100
  App->>App: Build 8-byte packet
  Note over App: A5 UL UR ML MR LL LR XOR
  App->>BLE: writeValueWithoutResponse(command)
  BLE->>ESP: Command characteristic write
  ESP->>FW: onWrite callback
  FW->>FW: Validate length, header, checksum
  alt Valid packet
    FW->>MC: setTarget(i, position)
    FW->>FW: lastValidPacketMs = millis()
  else Invalid packet
    FW-->>ESP: Drop packet
  end
  ESP->>ESP: Every 1000ms build status
  Note over ESP: 5A flags 00 00 UL UR ML MR LL LR
  ESP->>BLE: notify(status)
  BLE->>App: characteristicvaluechanged
  App->>UI: Update homed, moving, failsafe, actual positions
```

## 6. ESP32 Firmware Loop

```mermaid
flowchart TD
  Boot["Power-on / reset"]
  InitSerial["Start Serial"]
  InitMotorPins["Attach RPWM and LPWM PWM pins"]
  EnableDrivers["Set shared EN_PIN HIGH"]
  HomeAll["Run all motors inward for HOMING_TIMEOUT_MS"]
  ZeroPositions["Set current positions to 0"]
  StartBLE["Advertise as POSCHAIR_001"]
  Loop["Main loop"]
  UpdateMotors["MotorController.update"]
  Timeout{"No valid BLE packet > 2000ms?"}
  EnterFailsafe["Set failsafe active"]
  RetractAll["Command all targets to 0mm"]
  StatusDue{"Status interval elapsed?"}
  Notify["Notify 10-byte status packet"]
  Continue["Continue loop"]

  Boot --> InitSerial
  InitSerial --> InitMotorPins
  InitMotorPins --> EnableDrivers
  EnableDrivers --> HomeAll
  HomeAll --> ZeroPositions
  ZeroPositions --> StartBLE
  StartBLE --> Loop
  Loop --> UpdateMotors
  UpdateMotors --> Timeout
  Timeout -- "Yes" --> EnterFailsafe
  EnterFailsafe --> RetractAll
  RetractAll --> StatusDue
  Timeout -- "No" --> StatusDue
  StatusDue -- "Yes" --> Notify
  StatusDue -- "No" --> Continue
  Notify --> Continue
  Continue --> Loop
```

## 7. Single Module Motor Control

```mermaid
stateDiagram-v2
  [*] --> IDLE
  IDLE --> MOVING_OUT: target > current
  IDLE --> MOVING_IN: target < current
  MOVING_OUT --> IDLE: run duration elapsed
  MOVING_IN --> IDLE: run duration elapsed
  IDLE --> HOMING: startup
  HOMING --> IDLE: timeout complete and position zeroed
  MOVING_OUT --> MOVING_IN: new lower target
  MOVING_IN --> MOVING_OUT: new higher target
  MOVING_OUT --> IDLE: stopAll
  MOVING_IN --> IDLE: stopAll
```

```mermaid
flowchart LR
  Target["Target position 0-100mm"]
  Current["Current estimated position"]
  Delta["delta_mm = abs(target - current)"]
  Speed["MOTOR_SPEED_MM_PER_MS"]
  Duration["duration_ms = delta_mm / speed"]
  Direction{"target > current?"}
  Out["Extend: RPWM=200 LPWM=0"]
  In["Retract: RPWM=0 LPWM=200"]
  Stop["Stop: RPWM=0 LPWM=0"]
  Update["Set current = target"]

  Target --> Delta
  Current --> Delta
  Delta --> Duration
  Speed --> Duration
  Duration --> Direction
  Direction -- "Yes" --> Out
  Direction -- "No" --> In
  Out --> Stop
  In --> Stop
  Stop --> Update
```

## 8. Physical Output Grid

```mermaid
flowchart TB
  subgraph Grid["2x3 Paraspinal Actuator Grid"]
    UL["M0 UL: Upper-Left foam pad"]
    UR["M1 UR: Upper-Right foam pad"]
    ML["M2 ML: Mid-Left foam pad"]
    MR["M3 MR: Mid-Right foam pad"]
    LL["M4 LL: Lower-Left foam pad"]
    LR["M5 LR: Lower-Right foam pad"]
  end

  subgraph Anatomy["User Back Contact Zones"]
    ULeft["Upper-left paraspinal zone"]
    URight["Upper-right paraspinal zone"]
    MLeft["Mid-left lumbar zone"]
    MRight["Mid-right lumbar zone"]
    LLeft["Lower-left pelvis/lumbar zone"]
    LRight["Lower-right pelvis/lumbar zone"]
    SpineGap["2cm open spine gap"]
  end

  UL --> ULeft
  UR --> URight
  ML --> MLeft
  MR --> MRight
  LL --> LLeft
  LR --> LRight
  ULeft --- SpineGap
  MLeft --- SpineGap
  LLeft --- SpineGap
  SpineGap --- URight
  SpineGap --- MRight
  SpineGap --- LRight
```

## 9. Safety and Failure Paths

```mermaid
flowchart TD
  Normal["Normal closed-loop operation"]
  BadPacket["Bad BLE packet"]
  LowConfidence["Low pose confidence"]
  BLETimeout["No valid BLE command for 2s"]
  PowerCycle["Power cycle / reset"]
  ManualStop["User stops camera or disconnects"]

  Drop["Drop packet, keep previous target"]
  Hold["Hold previous positions"]
  Retract["Retract all modules to 0mm"]
  Home["Startup homing to 0mm"]
  UIWarn["Show UI warning or disconnected state"]
  SafeState["Safe mechanical state"]

  Normal --> BadPacket
  Normal --> LowConfidence
  Normal --> BLETimeout
  Normal --> PowerCycle
  Normal --> ManualStop

  BadPacket --> Drop
  Drop --> SafeState
  LowConfidence --> Hold
  Hold --> SafeState
  BLETimeout --> Retract
  Retract --> SafeState
  PowerCycle --> Home
  Home --> SafeState
  ManualStop --> UIWarn
  UIWarn --> SafeState
```

## 10. Backend Data Flow

```mermaid
flowchart LR
  UI["React dashboard"]
  Profile["Profile form / default user"]
  CalibrationModal["Calibration modal"]
  Session["Monitoring session"]
  API["FastAPI backend"]
  DB["PostgreSQL"]
  Analytics["Analytics dashboard"]

  Profile --> UI
  CalibrationModal --> UI
  Session --> UI
  UI -->|POST /profile| API
  UI -->|POST /calibration| API
  UI -->|POST /sessions| API
  UI -->|GET /sessions/:userId| API
  API --> DB
  DB --> API
  API --> Analytics
  Analytics --> UI
```

## 11. Key Signals and Units

| Signal | Source | Destination | Unit / Format |
|---|---|---|---|
| Camera frames | Browser camera | MediaPipe Pose | Video frame |
| Pose landmarks | MediaPipe Pose | Posture analyzer | 33 landmarks |
| `spineAngleDeg` | Posture analyzer | Decision engine / UI | Degrees |
| `lateralLeanDeg` | Posture analyzer | Decision engine / UI | Degrees |
| `velocitySpine` | Posture analyzer | Decision engine / UI | Degrees per second |
| `confidence` | Pose landmarks | Decision engine / UI | 0.0-1.0 |
| Target positions | Decision engine | BLE manager | 6 values, 0-100mm |
| Command packet | BLE manager | ESP32-C3 | 8 bytes |
| Current positions | ESP32-C3 | Dashboard UI | 6 values, 0-100mm |
| Motor PWM | ESP32-C3 | BTS7960 drivers | 0-255 duty |
| Foam pad travel | Worm-rack actuator | User back | 0-100mm |
