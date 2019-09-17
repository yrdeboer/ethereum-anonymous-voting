var Accounts = require('web3-eth-accounts');


function stringToHex(str, maxLength) {

    var len = Math.min(str.length, maxLength);
    var hex = '';
    for(var i=0;i<len;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}


function hexToString (hexstr) {

    var str = '';
    for (var i = 0; (i < hexstr.length && hexstr.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hexstr.substr(i, 2), 16));
    return str;
}


function getRandomString(strLength) {

    var randomArray;
    var randomStr;
    while (true) {

	randomArray = new Uint32Array(1);
	window.crypto.getRandomValues(randomArray);

	randomStr += randomArray[0].toString(16);
	if (randomStr.length >= strLength) {
	    randomStr = randomStr.substring(0, strLength);
	    break;
	}
    }
    return randomStr;
}


export function getCandidateNamesInt(namesStrLst) {

    var namesInt = [];
    for (var i = 0; i < namesStrLst.length; i ++ ){
	var nr = parseInt(stringToHex(namesStrLst[i].trim(), 32));
	namesInt.push(nr);
    }
    return namesInt;
}

export function getVoterAccounts(voterCount) {

    console.log("getVoterAccounts, voterCount=" + voterCount);

    
    var ethAccounts = new Accounts();

    var addrs = [];
    var keys = [];
    
    for (var i = 0; i < voterCount; i ++) {

	var randomStr = getRandomString(32);
	var newAccount = ethAccounts.create(randomStr);
	addrs.push(newAccount.address);
	keys.push(newAccount.privateKey);
    }

    console.log([addrs, keys]);
    return [addrs, keys];
}

export function createVoterListElements(voterKeys) {

    const panelBody = document.getElementById("panelBodyForKeyList");
    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group");
    panelBody.appendChild(ul);

    console.log("voterKeys: " + voterKeys);

    for (var i = 0; i < voterKeys.length; i ++ ){

	var li = document.createElement("li");
	li.setAttribute("class", "list-group-item");
	li.appendChild(document.createTextNode(voterKeys[i]));
	ul.appendChild(li);
    }

    
}
