// Controller for the task list
function TaskListCtrl($scope, $http, $location, $route, Task) {
	$scope.tasks = Task.query();
	$scope.sortOrder = "-meta.createAt";
	$scope.delete = function(id) {
		console.log(id);
		$http.delete('/tasks/' + id).success(function(response) {
			$location.path('tasks');
			$route.reload()
		});
	};

}

// Controller for an individual task
function TaskItemCtrl($scope, $routeParams, socket, Task) {	
	$scope.task = Task.get({taskId: $routeParams.taskId});
	
	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.taskId) {
			$scope.task = data;
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.taskId) {
			$scope.task.choices = data.choices;
			$scope.task.totalVotes = data.totalVotes;
		}		
	});
	
	$scope.vote = function() {
		var taskId = $scope.task._id,
				choiceId = $scope.task.userVote;
		
		if(choiceId) {
			var voteObj = { task_id: taskId, choice: choiceId };
			socket.emit('send:vote', voteObj);
		} else {
			alert('You must select an option to vote for');
		}
	};
}

// Controller for creating a new task
function TaskNewCtrl($scope, $location, Task) {
	// Define an empty task model object
	$scope.task = {
		co: '',
		company:'',
		segment:'',
		administrator:'',
		auditor:'',
		specialist:'',
		choices: [ { text: 'under administrator' }, { text: 'under auditor' }, { text: 'under specialist' }]
	};
	
	// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.task.choices.push({ text: '' });
	};
	
	// Validate and save the new task to the database
	$scope.createTask = function() {
		var task = $scope.task;
		
		// Check that a co was provided
		if(task.co.length > 0) {
			var choiceCount = 0;
			
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = task.choices.length; i < ln; i++) {
				var choice = task.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount > 1) {
				// Create a new task from the model
				var newTask = new Task(task);
				
				// Call API to save task to the database
				newTask.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('tasks');
					} else {
						alert('Could not create task');
					}
				});
			} else {
				alert('You must enter at least two choices');
			}
		} else {
			alert('You must enter a co');
		}
	};
}