//import jquery and bootstrap
import 'jquery';
import 'bootstrap-loader';
// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import { default as Web3} from 'web3';

import { default as contract } from 'truffle-contract';

import { default as bigInt } from "bignumber.js";

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

    // This toggles whether to show all elections or only those 
    // created by the current user account
    showAllElections: true,
    
    start: async function() {

	try {
	    zkpElectionsContract.setProvider(window.web3.currentProvider);
	    zkpElections = await zkpElectionsContract.deployed();
	    console.log("Election contract at " + zkpElectionsContract.address);

	} catch (error) {
	    alert("Could not find contract, are you connected to the right network?");
	}

	try {
	    var accounts = await window.web3.eth.getAccounts();
	} catch (error) {
	    console.error(error);
	    var msg = "There was an error fetching your accounts, please ";
	    msg += "connect a wallet (MetaMask, Mist, etc). ";
	    msg += "Also make sure to add this domain: \"" + window.location.hostname;
	    msg += "\" to your wallet's allowed connections.";
	    alert(msg);
	    return;
	}

	allAccounts = accounts;
	userAccount = accounts[0];
	console.log("Using account " + userAccount);

	await window.App.subscribeToEvents();
	await window.App.route();
    },

    route: async function () {

	var pathName = window.location.pathname;
	var slug = pathName.substr(pathName.lastIndexOf("/"));

	if (slug == "/" || slug == "/index.html") {
	    await window.App.initIndex();
	} else {
	    await window.App.initElection();
	}
	
    },
    
    initIndex: async function () {

	await window.App.mentionOtherNetAvailability();
	
	if (zkpElections !== null) {

	    let userElectionKeys = await window.App.getUserElectionKeys();
	    await window.App.displayUserElectionCount(userElectionKeys);
	    let userElections = await window.App.getUserElections(userElectionKeys);
	    window.App.displayUserElections(userElections);
	    window.App.displayTotalDonated();
	}
    },

    mentionOtherNetAvailability: async function () {

	var netId = await window.web3.eth.net.getId();

	var mentionStr = "";
	if (netId != 1 && netId != 4) {
	    mentionStr += "Available on the main net and Rinkeby test net";
	} else {
	    if (netId == 1) {
		mentionStr += "Also available on the Rinkeby testnet";
	    } else if (netId == 4) {
		mentionStr += "Also available on the main net";
	    }
	}
    
	var node = document.getElementById("otherNetMention");
	node.innerHTML = mentionStr;
    },
    
    toggleUserAll: function () {

	var curVal = window.App.showAllElections;
	window.App.showAllElections = ! curVal;

	var newButtonTxt;
	if (curVal) {
	    newButtonTxt = "Show all elections";
	} else {
	    newButtonTxt = "Show only your elections";
	}
	document.getElementById("buttonToggleUserAll").innerHTML = newButtonTxt;

	window.App.initIndex();
    },
    
    getUserElectionKeys: async function () {

	// The contract returns an array of length equal to
	// the number of elections. When a value is 1, it means
	// that election is owned by this user. Starts counting at 1!
	
	let keys = await zkpElections.getElectionKeysForOwner.call({"from": userAccount});
	let userElectionKeys = [];
	for (var i = 0; i < keys.length; i ++) {
	    if (keys[i].toNumber() == 1 || window.App.showAllElections) {
		userElectionKeys.push(i+1);
	    }
	}

	return userElectionKeys;
    },

    displayUserElectionCount: async function (userElectionKeys) {

	const element = document.getElementById("userElectionCount");

	var electionCountTxt;
	if (userElectionKeys.length == 0) {

	    if (window.App.showAllElections) {
		electionCountTxt = "There are no elections yet";
	    } else {
		electionCountTxt = "You have no elections yet";
	    }
	    
	} else {
	    if (window.App.showAllElections) {
		electionCountTxt = "There are " + userElectionKeys.length;
		electionCountTxt += " elections";
	    } else {
		electionCountTxt = "You have " + userElectionKeys.length;
		electionCountTxt += " elections";
	    }
	}
	element.innerHTML = electionCountTxt;
    },

    getUserElections: async function (userElectionKeys) {

	// Keys are reversed already
	var userElections = {};
	for (var i = 0; i < userElectionKeys.length; i ++) {
	    try {
		let election = await zkpElections.getElection(userElectionKeys[i]);
		userElections[userElectionKeys[i]] = election;
	    } catch (error) {
		console.error("Unable to get election by key (" + userElectionKeys[i] + ")");
	    }
	}

	return userElections;
    },

    getHrefFor: function (pageName) {

	// Fetch href without any GET parameters
	var pathName = window.location.origin + window.location.pathname;
	
	// Strip off last file name (which is index.html or election.html)
	var base = pathName.substr(0, pathName.lastIndexOf("/"));
	
	// Construct new href without any GET parameters
	var href = base + "/" + pageName;
	
	return href;
    },
    
    
    displayUserElections: async function (userElections) {

	const electionsTable = document.getElementById("electionsTable");
	electionsTable.innerHTML = null;
	
	for (var key in userElections) {

	    const name = userElections[key][0];
	    const candidates = userElections[key][1];
	    const candidateVoteCounts = userElections[key][2];
	    const voterCount = userElections[key][3].toNumber();
	    const isClosed = userElections[key][4];

	    // Create clickable row
	    var tr = document.createElement("tr");

	    var newHref = window.App.getHrefFor("election.html") + "?electionKey=" + key;
	    var clck = "window.location.href='" + newHref + "'";
	    tr.setAttribute("onclick", clck);

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

	    var tdStatus = document.createElement("td");
	    if (isClosed) {
		tdStatus.innerHTML = "Closed";
	    } else {
		tdStatus.innerHTML = "Accepting votes";
	    }
	    tr.appendChild(tdStatus);

	    electionsTable.appendChild(tr);
	}
    },

    displayTotalDonated: async function () {

	var donatedWei = new bigInt(await window.web3.eth.getBalance(zkpElectionsContract.address));
	const el = document.getElementById("totalEtherDonated");
	el.innerHTML = parseFloat(donatedWei.dividedBy(1e18).toNumber().toFixed(8));
	await window.App.displayWithdrawButton();
    },

    displayWithdrawButton: async function () {

	// Check if current userAccount owns contract
	let contractOwner = await zkpElections.getContractOwner.call(
	    {"from": userAccount});

	console.log("Contract owned by " + contractOwner);
	
	if (userAccount.toLowerCase() == contractOwner.toLowerCase()) {

	    var oldBtn = document.getElementById("withdrawButton");
	    if (oldBtn) {
		oldBtn.remove();
	    }

	    let btn = document.createElement("button");
	    btn.setAttribute("class", "btn btn-default");
	    btn.setAttribute("id", "withdrawButton");
	    btn.setAttribute("onclick", "App.withdrawFunds();return false;");
	    btn.innerHTML = "Withdraw";
	    document.getElementById("panelWithdrawButton").appendChild(btn);
	}
    },

    withdrawFunds: async function () {
	try {
	    await zkpElections.withdrawAllFunds({"from": userAccount});
	} catch (error) {
	    console.error(error);
	    alert("Error withdrawing funds");
	}
    },
    
    showVoterAccounts: async function () {

	let electionName = document.getElementById("inputElectionName").value;
	let canNames = document.getElementById("inputCandidateNames").value;
	let canNamesLst = canNames.split(",");
	let voterCount = document.getElementById("inputVoterCount").value;

	let donationEther = document.getElementById("inputDonationEther").value;
	if (donationEther == "") {
	    donationEther = 0;
	}
	
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
		donationEther
	    );
	    await window.App.createVoterListElements(voterAddresses, voterPrivateKeys);
	}
    },


    createVoterListElements: async function (addrs, keys) {

	const oldList = document.getElementById("privateKeyListElement");
	if (oldList !== null) {
	    oldList.remove();
	}

	const panelBody = document.getElementById("panelBodyForKeyList");

	const ul = document.createElement("ul");
	ul.setAttribute("class", "list-group");
	ul.setAttribute("id", "privateKeyListElement");
	panelBody.appendChild(ul);

	let voterUrl = await window.App.getVoterURL();
	for (var i = 0; i < keys.length; i ++ ){

	    var li = document.createElement("li");
	    li.setAttribute("class", "list-group-item");
	    li.appendChild(window.App.createVoterInstructionNode(
		voterUrl,
		i,
		keys.length,
		addrs[i], keys[i]));
	    ul.appendChild(li);
	}

	await window.App.createSubmissionButton();
    },


    getVoterURL: async function () {
	let electionKey = await zkpElections.getNextElectionKey.call({"from": userAccount});
	var url = "http://" + window.location.host + "/election.html?electionKey=" + electionKey;
	return url;
    },
    

    createVoterInstructionNode: function (voterURL, voterId, voterCnt, addr, key) {

	var cardDiv = document.createElement("div");
	cardDiv.setAttribute("class", "card mx-auto");
	cardDiv.setAttribute("style", "background-color: GhostWhite;");


	var hdrDiv = document.createElement("div");
	hdrDiv.setAttribute("class", "card-header");
	var hdrTxt = "Instruction card (" +  parseInt(voterId+1) + "/" + voterCnt + ")";
	hdrDiv.innerHTML = "<h3>" + hdrTxt + "</h3>";
	cardDiv.appendChild(hdrDiv);	

	var ol = document.createElement("ol");
	// ol.setAttribute("class", "list-group");

	var liMM = document.createElement("li");
	// liMM.setAttribute("class", "list-group-item");
	liMM.innerHTML = "Install and/or open MetaMask, Mist, etc. in your browser";
	ol.appendChild(liMM);
	
	var liPK = document.createElement("li");
	// liPK.setAttribute("class", "list-group-item");
	liPK.innerHTML = "<p>Add your voting account using this private key:</p><p>" + key + "</p>";
	liPK.innerHTML += "<p>Tip: Scan it with your phone</p>";
	ol.appendChild(liPK);

	var liDep = document.createElement("li");
	// liDep.setAttribute("class", "list-group-item");
	liDep.innerHTML = "Deposit at least 0.005 ETH on it";
	ol.appendChild(liDep);
	
	var liNav = document.createElement("li");
	// liNav.setAttribute("class", "list-group-item");
	liNav.innerHTML = "Navigate to: " + voterURL;
	ol.appendChild(liNav);
	
	var liCast = document.createElement("li");
	// liCast.setAttribute("class", "list-group-item");
	liCast.innerHTML = "Cast your vote";
	ol.appendChild(liCast);

	cardDiv.appendChild(ol);

	var ftrDiv = document.createElement("div");
	ftrDiv.setAttribute("class", "card-footer");
	ftrDiv.innerHTML = "<h3>Thank you and good luck!</h4>";
	cardDiv.appendChild(ftrDiv);

	return cardDiv;
    },
    
    
    createSubmissionButton: async function () {

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
    
    
    stageElection: async function (electionNameStr, canNamesLst, voterAddresses, donationEther) {
	
	var candidatesHexStrList = [];
	for (var i = 0; i < canNamesLst.length; i ++) {
	    candidatesHexStrList.push(nameStrToHexStr(canNamesLst[i]));
	}

	let donationWei = new bigInt(donationEther * 1e18).toString(10);

	stagedElection = {};
	stagedElection["nameHexStr"] = nameStrToHexStr(electionNameStr);
	stagedElection["candidateHexStrList"] = candidatesHexStrList;
	stagedElection["voterAddresses"] = voterAddresses;
	stagedElection["kwargs"] = {"from": userAccount, "value": donationWei};
    },
	

    submitStagedElection: async function (electionNameStr, canNamesLst, voterCount) {

	document.getElementById("privateKeyListElement").remove();
	
	if (stagedElection == null) {
	    alert("No election staged for submission");
	} else {

	    let donation = stagedElection["kwargs"]["value"];
	    if (donation > 0) {
		alert("Thank you for your donation!");
	    }

	    var receipt = await zkpElections.addElection(
		stagedElection["nameHexStr"],
		stagedElection["candidateHexStrList"],
		stagedElection["voterAddresses"],
		stagedElection["kwargs"]);
	    
	    stagedElection = null;
	    
	    const oldButton = document.getElementById("submitElection");
	    if (oldButton !== null) {
		oldButton.remove();
	    }
	}
    },
    
    initElection: async function () {
	
	var electionKey = getURLParam("electionKey", window.location.search);
	let election = await zkpElections.getElection(electionKey);
	let voterStatus = await window.App.getVoterStatus(electionKey);
	let isClosed = election[4];
	
	await window.App.displayElectionName(election[0].toString(16));
	await window.App.displayElectionStatus(isClosed);
	await window.App.displayVoteStatus(election);
	await window.App.displayVoterStatus(voterStatus);
	await window.App.displayCandidates(election, electionKey, voterStatus);
	await window.App.addCloseElectionButton(isClosed, electionKey);
	await window.App.addElectionResult(election);
	window.App.addButtonForNewElection();
    },

    getVoterStatus: async function (electionKey) {

	// Voter status: 0: Not voting, 1: awaiting to vote 2: voted
	var voterStatus = 0;
	try {
	    voterStatus = new bigInt(await zkpElections.getVoterStatus.call(
		electionKey,
		{"from": userAccount})).toNumber();

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

    displayVoterStatus: async function (voterStatus) {

	const statusNode = document.getElementById("voterStatus");
	if (voterStatus == 0) {
	    statusNode.innerHTML = "Not voting";
	} else if (voterStatus == 1) {
	    statusNode.innerHTML = "Not voted";
	} else if (voterStatus == 2) {
	    statusNode.innerHTML = "Voted";
	};
    },

    displayCandidates: async function (election, electionKey, voterStatus) {

	var candidates = election[1];
	var voteCounts = election[2];
	var isClosed = election[4];
	
	const canTable = document.getElementById("candidatesTable");
	canTable.innerHTML = "";

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

    getLeaderKey: async function (election) {

	var leaderKey = 0;
	var leaderVoteCount = 0;
	for (var i = 0; i <election[1].length; i ++) {
	    var thisVoteCount = bigInt(election[2][i]).toNumber();
	    if (thisVoteCount > leaderVoteCount) {
		leaderKey = i + 1;
		leaderVoteCount = thisVoteCount;
	    }
	}
	return leaderKey;
    },
    
    addCloseElectionButton: async function (isClosed, electionKey) {

	if (!isClosed) {

	    let keys = await zkpElections.getElectionKeysForOwner.call({"from": userAccount});
	    if (keys[electionKey - 1] == 1) {
		
		var panelNode = document.getElementById("panelForCloseButton");
		panelNode.innerHTML = "";
		
		var btnNode = document.createElement("button");
		btnNode.setAttribute("class", "btn btn-default");
		btnNode.setAttribute("id", "closeElectionButton");
		var clck = "App.closeElection(" + electionKey + ");return false;";
		btnNode.setAttribute("onclick", clck);
		btnNode.innerHTML = "Close election";
		panelNode.appendChild(btnNode);
	    }
	}
    },


    addElectionResult: async function (election) {

	// Fetch total votes cast and highest vote count for a candidate
	var maxVoteCount = 0;
	var totVotesCast = 0;
	var candidates = election[1];
	var voteCounts = election[2];
	for (var i = 0; i < candidates.length; i ++) {
	    totVotesCast += voteCounts[i].toNumber();
	    if (voteCounts[i] > maxVoteCount) {
		maxVoteCount = voteCounts[i];
	    }
	}

	var result = "<h3>";
	if (totVotesCast == 0) {
	    result = "No votes cast";
	} else {

	    // Check how many candidates have the max vote count
	    var leaders = [];
	    for (var j = 0; j < candidates.length; j ++)
	    {
		if (voteCounts[j].toNumber() == maxVoteCount) {
		    leaders.push(hexStrToNameStr(candidates[j].toString(16)));
		}
	    }

	    // If there are more or only 1 leader ...
	    var isClosed = election[4];
	    if (leaders.length > 1) {

		if (isClosed) {
		    result += "Tie between ";
		}
		
		for (var i =  0; i < leaders.length; i ++ ) {
		    if (i == leaders.length - 1) {
			result += " and ";
		    }
		    result += leaders[i];
		}

		if (!isClosed) {
		    result += " are leading";
		}
		
	    } else {
		if (isClosed) {
		    result += leaders[0] + " won";
		} else {
		    result += leaders[0] + " is leading";
		}
	    }
	}

	result += "</h3>";

	var node = document.getElementById("panelBodyForResult");
	node.innerHTML = result;
	
    },
    
    
    closeElection: async function (electionKey) {

	try {
	    
	    await zkpElections.closeElectionPrematurely(
		electionKey,
		{"from": userAccount});

	    document.getElementById("closeElectionButton").remove();
	    
	} catch (error) {
	    
	    console.error(error);
	    var txt = "There was an error trying to close the election. ";
	    txt += "Election not closed.";
	    alert(txt);
	    
	}
	
    },
    
    castVote: async function (electionKey, candidateKey) {

	var receipt = await zkpElections.castVote(
	    electionKey,
	    candidateKey,
	    {"from": userAccount});
    },

    addButtonForNewElection: function () {
	
	var panelNode = document.getElementById("panelForNewElectionButton");
	panelNode.innerHTML = "";
	
	var btnNode = document.createElement("button");
	btnNode.setAttribute("class", "btn btn-default");
	
	var newHref = window.App.getHrefFor("");
	var clck = "window.location.href='" + newHref + "'";
	btnNode.setAttribute("onclick", clck);

	btnNode.setAttribute("onclick", clck);
	btnNode.innerHTML = "Let me create a new election";
	panelNode.appendChild(btnNode);
    },

    subscribeToEvents: async function () {

	if (zkpElections !== null) {
	    await window.web3.eth.subscribe(
		'logs',
		{"address": zkpElections.address},
		window.App.processEvents);
	}	
    },
    
    processEvents: async function (error, events) {

	if (error) {
	    console.error("Error in processing events:");
	    console.error(error);
	}
	await window.App.route();
    },

};

window.addEventListener('load', async function(args) {

    if (window.ethereum) {
	
	window.web3 = new Web3(window.ethereum);
	
	try {
	    await window.ethereum.enable();
	} catch (error) {
	    console.error(error);
	}
    } else if (window.web3) {

	window.web3 = new Web3(window.web3.currentProvider);
    } else {
	var msg = "Could not connect to a wallet like MetaMask, Mist, etc.";
	msg += "This dapp will not work without it.";
	alert(msg);
    }
    
    await window.App.start();
});
