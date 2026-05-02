# Badminton Match Scoring App - UI Specification

## 1. Concept & Vision

A premium badminton match scoring application that combines Apple Human Interface Guidelines' clarity with Material Design's motion philosophy. The app exudes competitive sports energy through dynamic glassmorphism, vibrant neon accents, and fluid micro-interactions. Every tap should feel responsive and satisfying, creating an immersive real-match atmosphere whether on phone, tablet, or desktop.

## 2. Design Language

### Aesthetic Direction
- **Reference**: Apple Fitness+ meets Spotify's dark UI with Material You's tactile feedback
- **Key Elements**: Frosted glass cards, subtle gradients, glowing accents, sport-inspired motion trails

### Color Palette
```
Primary Green:    #00FF87 (neon mint - main accent)
Primary Blue:     #00D4FF (electric cyan - secondary accent)
Dark Background:  #0A0A0F (near-black with blue tint)
Dark Surface:    #16161D (elevated surfaces)
Dark Card:        #1E1E28 (card backgrounds)
Light Background: #F5F7FA (soft gray-white)
Light Surface:    #FFFFFF
Light Card:       #FFFFFF with shadow
Success:          #00FF87
Warning:          #FF6B35 (orange - deuce state)
Danger:           #FF3B5C (red - critical moments)
Text Primary (dark): #FFFFFF
Text Secondary (dark): #A0A0A8
Text Primary (light): #1A1A1F
Text Secondary (light): #6B6B75
```

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent readability
- **Numeric Display**: SF Pro Display / Inter (fallback) - large score numbers
- **Weights**: 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Scale**: 12px / 14px / 16px / 20px / 24px / 32px / 48px / 72px / 96px

### Spatial System
- Base unit: 8px
- Card padding: 24px (mobile), 32px (tablet+)
- Section gaps: 24px
- Border radius: 16px (cards), 12px (buttons), 24px (large cards), 50% (circular)

### Motion Philosophy
- **Duration**: 150ms (micro), 300ms (standard), 500ms (emphasis), 800ms (dramatic)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) for standard, cubic-bezier(0, 0, 0.2, 1) for decelerate
- **Score increment**: Scale pulse 1.0→1.15→1.0 with glow burst
- **Page transitions**: Fade + subtle slide (300ms)
- **Deuce warning**: Continuous pulse animation (1.5s infinite)
- **Victory**: Confetti explosion + scale bounce + glow ring

### Visual Assets
- **Icons**: Lucide Icons (clean, consistent stroke width)
- **Decorative**: SVG badminton shuttlecock, rackets, speed trails
- **Backgrounds**: Radial gradients with subtle noise texture
- **Glass effect**: backdrop-filter: blur(20px), rgba(255,255,255,0.1) border

## 3. Layout & Structure

### Page Architecture

#### 3.1 Welcome/Login Page
- Full-screen gradient background with floating shuttlecock silhouettes
- Centered glass card with app logo
- "Get Started" CTA button with glow effect
- Theme toggle (sun/moon icon) in top-right

#### 3.2 Match Setup Page
- Scrollable form in glass card container
- Sections: Player Names → Game Mode → Scoring → Court Position
- Large, thumb-friendly toggle switches
- Prominent "Start Match" button at bottom
- Live preview of selected settings

#### 3.3 Live Scoring Page (Core)
- Split-screen: Player A (left) | Player B (right)
- Massive centered score numbers (96px+)
- Game/Game point indicators above scores
- Current server highlighted with pulsing icon
- Match timer in top-center with glass background
- +/- buttons below each score (large touch targets)
- Deuce warning banner (conditional)
- Quick settings access in top corners

#### 3.4 Deuce/Overtime State
- Red/orange warning gradient overlay
- "DEUCE" or "加时赛" text with pulse animation
- "Must win by 2" reminder badge
- Score area gets warning glow border

