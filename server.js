/* TODO List */
/*
1. Sync file writing issues for all files
*/

var express = require('express');
var fs = require('fs');
var xml2js = require('xml2js');
var request = require('request');
var syncRequest = require('sync-request');
var cheerio = require('cheerio');

var app = express();
var DOMParser = require('xmldom').DOMParser;
var serializer = new (require('xmldom')).XMLSerializer;

vsprintf = require('sprintf-js').vsprintf;

var ipAddress = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;

var FILE_EXTENSION_FOR_WEB_PAGES = ".html";
var FILE_EXTENSION_FOR_XML = ".xml";
var FILE_EXTENSION_FOR_JSON = ".json";

var OLDEST_YEAR = 2016;
var SPRING_START_DAY = 22;
var SEASON_SPRING = 'spring';
var SEASON_WINTER = 'winter';

/* Directories */
var PUBLIC_PATH = "./public/";

var DIRECTORY_CONFIGURATION = "./configuration/";

/* Directories for Data that gets Generated (JSON) */
var DIRECTORY_DATA_GENERATED = "./data_generated/";
var DIRECTORY_APPEARANCES = DIRECTORY_DATA_GENERATED + "appearances/";
var DIRECTORY_FIXTURES = DIRECTORY_DATA_GENERATED + "fixtures/";
var DIRECTORY_LADDERS = DIRECTORY_DATA_GENERATED + "ladders/";
var DIRECTORY_RANKINGS = DIRECTORY_DATA_GENERATED + "rankings/";
var DIRECTORY_STANDINGS = DIRECTORY_DATA_GENERATED + "team_standings/";
var DIRECTORY_WELSH_RANKINGS_DATA = DIRECTORY_DATA_GENERATED + "welsh_rankings/";

/* Directories for Data that gets scraped (HTML and JSON) */
var DIRECTORY_DATA_SCRAPED = "./data_scraped/";
var DIRECTORY_WELSH_RANKINGS = DIRECTORY_DATA_SCRAPED + "welsh_rankings/";
var DIRECTORY_TEAM_PLAYER_LISTS = DIRECTORY_DATA_SCRAPED + "team_player_lists/";
var DIRECTORY_TEAM_RESULTS = DIRECTORY_DATA_SCRAPED + "team_results/";
var DIRECTORY_TEAM_STANDINGS = DIRECTORY_DATA_SCRAPED + "team_standings/";
var DIRECTORY_PLAYERS = DIRECTORY_DATA_SCRAPED + "players/";
var DIRECTORY_TEAMS = DIRECTORY_DATA_SCRAPED + "teams/";
var DIRECTORY_COMPETITIONS = DIRECTORY_DATA_SCRAPED + "competitions/";

/* Filenames */
var FIXTURES_FILENAME = 'fixtures.json'
var CONFIGURATION_FILENAME_XML = "Configuration.xml";
var LADDERS_FILENAME_XML = "ladders.xml";
var LADDERS_FILENAME_JSON = "ladders.json";
var APPEARANCES_FILENAME = "appearances.json";
var TEAM_STANDINGS_FILENAME = "team_standings.json";
var ALL_WELSH_RANKINGS_FILENAME = "all_welsh_rankings.json";
var WELSH_RANKINGS_FILENAME = "welsh_rankings.json";

/* Scrape Functions */
var SCRAPE_FUNCTION_WELSH_RANKINGS = "Welsh Rankings";
var SCRAPE_FUNCTION_APPEARANCES = "Appearances";
var SCRAPE_FUNCTION_RANKINGS = "Rankings";
var SCRAPE_FUNCTION_FIXTURES_AND_RESULTS = "Fixtures And Results";
var SCRAPE_FUNCTION_APPEARANCE_MATCH_RESULTS = "Appearance Match Results";
var SCRAPE_FUNCTION_TEAM_STANDINGS = "Team Standings";
var SCRAPE_FUNCTION_RANKINGS_TEAMS_LIST = "Rankings Team List";
var SCRAPE_FUNCTION_TEAM_INITIALISATION = "Team Initialisation";

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

app.post('/save_ladder', function(req, res) {

    var body = '';

    req.on('data', function(data) {
        body += data;
    });

	var club = getClubName();
	var laddersDataDirectory = DIRECTORY_LADDERS + club + '/';
	
    req.on('end', function (){
		writeFile(laddersDataDirectory, 'ladders.json', body);
		res.sendStatus(200);
    });
});

app.get('/', function(req, res) {
	res.sendfile('./public/index.html');
})

app.get('/index', function(req, res) {	
	res.sendfile('./public/index.html');
})

app.get('/archived_team_results', function(req, res) {	
	res.redirect('/#/archived_team_results');
})

app.get('/fixtures', function(req, res) {
	processAllFixturesAndResults(req, 'fixtures', res);
	res.redirect('/#/fixtures');
});

app.get('/results', function(req, res) {
	processAllFixturesAndResults(req, 'fixtures', res);
	res.redirect('/#/results');
});

app.get('/ladders', function(req, res) {
	res.redirect('/#/ladders');
});

app.get('/team_standings', function(req, res) {
	processAllFixturesAndResults(req, 'team_standings', res);
	res.redirect('/#/team_standings');
});

app.get('/tournament_details', function(req, res) {
	res.redirect('/#/tournament_details');
});

app.get('/tournament_prize_money', function(req, res) {
	res.redirect('/#/tournament_prize_money');
});

app.get('/tournament_draw', function(req, res) {
	res.redirect('/#/tournament_draw');
});

app.get('/tournament_faqs', function(req, res) {
	res.redirect('/#/tournament_faqs');
});

app.get('/tournament_gallery', function(req, res) {
	CreateImageList();
	res.redirect('/#/tournament_gallery');
});

app.get('/tournament_history', function(req, res) {
	res.redirect('/#/tournament_history');
});

app.get('/club_ranking_list', function(req, res) {
	res.redirect('/#/club_ranking_list');
});

app.get('/club_ranking_list_provisional', function(req, res) {
	res.redirect('/#/club_ranking_list_provisional');
});

app.get('/about_us', function(req, res) {
	res.redirect('/#/about_us');
});

app.get('/appearances', function(req, res) {

	var year, season;
	year = getYear(req.query.year);
	season = getSeason(req.query.season);

	processAllFixturesAndResults(req, 'appearances', res);
	res.redirect('/#/appearances?year=' + year + '&season=' + season);
});

app.get('/rankings', function(req, res) {
	
	var year, season;
	year = getYear(req.query.year);
	season = getSeason(req.query.season);
	
	processAllFixturesAndResults(req, 'rankings', res);
	res.redirect('/#/rankings?year=' + year + '&season=' + season);
	//res.redirect('/#/under_construction');
});

app.get('/reset', function(req, res) {
	
	var sourcePage = req.query.sourcePage;
	var allowReset = true;
	var currentYear, currentSeason;
	currentYear = getYear(req.query.year);
	currentSeason = getSeason(req.query.season);

	if (parseInt(currentYear) !== getYear(undefined) || currentSeason != getSeason(undefined))
	{
		allowReset = false;
	}

	var yearAndSeason = currentYear + '-' + currentSeason;
	var currentSeasonResultsFilename = yearAndSeason + FILE_EXTENSION_FOR_JSON;
	var club = getClubName();
	var currentSeasonResultsFilepath = DIRECTORY_RANKINGS + club + '/' + currentSeasonResultsFilename;
	
	// Used as a reset mechanism for auto generated .json files
	switch(sourcePage)
	{
		case 'rankings':
			if (allowReset){
				unlink(DIRECTORY_APPEARANCES + club + '/' + currentSeasonResultsFilename);
			}
			res.redirect('/rankings?year=' + currentYear + '&season=' + currentSeason);
			break;

		case 'welsh_rankings':
			if (allowReset){
				unlink(DIRECTORY_WELSH_RANKINGS_DATA + club + '/' + WELSH_RANKINGS_FILENAME);
				unlink(DIRECTORY_WELSH_RANKINGS_DATA + club + '/' + ALL_WELSH_RANKINGS_FILENAME);
			}
			res.redirect('/welsh_rankings');
			break;

		case 'appearances':
			if (allowReset){
				unlink(DIRECTORY_APPEARANCES + club + '/' + currentSeasonResultsFilename);
			}
			res.redirect('/appearances?year=' + currentYear + '&season=' + currentSeason);
			break;

		default:
			if (allowReset){
				unlink(DIRECTORY_WELSH_RANKINGS_DATA + club + '/' + WELSH_RANKINGS_FILENAME);
				unlink(DIRECTORY_WELSH_RANKINGS_DATA + club + '/' + ALL_WELSH_RANKINGS_FILENAME);
				unlink(DIRECTORY_APPEARANCES + club + '/' + currentSeasonResultsFilename);
				unlink(DIRECTORY_FIXTURES + club + '/' + FIXTURES_FILENAME);
				unlink(DIRECTORY_STANDINGS + club + '/' + TEAM_STANDINGS_FILENAME);
				unlink(currentSeasonResultsFilepath);
			}
			res.redirect('/#/reset');
			break;
	}
})

