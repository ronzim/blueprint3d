import { Blueprint3d } from "../../src/blueprint3d";

/*
 * Initialize!
 */

window.addEventListener('DOMContentLoaded', () => {

  // main setup
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    widget: false
  }
  var blueprint3d = new Blueprint3d(opts);

  let currentTab = null;

  function handleTabChange(newTab) {
    if (currentTab === newTab) {
      return;
    }

    const views = {
      'FLOORPLAN': document.querySelector('#floorplanner'),
      'DESIGN': document.querySelector('#viewer'),
      'SHOP': document.querySelector('#add-items')
    };

    if (currentTab) {
      views[currentTab].style.display = 'none';
    }
    views[newTab].style.display = 'block';

    if (newTab === 'FLOORPLAN') {
      const floorplanner = document.querySelector('#floorplanner');
      floorplanner.style.height = (window.innerHeight - floorplanner.offsetTop) + 'px';
      blueprint3d.floorplanner.resizeView();
      blueprint3d.floorplanner.reset();
    }

    if (newTab === 'DESIGN') {
      blueprint3d.three.updateWindowSize();
    }

    currentTab = newTab;
  }

  document.addEventListener('app-tab-changed', (e) => {
    handleTabChange(e.detail.tabName);
  });

  window.addEventListener('resize', () => {
    if (currentTab === 'FLOORPLAN') {
      const floorplanner = document.querySelector('#floorplanner');
      floorplanner.style.height = (window.innerHeight - floorplanner.offsetTop) + 'px';
      blueprint3d.floorplanner.resizeView();
    }
  });

  const event = new CustomEvent('blueprint3d-ready', { detail: { blueprint3d } });
  document.dispatchEvent(event);

  handleTabChange('DESIGN');

  // This serialization format needs work
  // Load a simple rectangle room
  blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/example/rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
});