#### 3.5 Match End Page
- Winner announcement with trophy icon
- Confetti particle animation
- Final score display (large)
- Per-game breakdown in expandable cards
- Action buttons: New Match, Save, Share, Export

#### 3.6 History Page
- Search bar with filter chips
- Scrollable card list with match summaries
- Each card: date, players, final score, winner badge
- Swipe-to-delete on mobile, hover-reveal delete on desktop
- Empty state illustration when no matches

### Responsive Strategy
- **Mobile (<640px)**: Single column, stacked layout, bottom-fixed buttons
- **Tablet (640-1024px)**: Two-column where appropriate, larger touch targets
- **Desktop (>1024px)**: Centered max-width container (1200px), hover states active

## 4. Features & Interactions

### Match Setup
- **Player Names**: Text inputs with floating labels, max 20 characters
- **Mode Toggle**: Single/Double with sliding pill indicator
- **Scoring Select**: Radio button cards (11/15/21), selected has glow border
- **Games Select**: Radio button cards (1/3/5), selected has glow border
- **First Server**: Coin flip animation or manual selection
- **Start Button**: Disabled until names entered, pulses when ready

### Live Scoring
- **Add Point (+)**: Tap → score increments with bounce animation, button ripple effect
- **Remove Point (-)**: Long-press or tap → score decrements, subtle shake
- **Undo**: Available for 3 seconds after point, toast notification confirms
- **Server Toggle**: Tap server indicator to manually change (with confirmation)
- **Timer**: MM:SS format, auto-starts on first point, pauses on match end
- **Deuce Detection**: Auto-triggers at 20-20, shows warning overlay
- **Win Detection**: When winner has 2+ lead at 21+, triggers victory sequence

### Victory Sequence
- Screen flash white→normal (200ms)
- Confetti burst from center
- Winner name scales up with glow
- Trophy icon bounces in
- Action buttons fade in (staggered 100ms)
- Device vibration (if supported)

### History Management
- **Search**: Filters by player name or date
- **Delete**: Swipe left (mobile) or hover-reveal trash icon (desktop)
- **Confirm Delete**: Modal with "Cancel" / "Delete" buttons
- **Share**: Generates shareable image with app branding
- **Export**: Downloads JSON/CSV with full match data

### Error States
- Empty player name: Red border + "Required" label
- Network error (save): Toast with retry button
- Invalid operation: Shake animation + error toast

### Loading States
- Button loading: Spinner replaces text, disabled state
- Page transitions: Fade with subtle skeleton pulse

## 5. Component Inventory

### Buttons
- **Primary**: Gradient background (green→cyan), white text, glow shadow
  - Hover: Brightness 110%, shadow expands
  - Active: Scale 0.98, shadow contracts
  - Disabled: Grayscale, 50% opacity
- **Secondary**: Glass background, colored border, colored text
- **Icon Button**: Circular, glass background, icon centered
  - Hover: Background lightens
  - Active: Scale 0.95

### Score Display
- Container: Glass card with inner glow
- Number: Extra bold, tabular-nums, gradient text (green→blue)
- Label: Small caps, secondary text color
- Animation: Scale pulse + color flash on change

### Toggle Switch
- Track: 52x28px rounded pill, glass background
- Thumb: 24x24px circle, gradient fill
- Transition: Thumb slides 24px, track color changes

### Radio Cards
- Size: Fill available width, 56px height
- Default: Glass background, secondary text
- Selected: Primary border glow, primary text, checkmark icon
- Hover: Border appears (1px primary with 50% opacity)

### Input Fields
- Height: 56px
- Background: Glass effect
- Border: 1px secondary, 2px primary on focus
- Label: Floats above on focus/filled
- Error: Red border, error message below

### Match History Card
- Padding: 20px
- Background: Glass card
- Content: Date, players, score, winner badge
- Actions: Revealed on hover (desktop) or swipe (mobile)

