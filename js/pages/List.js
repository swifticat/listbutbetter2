import { store } from '../main.js';
import { fetchList } from '../content.js';

export default {
    data: () => ({
        list: [],
        loading: true,
        store,
    }),
    async mounted() {
        this.list = await fetchList();
        this.loading = false;
    },
    methods: {
        extractYouTubeID(url) {
            if (!url) return '';
            try {
                const u = new URL(url);
                if (u.hostname.includes('youtu.be')) {
                    return u.pathname.slice(1);
                }
                if (u.hostname.includes('youtube.com')) {
                    return u.searchParams.get('v');
                }
            } catch (e) {
                return '';
            }
            return '';
        }
    },
    template: `
        <main v-if="loading">
            <p style="text-align:center; margin-top: 2rem;">Loading...</p>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div
                    class="level-box"
                    v-for="([err, rank, level], i) in list"
                    :key="level.id"
                >
                    <div class="thumbnail">
                        <img
                            :src="level.verification ? \`https://img.youtube.com/vi/\${extractYouTubeID(level.verification)}/0.jpg\` : '/assets/default-thumbnail.png'"
                            alt="Thumbnail"
                        />
                    </div>
                    <div class="level-info">
                        <p class="title">
                            <span class="rank">#{{ rank }}</span> –
                            <span class="name">{{ level.name }}</span>
                        </p>
                        <p class="author">{{ level.author }}</p>
                    </div>
                </div>
            </div>
        </main>
    `
};
