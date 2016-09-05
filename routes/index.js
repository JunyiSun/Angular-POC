// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var db;
if (process.env.VCAP_SERVICES) {
   var env = JSON.parse(process.env.VCAP_SERVICES);
   db = mongoose.createConnection(env['mongodb-2.2'][0].credentials.url);
} else {
   db = mongoose.createConnection('localhost', 'emt-poc');
}

// Get Task schema and model
var TaskSchema = require('../models/Task.js').TaskSchema;
var Task = db.model('tasks', TaskSchema);

// Main application view
exports.index = function(req, res) {
	res.render('index');
};

// JSON API for list of tasks
exports.list = function(req, res) {
	// Query Mongo for tasks, just get back the co text
	Task.find({}, function(error, tasks) {
		res.json(tasks);
	});
};

// JSON API for getting a single task
exports.task = function(req, res) {
	// Task ID comes in the URL
	var taskId = req.params.id;
	
	// Find the task by its ID, use lean as we won't be changing it
	Task.findById(taskId, '', { lean: true }, function(err, task) {
		if(task) {
			var userVoted = false,
					userChoice,
					totalVotes = 0;

			// Loop through task choices to determine if user has voted
			// on this task, and if so, what they selected
			for(c in task.choices) {
				var choice = task.choices[c]; 

				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;

					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}

			// Attach info about user's past voting on this task
			task.userVoted = userVoted;
			task.userChoice = userChoice;

			task.totalVotes = totalVotes;
		
			res.json(task);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for creating a new task
exports.create = function(req, res) {
	var reqBody = req.body,
			// Filter out choices with empty text
			choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
			// Build up task object to save
			taskObj = {co: reqBody.co, company: reqBody.company, segment: reqBody.segment,
				administrator: reqBody.administrator,auditor: reqBody.auditor, specialist: reqBody.specialist, choices: choices};
				
	// Create task model from built up task object
	var task = new Task(taskObj);
	
	// Save task to DB
	task.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}		
	});
};

exports.vote = function(socket) {
	socket.on('send:vote', function(data) {
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;

		Task.findById(data.task_id, function(err, task) {
			var choice = task.choices.id(data.choice);
			choice.votes.push({ ip: ip });
			
			task.save(function(err, doc) {
				var theDoc = { 
					co: doc.co, _id: doc._id, choices: doc.choices, 
					userVoted: false, totalVotes: 0 
				};

				// Loop through task choices to determine if user has voted
				// on this task, and if so, what they selected
				for(var i = 0, ln = doc.choices.length; i < ln; i++) {
					var choice = doc.choices[i]; 

					for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
						var vote = choice.votes[j];
						theDoc.totalVotes++;
						theDoc.ip = ip;

						if(vote.ip === ip) {
							theDoc.userVoted = true;
							theDoc.userChoice = { _id: choice._id, text: choice.text };
						}
					}
				}
				
				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			});			
		});
	});
};


exports.del = function(req,res){
	var id = req.params.id;
	if(id){
		Task.remove({_id:id},function(err,task){
			if(err){
				console.log(err);
			}
			res.json(task);
		});
	}
};