### Toast Notifications
- Position: Bottom center, 24px from edge
- Style: Glass card, icon + message + optional action
- Animation: Slide up + fade in, auto-dismiss 3s
- Types: Success (green icon), Error (red icon), Info (blue icon)

### Modal/Dialog
- Overlay: Black 60% opacity, blur background
- Card: Centered, max-width 400px, glass background
- Animation: Scale 0.95→1 + fade in

## 6. Technical Approach

### Stack
- **HTML5**: Semantic markup, accessibility attributes
- **CSS3**: Custom properties, Grid/Flexbox, animations, media queries
- **JavaScript**: Vanilla ES6+ with Redux-style state management

### Redux Architecture

#### Store Structure
```javascript
const initialState = {
    darkMode: true,
    currentPage: 'welcomePage',
    ui: {
        playerANameInput: '',
        playerBNameInput: ''
    },
    settings: {
        mode: 'single',
        scoring: 21,
        gamesToWin: 3,
        firstServer: 'A'
    },
    match: {
        playerA: { name: '选手 A', score: 0, games: [] },
        playerB: { name: '选手 B', score: 0, games: [] },
        timer: { started: false, elapsed: 0 },
        currentServer: 'A',
        isDeuce: false,
        gamesWonA: 0,
        gamesWonB: 0,
        isComplete: false,
        winner: null
    },
    history: [],
    past: [],    // Undo history
    future: []   // Redo future
};
```

#### Action Types
| Action | Description | Payload |
|--------|-------------|---------|
| `TOGGLE_THEME` | Switch dark/light mode | - |
| `NAVIGATE` | Change active page | `{ pageId }` |
| `SET_MODE` | Set single/double mode | `{ mode }` |
| `SELECT_SCORING` | Set points system | `{ scoring }` |
| `SELECT_GAMES` | Set games to win | `{ gamesToWin }` |
| `SELECT_FIRST_SERVER` | Set first server | `{ firstServer }` |
| `SET_PLAYER_NAME` | Update player name | `{ player, name }` |
| `START_MATCH` | Initialize new match | `{ playerAName, playerBName }` |
| `INCREMENT_SCORE` | Add point to player | `{ player }` |
| `DECREMENT_SCORE` | Remove point from player | `{ player }` |
| `SWITCH_SERVER` | Toggle server | - |
| `START_TIMER` | Start match timer | - |
| `TICK_TIMER` | Increment timer | - |
| `START_NEW_GAME` | Begin next game | - |
| `END_MATCH` | Complete match | `{ winner }` |
| `SAVE_MATCH` | Save to history | - |
| `DELETE_HISTORY` | Remove history record | `{ id }` |
| `UNDO` | Restore previous state | - |
| `REDO` | Restore next state | - |

#### State Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTION                           │
│                  (click, input, toggle)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ACTION CREATORS                            │
│         ActionCreators.incrementScore('A')                   │
│         createAction('INCREMENT_SCORE', { player: 'A' })     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       DISPATCH                               │
│                   dispatch(action)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       REDUCER                               │
│              reducer(currentState, action)                    │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  past[]      │───▶│ currentState │───▶│  future[]    │  │
│  │  (history)   │    │  (present)   │    │  (redo)      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                   │                   ▲           │
│         │                   │                   │           │
│         │                   ▼                   │           │
│         │           ┌──────────────┐            │           │
│         └───────────┤ IMMUTABLE   ├────────────┘           │
│                     │ UPDATE      │                        │
│                     └──────────────┘                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUBSCRIBERS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ UI Renderer │  │  Storage    │  │  Analytics  │         │
│  │ (DOM sync)  │  │ (persist)   │  │ (optional)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### Undo/Redo Implementation
- **past[]**: Stack of previous match states (immutable snapshots)
- **future[]**: Stack of undone states for redo capability
- **cloneDeep()**: JSON.parse(JSON.stringify()) for immutable copying
- **UNDO**: Pops from past[], pushes current to future[]
- **REDO**: Pops from future[], pushes current to past[]

