<template>
  <div id="camera-controls">
    <a href="#" class="btn btn-default bottom" @click="zoomOut" @dblclick.prevent>
      <span class="glyphicon glyphicon-zoom-out"></span>
    </a>
    <a href="#" class="btn btn-default bottom" @click="resetView" @dblclick.prevent>
      <span class="glyphicon glyphicon-home"></span>
    </a>
    <a href="#" class="btn btn-default bottom" @click="zoomIn" @dblclick.prevent>
      <span class="glyphicon glyphicon-zoom-in"></span>
    </a>

    <span>&nbsp;</span>

    <a class="btn btn-default bottom" href="#" @click="pan('LEFT')" @dblclick.prevent>
      <span class="glyphicon glyphicon-arrow-left"></span>
    </a>
    <span class="btn-group-vertical">
      <a class="btn btn-default" href="#" @click="pan('UP')" @dblclick.prevent>
        <span class="glyphicon glyphicon-arrow-up"></span>
      </a>
      <a class="btn btn-default" href="#" @click="pan('DOWN')" @dblclick.prevent>
        <span class="glyphicon glyphicon-arrow-down"></span>
      </a>
    </span>
    <a class="btn btn-default bottom" href="#" @click="pan('RIGHT')" @dblclick.prevent>
      <span class="glyphicon glyphicon-arrow-right"></span>
    </a>
  </div>
</template>

<script>
export default {
  name: 'CameraButtons',
  data() {
    return {
      panSpeed: 30,
    };
  },
  methods: {
    pan(direction) {
      const orbitControls = this.$blueprint3d.three.controls;
      switch (direction) {
        case 'UP':
          orbitControls.panXY(0, this.panSpeed);
          break;
        case 'DOWN':
          orbitControls.panXY(0, -this.panSpeed);
          break;
        case 'LEFT':
          orbitControls.panXY(this.panSpeed, 0);
          break;
        case 'RIGHT':
          orbitControls.panXY(-this.panSpeed, 0);
          break;
      }
    },
    zoomIn(e) {
      e.preventDefault();
      const orbitControls = this.$blueprint3d.three.controls;
      orbitControls.dollyIn(1.1);
      orbitControls.update();
    },
    zoomOut(e) {
      e.preventDefault();
      const orbitControls = this.$blueprint3d.three.controls;
      orbitControls.dollyOut(1.1);
      orbitControls.update();
    },
    resetView() {
      this.$blueprint3d.three.centerCamera();
    },
  },
};
</script>

<style scoped>
a {
  cursor: pointer;
}
</style>
