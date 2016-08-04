'use strict'
const uuid = require('node-uuid');
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const redis = require('redis').createClient();
const event = require('events').EventEmitter;
const evt = new event();

class PlayVoice {
	constructor(storyName) {
		this.fileId
		mqtt.subscribe('sound_manager/+/complete');
		mqtt.subscribe('sound_manager/+/terminate');
		this.soundOptions = {
			storyName: storyName
		}
		mqtt.on('message', (topic, message) => {
			let fileId
			switch (true) {
			case /^sound_manager[/].*[/]complete\b/.test(topic):
				fileId = topic.split('/')[1];
				if (fileId == this.fileId) {
					let fileOptions = {
						file: this.soundOptions,
						t: 'done'
					}
					redis.set(this.fileId, JSON.stringify(fileOptions));
					evt.emit('play-voice-to-end', 'complete');
				}
				break;
			case /^sound_manager[/].*[/]terminate\b/.test(topic):
				fileId = topic.split('/')[1];
				if (fileId == this.fileId) {
					console.log('请求进入terminate');
					console.log(message.toString());
					let fileOptions = {
						file: this.soundOptions.file,
						t: JSON.parse(message.toString()).progress
					}
					redis.set(this.fileId, JSON.stringify(fileOptions));
					evt.emit('play-voice-to-end', 'terminate');
				}
				break;
			}
		})
	}

	play(file) {
		this.fileId = uuid.v4();
		redis.lpush('story-flag-' + this.soundOptions.storyName, this.fileId, (err, reply) => {
			this.soundOptions.file = file;
			this.soundOptions.soundId = this.fileId;
			mqtt.publish('sound_manager/play', JSON.stringify(this.soundOptions), (err) => {
				if (err) console.log(err);
			});
			let fileOptions = {
				file: file,
				t: 0
			}
			redis.set(this.fileId, JSON.stringify(fileOptions));
		})
		return new Promise((resolve, inject) => {
			evt.on('play-voice-to-end', (msg) => {
				resolve(msg);
			});
		});
	}
}

module.exports = PlayVoice;
