import { fetchList } from '../content.js';
import Spinner from '../components/Spinner.js';



export default {
	components: { Spinner },
	template: /*html*/`
		<main v-if="loading" class="surface">
			<Spinner></Spinner>
		</main>
		<main v-else class="page-submit">
			<h1>Submit a new record</h1>
			<div v-if="!sent" id="form-box">
				<form class="form" method="POST">
					<span class="note">* Inputs marked with an asterisk are required!</span>
					<select name="demon-name" id="demon-name" v-model="level">
						<option selected disabled="disabled">Select level*</option>
						<option v-for="([err, rank, level], i) in list" :value="level">{{rank}}. {{ level?.name }}</option>
					</select>
		
					<input type="text" v-model="holder" name="record-holder" id="record-holder" placeholder="Name to show in the record*" required>
		
					<div id="percentage-div">
						<input type="number" min="0" max="100" v-model="percentage" name="record-percentage-num" id="record-percentage-num" placeholder="Percentage*" required>
						<input type="range" min="0" max="100" v-model="percentage" name="record-percentage" id="record-percentage" placeholder="Percentage*" required>
					</div>
					<input type="text" v-model="footage" name="record-footage" id="record-footage" placeholder="Video*" required>
		
					<input type="text" v-model="rawfootage" name="record-rawfootage" id="record-rawfootage" placeholder="Raw Footage">
		
					<textarea name="record-notes" v-model="notes" id="record-notes" placeholder="Notes"></textarea>
		
					<button type="button" @click='sendWebhook()'>Submit record</button>
					
					
					</form>
					</div>
			<div v-else id="rec-sent">
				<h2 class="success">Record submitted!</h2>
				<button class="success" @click="sent = !sent">Submit another record</button>
			</div>
			<h3 id="error">{{ error }}</h3>
		</main>
	`,
	
	
	data: () => ({
		list: [],
		loading: true,
		sent: false,
		level: 'Select level*',
		holder: '',
		footage: '',
		rawfootage: '',
		notes: '',
		percentage: 0,
		error: '',
		errortimes: 0,
	}),
	async mounted() {
		// Hide loading spinner
		this.list = await fetchList();

		this.list.forEach(element => {
			if(element[1] === null){
				this.list.splice(this.list.indexOf(element), 1);
			}
		});

		this.loading = false;
	},

	methods: {
		sendWebhook() {
			console.log(this.level)
			if (this.level === 'Select level*' || this.holder === '' || this.footage === '' || this.percentage < 0 || this.percentage > 100) {
				this.errortimes += 1
				switch (this.errortimes) {
					case 3:
						this.error = 'Please fill in all required fields. If you are having trouble, please contact us on Discord.'
						return;
					case 6:
						this.error = 'boi what are you doing'
						return;
					case 10:
						this.error = 'ok you are just trolling now'
						return;
					case 20:
						this.error = 'you are just wasting your time'
						return;
					case 40:
						this.error = 'you are wasting our time'
						return;
					case 60:
						this.error = 'please stop lol'
						return;
					case 80:
						this.error = 'ok i am done lol'
						return;
					case 100:
						this.error = 'you clicked the button 100 times, good job.'
						return;
					case 200:
						this.error = 'you clicked the button 200 times, good job.'
						return;
					case 500:
						this.error = 'do you need help?'
						return;
					case 600:
						this.error = 'you might need help.'
						return;
					case 800:
						this.error = 'bro stop what the hell are you doing'
						return;
					case 1000:
						this.error = 'please stop, go outside or something'
						return;
					default:
						break;
				}
				if (this.error === ''){
					this.error = 'Please fill in all required fields.'
				}
				return;
			}
			return new Promise((resolve, reject) => {
				fetch("https://discord.com/api/webhooks/1381004484066676836/6xEAzw51JCpIouI7L_C35GBAh6iE22c-hdzwa3HSSyDlY8dZKMSDappeSSKiLsViL5zN", {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						content: this.level.name + " - " + this.holder,
						embeds: [
							{
								title: 'New record submission!',
								description: 'New record by ' + this.holder + ' on ' + this.level.name + '.',
								fields: [
									{
										name: 'Level',
										value: this.level.name + ' | ' + this.level.id,
									},
									{
										name: 'Record holder',
										value: this.holder,
									},
									{
										name: 'Percentage',
										value: this.percentage,
									},
									{
										name: 'Video',
										value: this.footage,
									},
									{
										name: 'Raw footage',
										value: this.rawfootage || "None",
									},
									{
										name: 'Notes',
										value: this.notes || "None",
									},
								],
							},
						],
					
					}),
				})
				.then((response) => {
					if (!response.ok) {
						reject(new Error(`Could not send message: ${response.status}`));
					}
					this.level = 'Select level*'
					this.holder = ''
					this.footage = ''
					this.rawfootage = ''
					this.notes = ''
					this.sent = true
					this.error = ''
					this.errortimes = 0
					resolve();
				})
				.catch((error) => {
					console.error(error);
					reject(error);
				});
			});
		}
		
	}
}