app.get('/welsh_rankings', function(req, res) {
	
	var masterConfigurationXML;
	var currentSeasonConfigurationXML;
	var allWelshRankings = [];
	var welshRankings = [];
	
	currentYear = getYear(req.query.year);
	currentSeason = getSeason(req.query.season);
	
	// SEASON CONFIGURATION
	var yearAndSeason = currentYear + '-' + currentSeason;
	var currentSeasonConfigurationFilename = yearAndSeason + FILE_EXTENSION_FOR_XML;
	var club = getClubName();
	var clubDirectoryConfigurationPath = DIRECTORY_CONFIGURATION + club + '/';
	var currentSeasonConfigurationFilepath = clubDirectoryConfigurationPath + yearAndSeason + FILE_EXTENSION_FOR_XML;
	var currentSeasonConfigurationFilenameForJson = yearAndSeason + FILE_EXTENSION_FOR_JSON;
	var currentSeasonConfigurationFilepathForJson = clubDirectoryConfigurationPath + yearAndSeason + FILE_EXTENSION_FOR_JSON;

	var welshRankingsDirectory = DIRECTORY_WELSH_RANKINGS + club + '/';
	var welshRankingsDataDirectory = DIRECTORY_WELSH_RANKINGS_DATA + club + '/';
	// Build the file path for the welsh rankings file
	var welshRankingsFilepath = welshRankingsDataDirectory + WELSH_RANKINGS_FILENAME;

	var masterConfigurationFilepath = getMasterConfigurationFile();
	masterConfigurationXML = getXMLFromFile(masterConfigurationFilepath);
	var welshRankingsURL = readValueFromXMLConfiguration(masterConfigurationXML, 'WelshRankingsURL');
	
	var expiryPeriod = getExpiryPeriod(SCRAPE_FUNCTION_WELSH_RANKINGS);
	
	// Get the Current Season XML
	currentSeasonConfigurationXML = getXMLFromFile(currentSeasonConfigurationFilepath);
		
	if (currentSeasonConfigurationXML == '') {
		console.log("No Configuration file for season: " + currentSeason + ' ' + currentYear);
		res.send("There is no ranking list configured for season: " + currentSeason + ' ' + currentYear);
		return;
	}
	
	// Check the last updated of our welsh rankings file
	// Make sure the file exists on disk, create it if it's doesn't
	if(fileExists(welshRankingsFilepath)) {

		var lastModified = getLastModified(welshRankingsFilepath);
		
		// Only carry on if it has not been updated recently
		if(hasExpired(lastModified, expiryPeriod)) {
			// console.log("File: " + welshRankingsFilepath + " is out of date. Last updated: " + lastModified);
			// Carry on and let the logic update the results file
		} else {
			// console.log("File: " + welshRankingsFilepath + " was recently updated. Last updated: " + lastModified);
			// We have an up to date result file so just display the page
			res.redirect('/#/welsh_rankings');
			return;
		}	
	}
	
	teams = currentSeasonConfigurationXML.getElementsByTagName('Team');
	
	var pageIndex = 0;

	// Download all the welsh rankings 50 at a time	per page as per the non logged in limit
	for (pageOf50 = 0; pageOf50 < 2600; pageOf50 += 50)
	{
		pageIndex++;
		var welshRankingPageOf50URL = vsprintf(welshRankingsURL, pageOf50.toString());
		var filename = pageOf50 + FILE_EXTENSION_FOR_WEB_PAGES;	
		var filepath = welshRankingsDirectory + filename;

		checkExistsAndIsRecentlyModifiedForRankings(filepath, welshRankingPageOf50URL, welshRankingsDirectory, filename, writeFile, expiryPeriod, pageIndex*1000);
	}

	// Loop all 25 or so pages and build full 1300 rankings into JSON
	for (pageOf50 = 0; pageOf50 < 2600; pageOf50 += 50)
	{
		var filename = pageOf50 + FILE_EXTENSION_FOR_WEB_PAGES;	
		var filepath = welshRankingsDirectory + filename;

		if(fileExists(filepath)) {
			var welshRankingPlayerHTML = fs.readFileSync(filepath, 'utf8').toString();		
			var $ = cheerio.load(welshRankingPlayerHTML);
			
			// <table class="ranking">
			var rows = $('table').filter(function() {
				return ($(this).attr('class') === 'ranking');
			}).find($('tr')).filter(function() {
				return isInt($(this).children().eq(7).text().replace("&nbsp;", "").replace(",", "").trim());
			}).each(function(){

				var welshRankingIDMatch = $(this).children().eq(1).children().first().attr('href').trim().match('player=(\\d+)&show');
				var welshRank = {
					position: $(this).children().eq(0).text().replace("&nbsp;", "").trim(),
					playerName: $(this).children().eq(1).text().trim(),
					playerHistoryUrl: 'http://www.wales.squashlevels.com/' + $(this).children().eq(1).children().first().attr('href').trim(),
					county: $(this).children().eq(2).text().trim(),
					lastEvent: $(this).children().eq(4).text().trim(),
					events: $(this).children().eq(5).text().trim(),
					level: $(this).children().eq(7).text().replace("&nbsp;", "").replace(",", "").trim(),
					welshRankingID: parseInt(welshRankingIDMatch[1])
				};

				if (welshRank.position.length == 0)
				{
					welshRank.position = allWelshRankings.length;
				}

				allWelshRankings.push(welshRank);
			});
		}
	}

	// Save all welsh rankings
	if (allWelshRankings.length > 0){
		writeFile(welshRankingsDataDirectory, ALL_WELSH_RANKINGS_FILENAME, JSON.stringify(allWelshRankings, null, 4));
	}
	
	var playersClubRank = 0;

	// Loop teams and get players and lookup players in JSON
	for (teamIndex = 0; teamIndex < teams.length; teamIndex++) {
		
		var teamPlayers = teams[teamIndex].getElementsByTagName('Player');
		var team = teamLetter = teams[teamIndex].getElementsByTagName("Name")[0].textContent;
		
		for (playerIndex = 0; playerIndex < teamPlayers.length; playerIndex++) {
			
			var playerFound = false;
			var playerName = teamPlayers[playerIndex].getAttribute("Name");
			var welshRankingName = teamPlayers[playerIndex].getAttribute("WelshRankingName");

			// Some players have an ID due to indistinguisahble names from other wales clubs
			var welshRankingID = teamPlayers[playerIndex].getAttribute("WelshRankingID");
			var county = teamPlayers[playerIndex].getAttribute("County");
			var lookupName = playerName;
			playersClubRank += 1;
			
			// Some players have an override from their actual name
			if (welshRankingName.length > 0){
				lookupName = welshRankingName
			}
			
			// Loop all welsh rankings file to look for a match
			for (allWelshRankingsIndex = 0; allWelshRankingsIndex < allWelshRankings.length; allWelshRankingsIndex++) {

				var allWelshRankingPlayer = allWelshRankings[allWelshRankingsIndex];

				if ((welshRankingID.length == 0 && lookupName === allWelshRankingPlayer.playerName) || parseInt(welshRankingID) === allWelshRankingPlayer.welshRankingID)
				{
					var welshRanking = {
						playerRank: playersClubRank,
						team: team,
						name: playerName,
						welshRank: parseInt(allWelshRankingPlayer.position),
						playerHistoryUrl: allWelshRankingPlayer.playerHistoryUrl,
						county: allWelshRankingPlayer.county,
						lastEvent: allWelshRankingPlayer.lastEvent,
						events: parseInt(allWelshRankingPlayer.events),
						level: parseInt(allWelshRankingPlayer.level)
					};

					welshRankings.push(welshRanking);
					playerFound = true;
					break;
				}
			}

			/* Player not found but create a record for them */
			if (!playerFound) {

				var welshRanking = {
					playerRank: playersClubRank,
					team: team,
					name: playerName,
					welshRank: NaN,
					playerHistoryUrl: '',
					county:'',
					lastEvent: '',
					events: '',
					level: 'UNKNOWN'
				};

				welshRankings.push(welshRanking);
			}

		}
	}

	// Save the JSON data to file
	if(welshRankings.length > 0){
		writeFile(welshRankingsDataDirectory, WELSH_RANKINGS_FILENAME, JSON.stringify(welshRankings, null, 4));
	}
		
	res.redirect('/#/welsh_rankings');
});

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){ 
	res.sendfile(__dirname + req.params[0]); 
});

