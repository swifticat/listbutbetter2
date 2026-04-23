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
         * Return an array of thumbnail URLs in descending preference for YouTube.
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
         * Called when an <img> for YouTube fails to load (404 etc).
         * Attempts the next fallback URL (if any), otherwise uses default image.
         */
        thumbError(e) {
            const el = e.target;
            if (!el) return;
            const fallbacks = (el.dataset.fallbacks || '').split(',').map(s => s.trim()).filter(Boolean);
            const attempted = parseInt(el.dataset.attempt || '0', 10);

            if (attempted < fallbacks.length) {
                const next = fallbacks[attempted];
                el.dataset.attempt = String(attempted + 1);
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
         * Detects low-res placeholder images by naturalWidth and tries next fallback if necessary.
         */
        thumbLoad(e) {
            const el = e.target;
            if (!el) return;

            const attempted = parseInt(el.dataset.attempt || '0', 10);
            const fallbacks = (el.dataset.fallbacks || '').split(',').map(s => s.trim()).filter(Boolean);

            const NATURAL_WIDTH_THRESHOLD = 300;
            const naturalWidth = el.naturalWidth || 0;

            if ((naturalWidth > 0 && naturalWidth < NATURAL_WIDTH_THRESHOLD) && attempted < fallbacks.length) {
                const next = fallbacks[attempted];
                el.dataset.attempt = String(attempted + 1);
                el.src = next;
                return;
            }

            if (naturalWidth > 0 && naturalWidth < NATURAL_WIDTH_THRESHOLD && attempted >= fallbacks.length) {
                el.onerror = null;
                el.onload = null;
                el.src = '/assets/default-thumbnail.png';
            }
        },

        /**
         * Simple handler for custom asset thumbnails (from /assets).
         * If the asset fails to load, fall back to default thumbnail.
         */
        assetThumbError(e) {
            const el = e.target;
            if (!el) return;
            el.onerror = null;
            el.src = '/assets/default-thumbnail.png';
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
                    :data-rank="rank"
                    @click="selectLevel(level)"
                    style="cursor:pointer"
                >
                    <div class="thumbnail">
                        <!-- If level.thumbnail is provided, use it (asset path). Wrap in link if verification exists -->
                        <template v-if="level.thumbnail">
                            <a 
                                v-if="level.verification"
                                :href="level.verification"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    :src="\`/assets/\${level.thumbnail}\`"
                                    loading="lazy"
                                    :alt="\`Thumbnail for \${level.name}\`"
                                    @error="assetThumbError"
                                />
                            </a>
                            <img
                                v-else
                                :src="\`/assets/\${level.thumbnail}\`"
                                loading="lazy"
                                :alt="\`Thumbnail for \${level.name}\`"
                                @error="assetThumbError"
                            />
                        </template>

                        <!-- Otherwise try YouTube thumbnails with progressive fallback/placeholder detection -->
                        <template v-else-if="level.verification">
                            <a 
                                :href="level.verification" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
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
                        </template>

                        <!-- final fallback -->
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
                        Enjoyment: {{ selectedLevel.enjoyment }}
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
                        <div>Enjoyment</div>
                    </div>

                    <!-- Record Rows -->
                    <div 
                        class="record-row" 
                        v-for="(record, idx) in selectedLevel.records" 
                        :key="idx" 
                        :class="{'even-row': idx % 3 === 0, 'odd-row': idx % 3 !== 0}"
                    >
                        <div>{{ record.user || '-' }}</div>
                        <div>{{ record.enjoyment }}</div>
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
                <p>Disallowed hacks include, but are not limited to: noclip, speedhack and show hitboxes. FPS Bypass is restricted to a max of 360FPS. Smooth fix is generally not allowed due to the potential for it to act as a speedhack. Polzhax users must have the cheat indicator setting enabled.</p>
                <p>Videos must contain audible clicks, the death before completion, and the level complete screen.</p>
                <p>"(1P)" levels must be beaten solo whereas "(2P)" levels must be beaten with another player.</p>
                <p>All levels must be beaten on the native Rewind19 executable environment to count as a valid record. Completions on other versions such as 2.1 or 2.2 are not acceptable.</p>
            </div>
        </main>
    `
};
