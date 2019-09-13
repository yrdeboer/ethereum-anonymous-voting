var bigInt = require("bignumber.js");
const truffleAssert = require('truffle-assertions');

var zkpElectionsArtifact = artifacts.require("contracts/ZKPElections.sol");


contract("Test ZKP elections admin", function(accounts) {

    const ownerAccount = accounts[0];
    const userAccount = accounts[1];
    const amountWei = new bigInt(1000);
    var zkpElections;
    
    beforeEach("send ether to contract", async function () {
	
	zkpElections = await zkpElectionsArtifact.new({"from": ownerAccount});

	let balanceBeforeWei = new bigInt(await web3.eth.getBalance(userAccount));
	var receipt = await zkpElections.send(amountWei, {"from": userAccount});
	let balanceAfterWei = new bigInt(await web3.eth.getBalance(userAccount));

	let tx = await web3.eth.getTransaction(receipt.tx);
	let gasPriceWei = new bigInt(tx.gasPrice);
	let gasUsed = new bigInt(receipt.receipt.cumulativeGasUsed);
	let gasCostWei = gasPriceWei.times(gasUsed);
	
	assert(balanceBeforeWei.minus(
	    balanceAfterWei).minus(gasCostWei).isEqualTo(amountWei));

    });

    it("should let owner withdraw", async function () {

	let balanceOwnerBeforeWei = new bigInt(await web3.eth.getBalance(ownerAccount));
	let receipt = await zkpElections.withdraw(amountWei, {"from": ownerAccount});
	let balanceOwnerAfterWei = new bigInt(await web3.eth.getBalance(ownerAccount));

	let tx = await web3.eth.getTransaction(receipt.tx);
	let gasPriceWei = new bigInt(tx.gasPrice);
	let gasUsed = new bigInt(receipt.receipt.cumulativeGasUsed);
	let gasCostWei = gasPriceWei.times(gasUsed);

	assert(balanceOwnerBeforeWei.plus(amountWei).minus(gasCostWei).isEqualTo(
	    balanceOwnerAfterWei));
    });

    it("should not let non-owner withdraw", async function () {

	await truffleAssert.reverts(
	    zkpElections.withdraw(amountWei, {"from": userAccount}));

    });
});
