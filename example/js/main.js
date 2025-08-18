import { createApp } from 'vue';
import App from '../../src/App.vue';

document.addEventListener('blueprint3d-ready', (e) => {
  const app = createApp(App);
  app.config.globalProperties.$blueprint3d = e.detail.blueprint3d;
  app.mount('#app');
});
