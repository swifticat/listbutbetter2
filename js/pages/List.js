export default {
    data: () => ({
        list: [],
        loading: true,
        store,
        expandedLevel: null, // <-- track clicked level
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
        toggleLevel(level) {
            this.expandedLevel = this.expandedLevel === level ? null : level;
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
                return `${baseScore.toFixed(2)} points`;
            } else {
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
                    @click="toggleLevel(level)"
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
            <div 
                class="guidelines-box"
                :class="{ shifted: expandedLevel }"
            >
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
import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel, score } from '../score.js';

export default {
    data: () => ({
        list: [],
        loading: true,
        store,
        expandedLevel: null, // track clicked level
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
        toggleLevel(level) {
            this.expandedLevel = this.expandedLevel === level ? null : level;
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
                return `${baseScore.toFixed(2)} points`;
            } else {
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
                    @click="toggleLevel(level)"
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

                <!-- Expanded Level Box -->
                <div
                    v-if="expandedLevel"
                    class="expanded-level-box"
                >
                    <h1 class="expanded-title">{{ expandedLevel.name }}</h1>
                    <p class="expanded-author">
                        by {{ expandedLevel.author }}, verified by {{ expandedLevel.verifier }}
                    </p>
                    <div class="expanded-video">
                        <iframe 
                            v-if="expandedLevel.verification"
                            :src="'https://www.youtube.com/embed/' + extractYouTubeID(expandedLevel.verification)"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                        ></iframe>
                    </div>
                    <div class="expanded-stats">
                        <div>Level ID:<br>{{ expandedLevel.id }}</div>
                        <div>Points Awarded:<br>{{ calcScore(expandedLevel) }}</div>
                        <div>Password:<br>{{ expandedLevel.password }}</div>
                    </div>
                </div>
            </div>

            <!-- Guidelines box -->
            <div 
                class="guidelines-box"
                :class="{ shifted: expandedLevel }"
            >
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