app.listen(port, ipAddress);
console.log('Server running on http://%s:%s', ipAddress, port);
module.exports = app;

function processAllFixturesAndResults(req, sourcePage, res){
	
	/* FOR FIXTURES
	Load the current season's team config file
	Check that team data is initialised
	If not then
		Call initialiseTeamData to get the team ID division name and ID, etc
	For each team
		Check if we have recently downloaded fixtures/results HTML
			If not get the latest and save it to disk
		Then read the fixtures from the HTML out into a wider array
		Team / Date / Start Time / HOME or AWAY / Opponent
	Save the fixtures array data as a JSON to file to be read by the Fixtures page
	*/

	/* FOR APPEARANCES AND RESULTS DATA
	Load the current season's team config file
	Check that team data is initialised
	If not then
		Call initialiseTeamData to get the team ID division name and ID, etc
	For each team
		Check if we have recently downloaded fixtures/results HTML
			If not get the latest and save it to disk
		Then read the fixtures from the HTML out into a wider array
			Only add to the array if the result is in
			Array just needs to store the View link details:
			http://walessquash.countyleagues.co.uk/cgi-county/icounty.exe/showmatch?fixtureid=536&divid=1
		Loop each result that's in the array
		Check if file has been downloaded and is up to date
		Download it again if not

		Re-loop each result that's in the array
		Generate the appearances file

	Save the fixtures array data as a JSON to file to be read by the Fixtures page
	*/

	/*
	For TEAM STANDINGS

	Visit each team division's league team standings page
	Save the table

	*/

	var currentYear, currentSeason;
	var teams, club;
	var masterConfigurationXML;
	var masterConfigurationFilepath = getMasterConfigurationFile();
	var teamHTMLs = [];
	var teamFixturesAndResults = [];
	var teamStandings = [];
	var teamMatchResults = [];
	var teamMatchResultHTMLs = [];

	masterConfigurationXML = getXMLFromFile(masterConfigurationFilepath);
	
	currentYear = getYear(req.query.year);
	currentSeason = getSeason(req.query.season);
	
	// console.log("currentYear: " + currentYear + " currentSeason: " + currentSeason);

	var yearAndSeason = currentYear + '-' + currentSeason;
	club = getClubName();

	var currentSeasonConfigurationFilename = yearAndSeason + FILE_EXTENSION_FOR_XML;

	// Build the file path for the appearances file
	var currentSeasonAppearancesFilename = yearAndSeason + FILE_EXTENSION_FOR_JSON;

	var clubDirectoryConfigurationPath = DIRECTORY_CONFIGURATION + club + '/';
	var currentSeasonConfigurationFilepath = clubDirectoryConfigurationPath + yearAndSeason + FILE_EXTENSION_FOR_XML;

	var generatedDataDirectory = '';
	var generatedDataFilePath = '';

	var teamStandingsDirectory = DIRECTORY_TEAM_STANDINGS + club + '/';
	var teamResultsDirectory = DIRECTORY_TEAM_RESULTS + club + '/';
	var teamPlayerListsDirectory = DIRECTORY_TEAM_PLAYER_LISTS + club + '/';
	var teamURL = readValueFromXMLConfiguration(masterConfigurationXML, 'TeamURL');
	var matchDetailsURL = readValueFromXMLConfiguration(masterConfigurationXML, 'MatchDetailsURL');
	var divisionStandingsURL = readValueFromXMLConfiguration(masterConfigurationXML, 'DivisionStandingsURL');
	var leagueHomePage = readValueFromXMLConfiguration(masterConfigurationXML, 'LeagueHomePage');
	var expiryPeriod = getExpiryPeriod(SCRAPE_FUNCTION_FIXTURES_AND_RESULTS);

	switch(sourcePage) {

		case 'fixtures':
			generatedDataDirectory = DIRECTORY_FIXTURES + club + '/';
			generatedDataFilePath = generatedDataDirectory + FIXTURES_FILENAME;
			break;
		case 'appearances':
		case 'rankings':
			generatedDataDirectory = DIRECTORY_APPEARANCES + club + '/';
			generatedDataFilePath = generatedDataDirectory + currentSeasonAppearancesFilename;
			break;
		case 'team_standings':
			generatedDataDirectory = DIRECTORY_STANDINGS + club + '/';
			generatedDataFilePath = generatedDataDirectory + TEAM_STANDINGS_FILENAME;
			break;
		default:

	}

	// Check the last updated of our fixtures file
	// Make sure the file exists on disk, create it if it's doesn't
	if(fileExists(generatedDataFilePath)) {

		var lastModified = getLastModified(generatedDataFilePath);
		
		// Only carry on if it has not been updated recently
		if(hasExpired(lastModified, expiryPeriod)) {
			// console.log("File: " + generatedDataFilePath + " is out of date. Last updated: " + lastModified);
			// Carry on and let the logic update the fixtures file
		} else {
			// console.log("File: " + generatedDataFilePath + " was recently updated. Last updated: " + lastModified);
			// We have an up to date result file so just display the page
			return;
		}	
	}
	
	// Get the Current Season XML
	currentSeasonConfigurationXML = getXMLFromFile(currentSeasonConfigurationFilepath);
	
	if (currentSeasonConfigurationXML == '') {
		console.log("No Configuration file for season: " + currentSeason + ' ' + currentYear);
		res.send("There is no ranking list configured for season: " + currentSeason + ' ' + currentYear);
		return;
	}	
	
	teams = currentSeasonConfigurationXML.getElementsByTagName('Team');

	if (teams.length == 0){
		console.log("No Teams found in the Configuration file for season: " + currentSeason + ' ' + currentYear);
		return;
	}

	// Has the team data been initialised?
	if (teams[0].getElementsByTagName("TeamID")[0].textContent.length == 0){
		if (!initialiseTeamData()) {
			res.send("There was an issue trying to initialise team data.");
			return;
		}
	}

	// Loop teams and create/update their fixture/result HTML if necessary
	for (teamIndex = 0; teamIndex < teams.length; teamIndex++) {
		
		var directory, filename, filepath;
		var teamName = getTeamName(teams[teamIndex].getElementsByTagName("Name")[0].textContent, club);
		var divisionID = teams[teamIndex].getElementsByTagName("DivisionID")[0].textContent;
		var divisionName = teams[teamIndex].getElementsByTagName("DivisionName")[0].textContent;
		var teamID = teams[teamIndex].getElementsByTagName("TeamID")[0].textContent;
		var competitionID = teams[teamIndex].getElementsByTagName("CompetitionID")[0].textContent;
		var teamFixturesURL =  leagueHomePage + vsprintf(teamURL, [divisionID, teamID, competitionID]);
		var teamStandingsURL = leagueHomePage + vsprintf(divisionStandingsURL, [divisionID]);

		filename = currentYear + '-' + currentSeason + '-' + teamName + FILE_EXTENSION_FOR_WEB_PAGES;
		if (sourcePage === 'team_standings') {
			
			filepath = teamStandingsDirectory + filename;
			checkExistsAndIsRecentlyModified(filepath, teamStandingsURL, teamStandingsDirectory, filename, writeFile, expiryPeriod, competitionID, true);

		} else {
			filepath = teamPlayerListsDirectory + filename;
			checkExistsAndIsRecentlyModified(filepath, teamFixturesURL, teamPlayerListsDirectory, filename, writeFile, expiryPeriod, competitionID, true);
		}
		
		if (fileExists(filepath)){
			var filedata = fs.readFileSync(filepath, 'utf8').toString();		
			teamHTMLs.push({
					html: filedata,
					teamName: teamName,
					divisionName: divisionName,
					teamFixturesURL: teamFixturesURL,
					competitionID: competitionID,
					teamStandingsURL: teamStandingsURL
				});
		}
	}
	
	switch(sourcePage) {

		// PROCESS FIXTURES/RESULTS
		case 'fixtures':

			// Loop team fixture HTMLs and build fixture list
			for (teamHTMLIndex = 0; teamHTMLIndex < teamHTMLs.length; teamHTMLIndex++) {
			
				// Get a tr where
				//   td has class hzleague_results_team_selected and value == teamName
				// and also get the previous tr (which contains the date of the fixture)
				var $ = cheerio.load(teamHTMLs[teamHTMLIndex].html);
				var teamName = teamHTMLs[teamHTMLIndex].teamName;
				var teamFixturesURL = teamHTMLs[teamHTMLIndex].teamFixturesURL;

				// Change the below to scrape new site instead...
				var rows = $('table').filter(function() {
					return ($(this).attr('align') === 'center');
				}).find('tr').filter(function() {
					return ($(this).children().length === 8 && $(this).children().eq(1)[0].name === "td");
				}).each(function(){

					// When teams drop out, the fixture is still listed but with no icon
					var matchDateAndTime = $(this).children().eq(1).text().match('(\\d+)\\/(\\d+)\\/(\\d+)\\s(\\d+:\\d+)');
					var matchDate = new Date('20' + matchDateAndTime[3], parseInt(matchDateAndTime[2]) - 1, matchDateAndTime[1]);
					var today = new Date();
					today = new Date(today.getTime() + (today.getTimezoneOffset() * 3600));
					var isNonFixture = ($(this).children().eq(5).children().length === 0) && (matchDate.withoutTime() < today.withoutTime());
						
					if (!isNonFixture)
					{
						var matchDateFormatted = formatDate(matchDate);
						var matchTime = matchDateAndTime[4];
						var opponent = $(this).children().eq(3).text();
						var pointsResult = $(this).children().eq(5).text().replace("Won ", "").replace("Lost ", "").trim();
						var result = $(this).children().eq(6).text().trim();
						var homeTeam, awayTeam;

						if ($(this).children().eq(2).text().toUpperCase() === 'HOME'){
							homeTeam = teamName;
							awayTeam = opponent;
						} else{
							homeTeam = opponent;
							awayTeam = teamName;
						}

						var fixtureOrResult = {
							team: teamName,
							date: matchDateFormatted,
							time: matchTime,
							homeTeam: homeTeam,
							awayTeam: awayTeam,
							result: result,
							pointsResult: pointsResult,
							teamURL: teamFixturesURL,
							isClash: false,
							isWin: false,
							isHome: homeTeam == teamName			
						};

						//Push it onto the master array
						teamFixturesAndResults.push(fixtureOrResult);
					}
				});
			}
			
			// Loop results and fixtures and mark those that clash on the same date as a clash, and also mark results with isWin
			for (fixtureOrResultIndex = 0; fixtureOrResultIndex < teamFixturesAndResults.length; fixtureOrResultIndex++) {
				
				// Determine and set isClash
				var fixturesOnThisDate = teamFixturesAndResults.reduce(function(n, fixture) {
					return n + (fixture.date == teamFixturesAndResults[fixtureOrResultIndex].date);
				}, 0);
				
				if (fixturesOnThisDate > 1) {
					teamFixturesAndResults[fixtureOrResultIndex].isClash = true;
				}
				
				// Determine and set isWin
				if (teamFixturesAndResults[fixtureOrResultIndex].result.length > 0){
					
					var teamRubbers = teamFixturesAndResults[fixtureOrResultIndex].result.substr(0, 1);
					var oppositionTeamRubbers = teamFixturesAndResults[fixtureOrResultIndex].result.substr(2, 1);
					teamFixturesAndResults[fixtureOrResultIndex].isWin = parseInt(teamRubbers) > parseInt(oppositionTeamRubbers);
				}
			}
			
			if (teamFixturesAndResults.length > 0){
				// Save the fixtures to file as JSON
				writeFile(generatedDataDirectory, FIXTURES_FILENAME, JSON.stringify(teamFixturesAndResults, null, 4));
			}

			break;

		// PROCESS APPEARANCES/RANKINGS
		case 'appearances':
		case 'rankings':

			var playerAppearancesData = [];
			var playerResults = [];
			var pointDividerPerRank = readValueFromXMLConfiguration(masterConfigurationXML, 'PointDividerPerRank');
			var pointsForALoss = readValueFromXMLConfiguration(masterConfigurationXML, 'PointsForALoss');
			var pointsForAWin = readValueFromXMLConfiguration(masterConfigurationXML, 'PointsForAWin');
			var pointsForAnAppearance = readValueFromXMLConfiguration(masterConfigurationXML, 'PointsForAnAppearance');
			var pointsForPlayingUp = readValueFromXMLConfiguration(masterConfigurationXML, 'PointsForPlayingUp');

			// Loop team fixture HTMLs and build fixture list
			for (teamHTMLIndex = 0; teamHTMLIndex < teamHTMLs.length; teamHTMLIndex++) {
			
				// Get a tr where
				//   td has class hzleague_results_team_selected and value == teamName
				// and also get the previous tr (which contains the date of the fixture)
				var $ = cheerio.load(teamHTMLs[teamHTMLIndex].html);
				var teamName = teamHTMLs[teamHTMLIndex].teamName;
				var competitionID = teamHTMLs[teamHTMLIndex].competitionID;

				// Change the below to scrape new site instead...
				var rows = $('table').filter(function() {
					return ($(this).attr('align') === 'center');
				}).find($('tr')).filter(function() {
					return $(this).find('td').length === 8;
				}).each(function(){

					if ($(this).children().eq(6).text().trim().length > 0) {

						var resultURL = $(this).children().eq(7).children().first().attr('href');
						var isHome = $(this).children().eq(2).text().toUpperCase() === 'HOME'

						// E.g. http://walessquash.countyleagues.co.uk/cgi-county/icounty.exe/showmatch?fixtureid=536&divid=1
						var fixtureAndDivisionId =  resultURL.match('fixtureid=(\\d+)&divid=(\\d+)');

						// 
						var fixtureId = fixtureAndDivisionId[1];
						var divisionId = fixtureAndDivisionId[2];
						var matchResultDetailsURL = leagueHomePage + vsprintf(matchDetailsURL, [fixtureId, divisionId, competitionID]);

						var teamMatchResult = {
							teamName: teamName,
							fixtureId: fixtureId,
							divisionId: divisionId,
							competitionID: competitionID,
							resultURL: matchResultDetailsURL,
							isHome: isHome
						};

						//Push it onto the master array
						teamMatchResults.push(teamMatchResult);
					}
				});
			}

			// Loop team match results and create/update their fixture/result HTML if necessary
			for (teamMatchIndex = 0; teamMatchIndex < teamMatchResults.length; teamMatchIndex++) {
				
				var teamName = teamMatchResults[teamMatchIndex].teamName;
				var competitionID = teamMatchResults[teamMatchIndex].competitionID;
				var isHome = teamMatchResults[teamMatchIndex].isHome;

				var directory, filename, filepath;
				directory = teamResultsDirectory + currentYear + '/' + currentSeason + '/';
				filename = teamName + '-' + teamMatchResults[teamMatchIndex].divisionId + '-' + teamMatchResults[teamMatchIndex].fixtureId + FILE_EXTENSION_FOR_WEB_PAGES;	
				filepath = directory + filename;

				var teamMatchResultURL =  teamMatchResults[teamMatchIndex].resultURL;

				checkExistsAndIsRecentlyModified(filepath, teamMatchResultURL, directory, filename, writeFile, expiryPeriod, competitionID, false);
				
				if(fileExists(filepath)) {
					var filedata = fs.readFileSync(filepath, 'utf8').toString();		
					teamMatchResultHTMLs.push({
						html: filedata,
						teamName: teamName,
						teamMatchResultURL: teamMatchResultURL,
						isHome: isHome 
					});
				}
			}

			var playerNumber = 0;

			// Loop teams and build initial appearance data for every player
			for (teamIndex = 0; teamIndex < teams.length; teamIndex++) {
				
				var teamPlayers = teams[teamIndex].getElementsByTagName('Player');
				var teamLetter = teams[teamIndex].getElementsByTagName("Name")[0].textContent;	
				var divisionID = teams[teamIndex].getElementsByTagName("DivisionID")[0].textContent;
				var divisionName = teams[teamIndex].getElementsByTagName("DivisionName")[0].textContent;
				var teamID = teams[teamIndex].getElementsByTagName("TeamID")[0].textContent;
				var competitionID = teams[teamIndex].getElementsByTagName("CompetitionID")[0].textContent;
				var teamFixturesURL =  leagueHomePage + vsprintf(teamURL, [divisionID, teamID, competitionID]);

				for (playerIndex = 0; playerIndex < teamPlayers.length; playerIndex++) {
					
					playerNumber += 1;
					var playerName = teamPlayers[playerIndex].getAttribute("Name");

					var playerAppearanceData = {
						name: playerName,
						team: teamLetter,
						playerRank: playerNumber,
						appearances: [],
						totalUpAppearances: 0,
						isEligible: true,
						//code: "UNKNOWN",
						division: divisionName,
						divisionURL: leagueHomePage + vsprintf(divisionStandingsURL, [divisionID]),
						//divisionSecondary: "UNKNOWN",
						//divisionURLSecondary: "UNKNOWN",
						teamURL: teamFixturesURL,
						matchesPlayed: 0,
						matchesWon: 0,
						matchesLost: 0,
						matchesDifference: 0,
						gamesWon: 0,
						gamesLost: 0,
						gamesDifference: 0,
						pointsFor: 0,
						pointsAgainst: 0,
						pointsDifference: 0,
						averagePointsPerGame: 0,
						averagePointsPerMatch: 0,
						startingRankingPoints: 0,
						currentRankingPoints: 0,
						winPercentage: 0,
						startingRankingPosition: 0,
						currentRankingPosition: 0,
						rankingMovement: 0,
						rankingMovementPositions: 0
					};

					playerAppearancesData.push(playerAppearanceData);
				}
			}

			// Loop team match result HTMLs and generate appearance data with results data json
			for (teamMatchResultIndex = 0; teamMatchResultIndex < teamMatchResultHTMLs.length; teamMatchResultIndex++) {
				
				// Create list of team match participants with games and points scored/conceded
				var $ = cheerio.load(teamMatchResultHTMLs[teamMatchResultIndex].html);

				var rows = $('table').eq(11).find($('tr')).each(function(index){
					if(index >= 1 && index <= 5) {

						var playerColumnIndex = 3;

						if(teamMatchResultHTMLs[teamMatchResultIndex].isHome){
							playerColumnIndex = 1;
						}

						var playerResult = {
							playerName: $(this).children().eq(playerColumnIndex).text(),
							homeGames: parseInt($(this).children().eq(4).text()),
							awayGames: parseInt($(this).children().eq(5).text()),
							gameScores: $(this).children().eq(6).text(),
							teamLetter: teamMatchResultHTMLs[teamMatchResultIndex].teamName.slice(-1),
							isHome: teamMatchResultHTMLs[teamMatchResultIndex].isHome
						};

						playerResults.push(playerResult);
					}
				});
			}

			// Loop each playerAppearancesData and playerResults to build the playerAppearancesData
			for (playerResultIndex = 0; playerResultIndex < playerResults.length; playerResultIndex++) {

				var playerResult = playerResults[playerResultIndex];

				for (playerAppearancesIndex = 0; playerAppearancesIndex < playerAppearancesData.length; playerAppearancesIndex++) {

					var playerAppearance = playerAppearancesData[playerAppearancesIndex];				

					if (playerResult.playerName == playerAppearance.name){

						// Reset values to 0 if first match and is "UNKNOWN"
						playerAppearance.matchesPlayed = reset(playerAppearance.matchesPlayed);
						playerAppearance.matchesWon = reset(playerAppearance.matchesWon);
						playerAppearance.matchesLost = reset(playerAppearance.matchesLost);
						playerAppearance.gamesWon = reset(playerAppearance.gamesWon);
						playerAppearance.gamesLost = reset(playerAppearance.gamesLost);
						playerAppearance.pointsFor = reset(playerAppearance.pointsFor);
						playerAppearance.pointsAgainst = reset(playerAppearance.pointsAgainst);
						
						playerAppearance.matchesPlayed += 1;
						
						if (playerResult.teamLetter < playerAppearance.team){
							playerAppearance.totalUpAppearances += 1;
						}

						if (playerAppearance.totalUpAppearances >= 4){
							playerAppearance.isEligible = false;
						}

						var appearance = {
							team: playerResult.teamLetter,
							gamesFor: 0,
							gamesAgainst: 0,
							pointsFor: 0,
							pointsAgainst: 0 
						}

						var gameScores = playerResult.gameScores.split(' ');
						var homePoints = 0;
						var awayPoints = 0;

						for (scoreIndex = 0; scoreIndex < gameScores.length; scoreIndex++){
							if (gameScores[scoreIndex].trim().length > 0)
							{
								homePoints += parseInt(gameScores[scoreIndex].split('/')[0]);
								awayPoints += parseInt(gameScores[scoreIndex].split('/')[1]);
							}
						}

						if (playerResult.isHome){
							appearance.gamesFor = playerResult.homeGames,
							appearance.gamesAgainst = playerResult.awayGames,
							appearance.pointsFor = homePoints,
							appearance.pointsAgainst = awayPoints
						} else{
							appearance.gamesFor = playerResult.awayGames,
							appearance.gamesAgainst = playerResult.homeGames,
							appearance.pointsFor = awayPoints,
							appearance.pointsAgainst = homePoints
						}

						if(appearance.gamesFor > appearance.gamesAgainst) {
							playerAppearance.matchesWon += 1;
						} else {
							playerAppearance.matchesLost += 1;
						}

						playerAppearance.gamesWon += appearance.gamesFor;
						playerAppearance.gamesLost += appearance.gamesAgainst;
						playerAppearance.pointsFor += appearance.pointsFor;
						playerAppearance.pointsAgainst += appearance.pointsAgainst;
						
						playerAppearance.appearances.push(appearance);

						break;
					}
				}
			}
			
			playerAppearancesData = calculatePoints(playerAppearancesData, pointsForAWin, pointsForALoss, pointDividerPerRank, pointsForAnAppearance, pointsForPlayingUp);
	
			// Save the JSON data to file
			writeFile(generatedDataDirectory, currentSeasonAppearancesFilename, JSON.stringify(playerAppearancesData, null, 4));

			break;

		case 'team_standings':

			// Loop team fixture HTMLs and build fixture list
			for (teamHTMLIndex = 0; teamHTMLIndex < teamHTMLs.length; teamHTMLIndex++) {
			
				// Get a table where align is center
				var $ = cheerio.load(teamHTMLs[teamHTMLIndex].html);
				var teamName = teamHTMLs[teamHTMLIndex].teamName;
				var divisionName = teamHTMLs[teamHTMLIndex].divisionName;
				var teamStandingsURL = teamHTMLs[teamHTMLIndex].teamStandingsURL;

				// Change the below to scrape new site instead...
				var rows = $('table').filter(function() {
					return ($(this).attr('align') === 'center');
				}).each(function(){

					var teamStanding = {
						team: teamName,
						divisionName: divisionName,
						teamStandingsURL: teamStandingsURL,
						standings: [],
						position: 0
					};

					var rows = $(this).find($('tr')).each(function(){

						if ($(this).find('td').eq(0).text().length > 0)
						{
							var standing = {
								position: parseInt($(this).find('td').eq(0).text()),
								team: $(this).find('td').eq(1).text(),
								played: parseInt($(this).find('td').eq(3).text()),
								won: parseInt($(this).find('td').eq(4).text()),
								lost: parseInt($(this).find('td').eq(5).text()),
								drawn: parseInt($(this).find('td').eq(6).text()),
								for: parseInt($(this).find('td').eq(7).text()),
								against: parseInt($(this).find('td').eq(8).text()),
								penaltyPoints: parseInt($(this).find('td').eq(9).text()),
								totalPoints: parseInt($(this).find('td').eq(10).text())
							};

							if (standing.team === teamStanding.team)
							{
								teamStanding.position = standing.position;
							}

							teamStanding.standings.push(standing);
						}
					});

					//Push it onto the master array
					teamStandings.push(teamStanding);
				});
			}
						
			// Save the fixtures to file as JSON
			writeFile(generatedDataDirectory, TEAM_STANDINGS_FILENAME, JSON.stringify(teamStandings, null, 4));
			break;

		// DO NOTHING
		default:

	}
}

