'use strict'
const uuid = require('node-uuid');
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const redis = require('redis').createClient();
const event = require('events').EventEmitter;
const evt = new event();
const _ = require('lodash');

class Choice {
	constructor() {
		mqtt.subscribe('environmental_perception/mic/recording/done');
		mqtt.subscribe('speech2text/do/reply');
		mqtt.on('message', (err, message) => {
			let msg;
			switch (topic) {
			case 'environmental_perception/mic/recording/done':
				msg = JSON.parse(message.toString());
				if (msg && msg.correlationId && msg.correlationId == this.correlationId) {
					mqtt.publish('speech2text/do/request', JSON.stringify({
						"correlationId": this.correlationId,
						"file": msg.file
					}));
				}
				break;
			case 'speech2text/do/reply':
				msg = JSON.parse(message.toString());
				if (msg && msg.correlationId && msg.correlationId == this.correlationId) {
					let text = msg.text;
					let once = true;
					_.forEach(this.option, function (value, key) {
						for (let t of value) {
							if (text.indexOf(t) === -1 && once) {
								evt.emit('reply', key);
								once = false;
								break;
							}
						}
					});
					if (this.def && once) {
						evt.emit('reply', this.def);
					}
					once || evt.emit('reply', null);
				}
			}
		});
	}

	getAllChoice() {
		let allChoice = [];
		this.def || allChoice.push(this.def);
		_.forEach(this.option, function (value, key) {
			allChoice.push(key);
		});
		return allChoice;
	}

	getUnselected(str) {
		let unselect = [];
		for (let choice of this.allChoice) {
			if (choice !== str) {
				unselect.push(choice);
			}
		}
		return unselect;
	}

	choice(option, def) {
		this.option = option;
		this.def = def;
		this.allChoice = this.getAllChoice();
		this.correlationId = uuid.v4();

		mqtt.publish('environmental_perception/mic/recording/start', JSON.stringify({
			"correlationId": correlationId
		}));

		return new Promise((resolve, reject) => {
			evt.on("reply", (data) => {
				if (data) {
					return data;
				} else {
					return null;
				}
			});
		});
	}
}
//environmental_perception/mic/recording/start  payload correlationId

//environmental_perception/mic/recording/done   payload correlationId file

//speech2text/do/request  payload correlationId file

//speech2text/do/reply  payload correlationId text
module.exports = Choice;
