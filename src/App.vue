<template>
  <teleport to="#vue-add-items">
    <add-items />
  </teleport>
  <teleport to="#context-menu-container">
    <context-menu />
  </teleport>
</template>

<script>
import AddItems from './components/AddItems.vue';
import ContextMenu from './components/ContextMenu.vue';

export default {
  name: 'App',
  components: {
    AddItems,
    ContextMenu,
  },
};
</script>
