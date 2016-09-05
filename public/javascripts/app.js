// Angular module, defining routes for the app
angular.module('tasks', ['taskServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/tasks', { templateUrl: 'partials/list.html', controller: TaskListCtrl }).
			when('/task/:taskId', { templateUrl: 'partials/item.html', controller: TaskItemCtrl }).
			when('/new', { templateUrl: 'partials/new.html', controller: TaskNewCtrl }).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '/tasks' });
	}]);
	