#### Store API
```javascript
const store = {
    getState: () => currentState,        // Read current state
    dispatch: (action) => {               // Dispatch action
        currentState = reducer(currentState, action);
        listeners.forEach(listener => listener(currentState));
        return action;
    },
    subscribe: (listener) => {            // Subscribe to changes
        listeners.push(listener);
        return () => { listeners = listeners.filter(l => l !== listener); };
    }
};
```

### Persistence
- LocalStorage for match history and preferences
- Auto-save on every state change via subscriber
- Hydrate on app initialization

### Animations (CSS)
```css
@keyframes scoreIncrement {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

### Accessibility
- ARIA labels on interactive elements
- Focus visible outlines
- Reduced motion media query support
- Color contrast minimum 4.5:1

### Performance
- CSS containment on animated elements
- will-change hints for transforms
- Debounced resize handlers
- Passive event listeners where applicable

## 7. BWF Rules Engine

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    BadmintonRules Class                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CourtSide    │  │ CourtArea    │  │ PlayerPos    │     │
│  │ (LEFT/RIGHT) │  │ (Service)    │  │ (Server...)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           │                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  State Management                    │   │
│  │  - mode (single/double)     - scoringSystem        │   │
│  │  - servingPair               - currentServer        │   │
│  │  - serviceCourt              - isDeuce              │   │
│  │  - isAtCap                   - needSideChange       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BadmintonStateMachine                       │
│                                                              │
│   IDLE → READY → PLAYING → POINT_SCORED → GAME_END → MATCH  │
│                    ↓                                         │
│               SIDE_CHANGE                                   │
└─────────────────────────────────────────────────────────────┘
```

### Supported BWF Rules

| Rule | Description | Implementation |
|------|-------------|----------------|
| 单打规则 | Single player per side | `mode: 'single'` |
| 双打规则 | Two players per side | `mode: 'double'` |
| 双打发球轮换 | Serving rotation in doubles | `handleDoubleServingRotation()` |
| 奇偶区发球 | Odd/even server score determines court | `updateServiceCourt()` (server score parity) |
| 30分封顶 | 30-point cap (29-29) | `checkCapRule()` |
| Deuce规则 | Must win by 2 points | `checkDeuce()` |
| 第三局11分换边 | Side change at 11 in game 3 | `checkSideChangeNeeded()` |
| 局间换边 | Side change between games | `startNewGame()` |
| 发球方提示 | Server indicator | `getServerPositionName()` |
| 发球区域提示 | Service court indicator | `getServiceCourtName()` |
| 当前站位提示 | Position hints | `getPositionHints()` |
| 犯规判定 | Fault detection | `callFault()` |

### Rules Engine API

```javascript
// Initialize rules engine
const rules = new BadmintonRules();
rules.initializeMatch({
    mode: 'double',
    scoringSystem: 21,
    gamesToWin: 3,
    firstServer: 'A'
});

// Handle point scored
const result = rules.handlePoint('A', 5, 3, 0, 0, 1);
// Returns: { winner, serverChanged, sideChanged, gameEnded, ... }

// Get current position hints
const hints = rules.getPositionHints();
// Returns: { server, receiver, courtSideA, courtSideB, serviceCourt, instruction }

// Call a fault
const fault = rules.callFault('OUT');
// Returns: { code: 'OUT', reason: '球出界', pointTo: 'receiver' }

// Check match end
const matchResult = rules.checkMatchEnd(21, 18, 2, 1, 0);
// Returns: { gameEnded: true, matchEnded: false, winner: 'A' }
```

### State Machine Events

