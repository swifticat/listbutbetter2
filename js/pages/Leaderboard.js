import { fetchLeaderboard } from '../content.js';
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

                        <!-- Created (new) -->
                        <h2 v-if="entry && entry.created && entry.created.length > 0">Created</h2>
                        <table v-if="entry && entry.created && entry.created.length > 0" class="table">
                            <tr v-for="item in entry.created">
                                <td class="rank">
                                    <p v-if="item.rank === null || item.rank === undefined">&mdash;</p>
                                    <p v-else>#{{ item.rank }}</p>
                                </td>
                                <td class="level">
                                    <!-- created entries may not have a score; show as link if available -->
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
                                    <!-- some backends may include a score for created entries; show if present -->
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
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
    },
};
