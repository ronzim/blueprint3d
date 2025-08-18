<template>
  <div>
    <div id="floorTexturesDiv" v-if="floorTexturesVisible" style="padding: 0 20px">
      <div class="panel panel-default">
        <div class="panel-heading">Adjust Floor</div>
        <div class="panel-body" style="color: #333333">
          <div class="col-sm-6" style="padding: 3px">
            <a href="#" class="thumbnail" @click="selectTexture('/example/rooms/textures/light_fine_wood.jpg', false, 300)">
              <img alt="Thumbnail light fine wood" src="/example/rooms/thumbnails/thumbnail_light_fine_wood.jpg" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div id="wallTextures" v-if="wallTexturesVisible" style="padding: 0 20px">
      <div class="panel panel-default">
        <div class="panel-heading">Adjust Wall</div>
        <div class="panel-body" style="color: #333333">
          <div class="col-sm-6" style="padding: 3px">
            <a href="#" class="thumbnail" @click="selectTexture('/example/rooms/textures/marbletiles.jpg', false, 300)">
              <img alt="Thumbnail marbletiles" src="/example/rooms/thumbnails/thumbnail_marbletiles.jpg" />
            </a>
          </div>
          <div class="col-sm-6" style="padding: 3px">
            <a href="#" class="thumbnail" @click="selectTexture('/example/rooms/textures/wallmap_yellow.png', true, 0)">
              <img alt="Thumbnail wallmap yellow" src="/example/rooms/thumbnails/thumbnail_wallmap_yellow.png" />
            </a>
          </div>
          <div class="col-sm-6" style="padding: 3px">
            <a href="#" class="thumbnail" @click="selectTexture('/example/rooms/textures/light_brick.jpg', false, 100)">
              <img alt="Thumbnail light brick" src="/example/rooms/thumbnails/thumbnail_light_brick.jpg" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextureSelector',
  data() {
    return {
      floorTexturesVisible: false,
      wallTexturesVisible: false,
      currentTarget: null,
    };
  },
  methods: {
    wallClicked(halfEdge) {
      this.currentTarget = halfEdge;
      this.floorTexturesVisible = false;
      this.wallTexturesVisible = true;
    },
    floorClicked(room) {
      this.currentTarget = room;
      this.wallTexturesVisible = false;
      this.floorTexturesVisible = true;
    },
    reset() {
      this.floorTexturesVisible = false;
      this.wallTexturesVisible = false;
      this.currentTarget = null;
    },
    selectTexture(url, stretch, scale) {
      if (this.currentTarget) {
        this.currentTarget.setTexture(url, stretch, scale);
      }
    },
  },
  mounted() {
    this.$blueprint3d.three.wallClicked.add(this.wallClicked);
    this.$blueprint3d.three.floorClicked.add(this.floorClicked);
    this.$blueprint3d.three.itemSelectedCallbacks.add(this.reset);
    this.$blueprint3d.three.nothingClicked.add(this.reset);
  },
  beforeUnmount() {
    this.$blueprint3d.three.wallClicked.remove(this.wallClicked);
    this.$blueprint3d.three.floorClicked.remove(this.floorClicked);
    this.$blueprint3d.three.itemSelectedCallbacks.remove(this.reset);
    this.$blueprint3d.three.nothingClicked.remove(this.reset);
  },
};
</script>

<style scoped>
a.thumbnail {
  cursor: pointer;
}
</style>
