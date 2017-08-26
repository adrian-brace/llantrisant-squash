homeApp.service('configuration', function($q, $http, xmlToJson) {

	this.getConfiguration = function getConfiguration(){
		
		var deferred = $q.defer();
		
		// Read the master configuration file
		$http.get(MASTER_CONFIGURATION_FILE_PATH)
			.success(function(xmlData) {
				deferred.resolve(xmlToJson.convert(xmlData));
			})
			.error(function(data) {
				console.log('Error reading master configuration file: ' + MASTER_CONFIGURATION_FILE_PATH);
				deferred.resolve('');
			});

		return deferred.promise;
	};
});