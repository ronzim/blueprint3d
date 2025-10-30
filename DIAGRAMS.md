# Blueprint3D - Architecture Diagrams

## Current System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Blueprint3D                               │
│                     (Main Entry Point)                           │
└────────────┬────────────────────────────────┬────────────────────┘
             │                                │
             │                                │
┌────────────▼────────────┐      ┌───────────▼──────────────────┐
│        Model            │      │     Floorplanner             │
│   (Data & Logic)        │      │   (2D Editor)                │
│                         │      │                              │
│  ┌─────────────────┐   │      │  ┌─────────────────────┐    │
│  │   Floorplan     │   │      │  │ FloorplannerView    │    │
│  │  - Corners      │   │      │  │  (Canvas Drawing)   │    │
│  │  - Walls        │   │      │  └─────────────────────┘    │
│  │  - Rooms        │   │      └──────────────────────────────┘
│  └─────────────────┘   │
│                         │      ┌──────────────────────────────┐
│  ┌─────────────────┐   │      │      Three Main              │
│  │     Scene       │◄──┼──────┤   (3D Viewer)                │
│  │  - Items        │   │      │                              │
│  │  - Textures     │   │      │  ┌─────────────────────┐    │
│  └─────────────────┘   │      │  │   Controller        │    │
└─────────────────────────┘      │  │  (Interaction)      │    │
                                 │  └─────────────────────┘    │
                                 │                              │
                                 │  ┌─────────────────────┐    │
                                 │  │    Controls         │    │
                                 │  │  (Camera)           │    │
                                 │  └─────────────────────┘    │
                                 │                              │
                                 │  ┌─────────────────────┐    │
                                 │  │   Floorplan (3D)    │    │
                                 │  │   Floor, Edge       │    │
                                 │  └─────────────────────┘    │
                                 └──────────────────────────────┘
```

## Current Dependencies Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     External Libraries                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Three.js│  │  jQuery  │  │Bootstrap │  │Underscore│   │
│  │  v0.69   │  │  v2.1.3  │  │  v3.3.1  │  │  v1.7.0  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│       │             │              │             │          │
└───────┼─────────────┼──────────────┼─────────────┼──────────┘
        │             │              │             │
        ▼             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Blueprint3D Core                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Items (extend THREE.Mesh)      Model Layer                 │
│  ├─ Item (base)                 ├─ Model                    │
│  ├─ FloorItem                   ├─ Scene                    │
│  ├─ WallItem                    ├─ Floorplan                │
│  ├─ InWallItem                  ├─ Corner                   │
│  └─ ...                         ├─ Wall                     │
│                                 ├─ Room                     │
│  Uses jQuery for:               └─ HalfEdge                 │
│  - Event callbacks ($.Callbacks)                            │
│  - DOM manipulation ($('#id'))                              │
│  - AJAX (minimal usage)                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow - Current System

```
User Input (Mouse/Keyboard)
        │
        ▼
┌──────────────────┐
│   DOM Events     │
│  (jQuery)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌─────────────────┐
│  Floorplanner/   │         │   Controller    │
│  Controller      │◄────────┤  (Three Main)   │
└────────┬─────────┘         └────────┬────────┘
         │                            │
         │ fire callbacks             │ fire callbacks
         │ ($.Callbacks)              │ ($.Callbacks)
         ▼                            ▼
┌──────────────────┐         ┌─────────────────┐
│    Floorplan     │◄───────►│     Scene       │
│   (Data Model)   │         │  (Items/3D)     │
└────────┬─────────┘         └────────┬────────┘
         │                            │
         │ update callbacks           │ update callbacks
         ▼                            ▼
┌──────────────────┐         ┌─────────────────┐
│ FloorplannerView │         │  Three.js       │
│  (2D Canvas)     │         │  Renderer       │
└──────────────────┘         └─────────────────┘
```

## Item Inheritance Hierarchy

```
THREE.Mesh
    │
    └─── Item (abstract base class)
         ├── position: Vector3
         ├── rotation: number
         ├── scale: Vector3
         ├── metadata: Metadata
         │
         ├─── FloorItem
         │    └── Items that sit on the floor
         │
         ├─── WallItem
         │    ├── wallOffsetScalar
         │    ├── currentWallEdge
         │    └── Items that attach to walls
         │
         ├─── InWallItem
         │    └── Items embedded in walls (doors, windows)
         │
         ├─── OnFloorItem
         │    └── Items standing on floor
         │
         ├─── InWallFloorItem
         │    └── Items in wall and on floor
         │
         └─── WallFloorItem
              └── Items on wall and floor
