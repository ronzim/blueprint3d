<template>
  <div>
    <div id="floorplanner-controls">
      <button :class="{ 'btn-primary': activeMode === 'MOVE' }" class="btn btn-sm btn-default" @click="setMode('MOVE')">
        <span class="glyphicon glyphicon-move"></span>
        Move Walls
      </button>
      <button :class="{ 'btn-primary': activeMode === 'DRAW' }" class="btn btn-sm btn-default" @click="setMode('DRAW')">
        <span class="glyphicon glyphicon-pencil"></span>
        Draw Walls
      </button>
      <button :class="{ 'btn-primary': activeMode === 'DELETE' }" class="btn btn-sm btn-default" @click="setMode('DELETE')">
        <span class="glyphicon glyphicon-remove"></span>
        Delete Walls
      </button>
      <span class="pull-right">
        <button class="btn btn-primary btn-sm" @click="done">Done &raquo;</button>
      </span>
    </div>
    <div id="draw-walls-hint" v-if="activeMode === 'DRAW'">
      Press the "Esc" key to stop drawing walls
    </div>
  </div>
</template>

<script>
import { floorplannerModes } from '../../src/floorplanner/floorplanner';

export default {
  name: 'ViewerFloorplanner',
  data() {
    return {
      activeMode: floorplannerModes.MOVE,
    };
  },
  methods: {
    setMode(mode) {
      this.activeMode = mode;
      this.$blueprint3d.floorplanner.setMode(floorplannerModes[mode]);
    },
    done() {
      this.$emit('done');
    },
  },
  mounted() {
    this.$blueprint3d.floorplanner.modeResetCallbacks.add((mode) => {
      for (const key in floorplannerModes) {
        if (floorplannerModes[key] === mode) {
          this.activeMode = key;
        }
      }
    });
  },
};
</script>

<style scoped>
</style>