function getTeamName(teamLetter, club){

	var teamName = club;
	
	// No team letter means it's a one team club
	if(teamLetter.length > 0){
		teamName = club + ' ' + teamLetter;
	}

	return teamName;
}

function getYear(year){
	
	if(!isNaN(year) && year >= OLDEST_YEAR){
		return year;
	} else {
		var today = new Date();

		if(today.getMonth() === 11 && today.getDate() > SPRING_START_DAY) {
			return today.getFullYear() + 1;
		} else{
			return today.getFullYear();
		}
	}
}

function getSeason(season){
	
	if (season === SEASON_SPRING || season === SEASON_WINTER) {
		return season;
	} else {
		var today = new Date();
		var month = today.getMonth();
		var day = today.getDate();

		if (month < 7 ||
			(month === 11 && day > SPRING_START_DAY) ||
			(month === 7 && day < 11)) {
			return SEASON_SPRING;
		} else{
			return SEASON_WINTER;
		}
	}
}

function getDivisionName(anchors, leagueCode){
	
	var divisionName = "UNKNOWN";
	
	// console.log('anchors.length: ' + anchors.length);
	
	for (var anchorIndex = 0; anchorIndex < anchors.length; anchorIndex++) {
		
		var href = anchors[anchorIndex].getAttribute('href');

		//console.log('href: ' + href);
		//console.log('anchors[anchorIndex].textContent: ' + anchors[anchorIndex].textContent);
		
		// Match team code in href
		if (href.indexOf('view=league&league=' + leagueCode) > -1) {
			divisionName = anchors[anchorIndex].textContent.trim();
			break;
		}
	}
	
	return divisionName;
}