```

## Proposed Architecture (After Refactoring)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Blueprint3D                               │
│                   (Uses Dependency Injection)                    │
└────────────┬────────────────────────────────┬────────────────────┘
             │                                │
             │                                │
┌────────────▼────────────┐      ┌───────────▼──────────────────┐
│    State Manager        │      │    Service Container         │
│  - Centralized State    │      │  - DI Container              │
│  - Event Emitter        │      │  - Service Registration      │
│  - Type-safe Events     │      └──────────────────────────────┘
└─────────────────────────┘
             │
             │
    ┌────────┴─────────────────────────┐
    │                                   │
    ▼                                   ▼
┌─────────────────┐           ┌─────────────────────┐
│   Model Layer   │           │    View Layer       │
│  (Pure Data)    │           │   (Rendering)       │
│                 │           │                     │
│ - No THREE.js   │           │ ┌─────────────────┐│
│ - No jQuery     │           │ │  ThreeRenderer  ││
│ - Type-safe     │           │ │  - Uses Three.js││
│ - Testable      │           │ └─────────────────┘│
│                 │           │                     │
│ FloorplanData   │           │ ┌─────────────────┐│
│ ItemData        │           │ │ Canvas2DView    ││
│ RoomData        │           │ │  - 2D Editor    ││
│                 │           │ └─────────────────┘│
└─────────────────┘           └─────────────────────┘
```

## Event System - Current vs Proposed

### Current (jQuery Callbacks)

```
┌──────────────┐
│   Model      │
├──────────────┤
│ callbacks =  │
│ $.Callbacks()│
└──────┬───────┘
       │
       │ fire()
       ▼
┌──────────────┐
│  Listeners   │
│  (any type)  │
└──────────────┘

Issues:
- Not type-safe
- Memory leaks (hard to cleanup)
- jQuery dependency
- No async support
```

### Proposed (TypeScript Events)

```
┌──────────────────────┐
│   Model              │
│ extends EventEmitter │
├──────────────────────┤
│ interface Events {   │
│   loaded: Data       │
│   error: Error       │
│ }                    │
└──────┬───────────────┘
       │
       │ emit<K>(event, data)
       ▼
┌──────────────────────┐
│  Type-safe Listeners │
│  on<K>(event, fn)    │
└──────────────────────┘

Benefits:
- Type-safe
- No jQuery
- Modern async/await
- Easy cleanup
```

## Module Dependencies (Current)

```
core/
├── utils ────────┐
├── config ───┐   │
└── log      │   │
             │   │
model/       │   │
├── model ◄──┼───┼─── jQuery
├── scene ◄──┼───┼─── jQuery, THREE
├── floorplan◄───┼─── jQuery, utils
├── corner ◄─┼───┼─── jQuery, utils
├── wall ◄───┼───┼─── jQuery, utils, THREE
└── room ◄───┘   │    jQuery, utils, THREE
                 │
items/           │
├── item ◄───────┼─── THREE, utils
├── factory      │
└── [others] ◄───┘    THREE, utils

three/
├── main ◄───────── jQuery, THREE, model
├── controller ◄─── jQuery, THREE, model
├── controls ◄───── jQuery, THREE
└── [others] ◄───── THREE, model

floorplanner/
├── floorplanner ◄─ jQuery, model
└── view ◄───────── jQuery, model

Issues:
❌ Circular dependencies
❌ Heavy jQuery usage
❌ Tight coupling to THREE
```

## Proposed Module Dependencies

```
core/
├── event_emitter
├── container (DI)
├── utils
├── config
└── validation

domain/              (Pure TypeScript, no external deps)
├── types
├── entities
│   ├── FloorplanData
│   ├── ItemData
│   └── RoomData
└── services
    ├── FloorplanService
    └── ItemService

rendering/           (THREE.js adapters)
├── three/
│   ├── ThreeRenderer
│   ├── ItemRenderer
│   └── CameraController
└── canvas2d/
    └── Canvas2DRenderer

application/         (Orchestration)
├── Blueprint3d
├── StateManager
└── CommandHandler

Benefits:
✓ Clear dependencies
✓ No circular deps
✓ Testable layers
✓ Swappable rendering
```

## Build Output - Before vs After

### Before
```
bundle.js (565 KB)
├── blueprint3d code (150 KB)
├── three.js v0.69 (200 KB)
├── jquery (85 KB)
├── bootstrap (100 KB)
└── other deps (30 KB)

Issues:
- Single large bundle
- No code splitting
- Old libraries
- No tree shaking
```

### After (Proposed)
```
main.js (180 KB)
├── blueprint3d core (100 KB)
├── modern deps (80 KB)

three.js (150 KB) [lazy loaded]
└── three.js v0.160

vendor.js (50 KB)
└── shared utilities

Total: 380 KB vs 565 KB = 33% reduction
With gzip: ~95 KB vs 148 KB = 36% reduction
```

## Security Vulnerabilities Map

