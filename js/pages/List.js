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
        /**
         * Robust YouTube ID extractor.
         * - Tries URL parsing first (works when full URL with protocol is provided)
         * - Falls back to regex matching to support:
         *   - youtu.be/ID
         *   - youtube.com/watch?v=ID
         *   - youtube.com/embed/ID
         *   - youtube.com/shorts/ID
         * - Returns '' when no ID found
         */
        extractYouTubeID(url) {
            if (!url) return '';
            // quick guard for non-string values
            try {
                url = String(url).trim();
            } catch (e) {
                return '';
            }

            // Try using the URL API when possible
            try {
                // If the URL is missing a protocol, prepend https:// to allow parsing
                const maybeUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
                const u = new URL(maybeUrl);

                // youtu.be short link
                if (u.hostname.includes('youtu.be')) {
                    const id = u.pathname.slice(1);
                    return id || '';
                }

                // youtube.com - check query param v, or path segments (embed/shorts)
                if (u.hostname.includes('youtube.com') || u.hostname.includes('www.youtube.com')) {
                    const v = u.searchParams.get('v');
                    if (v) return v;
                    // path-based ids: /embed/ID, /shorts/ID
                    const segments = u.pathname.split('/').filter(Boolean);
                    // segments like ["embed", "ID"] or ["shorts","ID"]
                    if (segments.length >= 2) return segments[1] || '';
                }
            } catch (e) {
                // fall through to regex fallback
            }

            // Regex fallback: capture typical patterns
            // Supports:
            //  - youtu.be/ID
            //  - youtube.com/watch?v=ID
            //  - youtube.com/embed/ID
            //  - youtube.com/shorts/ID
            const re = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/i;
            const m = url.match(re);
            if (m && m[1]) return m[1];

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
                        <!-- compute id and only request YouTube thumbnail if we have an id -->
                        <template v-if="level.verification && extractYouTubeID(level.verification)">
                            <a 
                                :href="level.verification" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <img
                                    :src="\`https://img.youtube.com/vi/\${extractYouTubeID(level.verification)}/0.jpg\`"
                                    alt="Thumbnail"
                                />
                            </a>
                        </template>

                        <!-- fallback when no valid youtube id -->
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

                    <!-- only embed if we have a valid youtube id -->
                    <iframe
                        v-if="selectedLevel.verification && extractYouTubeID(selectedLevel.verification)"
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

                <!-- Box 2: Records with striped layout -->
                <div class="level-records-box">
                    <p style="text-align:center; font-weight:500;">Records</p>
                    <p style="text-align:center; font-size:0.9rem;">
                        {{ selectedLevel.percentToQualify }}% or better required to qualify
                    </p>
                    <p style="text-align:center; font-size:0.85rem;">
                        {{ selectedLevel.records.length }} completions overall registered.
                    </p>

                    <!-- Header Bar -->
                    <div class="record-header">
                        <div>Record Holder</div>
                        <div>Video Proof</div>
                    </div>

                    <!-- Record Rows -->
                    <div 
                        class="record-row" 
                        v-for="(record, idx) in selectedLevel.records" 
                        :key="idx" 
                        :class="{'even-row': idx % 2 === 0, 'odd-row': idx % 2 !== 0}"
                    >
                        <div>{{ record.user || '-' }}</div>
                        <div>
                            <a 
                                v-if="record.link" 
                                :href="record.link" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                YouTube
                            </a>
                            <span v-else>-</span>
                        </div>
                    </div>

                    <button @click="deselectLevel()" style="margin-top:12px; display:block; margin-left:auto; margin-right:auto;">Back</button>
                </div>
            </div>

            <!-- Guidelines box remains; it will shift instantly when in detail view -->
            <div class="guidelines-box" :class="{ shifted: selectedLevel }">
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