function getXMLFromFile(filePath){
	
	var parser = new DOMParser();
	
	if(fileExists(filePath)) {
		var fileData = fs.readFileSync(filePath, 'utf8').toString();
		// console.log("File: " + filePath + " successully read.");
		return parser.parseFromString(fileData, 'application/xml');		
	} else {
		console.log("File: " + filePath + " is missing. Cannot continue.");
		return '';
	}
}

function checkExistsAndIsRecentlyModifiedForRankings(filepath, url, directory, filename, writeFile, expiryInMs, timeout){
	
	// Make sure the file exists on disk, create it if it's doesn't
	if(!fileExists(filepath)) {
		// console.log("File: " + filepath + " does not exist");
		getHTMLForRankings(url, directory, filename, writeFile);
	} else {

		var lastModifiedDate = getLastModified(filepath);
		
		// Only re-retrieve the HTML if it has not been updated recently
		if(hasExpired(lastModifiedDate, expiryInMs)) {
			// console.log("File: " + filepath + " is out of date. Last updated: " + lastModifiedDate);
			setTimeout(function() {
				getHTMLForRankings(url, directory, filename, writeFile);	
			}, timeout);
			// getHTMLForRankings(url, directory, filename, writeFile);
		} else {
			// console.log("File: " + filepath + " was recently updated. Last updated: " + lastModifiedDate);
		}	
	}
}

