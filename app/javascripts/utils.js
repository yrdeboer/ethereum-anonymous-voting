var Accounts = require('web3-eth-accounts');


export function nameStrToHexStr(nameStr) {

    var len = Math.min(nameStr.length, 32);
    var hexStr = "0x";
    for(var i=0;i<len;i++) {
        hexStr += "" + nameStr.charCodeAt(i).toString(16);
	console.log("nameStrToHexStr: " +  hexStr);
    }
    return hexStr;
}


export function hexStrToNameStr (hexStr) {

    var nameStr = "";
    for (var i = 0; (i < hexStr.length && hexStr.substr(i, 2) !== '00'); i += 2)
        nameStr += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
    return nameStr;
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
    ul.setAttribute("id", "privateKeyListElement");
    panelBody.appendChild(ul);

    console.log("voterKeys: " + voterKeys);

    for (var i = 0; i < voterKeys.length; i ++ ){

	var li = document.createElement("li");
	li.setAttribute("class", "list-group-item");
	li.appendChild(document.createTextNode(voterKeys[i]));
	ul.appendChild(li);
    }

    
}
