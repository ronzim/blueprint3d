<template>
  <div class="row" id="items-wrapper">
    <div v-for="item in items" :key="item.name" class="col-sm-4">
      <a
        class="thumbnail add-item"
        @click="addItem(item)"
        :model-name="item.name"
        :model-url="item.model"
        :model-type="item.type"
      >
        <img :src="item.image" alt="Add Item" />
        {{ item.name }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddItems',
  methods: {
    addItem(item) {
      const metadata = {
        itemName: item.name,
        resizable: true,
        modelUrl: item.model,
        itemType: parseInt(item.type)
      };
      this.$blueprint3d.model.scene.addItem(parseInt(item.type), item.model, metadata);
    },
  },
  data() {
    return {
      items: [
        {
          "name" : "Closed Door",
          "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.04.12_PM.png",
          "model" : "models/js/closed-door28x80_baked.js",
          "type" : "7"
        },
        {
          "name" : "Open Door",
          "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.22.46_PM.png",
          "model" : "models/js/open_door.js",
          "type" : "7"
        },
        {
          "name" : "Window",
          "image" : "models/thumbnails/thumbnail_window.png",
          "model" : "models/js/whitewindow.js",
          "type" : "3"
        },
        {
          "name" : "Chair",
          "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
          "model" : "models/js/gus-churchchair-whiteoak.js",
          "type" : "1"
        },
        {
          "name" : "Red Chair",
          "image" : "models/thumbnails/thumbnail_tn-orange.png",
          "model" : "models/js/ik-ekero-orange_baked.js",
          "type" : "1"
        },
        {
          "name" : "Blue Chair",
          "image" : "models/thumbnails/thumbnail_ekero-blue3.png",
          "model" : "models/js/ik-ekero-blue_baked.js",
          "type" : "1"
        },
      ]
    }
  }
};
</script>

<style scoped>
.add-item {
  cursor: pointer;
}
</style>
