# Blueprint3D - Concrete Improvement Plan

This document provides actionable steps to improve the Blueprint3D codebase architecture. Each improvement includes specific code examples and implementation guidelines.

## Table of Contents
1. [Quick Wins (1-2 weeks)](#quick-wins)
2. [jQuery Removal Strategy](#jquery-removal-strategy)
3. [Three.js Update Guide](#threejs-update-guide)
4. [Type Safety Improvements](#type-safety-improvements)
5. [Dependency Injection Examples](#dependency-injection-examples)
6. [State Management Implementation](#state-management-implementation)
7. [Testing Setup](#testing-setup)
8. [Code Quality Tools](#code-quality-tools)

---

## Quick Wins (1-2 weeks)

### 1. Add ESLint and Prettier

**Install dependencies:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

**Create `.eslintrc.json`:**
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Create `.prettierrc`:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2. Remove Grunt

**Action:**
1. Delete `gruntfile.js`
2. Remove from package.json:
   - All `grunt-*` dependencies
   - matchdep dependency

### 3. Add .gitignore improvements

**Add to `.gitignore`:**
```
# Build outputs
dist/
docs/
*.js.map
*.d.ts

# Dependencies
node_modules/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temporary files
/tmp/
*.log
```

### 4. Add Basic Documentation

**Create `CONTRIBUTING.md`:**
```markdown
# Contributing to Blueprint3D

## Development Setup
1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start development server
4. Open http://localhost:8080

## Code Style
- Follow TypeScript best practices
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- All new code should have tests

## Pull Request Process
1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run `npm run lint` and `npm run typecheck`
5. Submit PR with clear description
```

---

## jQuery Removal Strategy

### Phase 1: Replace Callbacks System

**Create new EventEmitter base class:**

```typescript
// src/core/event_emitter.ts
type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  once(event: string, listener: EventListener): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}
```

**Migrate Model class:**

```typescript
// Before (src/model/model.ts)
import $ from 'jquery';

export class Model {
  private roomLoadingCallbacks = $.Callbacks();
  private roomLoadedCallbacks = $.Callbacks();
  
  loadSerialized(json: string) {
    this.roomLoadingCallbacks.fire();
    // ... load logic
    this.roomLoadedCallbacks.fire();
  }
}

// After
import { EventEmitter } from '../core/event_emitter';

export class Model extends EventEmitter {
  loadSerialized(json: string): void {
    this.emit('roomLoading');
    // ... load logic
    this.emit('roomLoaded');
  }
}

// Usage
model.on('roomLoaded', () => {
  console.log('Room loaded!');
});
```

**Add TypeScript event types:**

```typescript
// src/core/typed_event_emitter.ts
export interface TypedEventEmitter<EventMap> {
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void;
  off<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
}

export class TypedEventEmitter<EventMap> extends EventEmitter implements TypedEventEmitter<EventMap> {
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): void {
    super.on(event as string, listener);
  }
  
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    super.emit(event as string, data);
  }
}

// Usage
interface ModelEvents {
  roomLoading: void;
  roomLoaded: { itemCount: number };
  roomSaved: { id: string };
  error: { message: string };
}

export class Model extends TypedEventEmitter<ModelEvents> {
  loadSerialized(json: string): void {
    this.emit('roomLoading', undefined);
    // ... load logic
    this.emit('roomLoaded', { itemCount: this.scene.itemCount() });
  }
}
```

### Phase 2: Replace DOM Manipulation

**Before:**
```typescript
import $ from 'jquery';

this.canvasElement = $("#" + canvas);
this.canvasElement.mousedown(() => { /* ... */ });
$(document).keyup(e => { /* ... */ });
```

**After:**
```typescript
this.canvasElement = document.getElementById(canvas) as HTMLCanvasElement;
this.canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
document.addEventListener('keyup', this.handleKeyUp.bind(this));

// Don't forget cleanup
destroy() {
  this.canvasElement.removeEventListener('mousedown', this.handleMouseDown);
  document.removeEventListener('keyup', this.handleKeyUp);
}
```

**Create helper utilities:**

```typescript
// src/core/dom_utils.ts
export class DOMUtils {
  static getElementById<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
  }

  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    element.addEventListener(type, listener, options);
    // Return cleanup function
    return () => element.removeEventListener(type, listener, options);
  }
}
```

---

## Three.js Update Guide

### Breaking Changes from v0.69 to v0.160+

**1. Shadow Mapping:**
```typescript
// Before (v0.69)
this.renderer.shadowMapEnabled = true;
this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

// After (v0.160+)
this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

**2. Geometry:**
```typescript
// Before
geometry.computeBoundingBox();
geometry.applyMatrix4(matrix);

// After (same, but be aware of deprecated Geometry class)
// Use BufferGeometry everywhere, not Geometry
```

**3. Materials:**
```typescript
// Before
material.shading = THREE.SmoothShading;

// After
// Removed, smooth shading is default
// For flat shading, use:
material.flatShading = true;
```

**4. Object Loader:**
```typescript
// Before
this.loader = new THREE.ObjectLoader();
this.loader.load(fileName, callback);

// After (similar, but handle async better)
this.loader = new THREE.ObjectLoader();
this.loader.loadAsync(fileName).then(callback);
```

**Update package.json:**
```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@types/three": "^0.160.0"
  }
}
```

---

## Type Safety Improvements

### 1. Add Interfaces for Data Structures

```typescript
// src/model/types.ts

export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface ItemMetadata {
  itemName: string;
  itemType: number;
  modelUrl: string;
  resizable?: boolean;
}

export interface SerializedItem {
  item_name: string;
  item_type: number;
  model_url: string;
  xpos: number;
  ypos: number;
  zpos: number;
  rotation: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  fixed: boolean;
}

export interface SerializedCorner {
  x: number;
  y: number;
}

export interface SerializedWall {
  corner1: string;
  corner2: string;
  frontTexture: WallTexture;
  backTexture: WallTexture;
}

export interface WallTexture {
  url: string;
  stretch: boolean;
  scale: number;
}

export interface SerializedFloorplan {
  corners: Record<string, SerializedCorner>;
  walls: SerializedWall[];
  wallTextures: any[];
  floorTextures: Record<string, any>;
  newFloorTextures: Record<string, any>;
}

export interface SerializedRoom {
  floorplan: SerializedFloorplan;
  items: SerializedItem[];
}
```

### 2. Add Runtime Validation

```typescript
// src/core/validation.ts

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSerializedRoom(data: unknown): SerializedRoom {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Invalid room data: expected object');
  }

  const room = data as any;

  if (!room.floorplan || typeof room.floorplan !== 'object') {
    throw new ValidationError('Missing or invalid floorplan', 'floorplan');
  }

  if (!Array.isArray(room.items)) {
    throw new ValidationError('Invalid items: expected array', 'items');
  }

  // Validate items
  room.items.forEach((item: any, index: number) => {
    if (typeof item.item_type !== 'number') {
      throw new ValidationError(
        `Invalid item_type at index ${index}`,
        `items[${index}].item_type`
      );
    }
  });

  return room as SerializedRoom;
}

// Usage in Model.ts
loadSerialized(json: string): void {
  try {
    const data = JSON.parse(json);
    const validated = validateSerializedRoom(data);
    this.newRoom(validated.floorplan, validated.items);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`Validation error in ${error.field}: ${error.message}`);
    }
    throw error;
  }
}
```

### 3. Improve Factory Type Safety

```typescript
// src/items/factory.ts

import { Item } from './item';
import { FloorItem } from './floor_item';
import { WallItem } from './wall_item';
// ... other imports

export enum ItemType {
  Floor = 1,
  Wall = 2,
  InWall = 3,
  InWallFloor = 7,
  OnFloor = 8,
  WallFloor = 9,
}

type ItemClass = new (...args: any[]) => Item;

const itemTypes: Record<ItemType, ItemClass> = {
  [ItemType.Floor]: FloorItem,
  [ItemType.Wall]: WallItem,
  [ItemType.InWall]: InWallItem,
  [ItemType.InWallFloor]: InWallFloorItem,
  [ItemType.OnFloor]: OnFloorItem,
  [ItemType.WallFloor]: WallFloorItem,
};

export class Factory {
  public static getClass(itemType: number): ItemClass {
    if (!(itemType in itemTypes)) {
      throw new Error(`Unknown item type: ${itemType}`);
    }
    return itemTypes[itemType as ItemType];
  }

  public static isValidItemType(itemType: number): itemType is ItemType {
    return itemType in itemTypes;
  }
}
```

---

## Dependency Injection Examples

### 1. Create Service Container

```typescript
// src/core/container.ts

type ServiceFactory<T> = (container: Container) => T;

export class Container {
  private services: Map<string, any> = new Map();
  private factories: Map<string, ServiceFactory<any>> = new Map();

  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory);
  }

  singleton<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service "${name}" not found`);
    }

    const instance = factory(this);
    this.services.set(name, instance);
    return instance;
  }
}
```

### 2. Refactor Blueprint3d with DI

```typescript
// src/services/service_names.ts
export const SERVICE_NAMES = {
  MODEL: 'model',
  THREE_MAIN: 'threeMain',
  FLOORPLANNER: 'floorplanner',
  TEXTURE_DIR: 'textureDir',
} as const;

// src/services/setup.ts
import { Container } from '../core/container';
import { Model } from '../model/model';
import { Main as ThreeMain } from '../three/main';
import { Floorplanner } from '../floorplanner/floorplanner';
import { SERVICE_NAMES } from './service_names';
import { Options } from '../blueprint3d';

export function setupContainer(options: Options): Container {
  const container = new Container();

  // Register configuration
  container.singleton(SERVICE_NAMES.TEXTURE_DIR, options.textureDir || '');

  // Register services
  container.register(SERVICE_NAMES.MODEL, (c) => {
    return new Model(c.get(SERVICE_NAMES.TEXTURE_DIR));
  });

  container.register(SERVICE_NAMES.THREE_MAIN, (c) => {
    return new ThreeMain(
      c.get(SERVICE_NAMES.MODEL),
      options.threeElement,
      options.threeCanvasElement,
      {}
    );
  });

  if (!options.widget) {
    container.register(SERVICE_NAMES.FLOORPLANNER, (c) => {
      const model = c.get<Model>(SERVICE_NAMES.MODEL);
      return new Floorplanner(options.floorplannerElement!, model.floorplan);
    });
  }

  return container;
}

// src/blueprint3d.ts (refactored)
import { Container } from './core/container';
import { setupContainer } from './services/setup';
import { SERVICE_NAMES } from './services/service_names';
import { Model } from './model/model';
import { Main as ThreeMain } from './three/main';
import { Floorplanner } from './floorplanner/floorplanner';

export interface Options {
  widget?: boolean;
  threeElement?: string;
  threeCanvasElement?: string;
  floorplannerElement?: string;
  textureDir?: string;
}

export class Blueprint3d {
  private container: Container;

  constructor(options: Options) {
    this.container = setupContainer(options);
  }

  get model(): Model {
    return this.container.get(SERVICE_NAMES.MODEL);
  }

  get three(): ThreeMain {
    return this.container.get(SERVICE_NAMES.THREE_MAIN);
  }

  get floorplanner(): Floorplanner | undefined {
    try {
      return this.container.get(SERVICE_NAMES.FLOORPLANNER);
    } catch {
      return undefined;
    }
  }
}
```

---

## State Management Implementation

### Simple Event-Based State

```typescript
// src/state/app_state.ts

export interface AppState {
  selectedItem: string | null;
  mode: 'view' | 'edit' | 'draw';
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  floorplan: {
    corners: string[];
    walls: string[];
    rooms: string[];
  };
  ui: {
    sidebarOpen: boolean;
    loading: boolean;
  };
}

type StateListener<T = AppState> = (state: T, prevState: T) => void;
type PartialState = Partial<AppState>;

export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();
  private selectorListeners: Map<string, Set<StateListener<any>>> = new Map();

  constructor(initialState: AppState) {
    this.state = { ...initialState };
  }

  getState(): Readonly<AppState> {
    return this.state;
  }

  setState(update: PartialState | ((prev: AppState) => PartialState)): void {
    const prevState = { ...this.state };
    const changes = typeof update === 'function' ? update(prevState) : update;
    
    this.state = { ...this.state, ...changes };
    
    // Notify global listeners
    this.listeners.forEach(listener => listener(this.state, prevState));
    
    // Notify selector listeners
    this.notifySelectorListeners(prevState);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to specific state slice
  select<K extends keyof AppState>(
    key: K,
    listener: StateListener<AppState[K]>
  ): () => void {
    if (!this.selectorListeners.has(key)) {
      this.selectorListeners.set(key, new Set());
    }
    const listeners = this.selectorListeners.get(key)!;
    listeners.add(listener);
    
    return () => listeners.delete(listener);
  }

  private notifySelectorListeners(prevState: AppState): void {
    this.selectorListeners.forEach((listeners, key) => {
      if (this.state[key] !== prevState[key]) {
        listeners.forEach(listener => 
          listener(this.state[key], prevState[key])
        );
      }
    });
  }
}

// Initial state
export const initialAppState: AppState = {
  selectedItem: null,
  mode: 'view',
  camera: {
    position: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
  },
  floorplan: {
    corners: [],
    walls: [],
    rooms: [],
  },
  ui: {
    sidebarOpen: true,
    loading: false,
  },
};

// Usage
const stateManager = new StateManager(initialAppState);

// Subscribe to all changes
stateManager.subscribe((state, prevState) => {
  console.log('State changed:', state);
});

// Subscribe to specific slice
stateManager.select('selectedItem', (selected, prevSelected) => {
  console.log('Selection changed:', prevSelected, '->', selected);
});

// Update state
stateManager.setState({ selectedItem: 'item-123' });
stateManager.setState(prev => ({ 
  ui: { ...prev.ui, loading: true } 
}));
```

---

## Testing Setup

### Install Dependencies

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/dom @testing-library/user-event
```

### Configure Vitest

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'blueprint3d': path.resolve(__dirname, './src/blueprint3d.ts')
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  server: {
    port: 8080,
    open: '/example/index.html'
  },
  build: {
    rollupOptions: {
      input: {
        app: './example/index.html'
      },
    }
  }
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});
```

### Example Tests

```typescript
// src/model/model.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Model } from './model';

describe('Model', () => {
  let model: Model;

  beforeEach(() => {
    model = new Model('textures/');
  });

  it('should create a model with empty scene', () => {
    expect(model.scene.itemCount()).toBe(0);
  });

  it('should load serialized room data', () => {
    const mockData = {
      floorplan: {
        corners: {},
        walls: []
      },
      items: []
    };

    model.loadSerialized(JSON.stringify(mockData));
    expect(model.scene.itemCount()).toBe(0);
  });

  it('should emit roomLoaded event after loading', (done) => {
    const mockData = {
      floorplan: { corners: {}, walls: [] },
      items: []
    };

    model.on('roomLoaded', () => {
      done();
    });

    model.loadSerialized(JSON.stringify(mockData));
  });
});

// src/core/utils.test.ts
import { describe, it, expect } from 'vitest';
import { Utils } from './utils';

describe('Utils', () => {
  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const dist = Utils.distance(0, 0, 3, 4);
      expect(dist).toBe(5);
    });

    it('should return 0 for same points', () => {
      const dist = Utils.distance(5, 5, 5, 5);
      expect(dist).toBe(0);
    });
  });

  describe('guid', () => {
    it('should generate unique IDs', () => {
      const id1 = Utils.guid();
      const id2 = Utils.guid();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});

// src/items/factory.test.ts
import { describe, it, expect } from 'vitest';
import { Factory, ItemType } from './factory';
import { FloorItem } from './floor_item';
import { WallItem } from './wall_item';

describe('Factory', () => {
  it('should return correct class for valid item type', () => {
    expect(Factory.getClass(ItemType.Floor)).toBe(FloorItem);
    expect(Factory.getClass(ItemType.Wall)).toBe(WallItem);
  });

  it('should throw error for invalid item type', () => {
    expect(() => Factory.getClass(999)).toThrow('Unknown item type');
  });

  it('should validate item types', () => {
    expect(Factory.isValidItemType(ItemType.Floor)).toBe(true);
    expect(Factory.isValidItemType(999)).toBe(false);
  });
});
```

### Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## Code Quality Tools

### 1. Pre-commit Hooks with Husky

```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Create `.husky/pre-commit`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Update package.json:**
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ]
  }
}
```

### 2. Continuous Integration

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run typecheck
    
    - name: Test
      run: npm run test:coverage
    
    - name: Build
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### 3. Bundle Size Monitoring

```bash
npm install --save-dev vite-plugin-bundle-analyzer
```

**Update vite.config.ts:**
```typescript
import { visualizer } from 'vite-plugin-bundle-analyzer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

---

## Implementation Checklist

### Week 1-2: Setup and Quick Wins
- [ ] Add ESLint and Prettier
- [ ] Set up pre-commit hooks
- [ ] Remove Grunt
- [ ] Update .gitignore
- [ ] Add CONTRIBUTING.md
- [ ] Set up CI/CD pipeline
- [ ] Run security audit and fix critical issues

### Week 3-4: Type Safety
- [ ] Create type definitions (types.ts)
- [ ] Add runtime validation
- [ ] Fix all `any` types
- [ ] Improve Factory type safety
- [ ] Add JSDoc comments

### Week 5-6: jQuery Removal - Phase 1
- [ ] Create EventEmitter
- [ ] Migrate Model callbacks
- [ ] Migrate Floorplan callbacks
- [ ] Migrate Wall callbacks
- [ ] Add tests for event system

### Week 7-8: jQuery Removal - Phase 2
- [ ] Create DOM utilities
- [ ] Replace DOM manipulation
- [ ] Remove jQuery dependency
- [ ] Test thoroughly
- [ ] Update bundle size

### Week 9-10: Testing Infrastructure
- [ ] Set up Vitest
- [ ] Write tests for core utilities
- [ ] Write tests for model layer
- [ ] Write tests for items
- [ ] Achieve 50% coverage

### Week 11-12: Dependency Injection
- [ ] Create Container
- [ ] Refactor Blueprint3d
- [ ] Update tests
- [ ] Document DI patterns

### Week 13-14: State Management
- [ ] Implement StateManager
- [ ] Integrate with existing code
- [ ] Add tests
- [ ] Document usage

### Week 15-16: Three.js Update
- [ ] Update Three.js to latest
- [ ] Fix breaking changes
- [ ] Test rendering
- [ ] Update documentation

This plan provides concrete, actionable steps with code examples that can be implemented incrementally without breaking existing functionality.
