import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Antd from 'ant-design-vue'
// import * as Icons from '@ant-design/icons-vue'

const app = createApp(App)

app.use(Antd)
// 注册图标组件
// for (const i in Icons) {
//   app.component(i, Icons[i])
// }

app.mount('#app')
