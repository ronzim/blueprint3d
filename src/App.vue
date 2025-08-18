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
</template>

<script>
import AddItems from './components/AddItems.vue';
import ContextMenu from './components/ContextMenu.vue';
import SideMenu from './components/SideMenu.vue';

export default {
  name: 'App',
  components: {
    AddItems,
    ContextMenu,
    SideMenu,
  },
  methods: {
    onTabChanged(tabName) {
      const event = new CustomEvent('app-tab-changed', { detail: { tabName } });
      document.dispatchEvent(event);
    }
  }
};
</script>
