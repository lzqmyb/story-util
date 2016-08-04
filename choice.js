'use strict'
const uuid = require('node-uuid');
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const redis = require('redis').createClient();
const event = require('events').EventEmitter;
const evt = new event();

class Choice{
    constructor(){
        this.correlationId 
        mqtt.subscribe('environmental_perception/mic/recording/done');
        mqtt.subscribe('speech2text/do/reply');
        mqtt.on('message',(err,message) => {
            let msg
            switch(true){
                case /^environmental_perception[/]mic[/]recording[/]done\b/.test(topic):
                    msg = JSON.parse(message.toString());
                    if(msg&&msg.correlationId&&msg.correlationId==this.correlationId){
                        mqtt.publish('speech2text/do/request',JSON.stringify({"correlationId":this.correlationId,"file":msg.file}));
                    }
                    break;
                case /^speech2text[/]do[/]reply\b/.test(topic):
                    msg = JSON.parse(message.toString());
                    if(msg&&msg.correlationId&msg.correlationId==this.correlationId){
                        let text = msg.text;
                        for(let key of option){
                            for(let i=0;i<option[key].length;i++){
                                if(option[key][i].indexOf(text)!=-1){
                                    evt.emit('reply',key);
                                    break;
                                }
                            }
                        }
                        if(this.def){
                            evt.emit('reply',this.def);
                        }
                        evt.emit('reply');
                    }
            }
        })
    }
    choice(option,def){
        this.option = option;
        this.def = def;
        this.correlationId = uuid.v4();
        mqtt.publish('environmental_perception/mic/recording/start',JSON.stringify({"correlationId":correlationId}));
        evt.on("reply",(data) => {
            if(data){
                return data;
            }else{
                return null;
            }
        });
    }
}
//environmental_perception/mic/recording/start  payload correlationId

//environmental_perception/mic/recording/done   payload correlationId file

//speech2text/do/request  payload correlationId file

//speech2text/do/reply  payload correlationId text
module.exports = Choice;