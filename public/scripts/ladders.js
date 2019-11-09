homeApp.controller('LaddersController', ['$scope', '$http', '$location', 'club', function($scope, $http, $location, club) {
    
	$scope.saveStatus = '';
	$scope.unsavedData = false;
	$scope.admin = $location.search()['admin'];
	var today = new Date();	
	var getClub = club.getClub();

	getClub.then(function(clubName){		

		//$http.get('./data_generated/ladders/'+ clubName + '/ladders.json')
		$http.get('./data_generated/ladders/'+ clubName + '/squash_ladder.json')
			.success(function(data) {
				$scope.data = data;
				$scope.daysRemainingSquash = daysUntil($scope.data.Squash.EndDate);
				$scope.daysRemainingRacketball = daysUntil($scope.data.Racketball.EndDate);
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	function daysUntil(endDate){
		var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
		var secondDate = new Date(endDate);
		var firstDate = new Date();
		var daysUntil = Math.round((secondDate.getTime() - firstDate.getTime())/(oneDay));
		
		if (daysUntil < 0){
			return -1;
		}
		return daysUntil;
	};
	
	$scope.getLadderNumberArray = function(ladderNumber) {
		return new Array(parseInt(ladderNumber));
	}
	
	$scope.move = function move(ladder, moveBy, playerName) {
		
		var data;
		
		// Get relevant ladder data
		if (ladder==='squash'){
			data = $scope.data.Squash;
		} else {
			data = $scope.data.Racketball;
		}

		// Flatten data into array of all players
		var allLadderPlayers = flattenFullLadder(data);
		
		var playerIndex = allLadderPlayers.indexOf(playerName);
		
		var moveTo = getMoveTo(playerIndex, allLadderPlayers.length - 1, moveBy);
		
		// Move player safely
		allLadderPlayers.move(playerIndex, moveTo);
		
		// Put players back into data
		updateFullLadder(data, allLadderPlayers);

		$scope.unSavedData = true;
	};
	
	$scope.save = function save(){

		// Save data
		$http.post('./save_ladder', $scope.data)
			.then(function success(response) {
				$scope.saveStatus = 'Ladder data successfully updated';
			}, function error(response) {
				$scope.saveStatus = 'An error cccurred updating the ladder';
		});

		$scope.unSavedData = false;
	}

	$scope.showRules = false;
	
	$scope.showHideRules = function(){
		if ($scope.showRules){
			$scope.showRules = false;
		}
		else{
			$scope.showRules = true;
		}
	}
	
	$scope.groupSizeSquash = 5;
	$scope.groupSizeRacketball = 5;

	$scope.extendLadder = function (isSquash){

		var ladder;
		var groupSize;

		if(isSquash) {
			ladder = $scope.data.Squash.Ladders.Ladder;
			groupSize = $scope.groupSizeSquash;
		} else {
			ladder = $scope.data.Racketball.Ladders.Ladder
			groupSize = $scope.groupSizeRacketball;
		}

		var newDivisionNumber = ladder.length + 1;
		ladder.push({
				Number: newDivisionNumber,
				Players: {
					Name: []
			}
		});

		for(var count = 0; count < groupSize; count++){
			ladder[ladder.length - 1].Players.Name.push("New Player");
		}

		$scope.unSavedData = true;
	};

	$scope.trimLadder = function (isSquash){

		var ladder;
		if(isSquash) {
			ladder = $scope.data.Squash.Ladders.Ladder;
		} else {
			ladder = $scope.data.Racketball.Ladders.Ladder;
		}

		ladder = ladder.splice(-1,1);
		$scope.unSavedData = true;
	}
}]);

function getMoveTo(playerIndex, lastPlayerIndex, moveBy){
	
	var moveTo = playerIndex + moveBy;
	
	if (moveTo < 0){
		return 0;
	} else if (moveTo > lastPlayerIndex){
		return lastPlayerIndex;
	}
	
	return moveTo;
}

function flattenFullLadder(data){
	
	var allNames = [];
	var ladderIndex;
	
	for (ladderIndex = 0; ladderIndex < data.Ladders.Ladder.length; ladderIndex++){
		
		var nameIndex;
		
		for (nameIndex = 0; nameIndex < data.Ladders.Ladder[ladderIndex].Players.Name.length; nameIndex++){			
			allNames.push(data.Ladders.Ladder[ladderIndex].Players.Name[nameIndex]);			
		}			
	}
	
	return allNames;
}

function updateFullLadder(data, updatedPlayersList){

	var ladderIndex;
	
	for (ladderIndex = 0; ladderIndex < data.Ladders.Ladder.length; ladderIndex++){
		
		var nameIndex;
		
		for (nameIndex = 0; nameIndex < data.Ladders.Ladder[ladderIndex].Players.Name.length; nameIndex++){
			
			data.Ladders.Ladder[ladderIndex].Players.Name[nameIndex] = updatedPlayersList[(ladderIndex * 5) + nameIndex];
			
		}			
	}
}