function getHTMLForRankings(url, directory, filename, callback){
		
	// console.log('Fetching HTML for: ' + url);

	request({
	  uri: url,
	  method: "GET",
	  timeout: 10000,
	  followRedirect: true,
	  maxRedirects: 10,
	  headers: {
			'Cookie': 'BaDSquashInfoType=both; BaDSquashDamping=0; BaDSquashCharts=1; BaDSquashID=bb2ou4umt3uqvlbohq1cdgl5u0; BaDSquashVisitor=1; BaDSquashLeagueType=none; BaDSquashLimitConf=1; BaDSquashDefaultPlayerType=all; BaDSquashDefaultPlayercat=all; BaDSquashDefaultClub=all; BaDSquashDefaultCounty=all;'
		}
	}, function(error, response, html) {
		if (!error && response.statusCode == 200) {
			// console.log('directory: ' + directory);
			// console.log('filename: ' + filename);
			callback(directory, filename, html);
		} else {
			console.log('An error occurred retrieving HTML from: ' + url);
		}
	});
}

function getHTMLForRankingsSync(url, directory, filename, callback){
		
	// console.log('Fetching HTML for: ' + url);

	var html = syncRequest("GET", url, {
	  'timeout': 10000,
	  'followRedirects': true,
	  'maxRedirects': 10,
	  'headers': {
			'Cookie': 'BaDSquashInfoType=both; BaDSquashDamping=0; BaDSquashCharts=1; BaDSquashID=bb2ou4umt3uqvlbohq1cdgl5u0; BaDSquashVisitor=1; BaDSquashLeagueType=none; BaDSquashLimitConf=1; BaDSquashDefaultPlayerType=all; BaDSquashDefaultPlayercat=all; BaDSquashDefaultClub=all; BaDSquashDefaultCounty=all;'
		}
	});

	callback(directory, filename, html.getBody());
	
}

function checkExistsAndIsRecentlyModified(filepath, url, directory, filename, writeFile, expiryInMs, competitionId, useSync){
	
	// Make sure the file exists on disk, create it if it's doesn't
	if(!fileExists(filepath)) {
		// console.log("File: " + filepath + " does not exist");

		if (useSync){
			getHTMLSync(url, directory, filename, writeFile, competitionId);
		} else{
			getHTML(url, directory, filename, writeFile, competitionId);	
		}
	} else {

		var lastModifiedDate = getLastModified(filepath);
		
		// Only re-retrieve the HTML if it has not been updated recently
		if(hasExpired(lastModifiedDate, expiryInMs)) {
			// console.log("File: " + filepath + " is out of date. Last updated: " + lastModifiedDate);

			if (useSync){
				getHTMLSync(url, directory, filename, writeFile, competitionId);
			} else{
				getHTML(url, directory, filename, writeFile, competitionId);	
			}
		} else {
			// console.log("File: " + filepath + " was recently updated. Last updated: " + lastModifiedDate);
		}	
	}
}

function getLastModified(filepath){
	var stats = fs.statSync(filepath);
	var lastModified = stats["mtime"];
	return new Date(lastModified);
}

function hasExpired(lastModifiedDate, expiryInMs){
	return ((new Date) - lastModifiedDate) > expiryInMs;
}

function calculatePoints(playersResultData, pointForAWin, pointForALoss, pointDividerPerRank, pointsForAnAppearance, pointsForPlayingUp){
	
	/* Add the starting points to all players, calculating their points difference, and their updated ranking points */
	for (playerResultIndex = 0; playerResultIndex < playersResultData.length; playerResultIndex++) {
		playersResultData[playerResultIndex].startingRankingPosition = parseFloat(playerResultIndex + 1);
		playersResultData[playerResultIndex].startingRankingPoints = parseFloat(pointDividerPerRank * (playersResultData.length - playerResultIndex));
		playersResultData[playerResultIndex].pointsDifference = parseFloat(playersResultData[playerResultIndex].pointsFor - playersResultData[playerResultIndex].pointsAgainst);
		playersResultData[playerResultIndex].matchesDifference = parseFloat(playersResultData[playerResultIndex].matchesWon - playersResultData[playerResultIndex].matchesLost);
		playersResultData[playerResultIndex].gamesDifference = parseFloat((playersResultData[playerResultIndex].gamesWon - playersResultData[playerResultIndex].gamesLost));
		playersResultData[playerResultIndex].currentRankingPoints = parseFloat((playersResultData[playerResultIndex].startingRankingPoints + ((playersResultData[playerResultIndex].gamesWon + playersResultData[playerResultIndex].gamesLost) * pointsForAnAppearance) + (playersResultData[playerResultIndex].matchesWon * pointForAWin) + (playersResultData[playerResultIndex].matchesLost * pointForALoss) + playersResultData[playerResultIndex].gamesDifference + (playersResultData[playerResultIndex].totalUpAppearances * pointsForPlayingUp)));
		playersResultData[playerResultIndex].winPercentage = parseFloat((playersResultData[playerResultIndex].matchesWon / (playersResultData[playerResultIndex].matchesPlayed) * 100).toFixed(2));		
		playersResultData[playerResultIndex].averagePointsPerGame = parseFloat((playersResultData[playerResultIndex].pointsFor / (playersResultData[playerResultIndex].gamesWon + playersResultData[playerResultIndex].gamesLost)).toFixed(2));
		playersResultData[playerResultIndex].averagePointsPerMatch = parseFloat((playersResultData[playerResultIndex].pointsFor / playersResultData[playerResultIndex].matchesPlayed).toFixed(2));
		
		playersResultData[playerResultIndex].winPercentage = playersResultData[playerResultIndex].winPercentage || 0;
		playersResultData[playerResultIndex].averagePointsPerGame = playersResultData[playerResultIndex].averagePointsPerGame || 0;
		playersResultData[playerResultIndex].averagePointsPerMatch = playersResultData[playerResultIndex].averagePointsPerMatch || 0;
	}
	
	// Sort player by current ranking points
	playersResultData.sort(compareCurrentRankingPoints);
	
	// Set the current ranking position
	for (playerResultIndex = 0; playerResultIndex < playersResultData.length; playerResultIndex++) {
		playersResultData[playerResultIndex].currentRankingPosition = playerResultIndex + 1;

		// Set the ranking movement value
		if (playersResultData[playerResultIndex].currentRankingPosition < playersResultData[playerResultIndex].startingRankingPosition) {
			playersResultData[playerResultIndex].rankingMovement = "up";
		} else if (playersResultData[playerResultIndex].currentRankingPosition > playersResultData[playerResultIndex].startingRankingPosition) {
			playersResultData[playerResultIndex].rankingMovement = "down";
		} else {
			playersResultData[playerResultIndex].rankingMovement = "same";
		}
		
		var movement = Math.abs(playersResultData[playerResultIndex].currentRankingPosition - playersResultData[playerResultIndex].startingRankingPosition);
		
		playersResultData[playerResultIndex].rankingMovementPositions = new Array(movement);
	}
	
	return playersResultData;
}

