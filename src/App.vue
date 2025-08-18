<template>
  <teleport to="#vue-add-items">
    <add-items @item-added="onItemAdded" />
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
  <teleport to="#loading-modal-container">
    <modal-effects />
  </teleport>
  <teleport to="#texture-selector-container">
    <texture-selector />
  </teleport>
  <teleport to="#floorplanner-controls-container">
    <viewer-floorplanner @done="onTabChanged('DESIGN')" />
  </teleport>
</template>

<script>
import AddItems from './components/AddItems.vue';
import ContextMenu from './components/ContextMenu.vue';
import SideMenu from './components/SideMenu.vue';
import CameraButtons from './components/CameraButtons.vue';
import MainControls from './components/MainControls.vue';
import ModalEffects from './components/ModalEffects.vue';
import TextureSelector from './components/TextureSelector.vue';
import ViewerFloorplanner from './components/ViewerFloorplanner.vue';

export default {
  name: 'App',
  components: {
    AddItems,
    ContextMenu,
    SideMenu,
    CameraButtons,
    MainControls,
    ModalEffects,
    TextureSelector,
    ViewerFloorplanner,
  },
  methods: {
    onItemAdded() {
      this.onTabChanged('DESIGN');
    },
    onTabChanged(tabName) {
      const event = new CustomEvent('app-tab-changed', { detail: { tabName } });
      document.dispatchEvent(event);
    }
  }
};
</script>
