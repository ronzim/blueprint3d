import { createApp } from 'vue';
import AddItems from '../../src/components/AddItems.vue';

const app = createApp({
  components: {
    AddItems,
  }
});

document.addEventListener('blueprint3d-ready', (e) => {
  app.config.globalProperties.$blueprint3d = e.detail.blueprint3d;
  app.config.globalProperties.$sideMenu = e.detail.sideMenu;
  app.mount('#app');
});
