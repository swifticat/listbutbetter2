import { fetchLeaderboard } from '../content.js';
import { fetchList } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div v-if="!leaderboard" class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        {{ err[0] }}
                    </p>
                </div>
            </div>
            <div v-else class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">
                                        <!-- Display Flag -->
                                        <img v-if="ientry.country" :src="'/assets/flags/' + ientry.country + '.svg'" alt="Flag" class="country-flag"/>
                                        {{ ientry.user }}
                                    </span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <h1 v-if="entry">#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3 v-if="entry">{{ localize(entry.total) }}</h3>

                        <!-- Verified -->
                        <h2 v-if="entry && entry.verified && entry.verified.length > 0">Verified</h2>
                        <table v-if="entry && entry.verified && entry.verified.length > 0" class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p v-if="score.rank === null || score.rank === undefined">&mdash;</p>
                                    <p v-else>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p v-if="typeof score.score !== 'undefined'">+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- Completed -->
                        <h2 v-if="entry && entry.completed && entry.completed.length > 0">Completed</h2>
                        <table v-if="entry && entry.completed && entry.completed.length > 0" class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p v-if="score.rank === null || score.rank === undefined">&mdash;</p>
                                    <p v-else>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p v-if="typeof score.score !== 'undefined'">+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- Progressed -->
                        <h2 v-if="entry && entry.progressed && entry.progressed.length > 0">Progressed</h2>
                        <table v-if="entry && entry.progressed && entry.progressed.length > 0" class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p v-if="score.rank === null || score.rank === undefined">&mdash;</p>
                                    <p v-else>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p v-if="typeof score.score !== 'undefined'">+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- Created (generated from /data level files) -->
                        <h2 v-if="entry && entry.created && entry.created.length > 0">Created</h2>
                        <table v-if="entry && entry.created && entry.created.length > 0" class="table">
                            <tr v-for="item in entry.created">
                                <td class="rank">
                                    <p v-if="item.rank === null || item.rank === undefined">&mdash;</p>
                                    <p v-else>#{{ item.rank }}</p>
                                </td>
                                <td class="level">
                                    <a
                                        v-if="item.link"
                                        class="type-label-lg"
                                        target="_blank"
                                        :href="item.link"
                                    >
                                        {{ item.level }}
                                    </a>
                                    <span v-else class="type-label-lg">{{ item.level }}</span>
                                </td>
                                <td class="score">
                                    <!-- created entries don't award points; show if backend provided one -->
                                    <p v-if="typeof item.score !== 'undefined'">+{{ localize(item.score) }}</p>
                                </td>
                            </tr>
                        </table>

                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
        },
    },
    async mounted() {
        // fetch leaderboard + handle errors
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard || [];
        this.err = err || [];

        // fetch the levels list (same shape used by list.js)
        // fetchList returns array of [err, rank, level] per item
        try {
            const rawList = await fetchList();
            if (Array.isArray(rawList)) {
                // Build a map: creatorName -> array of created items
                const createdMap = Object.create(null);

                for (const item of rawList) {
                    // defensive: item should be [err, rank, level]
                    if (!Array.isArray(item)) continue;
                    const [, rank, level] = item;
                    if (!level) continue;

                    // `creators` may be an array or a single string; normalize
                    let creators = level.creators;
                    if (!creators) {
                        // some levels may have 'author' but no 'creators'
                        creators = level.author ? [level.author] : [];
                    } else if (typeof creators === 'string') {
                        creators = [creators];
                    }

                    for (const creatorName of creators) {
                        if (!creatorName) continue;
                        if (!createdMap[creatorName]) createdMap[creatorName] = [];

                        createdMap[creatorName].push({
                            level: level.name,
                            rank: typeof rank !== 'undefined' ? rank : null,
                            link: level.verification || null,
                            // no score for creations by default
                        });
                    }
                }

                // Merge created entries into leaderboard; if user doesn't exist, create an account entry
                for (const [creatorName, createdArr] of Object.entries(createdMap)) {
                    // try to find an existing leaderboard entry for this user
                    let target = this.leaderboard.find(x => x.user === creatorName);
                    if (target) {
                        // attach created array (overwrite if present)
                        this.$set ? this.$set(target, 'created', createdArr) : (target.created = createdArr);
                    } else {
                        // create a new minimal entry and push it
                        const newEntry = {
                            user: creatorName,
                            country: undefined,
                            total: 0,
                            verified: [],
                            completed: [],
                            progressed: [],
                            created: createdArr,
                        };
                        this.leaderboard.push(newEntry);
                    }
                }
            }
        } catch (e) {
            // non-fatal: if fetchList fails, we just won't show Created
            console.warn('Failed to build Created map:', e);
        }

        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
    },
};