| Event | From State | To State | Data |
|-------|------------|----------|------|
| `INIT_MATCH` | IDLE | READY | `{ config }` |
| `START_GAME` | READY | PLAYING | `{ gameNumber, gamesWonA, gamesWonB }` |
| `POINT_SCORED` | PLAYING | POINT_SCORED | `{ winner, scoreA, scoreB }` |
| `FAULT_CALLED` | PLAYING | PLAYING | `{ faultType }` |
| `SIDE_CHANGE` | POINT_SCORED | PLAYING | - |
| `GAME_END` | POINT_SCORED | GAME_END | `{ matchEnded }` |
| `MATCH_END` | GAME_END | MATCH_END | - |

### Example Match Flow

```
Game 1 Start:
  - A1 serves from RIGHT (score 0-0)
  - A1 wins point (1-0), A1 serves from LEFT
  - B wins point (1-1), B1 serves from RIGHT
  - B wins point (1-2), B1 serves from LEFT
  - ...

Game 1 End (21-18):
  - Side change between games
  - B1 serves first in Game 2

Game 3 (at 10-10):
  - Side change at 11 points
  - A1 serves from LEFT
  - First to 30 wins (cap rule)
```

### UI Indicators

| Element | Description | Color |
|---------|-------------|-------|
| `#serviceCourtIndicator` | Current service court | Gradient (green→blue) |
| `#serverHint` | Which side is serving | Green border |
| `#courtSideHint` | Court side positioning | Blue border |
| `#sideChangeOverlay` | Side change notification | Blue pulse |
| `#deuceOverlay` | Deuce warning | Orange pulse |
| `#capOverlay` | 30-point cap warning | Red pulse |

## 8. Voice Announcement System

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    VoiceManager Class                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SpeechSynthesis API                                   │   │
│  │  - speak(text, options)                              │   │
│  │  - stop(), pause(), resume()                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Announcement Methods                                 │   │
│  │  - announceScore()      - announceServer()          │   │
│  │  - announceDeuce()     - announceGameWon()          │   │
│  │  - announceMatchWon()  - announceSideChange()       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Commentary Mode                                      │   │
│  │  - Exciting phrases  - Comeback detection            │   │
│  │  - Match point alerts - AI passion mode              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Voice API

```javascript
// Global instance
const voice = window.voiceManager;

// Configuration
voice.setLanguage('zh-CN');        // 中文/English
voice.setRate(1.0);               // 语速 0.5-2
voice.setVolume(0.8);             // 音量 0-1
voice.setPitch(1.0);              // 音调 0.5-2
voice.setCommentaryMode(true);    // 激情解说

// Announcements
voice.announceScore(15, 12, '张三', '李四');
// Output: "张三 15，李四 12"

voice.announceServer('A', '张三', '李四');
// Output: "张三 发球"

voice.announceDeuce(20, 20);
// Output: "平分！加时赛！必须领先两分获胜！"

voice.announceGameWon('A', 21, 18, 1);
// Output: "第一局结束！张三 获胜！21 比 18"

voice.announceMatchWon('A', '张三', '李四', 2, 1);
// Output: "比赛结束！张三 获胜！最终比分 2 比 1"
```

### Commentary Phrases

| Type | Chinese | English |
|------|---------|---------|
| Exciting | 太精彩了！漂亮！好球！ | Amazing! Beautiful! Great shot! |
| Close Score | 比分咬得很紧！关键分！ | Tight score! Crucial point! |
| Comeback | 逆转！绝地反击！反超！ | Comeback! Turnaround! |
| Match Point | 赛点！金牌点！冠军点！ | Match point! Championship point! |

### UI Controls

| Element | Description |
|---------|-------------|
| `#voiceSettingsBtn` | Voice settings toggle button |
| `#voiceSettingsPanel` | Settings panel with sliders |
| `#rateSlider` | Speech rate control (0.5x - 2x) |
| `#volumeSlider` | Volume control (0% - 100%) |
| `#commentaryModeToggle` | AI commentary mode switch |
| `#langZhBtn` / `#langEnBtn` | Language toggle buttons |
