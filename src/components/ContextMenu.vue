<template>
  <div id="context-menu" v-if="visible">
    <div style="margin: 0 20px">
      <span class="lead">{{ itemName }}</span>
      <br /><br />
      <button class="btn btn-block btn-danger" @click="deleteItem">
        <span class="glyphicon glyphicon-trash"></span>
        Delete Item
      </button>
      <br />
      <div class="panel panel-default">
        <div class="panel-heading">Adjust Size</div>
        <div class="panel-body" style="color: #333333">
          <div class="form form-horizontal lead">
            <div class="form-group">
              <label class="col-sm-5 control-label"> Width </label>
              <div class="col-sm-6">
                <input type="number" class="form-control" v-model="width" @change="resize" />
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-5 control-label"> Depth </label>
              <div class="col-sm-6">
                <input type="number" class="form-control" v-model="depth" @change="resize" />
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-5 control-label"> Height </label>
              <div class="col-sm-6">
                <input type="number" class="form-control" v-model="height" @change="resize" />
              </div>
            </div>
          </div>
          <small><span class="text-muted">Measurements in inches.</span></small>
        </div>
      </div>

      <label><input type="checkbox" v-model="fixed" @change="toggleFixed" /> Lock in place</label>
      <br /><br />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  data() {
    return {
      visible: false,
      selectedItem: null,
      itemName: '',
      width: 0,
      height: 0,
      depth: 0,
      fixed: false,
    };
  },
  methods: {
    cmToIn(cm) {
      return cm / 2.54;
    },
    inToCm(inches) {
      return inches * 2.54;
    },
    itemSelected(item) {
      this.selectedItem = item;
      this.itemName = this.selectedItem.metadata.itemName;
      this.width = this.cmToIn(this.selectedItem.getWidth()).toFixed(0);
      this.height = this.cmToIn(this.selectedItem.getHeight()).toFixed(0);
      this.depth = this.cmToIn(this.selectedItem.getDepth()).toFixed(0);
      this.fixed = this.selectedItem.fixed;
      this.visible = true;
    },
    itemUnselected() {
      this.visible = false;
      this.selectedItem = null;
    },
    deleteItem() {
      if (this.selectedItem) {
        this.selectedItem.remove();
      }
    },
    toggleFixed() {
      if (this.selectedItem) {
        this.selectedItem.setFixed(this.fixed);
      }
    },
    resize() {
      if (this.selectedItem) {
        this.selectedItem.resize(
          this.inToCm(this.height),
          this.inToCm(this.width),
          this.inToCm(this.depth)
        );
      }
    },
  },
  mounted() {
    this.$blueprint3d.three.itemSelectedCallbacks.add(this.itemSelected);
    this.$blueprint3d.three.itemUnselectedCallbacks.add(this.itemUnselected);
  },
  beforeUnmount() {
    this.$blueprint3d.three.itemSelectedCallbacks.remove(this.itemSelected);
    this.$blueprint3d.three.itemUnselectedCallbacks.remove(this.itemUnselected);
  },
};
</script>

<style scoped></style>