```
Current Dependencies with Issues:

┌─────────────────────────────────────────┐
│ bootstrap@3.3.1                         │
│ ❌ XSS in Popover                       │
│ ❌ XSS in data-* attributes             │
│ Severity: MODERATE                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ elliptic@6.x                            │
│ ❌ EDDSA signature issues               │
│ ❌ ECDSA validation bypass              │
│ ❌ Private key extraction               │
│ Severity: CRITICAL                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ cipher-base@1.x                         │
│ ❌ Missing type checks                  │
│ ❌ Hash manipulation                    │
│ Severity: CRITICAL                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ esbuild (via vite)                      │
│ ❌ Dev server CORS bypass               │
│ Severity: MODERATE                      │
└─────────────────────────────────────────┘

Solution: Update all dependencies
```

## Performance Bottlenecks

```
Current Performance Issues:

1. Bundle Size
   ┌────────────────────┐
   │ 565 KB (unzipped)  │ ───► Slow initial load
   │ 148 KB (gzipped)   │
   └────────────────────┘

2. No Code Splitting
   ┌────────────────────┐
   │ All code loaded    │ ───► Wasted bandwidth
   │ upfront            │      for unused features
   └────────────────────┘

3. Old Three.js
   ┌────────────────────┐
   │ v0.69 (2014)       │ ───► Missing optimizations
   │ No WebGL2          │      Slower rendering
   └────────────────────┘

4. jQuery Overhead
   ┌────────────────────┐
   │ 85 KB for simple   │ ───► Unnecessary weight
   │ callbacks & DOM    │
   └────────────────────┘

Proposed Solutions:
✓ Code splitting → Reduce initial bundle
✓ Update Three.js → WebGL2, better performance
✓ Remove jQuery → -85 KB
✓ Lazy loading → Load on demand
```

## Testing Strategy

```
┌──────────────────────────────────────────────────┐
│              Testing Pyramid                      │
├──────────────────────────────────────────────────┤
│                                                   │
│                   ▲  E2E Tests                   │
│                  ╱ ╲ (Few)                       │
│                 ╱   ╲ Vitest + Playwright        │
│                ╱─────╲                           │
│               ╱       ╲                          │
│              ╱ Integr. ╲ Integration Tests      │
│             ╱  Tests    ╲ (Some)                │
│            ╱─────────────╲ Vitest              │
│           ╱               ╲                      │
│          ╱   Unit Tests    ╲ Unit Tests         │
│         ╱      (Many)       ╲ (Many)            │
│        ╱─────────────────────╲ Vitest          │
│       ╱                       ╲                  │
│      ╱   Pure Functions        ╲                │
│     ╱    Business Logic         ╲               │
│    ╱                             ╲              │
│   ──────────────────────────────────            │
│                                                   │
│  Target Coverage:                                │
│  - Unit Tests: 80%+                             │
│  - Integration: Key workflows                    │
│  - E2E: Critical paths                          │
└──────────────────────────────────────────────────┘
```

## Migration Path

```
Phase 1: Foundation (Weeks 1-2)
├── Add linting/formatting
├── Set up testing
├── Fix security issues
└── Add type definitions
     │
     ▼
Phase 2: Modernize (Weeks 3-8)
├── Remove jQuery
├── Update Three.js
├── Implement EventEmitter
└── Add type safety
     │
     ▼
Phase 3: Refactor (Weeks 9-14)
├── Dependency Injection
├── State Management
├── Separate data/rendering
└── Break down large classes
     │
     ▼
Phase 4: Enhance (Weeks 15+)
├── Performance optimization
├── Better documentation
├── New features
└── Advanced testing

Status Tracking:
┌─────────────────────────┬──────┬─────────┐
│ Phase                   │ Time │ Status  │
├─────────────────────────┼──────┼─────────┤
│ 1. Foundation           │ 2w   │ ⬜ TODO │
│ 2. Modernize            │ 6w   │ ⬜ TODO │
│ 3. Refactor             │ 6w   │ ⬜ TODO │
│ 4. Enhance              │ 4w+  │ ⬜ TODO │
└─────────────────────────┴──────┴─────────┘
```

---

## Legend

```
┌─────┐
│ Box │  Component or Module
└─────┘

───►    Data Flow / Dependency

◄────   Bidirectional Relationship

  │
  ▼     Inheritance or Composition

✓       Good / Implemented
❌      Bad / Issue
⬜      Not Started
```

## Quick Reference

### Current Tech Stack
- TypeScript (strict mode)
- Three.js v0.69 (2014)
- jQuery v2.1.3 (2014)
- Bootstrap v3.3.1 (2015)
- Vite v5.2 (build tool)

### Proposed Tech Stack
- TypeScript (strict mode)
- Three.js v0.160+ (latest)
- Native DOM APIs (no jQuery)
- Modern UI library or vanilla CSS
- Vite v5+ (build tool)
- Vitest (testing)
- ESLint + Prettier (code quality)

### Key Metrics to Improve
- Bundle Size: 565 KB → ~380 KB (33% reduction)
- Dependencies: 18 vulnerabilities → 0
- Test Coverage: 0% → 80%+
- Build Time: ~2s → ~1s
- Type Safety: ~60% → 95%+