function compareCurrentRankingPoints(playerA, playerB) {
	if (playerA.currentRankingPoints > playerB.currentRankingPoints) {
		return -1;
	} else if (playerA.currentRankingPoints < playerB.currentRankingPoints) {
		return 1;
	} else {
		return 0;
	}
}

function getHTML(url, directory, filename, callback, competitionId){

	// console.log('Fetching HTML for: ' + url);
	
	request({
	  uri: url,
	  method: "GET",
	  timeout: 10000,
	  followRedirect: true,
	  maxRedirects: 10,
	  headers: {
			'Cookie': 'Owner=LeagueMaster; Competition=' + competitionId
		}
	}, function(error, response, html) {
		if (!error && response.statusCode == 200) {
			// console.log('directory: ' + directory);
			// console.log('filename: ' + filename);
			callback(directory, filename, html);
		} else {
			// console.log('An error occurred retrieving HTML from: ' + url + ' RESPONSE: ' + response.statusCode);
		}
	});
}

function getHTMLSync(url, directory, filename, callback, competitionId){

	// console.log('Fetching HTML for: ' + url);
	
	var html = syncRequest("GET", url, {
	  'timeout': 10000,
	  'followRedirects': true,
	  'maxRedirects': 10,
	  'headers': {
			'Cookie': 'Owner=LeagueMaster; Competition=' + competitionId
		}
	});

	callback(directory, filename, html.getBody());
}

function writeFile(directory, filename, data){

	// console.log('directory: ' + directory);
	// console.log('filename: ' + filename);
	// If the directory doesn't exist, create the directory
	checkDirectory(directory, function(error) {  
	  if(error) {
		console.log("Error creating directory: " + directory, error);
	  }
	});

	// Write the file
	fs.writeFileSync(directory + filename, data);
}

// Function will check if a directory exists, and create it if it doesn't
function checkDirectory(directory, callback) {  

	if(!directoryExists(directory)){
		// console.log('Directory: ' + directory + ' is missing.');
		fs.mkdirSync(directory, function(error) {
			console.log(error);
		});
	}
}

function writeXMLToDiskAsJson(configurationXML, directory, filename){

	// Save the config file as json too - used in the angular app layer
	var parser = new xml2js.Parser();
	parser.parseString(configurationXML, function (err, result) {
		writeFile(directory, filename, JSON.stringify(result, null, 4));
		// console.log('XML Configuration file written to disk as JSON in file: ' + directory + filename);
    });
}

function writeAllResultsToDisk(results, resultsFilepath){
	
	var resultsData = JSON.stringify(results, null, 4);
	
	fs.writeFileSync(resultsFilepath, resultsData);
}

function getLeagueNameForURL(name, currentSeason, currentYear) {
	
	var leagueName = name.getAttribute('Name').toLowerCase();
	
	// console.log('currentYear: ' + currentYear);
	// console.log('leagueName: ' + leagueName);

		// TODO: In future seasons I bet they add the Year for Racketball!
		if (name.toString().indexOf("Racketball") >= 0){
			return leagueName;
		}

    return leagueName + ' ' + currentSeason.toLowerCase() + ' ' + currentYear;
}

function directoryExists(directory)
{
    try {
        return fs.existsSync(directory);
    }
    catch (err) {
        return false;
    }
}

function fileExists(filePath)
{
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (err) {
		console.log('ERROR: File: ' + filePath + ' does not exist.')
        return false;
    }
}

function unlink(filePath)
{
	if(fileExists(filePath)){
		try {
			// console.log('Deleting file: ' + filePath)
			return fs.unlinkSync(filePath);
		}
		catch (err) {
			console.log('ERROR: File: ' + filePath + 'could not be deleted.')
			return false;
		}
	}
}

