<template>
  <div id="main-controls">
    <a href="#" class="btn btn-default btn-sm" @click="newDesign">
      New Plan
    </a>
    <a href="#" class="btn btn-default btn-sm" @click="saveDesign">
      Save Plan
    </a>
    <a class="btn btn-sm btn-default btn-file">
     <input type="file" class="hidden-input" @change="loadDesign">
     Load Plan
    </a>
  </div>
</template>

<script>
export default {
  name: 'MainControls',
  methods: {
    newDesign() {
      this.$blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    },
    loadDesign(event) {
      const files = event.target.files;
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        this.$blueprint3d.model.loadSerialized(data);
      };
      reader.readAsText(files[0]);
    },
    saveDesign() {
      const data = this.$blueprint3d.model.exportSerialized();
      const a = document.createElement('a');
      const blob = new Blob([data], { type: 'text' });
      a.href = window.URL.createObjectURL(blob);
      a.download = 'design.blueprint3d';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
  },
};
</script>

<style scoped>
</style>
