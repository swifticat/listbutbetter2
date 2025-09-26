import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel, score } from '../score.js';

export default {
    data: () => ({
        list: [],
        loading: true,
        store,
        selectedLevel: null, // Track which level is clicked
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

            <!-- Level Detail View -->
            <div v-else class="list-container">
                <!-- Box 1: Level Info -->
                <div class="level-detail-box">
                    <h2 style="text-align:center">{{ selectedLevel.name }}</h2>
                    <p style="text-align:center; font-size:0.9rem;">
                        by {{ selectedLevel.author }}, verified by {{ selectedLevel.verifier }}
                    </p>
                    <iframe
                        v-if="selectedLevel.verification"
                        width="100%"
                        height="50%"
                        :src="\`https://www.youtube.com/embed/\${extractYouTubeID(selectedLevel.verification)}\`"
                        title="Verification Video"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                    <p style="text-align:center; margin-top: 8px;">
                        Level ID: {{ selectedLevel.id }} &nbsp;&nbsp;&nbsp;
                        Points Awarded: {{ calcScore(selectedLevel, 100).toFixed(2) }} &nbsp;&nbsp;&nbsp;
                        Password: {{ selectedLevel.password }}
                    </p>
                </div>

                <!-- Box 2: Records -->
                <div class="level-records-box">
                    <p style="text-align:center; font-weight:500;">Records</p>
                    <p style="text-align:center; font-size:0.9rem;">
                        {{ selectedLevel.percentToQualify }}% or better required to qualify
                    </p>
                    <p style="text-align:center; font-size:0.85rem;">
                        {{ selectedLevel.records.length }} completions overall registered.
                    </p>
                    <div class="record-chart" style="display:flex; justify-content:space-between; background-color:#111; color:#fff; padding:8px; margin-top:8px;">
                        <div style="text-align:center; flex:1;">
                            <p style="margin:0;">Record Holder</p>
                            <p style="margin:0; font-size:0.9rem;">
                                {{ selectedLevel.records[0]?.user || '-' }}
                            </p>
                        </div>
                        <div style="text-align:center; flex:1;">
                            <p style="margin:0;">Video Proof</p>
                            <p style="margin:0; font-size:0.9rem;">
                                <a 
                                    v-if="selectedLevel.records[0]?.link" 
                                    :href="selectedLevel.records[0].link" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style="color:#00f;"
                                >
                                    YouTube
                                </a>
                                <span v-else>-</span>
                            </p>
                        </div>
                    </div>
                    <button @click="deselectLevel()" style="margin-top:12px; display:block; margin-left:auto; margin-right:auto;">Back</button>
                </div>
            </div>

            <!-- Guidelines box remains -->
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
