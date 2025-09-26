import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel, score } from '../score.js'; // Import helpers

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
        rankLabel,
        calcScore(level, percent = 100) {
            if (!level.rank) return null;
            const lenlist = this.list.filter(x => x[1] !== null).length;
            return score(level.rank, percent, level.percentToQualify, lenlist);
        },
        formatScoreText(level) {
            const baseScore = this.calcScore(level, 100);
            if (baseScore === null) return '';

            if (level.percentToQualify === 100) {
                // Simple case: 100% required
                return `${baseScore.toFixed(2)} points`;
            } else {
                // Show required % vs max points
                const reqScore = this.calcScore(level, level.percentToQualify);
                return `${reqScore.toFixed(2)} (${level.percentToQualify}%) — ${baseScore.toFixed(2)} (100%) points`;
            }
        },
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
                        <p class="author">
                            Published by <span class="author-name">{{ level.author }}</span>
                        </p>
                        <p class="score-text">
                            {{ formatScoreText(level) }}
                        </p>
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
