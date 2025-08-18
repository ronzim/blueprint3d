<template>
  <teleport to="#vue-add-items">
    <add-items />
  </teleport>
  <teleport to="#context-menu-container">
    <context-menu />
  </teleport>
  <teleport to="#side-menu-container">
    <side-menu @tab-changed="onTabChanged" />
  </teleport>
  <teleport to="#camera-controls-container">
    <camera-buttons />
  </teleport>
  <teleport to="#main-controls-container">
    <main-controls />
  </teleport>
</template>

<script>
import AddItems from './components/AddItems.vue';
import ContextMenu from './components/ContextMenu.vue';
import SideMenu from './components/SideMenu.vue';
import CameraButtons from './components/CameraButtons.vue';
import MainControls from './components/MainControls.vue';

export default {
  name: 'App',
  components: {
    AddItems,
    ContextMenu,
    SideMenu,
    CameraButtons,
    MainControls,
  },
  methods: {
    onTabChanged(tabName) {
      const event = new CustomEvent('app-tab-changed', { detail: { tabName } });
      document.dispatchEvent(event);
    }
  }
};
</script>
