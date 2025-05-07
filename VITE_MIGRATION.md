# Migration from Grunt to Vite

This project has been migrated from Grunt to Vite for a modern, faster development experience. This document explains the changes made and how to work with the new build system.

## Advantages of Vite

- **Fast Development Server**: Vite provides an extremely fast development server with hot module replacement (HMR)
- **Native TypeScript Support**: Built-in TypeScript compilation without requiring separate TypeScript configuration
- **Improved Build Performance**: Optimized production builds with better code splitting and tree-shaking
- **Modern JavaScript Features**: Full support for ES modules and dynamic imports
- **Asset Handling**: Improved handling of static assets including images, fonts, and other resources
- **Legacy Browser Support**: Built-in support for older browsers via the legacy plugin

## New Development Workflow

### Prerequisites

- Node.js (version 14 or higher recommended)
- npm or yarn

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   This will open your browser to the example application. Changes to the source files will automatically trigger hot module replacement, updating the browser without a full reload.

3. Build for production:
   ```bash
   npm run build
   # or
   yarn build
   ```
   This generates the optimized production build in the `example/js` directory.

4. Preview the production build:
   ```bash
   npm run preview
   # or
   yarn preview
   ```
   This starts a local server with the production build for testing.

5. Check TypeScript type errors:
   ```bash
   npm run typecheck
   # or
   yarn typecheck
   ```
   This runs the TypeScript compiler in type-checking mode without emitting files.

## Changes Made

### New Configuration Files

- **vite.config.ts**: The main Vite configuration file that defines how the build process works
- **tsconfig.json**: TypeScript configuration for the project
- **index.html**: A root-level HTML file that serves as the entry point for Vite's development server

### Updated Files

- **package.json**: Updated with new dependencies and scripts
- **README.md**: Updated with new development instructions
- **src/blueprint3d.ts**: Minor updates to ensure compatibility with Vite

### Dependency Changes

| Removed | Added |
| --- | --- |
| grunt | vite |
| grunt-contrib-clean | @vitejs/plugin-legacy |
| grunt-contrib-concat | typescript |
| grunt-contrib-copy | @types/jquery |
| grunt-contrib-uglify | @types/bootstrap |
| grunt-string-replace | @types/three |
| grunt-subgrunt | @types/underscore |
| grunt-typedoc | regenerator-runtime |
| grunt-typescript | |
| matchdep | |
| browserify | |

## Configuration Details

### vite.config.ts

The vite.config.ts file configures Vite to:

- Set the entry point to `src/blueprint3d.ts`
- Output the bundled file to `example/js/blueprint3d.js`
- Serve the example directory for static assets
- Support legacy browsers through the legacy plugin
- Handle all asset types like images, fonts, and 3D models

### tsconfig.json

The TypeScript configuration is intentionally loose to accommodate the existing codebase:

- Target ES5 for maximum browser compatibility
- Disable strict type checking initially
- Enable source maps for debugging
- Allow importing JavaScript files

## Future Improvements

- Enable stricter TypeScript checking progressively
- Update dependencies to newer versions
- Remove jQuery dependency as noted in the README
- Add automated tests
- Improve documentation

## Troubleshooting

If you encounter issues:

1. Make sure you've installed all dependencies:
   ```bash
   npm install
   ```

2. Clear the npm cache if needed:
   ```bash
   npm cache clean --force
   ```

3. If TypeScript errors occur, you can temporarily bypass them with:
   ```bash
   npm run dev --force
   ```

4. Check the browser console for any runtime errors.
