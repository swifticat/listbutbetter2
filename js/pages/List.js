import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel, score } from '../score.js';

export default {
    data: () => ({
        list: [],
        loading: true,
        store,
        selectedLevel: null,
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
                if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
                if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
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
            if (level.percentToQualify === 100) return `${baseScore.toFixed(2)} points`;
            const reqScore = this.calcScore(level, level.percentToQualify);
            return `${reqScore.toFixed(2)} (${level.percentToQualify}%) — ${baseScore.toFixed(2)} (100%) points`;
        },
        selectLevel(level) {
            this.selectedLevel = level;
        },
        deselectLevel() {
            this.selectedLevel = null;
        },
    },
    template: `
        <main v-if="loading">
            <p style="text-align:center; margin-top: 2rem;">Loading...</p>
        </main>

        <main v-else class="page-list">
            <!-- Level List -->
            <div v-if="!selectedLevel" class="list-container">
                <div
                    class="level-box"
                    v-for="([err, rank, level], i) in list"
                    :key="level.id"
                    @click="selectLevel(level)"
                    tabindex="0" <!-- ✅ keyboard navigation -->
                    style="cursor:pointer"
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
                                :alt="\`Verification video thumbnail for \${level.name}\`"
                                loading="lazy" <!-- ✅ lazy load -->
                            />
                        </a>
                        <img
                            v-else
                            src="/assets/default-thumbnail.png"
                            :alt="\`Default thumbnail for \${level.name}\`"
                            loading="lazy"
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

            <!-- rest of template unchanged -->
            ...
    `
};
