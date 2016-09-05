var mongoose = require('mongoose');

// Subdocument schema for votes
var voteSchema = new mongoose.Schema({ ip: 'String' });

// Subdocument schema for task choices
var choiceSchema = new mongoose.Schema({ 
	text: String,
	votes: [voteSchema]
});

// Document schema for tasks
exports.TaskSchema = new mongoose.Schema({
	co: { type: String, required: true },
	company: { type: String, required: true },
	segment: { type: String, required: true },
	specialist: String,
	auditor: String,
	administrator: String,
	date : { type : String , required : true,
		default: "posted @"+new Date().getFullYear()+"-"+(new Date().getMonth()+1)+"-"+new Date().getDate()+" "+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds() },
	meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	},
	choices: [choiceSchema]
});