function readValueFromXMLConfiguration(configurationXML, tagName){
	var value = configurationXML.getElementsByTagName(tagName)[0].textContent;
	// console.log('Configuration key: \t' + tagName + ' \t has value: \t' + value);
	return value;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function getPoints(scores, index){
	
	var points = 0;
	
	for (scoreIndex = 0; scoreIndex < scores.length; scoreIndex++){
		// console.log('scores[scoreIndex] :' + scores[scoreIndex] + ', pts: ' + scores[scoreIndex].split('-')[index]);
		points += parseInt(scores[scoreIndex].split('-')[index]);
	}

	return points;
}

function getClubName(http, xmlToJson) {
	
	// TODO: Need a way to read the Club from the HOSTNAME/DOMAINNAME
	// var hostName = require("os").hostname();
	var hostName = "UNKNOWN";

	// console.log('hostName:' + hostName)
	
	// Try and determine club from the host name
	if (hostName.indexOf("-") > 0) {
		return hostName.substr(0, hostName.indexOf("-")).capitalize();
	} else {
		return getClubFromMasterConfiguration();
	}
};

function getClubFromMasterConfiguration() {
	var masterConfigurationFilepath = getMasterConfigurationFile();
	masterConfigurationXML = getXMLFromFile(masterConfigurationFilepath);
	return readValueFromXMLConfiguration(masterConfigurationXML, 'Club');
}

function getExpiryPeriod(scrapeFunction){

	var ONE_SECOND = 1000; /* 1 second in ms */
	var ONE_HOUR = 60 * 60 * ONE_SECOND; /* 1 hour in ms */
	var TWO_HOURS = 2 * ONE_HOUR; /* 2 hours in ms */
	var TWENTY_FOUR_HOURS = 24 * ONE_HOUR; /* 24 hours in ms */
	var THREE_DAYS = 3 * TWENTY_FOUR_HOURS; /* 3 days in ms */
	var SEVEN_DAYS = 7 * TWENTY_FOUR_HOURS; /* 7 days in ms */
	var TWENTY_EIGHT_DAYS = 4 * SEVEN_DAYS; /* 28 days in ms */
	var TWELVE_WEEKS = 3 * TWENTY_EIGHT_DAYS; /* 78 days in ms */
	
	var expiryPeriod;
	var month = new Date().getMonth();
	
	/* Out of season (4 months May-July), scraping is pointless, so don't do it */
	if(month > 4 && month < 7 && scrapeFunction !== SCRAPE_FUNCTION_WELSH_RANKINGS) {
		expiryPeriod = TWELVE_WEEKS;
	} else {
		/* In season, we need to proactively scrape */
		switch(scrapeFunction){
			case SCRAPE_FUNCTION_WELSH_RANKINGS:
			case SCRAPE_FUNCTION_APPEARANCES:
			case SCRAPE_FUNCTION_RANKINGS:
			case SCRAPE_FUNCTION_FIXTURES_AND_RESULTS:
			case SCRAPE_FUNCTION_TEAM_STANDINGS:
				expiryPeriod = TWO_HOURS;
				break;
			case SCRAPE_FUNCTION_APPEARANCE_MATCH_RESULTS:
			case SCRAPE_FUNCTION_RANKINGS_TEAMS_LIST:
			case SCRAPE_FUNCTION_TEAM_INITIALISATION:
				expiryPeriod = TWENTY_EIGHT_DAYS;
				break;
		}
	}
	
	return expiryPeriod;
}

function getMasterConfigurationFile(){
	return DIRECTORY_CONFIGURATION + CONFIGURATION_FILENAME_XML;
}

// Call this to initialise the team data for a new season (if it's been recognised as missing)
// This basically loops each team and scrapes the: competitionIDs, teamIDs, divisionIDs, divisionNames
// and saves them to the current season team configuration XML file.
function initialiseTeamData() {

	// Visit the homepage and store the HTML (because this contains the drop down list of competition IDs which may differ per team)
	// NOTE: Competition ID is handled as a cookie so can't be passed in query string. Grr!
	var masterConfigurationFilepath = getMasterConfigurationFile();
	var masterConfigurationXML = getXMLFromFile(masterConfigurationFilepath);
	var leagueHomePage = readValueFromXMLConfiguration(masterConfigurationXML, 'LeagueHomePage');
	var teamListForCompetition = readValueFromXMLConfiguration(masterConfigurationXML, 'TeamListForCompetition');
	var club = getClubName();
	var currentYear = getYear(currentYear);
	var currentSeason = getSeason(currentSeason);
	var yearAndSeason = currentYear + '-' + currentSeason;
	var teamPlayerListsDirectory = DIRECTORY_TEAM_PLAYER_LISTS + club + '/';
	var clubDirectoryConfigurationPath = DIRECTORY_CONFIGURATION + club + '/';
	var competitionsDirectory = DIRECTORY_COMPETITIONS + club + '/' + currentYear + '/' + currentSeason + '/';
	var competitionsFilename = "competitions" + FILE_EXTENSION_FOR_WEB_PAGES;
	var competitionsFilepath = competitionsDirectory + competitionsFilename
	var leagueTeamListHTMLs = [];
	var competitions = [];
	var teamsScraped = [];
	var currentSeasonConfigurationFilepath = clubDirectoryConfigurationPath + yearAndSeason + FILE_EXTENSION_FOR_XML;
	var currentSeasonConfigurationFilename = yearAndSeason + FILE_EXTENSION_FOR_XML;

	// Get the Current Season XML
	currentSeasonConfigurationXML = getXMLFromFile(currentSeasonConfigurationFilepath);
	teams = currentSeasonConfigurationXML.getElementsByTagName('Team');

	// Get the HTML for the homepage
	checkExistsAndIsRecentlyModified(competitionsFilepath, leagueHomePage, competitionsDirectory, competitionsFilename, writeFile, getExpiryPeriod(SCRAPE_FUNCTION_TEAM_INITIALISATION), '', true);

	var homepageHtml = fs.readFileSync(competitionsFilepath, 'utf8').toString();
	var $ = cheerio.load(homepageHtml);

	// Validate it has the drop down list
	if(!$('select[name=compselect]').length > 0) {
		console.log("Could not find Competitions drop down list on the hompage: " + leagueHomePage);
		return false;
	}

	// Get a list of leagues and competition IDs from a select list called "compselect"
	$('select[name=compselect]').children().each(function()
	{
		var competition = {
			name: $(this).html().replace(":", ""),
			id: $(this).val()
		};

		// Store them all in an array
		competitions.push(competition);
	});

	// Get leagues from master config
	leagues = masterConfigurationXML.getElementsByTagName('League');

	// For each league, check if we have an updated teams HTML, if not then get the HTML(s) and save them to disk
    for (leagueIndex = 0; leagueIndex < leagues.length; leagueIndex++) {

		var leagueNameForURL = getLeagueNameForURL(leagues[leagueIndex], currentSeason, currentYear);

		for (competitionIndex = 0; competitionIndex < competitions.length; competitionIndex++) {

			//	If you find a match from list of leagues and competitionids
			if (competitions[competitionIndex].name.toUpperCase() === leagueNameForURL.toUpperCase()) {

				// ALL TEAMS LIST FOR COMPETITION
				//	Visit http://walessquash.countyleagues.co.uk/cgi-county/icounty.exe/showteamlist and save the html to disk

				// Build URL
				var leagueTeamsURL = leagueHomePage + teamListForCompetition;
				var teamsDirectory = DIRECTORY_TEAMS + club + '/';

				// console.log("League Teams URL is: " + leagueTeamsURL);
				
				// Create a file name
				var filename = leagueNameForURL + FILE_EXTENSION_FOR_WEB_PAGES;	
				var filepath = teamsDirectory + filename; 
				
				checkExistsAndIsRecentlyModified(filepath, leagueTeamsURL, teamsDirectory, filename, writeFile, getExpiryPeriod(SCRAPE_FUNCTION_TEAM_INITIALISATION), competitions[competitionIndex].id, true);
				
				// Save the league HTMLs in an array
				var fileHtml = fs.readFileSync(filepath, 'utf8').toString();
				leagueTeamListHTMLs.push({
					html: fileHtml,
					competitionId: competitions[competitionIndex].id
				});
			}
		}
	}

	// For each league, find our teams and store some team data
    for (leagueIndex = 0; leagueIndex < leagues.length; leagueIndex++) {
		
		var $ = cheerio.load(leagueTeamListHTMLs[leagueIndex].html);

		// Class for the row (tr) is "firstrow" or "secondrow"
		// Get first rows where the text has the Club name
		$('tr').filter(function() {
			return ($(this).attr('class') === 'firstRow' || $(this).attr('class') === 'secondRow') && $(this).text().indexOf(club) > -1;
		}).each(function()
			{
				// 7 table cells, some of which contain data we need
				var teamName = $(this).children().first().children().first().text();

				// Third cell has an anchor in a paragraph
				var match = $(this).children().eq(2).children().first().attr('href').match('\\?divisionid=(\\d+)&teamid=(\\d+)');
				var divisionName = $(this).children().eq(1).children().text();
				var team = {
					teamName: teamName,
					teamId: match[2],
					divisionId: match[1],
					divisionName: divisionName,
					competitionId: leagueTeamListHTMLs[leagueIndex].competitionId
				};

				teamsScraped.push(team);
			});

		// Loop teams
		for (teamIndex = 0; teamIndex < teams.length; teamIndex++) {
		
			var teamName = getTeamName(teams[teamIndex].getElementsByTagName("Name")[0].textContent, club);

			// Loop page anchors
			for (var scrapedTeamIndex = 0; scrapedTeamIndex < teamsScraped.length; scrapedTeamIndex++) {
								
				// Match team name
				if (teamsScraped[scrapedTeamIndex].teamName === teamName) {

					teams[teamIndex].getElementsByTagName("TeamID")[0].nodeValue = teamsScraped[scrapedTeamIndex].teamId;
					teams[teamIndex].getElementsByTagName("DivisionID")[0].nodeValue = teamsScraped[scrapedTeamIndex].divisionId;
					teams[teamIndex].getElementsByTagName("DivisionName")[0].nodeValue = teamsScraped[scrapedTeamIndex].divisionName;
					teams[teamIndex].getElementsByTagName("CompetitionID")[0].nodeValue = teamsScraped[scrapedTeamIndex].competitionId;

					// UPDATE original configuration file with the newly discovered Team Data
					currentSeasonConfigurationXML.getElementsByTagName('Team')[teamIndex].getElementsByTagName('TeamID')[0].textContent = teamsScraped[scrapedTeamIndex].teamId;
					currentSeasonConfigurationXML.getElementsByTagName('Team')[teamIndex].getElementsByTagName('DivisionID')[0].textContent = teamsScraped[scrapedTeamIndex].divisionId;
					currentSeasonConfigurationXML.getElementsByTagName('Team')[teamIndex].getElementsByTagName('DivisionName')[0].textContent = teamsScraped[scrapedTeamIndex].divisionName;
					currentSeasonConfigurationXML.getElementsByTagName('Team')[teamIndex].getElementsByTagName('CompetitionID')[0].textContent = teamsScraped[scrapedTeamIndex].competitionId;
				}
			}
		}
		
		// SAVE the original configuration file with it's newly discovered Team Data
		writeFile(clubDirectoryConfigurationPath, currentSeasonConfigurationFilename, serializer.serializeToString(currentSeasonConfigurationXML));
	}

	// DID WE FIND ALL CONFIGURED TEAMS?
	if (teams.length !== teamsScraped.length){
		console.log("One or more of the configured teams cannot be initialised for season: " + currentSeason + ' ' + currentYear);
		return false;
	}

	// console.log("Team data has been successfully initialised.");
	return true;
}

function reset(valueToReset) {
	if (valueToReset === 'UNKNOWN') {
		return 0;
	}

	return valueToReset;
}

function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

Date.prototype.withoutTime = function () {
	return this.setHours(0,0,0,0);
};

function createImageList(){
	var club = getClubName();
	// TODO
	fs.readdir(path, function(err, items) {
		console.log(items);
	 
		for (var i=0; i<items.length; i++) {
			console.log(items[i]);
		}
	});
}