/* Constants */
var OLDEST_YEAR = 2016;
var SPRING_START_DAY = 6;
var SPRING_END_DAY = 2;
var SPRING_START_MONTH = '-01-08';
var WINTER_START_MONTH = '-08-25';
var SEASON_SPRING = 'spring';
var SEASON_WINTER = 'winter';
var DIRECTORY_CONFIGURATION = './configuration/';
var MASTER_CONFIGURATION_FILE_PATH = DIRECTORY_CONFIGURATION + 'Configuration.xml';
var CLUBS_CONFIGURATION_FILE_PATH = DIRECTORY_CONFIGURATION + 'Clubs.xml';
var HEADER_HTML_FILE = './public/header.html';
var TOURNAMENT_TITLE_HTML_FILE = './public/tournament_title.html';
var TOURNAMENT_HEADER_HTML_FILE = './public/tournament_header.html';
var TOURNAMENT_OVER_HTML_FILE = './public/tournament_over.html';
var TOURNAMENT_RESULTS_AVAILABLE_HTML_FILE = './public/tournament_results_available.html';

TOURNAMENT_OVER_HTML_FILE
var TOURNAMENT_FOOTER_HTML_FILE = './public/tournament_footer.html';
var CHALLENGE_RULES_HTML_FILE = './public/challenge_rules.html';
var RANKING_UPDATE_DUE_HTML_FILE = './public/ranking_update_due.html';

Number.prototype.ordinalSuffixOf = function(){
    var j = this % 10,
        k = this % 100;
    if (j == 1 && k != 11) {
        return String(this) + "st";
    }
    if (j == 2 && k != 12) {
        return String(this) + "nd";
    }
    if (j == 3 && k != 13) {
        return String(this) + "rd";
    }
    return String(this) + "th";
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function clearAll() {
    $("input:checkbox").prop('checked', false);
};

function noSubFilter(subFilterObj) {
	for (var key in subFilterObj) {
		if (subFilterObj[key]) return false;
	}
	return true;
}

function fixturesOnly(items) {
	var filtered = [];
	if(typeof items !== 'undefined'){
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var today = new Date();
			today.setHours(0, 0, 0, 0);
			if (new Date(item.date) >= today) {
				filtered.push(item);
			}
		}
	}
	return filtered;
};

function resultsOnly(items) {
	var filtered = [];
	if(typeof items !== 'undefined'){
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var today = new Date();
			today.setHours(0, 0, 0, 0);
			if (new Date(item.date) < today) {
				filtered.push(item);
			}
		}
	}
	return filtered;
};

function getYear(){
	
	var today = new Date();

	if(today.getMonth() === 0 && today.getDate() >= SPRING_START_DAY) {
		return today.getFullYear();
	} else if (today.getMonth() === 0) {
		return today.getFullYear() - 1;
	} else {
		return today.getFullYear();
	}
}

function getSeason(){
	
	var today = new Date();
	var month = today.getMonth();
	var day = today.getDate();

	if ((month < 7 && month >= 1) ||
		(month === 0 && day >= SPRING_START_DAY) ||
		(month === 7 && day < SPRING_END_DAY)) {
		return SEASON_SPRING.capitalize();
	} else{
		return SEASON_WINTER.capitalize();
	}
}

function getSeasonForRankings(){
	
	var today = new Date();
	var month = today.getMonth();
	var day = today.getDate();

	if ((month < 7 && month >= 2) ||
		(month === 1 && day >= SPRING_START_DAY) ||
		(month === 7 && day < SPRING_END_DAY)) {
		return SEASON_SPRING.capitalize();
	} else{
		return SEASON_WINTER.capitalize();
	}
}

function getYearAndSeason(){
	return getYear() + '-' + getSeason();
}

function getYearAndSeasonForProvisionalRankings(){
	var season = getSeasonForProvisionalRanking();
	return new Date().getFullYear() + '-' + season;
}

function getSeasonForProvisionalRanking() {
	var today = new Date();
	var month = today.getMonth();

	if (month === 11 || month === 0) {
		return SEASON_SPRING.capitalize()
	} else {
		return SEASON_WINTER.capitalize()
	}
}

function getSeasonAndYearForRankings(){
	return getSeasonForRankings() + ' ' + getYear();
}

function getSeasonAndYearForProvisionalRankings(){
	var season = getSeasonForProvisionalRanking();
	return season + ' ' + getYear();
}

function showProvisionalRankings() {
	var today = new Date();
	// NOTE: Date on month is 0 based
	var springSeasonEndDate = new Date(2023, 4, 5, 0, 0, 0, 0);
	var winterSeasonEndDate = new Date(2023, 11, 16, 0, 0, 0, 0);
	var finalRankingWinterListInBy = new Date(2023, 8, 1, 0, 0, 0, 0);
	var finalRankingSpringListInBy = new Date(2024, 0, 7, 0, 0, 0, 0);
	return (today <= finalRankingWinterListInBy && today > springSeasonEndDate) ||
	(today >= winterSeasonEndDate && today < finalRankingSpringListInBy); 
}

function getMasterConfiguration(http, xmlToJson, getClubNameOnly){
	
	// Read the master configuration file
	http.get(MASTER_CONFIGURATION_FILE_PATH)
		.success(function(xmlData) {
			
			var configurationData = xmlToJson.convert(xmlData);
			
			if(getClubNameOnly){
				return configurationData.CONSTANTS.CLUB;
			} else {
				return configurationData;
			}
		})
		.error(function(data) {
			console.log('Error reading master configuration file: ' + MASTER_CONFIGURATION_FILE_PATH);
			return '';
		});
}

function getClubConfiguration(http, xmlToJson){
	
	var year = getYear();
	var season = getSeason();
	
	var currentSeasonConfigurationFilename = './configuration/' + year + '-' + season + '.xml';
	
	http.get(currentSeasonConfigurationFilename)
        .success(function(data) {
			return xmlToJson.convert(data);
        })
        .error(function(data) {
            console.log('Error reading current season configuration from: ' + currentSeasonConfigurationFilename);
			return '';
        });	
}

function getClubName(http, xmlToJson){
	
	var hostName = window.location.hostname;

	// Try and determine club from the host name
	if (hostName.indexOf("-") > 0) {
		return hostName.substr(0, hostName.indexOf("-")).capitalize();
	} else{
		return getMasterConfiguration(http, xmlToJson, true);
	}
};

function buildTeamUrl(leagueHomePage, teamUrl, divisionId, teamId, competitionId){
	var teamUrl = leagueHomePage + teamUrl;
	var pattern = /%s/;
	teamUrl = teamUrl.replace(pattern, divisionId);
	teamUrl = teamUrl.replace(pattern, teamId);
	return teamUrl.replace(pattern, competitionId);
}