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
    createVoterListElements } from "../javascripts/utils.js";

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
		userElections[i] = election;
	    } catch (error) {
		console.error("Unable to get election by key (" + userElectionKeys[i] + ")");
	    }
	}
	console.log(userElections);
	return userElections;
    },

    displayUserElections: async function (userElections) {

	const electionsList = document.getElementById("electionsList");
	
	for (var key in userElections) {

	    const name = userElections[key][0];
	    const candidates = userElections[key][1];
	    const candidateVoteCounts = userElections[key][2];
	    const voterCount = userElections[key][3].toNumber();
	    const electionClosed = userElections[key][4];
	    
	    var li = document.createElement("li");
	    li.setAttribute("class", "list-group-item");

	    let votesCast = 0;
	    for (var i = 0; i < candidateVoteCounts.length; i ++) {
		votesCast += candidateVoteCounts[i].toNumber();
	    }

	    var tst = "Gold";
	    var tstHexStr = nameStrToHexStr(tst);
	    var bn = new bigInt(tstHexStr);
	    var hexStr = bn.toString(16);
	    var out = hexStrToNameStr(hexStr);
	    console.log("tst");
	    console.log(tst);
	    console.log(tstHexStr);
	    console.log(bn);
	    console.log(hexStr);
	    console.log(out);
	    console.log("---");
	    
	    console.log("displayUserElections, name:");
	    console.log(name);
	    console.log(name.toString(16));
	    console.log(hexStrToNameStr(name.toString(16)));
	    
	    var txt = hexStrToNameStr(name.toString(16)) + " ";
	    txt += candidates.length + " ";
	    txt += votesCast + "/" + voterCount;
	    var txtNode = document.createTextNode(txt);

	    li.appendChild(txtNode);
	    electionsList.appendChild(li);
	}
    },
    
    initElection: async function () {
	
	function getParam(paramName, urlPart) {

	    var items = urlPart.split("&");
	    for (var i = 0; i < items.length; i ++) {
		var tmp = items[i].split("=");
		if (tmp[0] == paramName) {
		    return tmp[1];
		}
	    }

	    return null;

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
		canNames,
		voterAddresses,
	    );
	    await createVoterListElements(voterPrivateKeys);
	    await window.App.createSubmissionButton();
	}
    },


    createSubmissionButton: async function () {
	console.log("createSubmissionButton");

	const panelBody = document.getElementById("panelBodyForKeyList");

	var button = document.createElement("button");
	button.setAttribute("class", "btn btn-default");
	button.setAttribute("onclick", "App.submitStagedElection();return false;");
	button.innerHTML ="Yes, remove the keys and submit election";

	panelBody.appendChild(button);
    },
    
    
    stageElection: async function (electionNameStr, canNamesLst, voterAddresses) {
	
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
	}
    },
    
    setStatus: async function(statusMsg) {

	const el = document.getElementById("status");
	el.innerHTML = statusMsg;
	
    },
    
    initElections: async function() {

	console.log("initElections");
	const electionsList = document.getElementById("electionsList");
	electionsList.innerHTML = "";
	var electionCount = await zkpElections.electionCount.call();

	var cntSpan = document.getElementById("electionCount");
	cntSpan.innerHTML = electionCount;

	if (parseInt(electionCount) > 0) {

	    for (var electionId = 1; electionId <= electionCount; electionId ++ ) {

		var result = await zkpElections.getElection.call(
		    bigInt(electionId).toString());

		var li = document.createElement("li");
		li.setAttribute("class", "list-group-item col-xs-6");
		li.innerHTML = result[0];
		electionsList.appendChild(li);
		
		var challenge = result[0];
		var prizeMoneyETH = parseFloat(result[1] / 1e18);

		var li2 = document.createElement("li");
		li2.setAttribute("class", "list-group-item col-xs-6");
		li2.innerHTML = prizeMoneyETH;
		electionsList.appendChild(li2);
	    }
	    
	}
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
