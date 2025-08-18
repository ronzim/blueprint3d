<template>
  <div id="loading-modal" v-if="visible">
    <h1>Loading...</h1>
  </div>
</template>

<script>
export default {
  name: 'ModalEffects',
  data() {
    return {
      visible: false,
      itemsLoading: 0,
    };
  },
  methods: {
    itemLoading() {
      this.itemsLoading++;
      this.updateVisibility();
    },
    itemLoaded() {
      this.itemsLoading--;
      this.updateVisibility();
    },
    updateVisibility() {
      this.visible = this.itemsLoading > 0;
    },
  },
  mounted() {
    this.$blueprint3d.model.scene.itemLoadingCallbacks.add(this.itemLoading);
    this.$blueprint3d.model.scene.itemLoadedCallbacks.add(this.itemLoaded);
  },
  beforeUnmount() {
    this.$blueprint3d.model.scene.itemLoadingCallbacks.remove(this.itemLoading);
    this.$blueprint3d.model.scene.itemLoadedCallbacks.remove(this.itemLoaded);
  },
};
</script>

<style scoped>
</style>
