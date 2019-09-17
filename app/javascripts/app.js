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
    getCandidateNamesInt,
    getVoterAccounts,
    getRandomString,
    createVoterListElements } from "../javascripts/utils.js";

var zkpElections = null;

var userAccount;

window.App = {
    
    start: async function() {

	zkpElectionsContract.setProvider(web3.currentProvider);
	zkpElections = await zkpElectionsContract.deployed();

	console.log("Election contract at: " + zkpElectionsContract.address);
	
	web3.eth.getAccounts(async function(error, accounts) {

	    if (error != null) {
		alert("There was an error fetching your accounts");
		return;
	    }

	    if (accounts.length == 0) {
		alert("Could not get active accounts");
		return;
	    }

	    userAccount = accounts[0];

	    console.log("set user account to:");
	    console.log(userAccount);

	    await App.route();
	    
	});

    },

    route: async function () {

	console.log("route, pathname=" + location.pathname);
	if (location.pathname == "/" || location.pathname == "/index.html") {
	    App.initIndex();
	} else if (location.pathname == "/election.html") {
	    App.initElection();
	}
	
    },
    
    initIndex: async function () {

	console.log("initIndex");

	let electionCount = new bigInt(await zkpElections.electionCount.call());
	console.log("electionCount=" + electionCount);

	const element = document.getElementById("userElectionCount");
	var keys = [];
	if (keys.length == 0) {
	    element.innerHTML = "<h3>You have no elections</h3>";
	} else {
	    element.innerHTML = "<h3>You have " + keys.length + " elections</h3>";
	}

	let receipt = await zkpElections.getElectionKeysForOwner.call();
	console.log(receipt);

	console.log(parseInt(receipt));
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
	console.log("initElection");
	console.log("location:");
	console.log(location);
	console.log("userAccount=" + userAccount);
    },

    addCandidateNames: async function () {

	let canNames = document.getElementById("inputCandidateNames").value;
	let canNamesLst = canNames.split(",");
	let voterCount = document.getElementById("inputVoterCount").value;

	if (canNamesLst.length == 1 && canNamesLst[0] == "") {

	    alert("Not enough candidates");

	} else if (voterCount == null || voterCount < 2)  {

	    alert("Not enough voters");
	    
	} else {

	    App.addElection(canNamesLst, voterCount);
	}
    },
    
    addElection: async function (canNamesLst, voterCount) {

	var candidatesInt = getCandidateNamesInt(canNamesLst);
	var [voterAddresses, voterPrivateKeys] = getVoterAccounts(voterCount);
	createVoterListElements(voterPrivateKeys);

	console.log(candidatesInt);
	console.log(voterAddresses);

	var receipt = await zkpElections.addElection(
	    candidatesInt,
	    voterAddresses,
	    {"from": userAccount});

	console.log(receipt);
	    
	
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

    // setStatus: function(message) {
    // 	var status = document.getElementById("status");
    // 	status.insertAdjacentHTML("beforeEnd", "<br>" + message + "</br>");
    // },

    // printImportantInformation: function() {

    // 	web3.eth.getAccounts(function(err, accounts) {
    // 	    var div = document.createElement("div");
    // 	    div.setAttribute("class", "row");

    // 	    web3.eth.getBalance(userAccount, function(err, balance) {

    // 		var balanceWei = new bigInt(balance);
    // 		var balanceEth = parseFloat(balanceWei / 1e18);
    
    // 		var divRow1 = document.createElement("div");
    // 		divRow1.setAttribute("class", "row");
    // 		divRow1.appendChild(document.createTextNode("Active account: " + userAccount));
    // 		div.appendChild(divRow1);
    
    // 		var divRow2 = document.createElement("div");
    // 		divRow2.setAttribute("class", "row");
    // 		divRow2.appendChild(document.createTextNode("Balance: " + balanceEth + " (ETH)"));
    // 		div.appendChild(divRow2);

    // 		div.setAttribute("class", "alert alert-info");
    
    // 		const iInfo = document.getElementById("importantInformation");
    // 		iInfo.appendChild(div);

    // 	    });
    // 	});
    
    // },

    // initExchange: function() {
    // },
    
    // watchExchangeEvents: function() {

    // 	// var exchangeInstance;
    // 	// return ExchangeContract.deployed().then(function(instance) {

    // 	//     exchangeInstance = instance;
    // 	//     exchangeInstance.allEvents({}, {fromBlock: 0, toBlock: "latest"}).watch(
    // 	// 	function(err, result) {

    // 	// 	    console.log(result);
    
    // 	// 	    var alertBox = document.createElement("div");
    // 	// 	    alertBox.setAttribute("class", "alert alert-info alert-dismissable");
    // 	// 	    var closeBtn = document.createElement("button");
    // 	// 	    closeBtn.setAttribute("type", "button");
    // 	// 	    closeBtn.setAttribute("class", "close");
    // 	// 	    closeBtn.setAttribute("data-dismiss", "alert");
    // 	// 	    closeBtn.innerHTML = "<span>&times</span>";
    // 	// 	    alertBox.appendChild(closeBtn);

    // 	// 	    var eventTitle = document.createElement("div");
    // 	// 	    eventTitle.innerHTML = "<strong>New event: " + result.event + "</strong>";
    // 	// 	    alertBox.appendChild(eventTitle);

    // 	// 	    var argsBox = document.createElement("textarea");
    // 	// 	    argsBox.setAttribute("class", "form-control");
    // 	// 	    argsBox.innerHTML = JSON.stringify(result.args);
    // 	// 	    alertBox.appendChild(argsBox);
    // 	// 	    document.getElementById("exchangeEvents").appendChild(alertBox);

    // 	// 	}
    // 	//     );
    // 	// }).catch(function(e) {

    // 	//     console.log(e);
    // 	//     alert("Error watching for exchange events");
    // 	// });

    // },
    
    // addTokenToExchange: function() {

    // 	console.log("addTokenToExchange");

    // 	var tokenName = document.getElementById("inputAddTokenName").value;
    // 	var tokenAddress = document.getElementById("inputAddTokenAddress").value;

    // 	console.log("addToken " + tokenName + " at " + tokenAddress);
    
    // 	var exchangeInstance;
    // 	return ExchangeContract.deployed().then(function(instance) {
    
    // 	    exchangeInstance = instance;
    // 	    console.log("Got instance, going to add from " + account);
    // 	    return exchangeInstance.addToken(tokenName, tokenAddress, {"from": account});
    
    // 	}).then(function(tx_receipt) {
    
    // 	    console.log(tx_receipt);
    // 	    App.setStatus("Added " + tokenName + " at " + tokenAddress);
    
    // 	}).catch(function(ex) {

    // 	    console.log(ex);
    // 	    alert("Error adding token");
    // 	    App.setStatus("");
    // 	});
    
    // },

    // refreshBalanceEthExchange: function() {
    // 	console.log("refreshBalanceEthExchange");

    // 	var exchangeInstance;
    // 	return ExchangeContract.deployed().then(function(instance) {
    
    // 	    exchangeInstance = instance;
    // 	    return exchangeInstance.getEthBalanceInWei.call({"from": account});

    // 	}).then(function(ethBalanceWei) {

    // 	    console.log("ethBalanceWei=" + ethBalanceWei + " for " + account);
    // 	    const element = document.getElementById("ethBalanceOnEx");
    // 	    element.innerHTML = parseFloat(ethBalanceWei/1e18);
    // 	});
    // },
    
    // refreshBalanceFIXEDExchange: function () {
    // 	console.log("refreshBalanceFIXEDExchange");
    // 	var exchangeInstance;
    // 	var balanceFixed = 0;
    // 	return ExchangeContract.deployed().then(function(instance) {
    
    // 	    exchangeInstance = instance;
    // 	    return exchangeInstance.getBalance.call("FIXED", {"from": account});

    // 	}).then(function(fixedBalanceWei) {

    // 	    balanceFixed = fixedBalanceWei;
    // 	    console.log("fixedBalanceWei=" + fixedBalanceWei);

    // 	}).catch(function(ex){
    
    // 	    console.error(ex);
    // 	    App.setStatus("Unable to fetch TOKEN balance");
    
    // 	}).then(function() {

    // 	    const element = document.getElementById("fixedBalanceOnEx");
    // 	    element.innerHTML = balanceFixed;
    // 	});
    // },
    
    // refreshBalanceExchange: function() {
    // 	App.refreshBalanceEthExchange();
    // 	App.refreshBalanceFIXEDExchange();
    // },
    // depositEther: function() {

    // 	console.log("deposit eth");

    // 	var amountEth = parseFloat(document.getElementById("inputAmountDepositEther").value);
    // 	var amountWei = new bigInt((amountEth * 1e18).toString());
    // 	console.log("amountWei=" + amountWei);

    // 	var exchangeInstance;
    // 	return ExchangeContract.deployed().then(function(instance) {
    
    // 	    exchangeInstance = instance;
    // 	    console.log("going to make transaction from " + account);
    // 	    return exchangeInstance.depositEther({
    // 		"from": account,
    // 		"value": amountWei});

    // 	}).then(function(tx_receipt) {
    
    // 	    console.log(tx_receipt);
    // 	    App.setStatus("Deposited " + amountEth);
    // 	    App.refreshBalanceExchange();
    
    // 	}).catch(function(ex) {

    // 	    console.log(ex);
    // 	    alert("Error depositing ether");
    // 	    App.setStatus("");
    // 	});



    // },
    // withdrawEther: function() {

    // 	console.log("withdraw ether");

    // 	var amountEth = parseFloat(document.getElementById("inputAmountWithdrawEther").value);
    // 	var amountWei = new bigInt((amountEth * 1e18).toString());
    // 	console.log("amountWei=" + amountWei);

    // 	if (amountWei == null | isNaN(amountWei)) {
    // 	    console.error("Invalid value provided.");
    // 	    App.setStatus("Invalid value for ether amount provided. Not withdrawing.");
    // 	    return false;
    
    // 	} else {
    
    // 	    var exchangeInstance;
    // 	    return ExchangeContract.deployed().then(function(instance) {
    
    // 		exchangeInstance = instance;
    // 		console.log("going to withdraw to " + account);
    // 		return exchangeInstance.withdrawEther(amountWei, {"from": account});

    // 	    }).then(function(tx_receipt) {
    
    // 		console.log(tx_receipt);
    // 		App.setStatus("Withdrew " + amountEth + " to " + account);
    // 		App.refreshBalanceExchange();
    
    // 	    }).catch(function(ex) {

    // 		console.log("got error");
    // 		console.log(ex);
    // 		alert("Error withdrawing ether");
    // 		App.setStatus("");
    // 	    });

    // 	}
    // },
    // depositToken: function() {
    // 	//deposit token function
    // },
    // /**
    //  * TRADING FUNCTIONS FROM HERE ON
    //  */
    // initTrading: function() {
    // 	App.refreshBalanceExchange();
    // 	App.printImportantInformation();
    // 	App.updateOrderBooks();
    // 	App.listenToTradingEvents();
    // },
    // updateOrderBooks: function() {
    // 	//update the order books function
    // },
    // listenToTradingEvents: function() {
    // 	//listen to trading events
    // },
    // sellToken: function() {
    // 	//sell token
    // },
    // buyToken: function() {
    // 	//buy token
    // },

    // /**
    //  * TOKEN FUNCTIONS FROM HERE ON
    //  */
    // initManageToken: function() {
    // 	App.updateTokenBalance();
    // 	App.watchTokenEvents();
    // 	App.watchExchangeEvents();
    // 	App.printImportantInformation();
    
    
    // },
    // updateTokenBalance: function() {

    // 	console.log("updateTokenBalance");

    // 	var tokenInstance;
    // 	TokenContract.deployed().then(function(instance) {

    // 	    console.log("got instance");
    // 	    tokenInstance = instance;

    // 	    console.log("account (2)" + account);
    // 	    return tokenInstance.balanceOf.call(account);
    
    // 	}).then(function(value) {

    // 	    if (value == null) {
    // 		console.log("Unable to get value, setting to -1");
    // 		value = -1;
    // 	    }
    
    // 	    var balance_element = document.getElementById("balanceTokenInToken");
    // 	    console.log("Setting token balance value to: " + value);
    // 	    balance_element.innerHTML = value.valueOf();
    
    // 	}).catch(function(e) {
    
    // 	    console.log(e);
    // 	    App.setStatus("Error getting token balance");
    
    // 	});
    
    // },
    // watchTokenEvents: function() {

    // 	var tokenInstance;
    // 	return TokenContract.deployed().then(function(instance) {

    // 	    tokenInstance = instance;
    // 	    tokenInstance.allEvents({}, {fromBlock: 0, toBlock: "latest"}).watch(
    // 		function(err, result) {

    // 		    console.log(result);
    
    // 		    var alertBox = document.createElement("div");
    // 		    alertBox.setAttribute("class", "alert alert-info alert-dismissable");
    // 		    var closeBtn = document.createElement("button");
    // 		    closeBtn.setAttribute("type", "button");
    // 		    closeBtn.setAttribute("class", "close");
    // 		    closeBtn.setAttribute("data-dismiss", "alert");
    // 		    closeBtn.innerHTML = "<span>&times</span>";
    // 		    alertBox.appendChild(closeBtn);

    // 		    var eventTitle = document.createElement("div");
    // 		    eventTitle.innerHTML = "<strong>New event: " + result.event + "</strong>";
    // 		    alertBox.appendChild(eventTitle);

    // 		    var argsBox = document.createElement("textarea");
    // 		    argsBox.setAttribute("class", "form-control");
    // 		    argsBox.innerHTML = JSON.stringify(result.args);
    // 		    alertBox.appendChild(argsBox);
    // 		    document.getElementById("tokenEvents").appendChild(alertBox);

    // 		}
    // 	    );
    // 	}).catch(function(e) {

    // 	    console.log(e);
    // 	    alert("Error watching for token events");
    // 	});

    // },

    // sendToken: function() {

    // 	console.log("Send token");

    // 	var amount = parseInt(document.getElementById("inputAmountSendToken").value);
    // 	var recipient = document.getElementById("inputBeneficiarySendToken").value;

    // 	console.log("sendToken, got: " + amount + " to " + recipient + " from " + account);
    
    // 	App.setStatus("Initiating transaction, one moment please ...");

    // 	var tokenInstance;
    // 	return TokenContract.deployed().then(function(instance) {

    // 	    tokenInstance = instance;
    // 	    console.log("HERE AM I");
    // 	    console.log("Transferring " + amount + " to " + recipient);
    // 	    return tokenInstance.transfer(recipient, amount, {"from": account});
    
    // 	}).then(function(tx_receipt) {
    // 	    console.log(tx_receipt);

    // 	    App.setStatus("Transferrered " + amount + " to " + recipient);
    // 	    App.updateTokenBalance();
    
    // 	}).catch(function(e) {
    // 	    alert("Error sending tokens");
    // 	    App.setStatus("");
    // 	});
    
    // },

    // allowanceToken: function() {

    // 	console.log("allowanceToken");

    // 	var amount = parseInt(document.getElementById("inputAmountAllowToken").value);
    // 	var recipient = document.getElementById("inputBeneficiaryAllowToken").value;

    // 	console.log("allowanceToken, got: " + amount + " to " + recipient + " from " + account);
    
    // 	App.setStatus("Initiating transaction, one moment please ...");

    // 	var tokenInstance;
    // 	return TokenContract.deployed().then(function(instance) {

    //   	    tokenInstance = instance;

    //   	    console.log("Allowing " + recipient + " to withdraw " + amount + " tokens");
    //   	    return tokenInstance.approve(recipient, amount, {"from": account});
    
    // 	}).then(function(tx_receipt) {
    //   	    console.log(tx_receipt);

    //   	    App.setStatus("Allowed " + recipient + " to withdraw " + amount + " tokens");
    //   	    App.updateTokenBalance();
    
    // 	}).catch(function(e) {
    //   	    alert("Error approving token withdrawal");
    //   	    App.setStatus("");
    // 	});
    // }
};

window.addEventListener('load', async function(args) {
    if (typeof web3 == 'undefined') {
	console.warn("No web3 provider found (MetaMask, Mist, etc.)");
    } else {
	window.web3 = new Web3(web3.currentProvider);
    }
    await App.start();
});
