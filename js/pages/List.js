import { store } from '../main.js';
import { fetchList } from '../content.js';
import { rankLabel, score } from '../score.js';

export default {
    data: () => ({
        list: [],
        loading: true,
        store,
        selectedLevel: null, // Track which level is clicked
        showGuidelines: true, // Track visibility of guidelines box
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
                // If the user passed a plain id instead of a URL, return it directly
                if (typeof url === 'string' && url.trim().length > 0) return url.trim();
                return '';
            }
            return '';
        },

        /**
         * Return an array of thumbnail URLs in descending preference.
         * YouTube supports several known filenames:
         *  - maxresdefault.jpg (1280x720 if available)
         *  - sddefault.jpg (640x480)
         *  - hqdefault.jpg (480x360)
         *  - mqdefault.jpg (320x180)
         *  - 0.jpg (default)
         */
        getYouTubeThumbs(verificationUrl) {
            const id = this.extractYouTubeID(verificationUrl);
            if (!id) return [];
            const base = `https://img.youtube.com/vi/${id}`;
            return [
                `${base}/maxresdefault.jpg`,
                `${base}/sddefault.jpg`,
                `${base}/hqdefault.jpg`,
                `${base}/mqdefault.jpg`,
                `${base}/0.jpg`,
            ];
        },

        /**
         * Called when an <img> fails to load (404 etc).
         * Attempts the next fallback URL (if any), otherwise uses default image.
         */
        thumbError(e) {
            const el = e.target;
            if (!el) return;
            // parse the fallbacks list stored in data-fallbacks
            const fallbacks = (el.dataset.fallbacks || '').split(',').map(s => s.trim()).filter(Boolean);
            const attempted = parseInt(el.dataset.attempt || '0', 10);

            if (attempted < fallbacks.length) {
                // try next fallback
                const next = fallbacks[attempted];
                el.dataset.attempt = String(attempted + 1);
                // set src to the next fallback; onload/onerror handlers will manage further checks
                el.src = next;
                return;
            }

            // no fallbacks left -> set site default and remove handlers
            el.onerror = null;
            el.onload = null;
            el.src = '/assets/default-thumbnail.png';
        },

        /**
         * Called when an <img> successfully loads.
         * Some YouTube URLs return a generic low-res placeholder image (still 200 OK).
         * Detect small placeholders by checking naturalWidth/naturalHeight, and if too small,
         * try the next fallback (if available).
         */
        thumbLoad(e) {
            const el = e.target;
            if (!el) return;

            // how many fallback attempts have already occurred
            const attempted = parseInt(el.dataset.attempt || '0', 10);
            const fallbacks = (el.dataset.fallbacks || '').split(',').map(s => s.trim()).filter(Boolean);

            // Dimensions that indicate a placeholder / low-res image.
            // HQ thumbnails are at least ~320px wide; maxres is 1280x720.
            // If naturalWidth is smaller than this threshold, we probably got a placeholder.
            const NATURAL_WIDTH_THRESHOLD = 300; // conservative threshold

            const naturalWidth = el.naturalWidth || 0;
            const naturalHeight = el.naturalHeight || 0;

            // If the loaded image is too small and we have additional fallbacks, try the next one.
            if ((naturalWidth > 0 && naturalWidth < NATURAL_WIDTH_THRESHOLD) && attempted < fallbacks.length) {
                const next = fallbacks[attempted];
                el.dataset.attempt = String(attempted + 1);
                el.src = next;
                return;
            }

            // If size is fine, keep it. If it's tiny but no fallbacks left, use default thumbnail.
            if (naturalWidth > 0 && naturalWidth < NATURAL_WIDTH_THRESHOLD && attempted >= fallbacks.length) {
                // remove handlers to avoid loops
                el.onerror = null;
                el.onload = null;
                el.src = '/assets/default-thumbnail.png';
            }
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
        closeGuidelines() {
            this.showGuidelines = false;
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
                            <!-- Try the best thumb first, then fallbacks. Handlers manage placeholder detection. -->
                            <img
                                :src="getYouTubeThumbs(level.verification)[0]"
                                :data-fallbacks="getYouTubeThumbs(level.verification).slice(1).join(',')"
                                :data-attempt="0"
                                @error="thumbError"
                                @load="thumbLoad"
                                loading="lazy"
                                :alt="\`Verification video thumbnail for \${level.name}\`"
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

            <!-- Guidelines box with close button -->
            <div v-if="showGuidelines" class="guidelines-box" :class="{ shifted: selectedLevel }">
                <button class="close-btn" @click="closeGuidelines">×</button>
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
