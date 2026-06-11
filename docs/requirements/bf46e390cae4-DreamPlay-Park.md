# DreamPlay Park
### Product Requirements Document (PRD)

Version: 1.0  
Type: Frontend Only  
Theme: Dreamy Fantasy Amusement Park  
Tech Stack: React + TypeScript + Vite + TailwindCSS + Framer Motion + Canvas API

---

# 1. Project Vision

DreamPlay Park is a beautiful browser-based game playground that combines multiple classic mini-games into a single magical amusement park experience.

Instead of displaying games as a boring list, users enter a dreamlike theme park where every attraction represents a different classic game.

The entire website feels like exploring a fantasy carnival at sunset, filled with floating lights, cute creatures, animated rides, and magical effects.

Users can freely walk around the park map and click attractions to enter games.

No account system.
No backend.
Pure frontend project.

---

# 2. Design Goals

## Emotional Goals

Users should feel:

- Curious
- Relaxed
- Nostalgic
- Playful
- Rewarded for exploration

Visual inspiration:

- Disney Fantasyland
- Ghibli dream worlds
- Animal Crossing
- MapleStory towns
- Stardew Valley festivals
- Monument Valley aesthetics

---

# 3. Site Structure

```text
/
├── Playground Map (Main World)
│
├── Snake Kingdom
├── Brick Break Castle
├── Tetris Tower
├── Space Shooter Port
├── Memory Garden
├── Minesweeper Cave
├── Flappy Forest
├── 2048 Crystal Mine
├── Pac Maze
└── More Games...
```

---

# 4. Main Playground Map

## Core Concept

The homepage is an explorable amusement park.

Not a menu.

Not a dashboard.

A living game world.

---

## Visual Layout

```text
                🎡 Ferris Wheel
                     |
     🎈 Balloon Field ---- 🎯 Arcade Plaza

                     |
🏰 Snake Castle ---- Central Fountain ---- 🧱 Brick Castle

                     |
      🌲 Flappy Forest ---- 💎 Crystal Mine

                     |
                🚀 Space Port
```

---

## Features

### Interactive Attractions

Each attraction represents a game.

Examples:

| Attraction | Game |
|------------|------|
| Snake Castle | Snake |
| Brick Break Castle | Brick Breaker |
| Crystal Mine | 2048 |
| Flappy Forest | Flappy Bird |
| Space Port | Space Shooter |
| Memory Garden | Memory Match |
| Maze Ruins | Pac-Man Style |
| Puzzle Tower | Tetris |

---

### Hover Effects

When user hovers:

- Attraction glows
- Floating particles appear
- Cute mascot waves
- Short description popup

Example:

```text
🏰 Snake Castle

"The kingdom's snakes are hungry.
Can you become the longest ruler?"
```

---

### Day/Night Cycle

Optional animation:

- Morning
- Sunset
- Night

Park lighting changes gradually.

---

### Animated Background

Features:

- Clouds drifting
- Floating balloons
- Fireflies
- Magic particles
- Birds flying

---

### Ambient Sound

Optional toggle.

Examples:

- Wind
- Carnival music
- Fountain water
- Birds

---

# 5. Navigation

## Enter Game

User clicks attraction.

Transition:

```text
Zoom In
Fade
Camera Fly-To
```

Then enter game page.

---

## Return To Park

Every game contains:

```text
← Return To Dream Park
```

Top-left corner.

---

# 6. Game Page Template

All games share a unified layout.

---

## Layout

```text
+--------------------------------------------------+
| ← Return To Park                                 |
|                                                  |
|               Game Title                         |
|                                                  |
|                Score                             |
|                                                  |
|                 Canvas                           |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|   Restart      Pause      Sound                  |
+--------------------------------------------------+
```

---

## Features

### Responsive

Desktop

Tablet

Mobile

---

### Fullscreen Mode

One-click fullscreen.

---

### Pause System

Every game supports:

- Pause
- Resume

---

### Restart

Restart current game.

---

### Local High Score

Store using:

```javascript
localStorage
```

No backend required.

---

# 7. Mini Games

## Phase 1

### Snake

Theme:

Snake Kingdom

Features:

- Food
- Speed increase
- High score

---

### Brick Breaker

Theme:

Brick Break Castle

Features:

- Paddle
- Ball physics
- Multiple levels

---

### Tetris

Theme:

Puzzle Tower

Features:

- Classic blocks
- Hold piece
- Next piece preview

---

### 2048

Theme:

Crystal Mine

Features:

- Smooth tile animations

---

### Memory Match

Theme:

Magic Garden

Features:

- Cute card artwork

---

# 8. Phase 2 Games

### Flappy Bird

Theme:

Flappy Forest

---

### Space Shooter

Theme:

Galaxy Port

---

### Pac-Man Style Maze

Theme:

Maze Ruins

---

### Whack-A-Mole

Theme:

Goblin Village

---

### Frog Crossing

Theme:

River Adventure

---

### Bubble Shooter

Theme:

Cloud Carnival

---

# 9. Progression System

No accounts.

Progress stored locally.

---

## Attraction Completion

When a user reaches milestones:

Example:

```text
Snake Score > 100
```

Park unlocks decorations.

Examples:

- New trees
- Fireworks
- Golden statues
- Floating islands

---

## Achievement System

Examples:

### Snake Master

Score 200+

---

### Brick Destroyer

Clear 1000 bricks

---

### Puzzle Wizard

Reach 4096 in 2048

---

# 10. Reward Effects

Achievements trigger:

- Confetti
- Fireworks
- Screen sparkle
- Sound effects

---

# 11. Visual Style

## Color Palette

### Sky

```css
#AEE2FF
#C7F9FF
#FFF5E4
```

### Fantasy

```css
#FFD6EC
#B8E8FC
#D7FFD9
#FFF4B8
```

### Night

```css
#2B2D42
#3A506B
#5BC0BE
```

---

## Art Direction

Style:

- Soft
- Rounded
- Cute
- Cozy
- Dreamy

Avoid:

- Sharp edges
- Dark cyberpunk
- Serious business UI

---

# 12. Animation System

Use Framer Motion.

---

## Attraction Idle

```text
Float Up
Float Down
```

---

## Hover

```text
Scale 1.05
Glow
Particles
```

---

## Enter Attraction

```text
Camera Zoom
Fade
Magic Sparkles
```

---

# 13. Technical Architecture

## Frontend Stack

```text
React
TypeScript
Vite
TailwindCSS
Framer Motion
React Router
```

---

## Game Engine

For simple games:

```text
HTML5 Canvas
requestAnimationFrame
```

No external engine needed.

---

## Project Structure

```text
src/

├── pages/
│   ├── ParkPage
│   ├── SnakePage
│   ├── TetrisPage
│   └── ...
│
├── games/
│   ├── snake/
│   ├── tetris/
│   ├── brick-breaker/
│   └── ...
│
├── components/
│   ├── Attraction
│   ├── ParkMap
│   ├── AchievementPopup
│   ├── ParticleSystem
│   └── UI
│
├── assets/
│   ├── music
│   ├── images
│   └── effects
│
├── hooks/
├── utils/
└── store/
```

---

# 14. Future Expansion

Potential future attractions:

- Chess Garden
- Sudoku Temple
- Pinball Palace
- Tower Defense Fortress
- Card Battle Arena
- Multiplayer Arcade Hall
- Daily Challenge Island
- Seasonal Festival Areas

---

# Success Criteria

A visitor should feel:

> "I'm not opening a website to play games.
> I'm entering a magical theme park where every ride is a game."

The park itself should be as enjoyable to explore as the games themselves.