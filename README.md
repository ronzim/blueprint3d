A customizable application built on three.js that allows users to design an interior space such as a home or apartment.

Forked from: https://github.com/furnishup/blueprint3d

## Online Demo

https://ronzim.github.io/blueprint3d/

## Developing and Running Locally

To get started, clone the repository and ensure you npm >= 3 and grunt installed, then run:

    npm install
    npm run dev

The latter command generates `example/js/blueprint3d.js` from `src`.

The easiest way to run locally is to run a local server from the `example` directory, eg using `VS Code Live Server` extension.

## Todo list

- [ ] dependencies update
- [ ] remove jquery dependency
- [ ] remove grunt in favour of a better dev experience

## Directory Structure

### `src/` Directory

The `src` directory contains the core of the project. Here is a description of the various sub-directories:

`core` - Basic utilities such as logging and generic functions

`floorplanner` - 2D view/controller for editing the floorplan

`items` - Various types of items that can go in rooms

`model` - Data model representing both the 2D floorplan and all of the items in it

`three` - 3D view/controller for viewing and modifying item placement

### `example/` Directory

The example directory contains an application built using the core blueprint3d javascript building blocks. It adds html, css, models, textures, and more javascript to tie everything together. Copied in `/docs` directory for gh pages.
