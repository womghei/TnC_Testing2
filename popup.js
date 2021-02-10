// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
//jshint esversion : 6

//update the manifest when you make a new version
//the tool checks https://tags.tiqcdn.com/utag/services-mreddin/udh-copy-version/prod/utag.2.js to see if there is a more recent version
var versionNumber = chrome.runtime.getManifest().version;
var versionInfo = 'Version ' + versionNumber + ' (deactivate omnichannel or file import in destination) 05Dec2019';

//this is redundant - in a future version, remove this line of code.  The URL is fetched in inline script in popup.html
var versionCheckHTTP = 'https://tags.tiqcdn.com/utag/services-mreddin/udh-copy-version/prod/utag.2.js';

var tlcLinkHref = "https://community.tealiumiq.com/t5/Team-Knowledge-Base/How-to-copy-a-UDH-profile/ta-p/26347";

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "errorFromBackground") alert(request.messageText);
    }
);

chrome.runtime.getBackgroundPage(function(bg){
  if(bg.sessionDataHTML){
    document.body.innerHTML = bg.sessionDataHTML;
  }

	var fromAccountProfile = bg.fromAccountProfile || {}, toAccountProfile = bg.toAccountProfile || {};
  var theFromUDHProfileContent = bg.theFromUDHProfileContent || "", theToUDHProfileContent = bg.theToUDHProfileContent || {};

	function reset (){
		fromAccountProfile = {};
		toAccountProfile = {};
    theFromUDHProfileContent = "";
    theToUDHProfileContent = "";
		startButton.style.display="inline";
		resetButton.style.display="none";
		haveSelectedSourceButton.style.display="none";
		haveSelectedDestinationButton.style.display="none";
		haveConfirmedButton.style.display="none";
		messageToSelectSourceDiv.style.display="none";
		messageToSelectDestinationDiv.style.display="none";
		messageToConfirmDiv.style.display="none";
		messageWhenCompleteDiv.style.display="none";
    helpDiv.style.display="none";
    haveConfirmedButton.disabled = false;
    haveConfirmedButton.innerText = 'Confirmed';
	};

  function sort_unique(arr) {
    if (!arr) return arr;
    if (arr.length === 0) return arr;
    arr = arr.sort(function (a, b) { return a*1 - b*1; });
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { //Start loop at 1: arr[0] can never be a duplicate
      if (arr[i-1] !== arr[i]) {
        ret.push(arr[i]);
      }
    }
    return ret;
  };

  function uuid() {
      var e = (new Date).getTime()
        , t = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t) {
          var n = (e + 16 * Math.random()) % 16 | 0;
          return e = Math.floor(e / 16),
          ("x" === t ? n : 7 & n | 8).toString(16)
      });
      return t;
  };
  function uuidShort() {
      var e = 46656 * Math.random() | 0
        , t = 46656 * Math.random() | 0;
      return (e = ("000" + e.toString(36)).slice(-3)) + (t = ("000" + t.toString(36)).slice(-3));
  };

	let startButton = document.getElementById('start');
	let resetButton = document.getElementById('reset');
	let haveSelectedSourceButton = document.getElementById('haveSelectedSource');
	let haveSelectedDestinationButton = document.getElementById('haveSelectedDestination');
	let haveConfirmedButton = document.getElementById('haveConfirmed');
	let messageToSelectSourceDiv = document.getElementById('messageToSelectSource');
	let messageToSelectDestinationDiv = document.getElementById('messageToSelectDestination');
	let messageToConfirmDiv = document.getElementById('messageToConfirm');
	let messageWhenCompleteDiv = document.getElementById('messageWhenComplete');
  let helpButton = document.getElementById('help');
  let helpDiv = document.getElementById('helpText');
  let versionP = document.getElementById('version');
  versionP.innerText = versionInfo;
  let tlclink = document.getElementById('tlclink');
  tlclink.href= tlcLinkHref;

	if(! bg.sessionDataHTML){
		reset();
	}
  setInterval(function(){
  	bg.fromAccountProfile = fromAccountProfile;
  	bg.toAccountProfile = toAccountProfile;
    bg.sessionDataHTML = document.body.innerHTML;
    bg.theFromUDHProfileContent = theFromUDHProfileContent;
    bg.theToUDHProfileContent = theToUDHProfileContent;
  },500);

	async function getActiveTabUDHProfile(){
    try{
  		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  		const tab = tabs[0];
  		// Execute script in the current tab
  		//would like to use gApp.inMemoryModels, but cannot figure out how to easily run a script that has access to that
  		//so instead just parse the URL
  		const qpArr = await chrome.tabs.executeScript(tab.id, { code: 'document.location.search' });
  		const qp = qpArr[0];
  		const account = /account=[^&]+/.exec(qp)[0].split('=')[1];
  		const profile = /profile=[^&]+/.exec(qp)[0].split('=')[1];
      //12Apr2019 - also need to work out the server address (in case of QA environment)
      const hostArr = await chrome.tabs.executeScript(tab.id, { code: 'document.location.hostname' });
      const host = hostArr[0];
  		const rv = {"host":host,"account":account,"profile":profile};
      return rv;
    }
    catch(e){
      return false;
    }
	};

  async function checkOnlyHasOneUDHProfileOpenAndIsTealiumUser(){
    const tabs = await chrome.tabs.query({ url:'https://*.tealiumiq.com/datacloud/*/?account=*&profile=*' });
    if (tabs.length !== 1) {
      alert("Please only have one UDH Profile open");
      return false;
    }
    const tabsActive = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabsActive[0];
    const emArr = await chrome.tabs.executeScript(tab.id, { code: 'localStorage.getItem("currentUserEmail")' });
    const em = emArr[0];
    if (/@tealium.com$/.test(em) == false) {
      alert("This tool is for Tealium Staff use only");
      return false;
    }
    return true;
  };

  // Execute script in the current tab
  async function getUDHProfileContent(whichAccountProfile){
    if (! await checkOnlyHasOneUDHProfileOpenAndIsTealiumUser()){
      return;
    }
    // Get the current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    var theCode = "var whichAccountProfile = '" + JSON.stringify(whichAccountProfile) + "'";
    await chrome.tabs.executeScript(tab.id, { code: theCode});
    var theUDHProfileContent = await chrome.tabs.executeScript(tab.id, { file: 'getUDHProfileContent.js' });
    return theUDHProfileContent[0];
  };

  //following same process as I wrote up here
  //https://community.tealiumiq.com/t5/Team-Knowledge-Base/How-to-copy-a-UDH-profile-EventStream-only-experimental-Uses/ta-p/26347
  var checkProfile = function(profileString, which, helpContext){
    //parse it to check a couple of things - in time we may move from regex to JSON transformation
    var p;
    try{        p = JSON.parse(profileString);      }
    catch(e){
      alert(which + ' profile is corrupted - did not parse as JSON');
      return false;
    }
    try{
      if(typeof(p.version_info.description) !== 'string'){
        alert(which + ' profile does not have a version description - ' + helpContext);
        return false;
      }
    }
    catch(e){
      alert(which + ' profile does not have a version - ' + helpContext);
      return false;
    }
    try{
      if(typeof(p.previousVersionInfo.description) !== 'string'){
        alert(which + ' profile does not have a previous version description - ' + helpContext);
        return false;
      }
    }
    catch(e){
      alert(which + ' profile does not have a previous version - ' + helpContext);
      return false;
    }
    return true;
  };

	startButton.addEventListener('click', async () => {
    if (await checkOnlyHasOneUDHProfileOpenAndIsTealiumUser()){
      //check if we are on the latest version
      try{
        //udhCopyVersion is set by the script that is called at the top of popup.html
        if ( versionNumber != udhCopyVersion ){
          alert("The latest version of this tool is " + udhCopyVersion + " and you are on " + versionNumber + ".  Please visit this article to check and update if needed " + tlcLinkHref);
        }
      }
      catch(e){
        alert("Not able to get latest version of tool.  You are on " + versionNumber + ".  Please visit this article to check and update if needed " + tlcLinkHref);
      }

  		startButton.style.display="none";
  		resetButton.style.display="inline";
  		messageToSelectSourceDiv.style.display="inline";
  		haveSelectedSourceButton.style.display="inline";
    }
	});

	haveSelectedSourceButton.addEventListener('click', async () => {
    if (await checkOnlyHasOneUDHProfileOpenAndIsTealiumUser()){
  		fromAccountProfile = await getActiveTabUDHProfile();
      if (!fromAccountProfile) {
        alert('Error getting source account and profile');
        return;
      }

      // Step 1 - Capture the UDH profile for the source profile.
  		theFromUDHProfileContent = await getUDHProfileContent(fromAccountProfile);
      if (!checkProfile(theFromUDHProfileContent, 'source', 'read the instructions under help')){
        return;
      }

  		messageToSelectSourceDiv.style.display="none";
  		haveSelectedSourceButton.style.display="none";
  		messageToSelectDestinationDiv.style.display="inline";
  		haveSelectedDestinationButton.style.display="inline";
    }
	});

	haveSelectedDestinationButton.addEventListener('click', async () => {
    if (await checkOnlyHasOneUDHProfileOpenAndIsTealiumUser()){
  		toAccountProfile = await getActiveTabUDHProfile();
      if (!toAccountProfile) {
        alert('Error getting destination account and profile');
        return;
      }
      if (JSON.stringify(fromAccountProfile) == JSON.stringify(toAccountProfile)){
        alert("Please make sure the source and desintation profile are different");
        return;
      }

      theToUDHProfileContent = await getUDHProfileContent(toAccountProfile);
      if (!checkProfile(theToUDHProfileContent, 'destination', 'read the instructions under help')){
        return;
      }

  		messageToSelectDestinationDiv.style.display="none";
  		haveSelectedDestinationButton.style.display="none";
  		messageToConfirmDiv.innerHTML = "Please confirm that you wish to copy<br><br>from: " + fromAccountProfile.account + "/" + fromAccountProfile.profile + "<br><br>to: " +
  			toAccountProfile.account + "/" + toAccountProfile.profile;
  		messageToConfirmDiv.style.display="inline";
  		haveConfirmedButton.style.display="inline";
    }
	});

	haveConfirmedButton.addEventListener('click', async () => {
    try{
  		//Step 2 - Grep out all the distinct uuids from the source profile.
      //Also since same loop
      //Step 3 - generate a list of new uuids and short uuids for each distinct one found above
      //I'd kinda prefer to run the gApp.utils.uuid() but
      //(a) it's more complex to do that and (b) I cannot get it to work - content scripts do not have access to the same variables as the actual content page
      //Step 4 - replace each uuid in the destination_profile.json file with its corresponding new uuid

      var replaceAllIDs = function(theProfileContent,regexForFinder,shortOrLong){
        var fromIDs = theProfileContent.match(regexForFinder);
        if (!fromIDs) return theProfileContent;
        fromIDs = sort_unique(fromIDs);
        for (var i = 0; i < fromIDs.length; i++){
          var newID = "";
          if (shortOrLong == "long"){
            newID = uuid();
          }
          else{
            newID = uuidShort();
          }
          var finderString = fromIDs[i].split(':')[1];
          if (shortOrLong == 'long'){
            finderString = finderString.replace(/^"/,'(["\.])');
            finderString = finderString.replace(/"$/,'(["\.])');
            newID = '$1' + newID + '$2';
          }
          else{
            newID = '"' + newID + '"';
          }
          var finder = new RegExp(finderString,'g');
          theProfileContent = theProfileContent.replace(finder,newID);
        };
        return theProfileContent;
      }
      //TODO - this does not get seen.  I think I need to wrap the blocking (other code below) code in the setTimeout instead
      setTimeout(function(){
        haveConfirmedButton.disabled = true;
        haveConfirmedButton.innerText = 'Working...';
      },0);

      //grep -iEo "\"id\": \"([a-z0-9]+-)+[a-z0-9]+\"" source_profile.json | sort | uniq | sed s/\"id\":\ //g > source_uuids.txt
      //Long IDs each like this ""id":"2ad2e3df-3628-4f4f-9706-780b339014f0""
      //Note if you are diffing that the JSON that comes back from UDH is not canonicalised, and comes back with different ordering each time you request it
      //so best to diff the initial theFromUDHProfileContent vs the final one, rather than trying to compare it to JSON you get from the UDH UI network tab
      //I have done this on services-mreddin/main and it looks good
      theFromUDHProfileContent = replaceAllIDs(theFromUDHProfileContent,/"id":"([a-z0-9]+-)+[a-z0-9]+"/igm,'long');
      //also (although this step was not on the TLC write up) get the shorter UUIDs and do the same
      //these are used for data source keys //short IDs are like this ""id":"4red4ty""
      theFromUDHProfileContent = replaceAllIDs(theFromUDHProfileContent,/"id":"[a-z0-9]{6}"/igm,'short');

      //Step 6 - Manual replacements
      //here the guide was replacing the source account name and profile with the destination_profile
      //we need to automate this
      //acount name appears in these formats
      //"account":"services-mreddin"
      var fromAccountRegexAccount = new RegExp('"account":"'+ fromAccountProfile.account +'"','g');
      var replaceAccount = '"account":"'+ toAccountProfile.account +'"';
      theFromUDHProfileContent = theFromUDHProfileContent.replace(fromAccountRegexAccount,replaceAccount);

      //profile appears like
      //"profile":"main",
      var fromAccountRegexProfile = new RegExp('"profile":"'+ fromAccountProfile.profile +'"','g');
      var replaceProfile = '"profile":"'+ toAccountProfile.profile +'"';
      theFromUDHProfileContent = theFromUDHProfileContent.replace(fromAccountRegexProfile,replaceProfile);

      //16Sep2019 - altered this section to be able to cope with accounts and profiles with dots in the name
      //fix 16Sep2019 - Audience IDs if the account or profile has a dot in it will have the dots replaced by "__"
      //this seems only to happen to audience IDs //"services__mark__reddin_test__dot_101"

      //audience IDs contain both the account and profile
      //"services-mreddin_main_101" OR "services__mark__reddin_test__dot_101"
      var fromAccountRegexAudienceNames = new RegExp('"'+ fromAccountProfile.account.replace(/\./g,'__') + '_' + fromAccountProfile.profile.replace(/\./g,'__') + '(_\\d+)"','g');
      var replaceAudience = '"'+ toAccountProfile.account.replace(/\./g,'__') + '_' + toAccountProfile.profile.replace(/\./g,'__') + '$1"';
      theFromUDHProfileContent = theFromUDHProfileContent.replace(fromAccountRegexAudienceNames,replaceAudience);

      //as do tags
      //"logic":"{\"properties.account\":\"services-mreddin\",\"properties.profile\":\"main\"
      var fromAccountRegexTags = new RegExp('"logic":"{\\\\"properties\\.account\\\\":\\\\"'+ fromAccountProfile.account + '\\\\",\\\\"properties\\.profile\\\\":\\\\"' + fromAccountProfile.profile + '\\\\"','g');
      var replaceTags = '"logic":"{\\"properties.account\\":\\"'+ toAccountProfile.account + '\\",\\"properties.profile\\":\\"' + toAccountProfile.profile + '\\"';
      theFromUDHProfileContent = theFromUDHProfileContent.replace(fromAccountRegexTags,replaceTags);

      //now replace the latest version history by splicing in the version history of the DESTINATION Profile - we are looking for the following two sections
      //"previousVersionInfo": {
      //"description": "test",
      //"hasBeenPublished": true,
      //"lastModifiedBy": "mark.reddin@tealium.com",
      //"published": true,
      //"revision": "2018-09-03T15:52:55.654Z",
      //"version": "event54 rework"
      //},

      //and

      //"version_info": {
      //"description": "test",
      //"hasBeenPublished": true,
      //"lastModifiedBy": "mark.reddin@tealium.com",
      //"published": true,
      //"revision": "2018-09-03T16:14:11.302Z",
      //"version": "event54 rework"
      //}
      var rePreviousVersionInfo = /"previousVersionInfo":{[^}]+?}/m;
      var destPreviousVersionInfo = theToUDHProfileContent.match(rePreviousVersionInfo)[0];
      theFromUDHProfileContent = theFromUDHProfileContent.replace(rePreviousVersionInfo,destPreviousVersionInfo);

      var reVersionInfo = /"version_info":{[^}]+?}/m;
      var destVersionInfo = theToUDHProfileContent.match(reVersionInfo)[0];
      theFromUDHProfileContent = theFromUDHProfileContent.replace(reVersionInfo,destVersionInfo);

      //05Dec2019 - for any omnichannel defintions and file import data sources in the destination that were switched on in the source
      //disable them now, and mark them as such.  This is because otherwise the destination system could accidentally
      //start processing the files as well as the source system (this happened and caused a production issue)

      //need JS for this, not regex
      var p = JSON.parse(theFromUDHProfileContent);

      var turnedOffOmniOrFileImport = false;

      //Omnichannel
      //Loop over bulk_augmentation_definitions
      if (p.bulk_augmentation_definitions.constructor === Array){
        for (var i = 0; i < p.bulk_augmentation_definitions.length; i++){
          if (p.bulk_augmentation_definitions[i].enabled == true){
            p.bulk_augmentation_definitions[i].enabled = false;
            p.bulk_augmentation_definitions[i].title += ' (Was active.  Deactivated for UDH profile copy)';
            turnedOffOmniOrFileImport = true;
          }
        }
      }

      //File import
      //Loop over fileDefinitions
      if (p.fileDefinitions.constructor === Array){
        for (var f = 0; f < p.fileDefinitions.length; f++){
          if (p.fileDefinitions[f].enabled == true){
            var id = p.fileDefinitions[f].id;
            //Loop over dataSources and find object in array where platformConfigId == id
            var foundMatch = false;
            for (var u = 0; u < p.dataSources.length; u++){
              if (p.dataSources[u].platformConfigId == id){
                p.dataSources[u].name += ' (Was active.  Deactivated for UDH profile copy)';
                foundMatch = true;
                break;
              }
            }
            if (!foundMatch){
              alert('Error.  Was not able to match up id ' + id + ' between UDH Profile fileDefinitions and dataSources');
              return;
            }
            p.fileDefinitions[f].enabled = false;
            turnedOffOmniOrFileImport = true;
          }
        }
      }

    theFromUDHProfileContent = JSON.stringify(p);

      if (!checkProfile(theFromUDHProfileContent, 'Copied', 'something has gone wrong, but nothing has been saved yet, so just refresh the UDH window')){
        return;
      }

      chrome.extension.sendMessage({ msg: "replaceProfile", toAccountProfile:toAccountProfile, content:theFromUDHProfileContent });

      var omnichannelOrFileImportDeactivatedMessage = "";
      if (turnedOffOmniOrFileImport){
        omnichannelOrFileImportDeactivatedMessage = "<br><br>Note that I have deactivated File Import and/or Omnichannel data sources " +
        "in the destination that were live in the source profile.<br><br>" +
          "They are marked as such.  Please review them and reactivate them if you are happy for the destination profile to process " +
          "files from those data sources.<br><br>" +
          "Note that for any Tealium S3 data sources, you will need to click on the edit button for each of these before the correct new credentials will be generated."
      }

      messageToConfirmDiv.style.display="none";
      haveConfirmedButton.style.display="none";
      messageWhenComplete.innerHTML = "I have copied<br><br>from: " + fromAccountProfile.account + "/" + fromAccountProfile.profile + "<br><br>to: " +
        toAccountProfile.account + "/" + toAccountProfile.profile +
        "<br><br>However, I have not saved or published anything.  Please review the destination profile, " +
        "including the staff settings, for region etc, and if you are happy, you can now publish the destination profile. " + omnichannelOrFileImportDeactivatedMessage;
      messageWhenComplete.style.display="inline";
    }
    catch(e){
      alert('Something went wrong during the copy process, but nothing has been saved yet, so just refresh the UDH window');
      throw(e);
    }
	});

	resetButton.addEventListener('click', function () {
		reset();
	});

  helpButton.addEventListener('click', function () {
    if (helpDiv.style.display == "none"){
      helpButton.innerHTML = 'Hide Help';
      helpDiv.style.display = "inline";
    }
    else {
      helpButton.innerHTML = 'Show Help';
      helpDiv.style.display = "none";
    }
  });

})
