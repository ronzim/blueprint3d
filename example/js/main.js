import { createApp } from 'vue';
import AddItems from '../../src/components/AddItems.vue';

const app = createApp(AddItems);

document.addEventListener('blueprint3d-ready', (e) => {
  app.config.globalProperties.$blueprint3d = e.detail.blueprint3d;
  app.mount('#vue-add-items');
});
