import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel } from '../score.js'; // Import the rankLabel helper

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
        },
        rankLabel, // make rankLabel available in template
    },
    template: `
        <main v-if="loading">
            <p style="text-align:center; margin-top: 2rem;">Loading...</p>
        </main>
        <main v-else class="page-list">
            <!-- Levels list -->
            <div class="list-container">
                <div
                    class="level-box"
                    v-for="([err, rank, level], i) in list"
                    :key="level.id"
                >
                    <div class="thumbnail">
                        <a 
                            v-if="level.verification" 
                            :href="level.verification" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <img
                                :src="\`https://img.youtube.com/vi/\${extractYouTubeID(level.verification)}/0.jpg\`"
                                alt="Thumbnail"
                            />
                        </a>
                        <img
                            v-else
                            src="/assets/default-thumbnail.png"
                            alt="Thumbnail"
                        />
                    </div>
                    <div class="level-info">
                        <p class="title">
                            <span class="rank">{{ rankLabel(rank) }}</span> –
                            <span class="name">{{ level.name }}</span>
                        </p>
                        <p class="author">Published by <span class="author-name">{{ level.author }}</span></p>
                    </div>
                </div>
            </div>

            <!-- Guidelines box -->
            <div class="guidelines-box">
                <h2>Guidelines</h2>
                <hr />
                <p>All demonlist operations are carried out in accordance to our guidelines. Be sure to check them before submitting a record to ensure a flawless experience!</p>
                <p>CBF usage is permitted.</p>
                <p>Make sure to include split audio tracks for a faster review of your record.</p>
                <p>For a level harder than Carmine Clutter, you must also include raw footage of your recording.</p>
                <p>Physics Bypass is not allowed and will get your record rejected.</p>
                <p>If you have Mega Hack, make sure to enable cheat indicator upon reaching the end screen, as well as the ingame clock.</p>
                <p>Make sure that the recording shows a few frames of the end card dropping down.</p>
            </div>
        </main>
    `
};
