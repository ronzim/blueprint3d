import { createApp } from 'vue';
import App from '../../src/App.vue';

import CameraButtons from '../../src/components/CameraButtons.vue';

document.addEventListener('blueprint3d-ready', (e) => {
  const app = createApp(App);
  app.config.globalProperties.$blueprint3d = e.detail.blueprint3d;
  app.mount('#app');

  const cameraButtonsApp = createApp(CameraButtons);
  cameraButtonsApp.config.globalProperties.$blueprint3d = e.detail.blueprint3d;
  cameraButtonsApp.mount('#camera-controls-container');
});
