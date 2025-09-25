/**
 * Numbers of decimal digits to round to
 */
const scale = 3;

/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @param {Number} listlen Length of the entire list
 * @returns {Number}
 */
export function score(rank, percent, minPercent, listlen) {
    let returnval = 0;

    // Ranks 151 and above are Legacy
    if (rank === null || rank > 150) {
        returnval = 0; // No points for Legacy
    } else {
        if (rank > 75) {
            minPercent = 100;
        }
        // Scoring formula for ranks 1–150
        let scoreValue = 3615.96 / (rank + 9.33109) - 0.00722289 * rank;
        scoreValue = Math.max(0, scoreValue);
        if (isNaN(scoreValue)) {
            scoreValue = 0;
        }

        if (percent !== 100) {
            returnval = round(scoreValue - scoreValue / 3);
        } else {
            returnval = round(scoreValue);
        }
    }

    return returnval;
}

/**
 * Round a number to a fixed number of decimal digits
 * @param {Number} num
 * @returns {Number}
 */
export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}

/**
 * Utility function to display rank label
 * @param {Number} rank
 * @returns {String}
 */
export function rankLabel(rank) {
    return (rank !== null && rank <= 150) ? `#${rank}` : "Legacy";
}
