//import jquery and bootstrap
import 'jquery';
import 'bootstrap-loader';
// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

var bigInt = require("bignumber.js");

import zkpElectionsArtifact from '../../build/contracts/ZKPElections.json';
var zkpElectionsContract = contract(zkpElectionsArtifact);

import {
    nameStrToHexStr,
    hexStrToNameStr,
    getVoterAccounts,
    getRandomString,
    createVoterListElements,
    getURLParam } from "../javascripts/utils.js";

var zkpElections = null;

var allAccounts;
var userAccount;
var stagedElection = null;

window.App = {
    
    start: async function() {

	try {
	    zkpElectionsContract.setProvider(window.web3.currentProvider);
	    zkpElections = await zkpElectionsContract.deployed();
	    console.log("Election contract at: " + zkpElectionsContract.address);
	    
	} catch (error) {
	    alert("Could not find contract, are you connected to the right network?");
	}
	
	window.web3.eth.getAccounts(async function(error, accounts) {

	    if (error != null || accounts.length == 0) {
		var msg = "There was an error fetching your accounts, please";
		msg += "connect a wallet (MetaMask, Mist, etc)";
		alert(msg);
		return;
	    }

	    allAccounts = accounts;
	    userAccount = accounts[0];

	    console.log("set user account to:");
	    console.log(userAccount);

	    await window.App.route();
	    
	});

    },

    route: async function () {

	console.log("route, pathname=" + window.location.pathname);
	if (window.location.pathname == "/" || window.location.pathname == "/index.html") {
	    window.App.initIndex();
	} else if (window.location.pathname == "/election.html") {
	    window.App.initElection();
	}
	
    },
    
    initIndex: async function () {

	console.log("initIndex");

	if (zkpElections !== null) {
	    let userElectionKeys = await window.App.getUserElectionKeys();
	    await window.App.displayUserElectionCount(userElectionKeys);
	    let userElections = await window.App.getUserElections(userElectionKeys);
	    window.App.displayUserElections(userElections);
	}
	
    },

    getUserElectionKeys: async function () {
	
	let keys = await zkpElections.getElectionKeysForOwner.call({"from": userAccount});
	console.log(keys);
	let userElectionKeys = [];
	for (var i = 0; i < keys.length; i ++) {
	    if (keys[i].toNumber() == 1) {
		userElectionKeys.push(i+1);
	    }
	}
	return userElectionKeys.reverse();
    },

    displayUserElectionCount: async function (userElectionKeys) {

	console.log(userElectionKeys);
	const element = document.getElementById("userElectionCount");
	if (userElectionKeys.length == 0) {
	    element.innerHTML = "<h3>You have no elections</h3>";
	} else {
	    element.innerHTML = "<h3>You have " + userElectionKeys.length + " elections</h3>";
	}
    },

    getUserElections: async function (userElectionKeys) {

	// Keys are reversed already
	var userElections = {};
	for (var i = 0; i < userElectionKeys.length; i ++) {
	    try {
		let election = await zkpElections.getElection(userElectionKeys[i]);
		console.log(election);
		userElections[userElectionKeys[i]] = election;
	    } catch (error) {
		console.error("Unable to get election by key (" + userElectionKeys[i] + ")");
	    }
	}
	console.log(userElections);
	return userElections;
    },

    displayUserElections: async function (userElections) {

	const electionsTable = document.getElementById("electionsTable");
	electionsTable.innerHTML = null;
	
	for (var key in userElections) {

	    const name = userElections[key][0];
	    const candidates = userElections[key][1];
	    const candidateVoteCounts = userElections[key][2];
	    const voterCount = userElections[key][3].toNumber();
	    const electionClosed = userElections[key][4];

	    // Create clickable row
	    var tr = document.createElement("tr");
	    var href = 'window.location.href="/election.html?electionKey=' + key + '"';
	    console.log("href=" + href);
	    tr.setAttribute("onclick", href);

	    // Add name column to this row
	    var tdName = document.createElement("td");
	    tdName.innerHTML = hexStrToNameStr(name.toString(16));
	    tr.appendChild(tdName);

	    // Add candidate count
	    var tdCnt = document.createElement("td");
	    tdCnt.innerHTML = candidates.length;
	    tr.appendChild(tdCnt);

	    // Add votes info
	    let votesCast = 0;
	    for (var i = 0; i < candidateVoteCounts.length; i ++) {
		votesCast += candidateVoteCounts[i].toNumber();
	    }
	    var tdVotes = document.createElement("td");
	    var txt = "" + votesCast + "/" + candidateVoteCounts.length;
	    tdVotes.innerHTML = txt;
	    tr.appendChild(tdVotes);
	    
	    electionsTable.appendChild(tr);
	}
    },
    
    showVoterAccounts: async function () {

	let electionName = document.getElementById("inputElectionName").value;
	let canNames = document.getElementById("inputCandidateNames").value;
	let canNamesLst = canNames.split(",");
	let voterCount = document.getElementById("inputVoterCount").value;

	if (canNamesLst.length == 1 && canNamesLst[0] == "") {

	    alert("Not enough candidates");

	} else if (voterCount == null || voterCount < 2)  {

	    alert("Not enough voters");
	    
	} else {

	    var [voterAddresses, voterPrivateKeys] = getVoterAccounts(voterCount);
	    await window.App.stageElection(
		electionName,
		canNamesLst,
		voterAddresses,
	    );
	    await window.App.createVoterListElements(voterPrivateKeys);
	}
    },


    createVoterListElements: async function (voterKeys) {

	const oldList = document.getElementById("privateKeyListElement");
	if (oldList !== null) {
	    oldList.remove();
	}

	const panelBody = document.getElementById("panelBodyForKeyList");

	const ul = document.createElement("ul");
	ul.setAttribute("class", "list-group");
	ul.setAttribute("id", "privateKeyListElement");
	panelBody.appendChild(ul);

	console.log("voterKeys: " + voterKeys);

	for (var i = 0; i < voterKeys.length; i ++ ){

	    var li = document.createElement("li");
	    li.setAttribute("class", "list-group-item");
	    li.appendChild(document.createTextNode(voterKeys[i]));
	    ul.appendChild(li);
	}

	await window.App.createSubmissionButton();
    },

    
    createSubmissionButton: async function () {
	console.log("createSubmissionButton");

	const oldButton = document.getElementById("submitElection");
	if (oldButton !== null) {
	    oldButton.remove();
	}
	
	const panelBody = document.getElementById("panelBodyForKeyList");
	
	var button = document.createElement("button");
	button.setAttribute("class", "btn btn-default");
	button.setAttribute("id", "submitElection");
	button.setAttribute("onclick", "App.submitStagedElection();return false;");
	button.innerHTML ="Yes, remove the keys and submit election";

	panelBody.appendChild(button);
    },
    
    
    stageElection: async function (electionNameStr, canNamesLst, voterAddresses) {

	console.log("stageElection, canNamesLst:");
	console.log(canNamesLst);
	
	var candidatesHexStrList = [];
	for (var i = 0; i < canNamesLst.length; i ++) {
	    candidatesHexStrList.push(nameStrToHexStr(canNamesLst[i]));
	}

	stagedElection = {};
	stagedElection["nameHexStr"] = nameStrToHexStr(electionNameStr);
	stagedElection["candidateHexStrList"] = candidatesHexStrList;
	stagedElection["voterAddresses"] = voterAddresses;
	stagedElection["kwargs"] = {"from": userAccount};

	console.log("stageElection, election:");
	console.log(stagedElection);
    },
	

    submitStagedElection: async function (electionNameStr, canNamesLst, voterCount) {

	console.log("submitStagedElection");
	console.log(stagedElection);

	document.getElementById("privateKeyListElement").remove();
	
	if (stagedElection == null) {
	    alert("No election staged for submission");
	} else {
	
	    var receipt = await zkpElections.addElection(
		stagedElection["nameHexStr"],
		stagedElection["candidateHexStrList"],
		stagedElection["voterAddresses"],
		stagedElection["kwargs"]);

	    stagedElection = null;
	    
	    console.log(receipt);

	    await window.App.initIndex();
	}
    },
    
    setStatus: async function(statusMsg) {

	const el = document.getElementById("status");
	el.innerHTML = statusMsg;
	
    },
    
    initElection: async function () {
	
	console.log("initElection");

	var electionKey = getURLParam("electionKey", window.location.search);
	console.log(electionKey);

	let election = await zkpElections.getElection(electionKey);
	console.log(election);

	let voterStatus = await window.App.getVoterStatus(electionKey);

	await window.App.displayElectionName(election[0].toString(16));
	await window.App.displayElectionStatus(election[4]);
	await window.App.displayVoteStatus(election);
	await window.App.displayVoterStatus(election[4], voterStatus);
	await window.App.displayCandidates(election, electionKey, voterStatus);
	await window.App.addCloseElectionButton(electionKey);
    },

    getVoterStatus: async function (electionKey) {

	// Voter status: 0: Not voting, 1: awaiting to vote 2: voted
	var voterStatus = 0;
	try {
	    voterStatus = new bigInt(await zkpElections.getVoterStatus.call(
		electionKey,
		{"from": userAccount})).toNumber();

	    console.log("got voter status from block: " + voterStatus);
	    
	} catch(error) {
	    console.error("Error getting voter status");
	}
	return voterStatus;
    },
    
    displayElectionName: async function (electionNameHexStr) {
	var name = hexStrToNameStr(electionNameHexStr);
	const nameNode = document.getElementById("electionName");
	nameNode.innerHTML = name;
    },
    
    displayElectionStatus: async function (isClosed) {
	const statusNode = document.getElementById("electionStatus");

	if (isClosed === null) {
	    statusNode.innerHTML = "Unknown";
	} else if (isClosed === false) {
	    statusNode.innerHTML = "Accepting votes";
	} else if (isClosed === true) {
	    statusNode.innerHTML = "Closed";
	}
    },

    displayVoteStatus: async function (election) {

	var voteCounts = election[2];
	var votesCast = 0;
	for (var i = 0; i < voteCounts.length; i ++) {
	    votesCast += voteCounts[i].toNumber();
	}

	const votesNode = document.getElementById("votesStatus");
	votesNode.innerHTML = "" + votesCast + "/" + election[3].toNumber();
    },

    displayVoterStatus: async function (isClosed, voterStatus) {

	const statusNode = document.getElementById("voterStatus");
	if (isClosed) {
	    statusNode.innerHTML = "Closed";
	} else if (voterStatus == 0) {
	    statusNode.innerHTML = "Not voting";
	} else if (voterStatus == 1) {
	    statusNode.innerHTML = "Voting";
	} else if (voterStatus == 2) {
	    statusNode.innerHTML = "Vote cast";
	};
    },

    displayCandidates: async function (election, electionKey, voterStatus) {

	var candidates = election[1];
	var voteCounts = election[2];
	var isClosed = election[4];

	const canTable = document.getElementById("candidatesTable");
	canTable.innerHTML = "";

	console.log("displayCandidates");
	for (var i = 0; i < candidates.length; i ++) {

	    var candidateKey = i + 1;
	    
	    var tr = document.createElement("tr");

	    // Add candidate name
	    var tdName = document.createElement("td");
	    tdName.innerHTML = hexStrToNameStr(candidates[i].toString(16));
	    tr.appendChild(tdName);

	    // Add their vote count
	    var tdVotes = document.createElement("td");
	    tdVotes.innerHTML = voteCounts[i];
	    tr.appendChild(tdVotes);

	    // Append vote button
	    var tdButton = document.createElement("td");

	    // Voterstatus
	    if (!isClosed && voterStatus == 1) {
		var button  = document.createElement("button");
		button.setAttribute("class", "btn btn-default");
		var clck = "App.castVote(" + electionKey;
		clck += "," + candidateKey + ");return false;";
		button.setAttribute("onclick", clck);
		button.innerHTML = "Vote";
		tdButton.appendChild(button);
	    }
	    tr.appendChild(tdButton);
	    canTable.appendChild(tr);
	}	
	
    },

    addCloseElectionButton: async function (electionKey) {
	// Get user election keys and check if this one is among them.
	// If so, add the button 
    },
    
    castVote: async function (electionKey, candidateKey) {

	console.log("electionKey=" + electionKey + " " + electionKey.toString(16));
	console.log("candidateKey=" + candidateKey + " " + candidateKey.toString(16));
	
	console.log("0x" + electionKey.toString(16));
	console.log("0x" + candidateKey.toString(16));
	
	var receipt = await zkpElections.castVote(
	    electionKey.toString(16),
	    candidateKey.toString(16),
	    {"from": userAccount});
	console.log(receipt);

	window.App.initElection();
    },
    
};

window.addEventListener('load', async function(args) {

    if (typeof window.web3 == 'undefined') {
	console.warn("No web3 provider found (MetaMask, Mist, etc.)");
    } else {
	window.web3 = new Web3(window.web3.currentProvider);
    }
    await window.App.start();
});
