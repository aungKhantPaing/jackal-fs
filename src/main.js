import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import formats from "./plugins/formats";

createApp(App).use(formats).mount("#app");
