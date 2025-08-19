<template>
  <ul class="nav nav-sidebar">
    <li :class="{ active: activeTab === 'FLOORPLAN' }" @click="changeTab('FLOORPLAN')">
      <a href="#">
        Edit Floorplan
        <span class="glyphicon glyphicon-chevron-right pull-right"></span>
      </a>
    </li>
    <li :class="{ active: activeTab === 'DESIGN' }" @click="changeTab('DESIGN')">
      <a href="#">
        Design
        <span class="glyphicon glyphicon-chevron-right pull-right"></span>
      </a>
    </li>
    <li :class="{ active: activeTab === 'SHOP' }" @click="changeTab('SHOP')">
      <a href="#">
        Add Items
        <span class="glyphicon glyphicon-chevron-right pull-right"></span>
      </a>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'SideMenu',
  data() {
    return {
      activeTab: 'DESIGN',
    };
  },
  methods: {
    changeTab(tabName) {
      this.activeTab = tabName;
      this.$emit('tab-changed', tabName);
    },
  },
};
</script>

<style scoped>
li {
  cursor: pointer;
}
</style>
