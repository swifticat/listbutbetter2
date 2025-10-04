import routes from './routes.js';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
        // Keep <body> class in sync so CSS can target body.dark / body:not(.dark)
        document.body.classList.toggle('dark', this.dark);
    },
});

// Ensure body has the initial dark class if saved
document.body.classList.toggle('dark', store.dark);

const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');
