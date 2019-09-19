var bigInt = require("bignumber.js");
const truffleAssert = require('truffle-assertions');

var zkpElectionsArtifact = artifacts.require("contracts/ZKPElections.sol");


contract("Test ZKP elections funding", function(accounts) {

    const ownerAccount = accounts[0];
    const userAccount = accounts[1];
    const donationAmount = new bigInt(870001);
    var zkpElections;

    const electionName1 = '0x456c656374';  // "Election 1"
    const candidateAccount1 = accounts[1];
    const candidateName1 = 0x43616e2031;  // "Can 1"
    const candidateAccount2 = accounts[2];
    const candidateName2 = 0x43616e2032;  // "Can 2"
    const voterAccount1 = accounts[3];
    const voterAccount2 = accounts[4];

    let balUserBefore;
    let balOwnerBefore;
    let gasCostDonation;
    
    async function getTransactionGasCost (receipt) {

	let tx = await web3.eth.getTransaction(receipt.tx);
	let gasPrice = new bigInt(tx.gasPrice);
	let gasUsed = new bigInt(receipt.receipt.cumulativeGasUsed);
	return gasPrice.times(gasUsed);
    };
    
    beforeEach("deploy contract and add election with donation", async function () {

	// Deploy contract
	zkpElections = await zkpElectionsArtifact.new(
	    {"from": ownerAccount});

	// Fetch balances before
	balUserBefore = new bigInt(await web3.eth.getBalance(userAccount));
	balOwnerBefore = new bigInt(await web3.eth.getBalance(ownerAccount));
	
	// Add election
	var receiptDonation = await zkpElections.addElection(
	    electionName1,
	    [candidateName1, candidateName2],
	    [voterAccount1, voterAccount2],
	    {"from": userAccount,
	     "value": donationAmount});

	gasCostDonation = await getTransactionGasCost(receiptDonation);
	let balUserAfter = new bigInt(await web3.eth.getBalance(userAccount));
	assert(
	    balUserBefore.minus(gasCostDonation).minus(donationAmount).isEqualTo(balUserAfter));
	
    });

    it("should get address of owner", async function () {

	let addressOwner = await zkpElections.getContractOwner.call(
	    {"from": userAccount});
	assert.equal(ownerAccount, addressOwner);
    });
    
    it("should let owner withdraw", async function () {

	let receiptWithdrawal = await zkpElections.withdrawAllFunds(
	    {"from": ownerAccount});

	let balOwnerAfter = new bigInt(await web3.eth.getBalance(ownerAccount));
	let gasCostWithdrawal = await getTransactionGasCost(receiptWithdrawal);
	assert(
	    balOwnerBefore.minus(gasCostWithdrawal).plus(donationAmount).isEqualTo(balOwnerAfter));
    });

    it("should not let non-owner withdraw", async function () {
	await truffleAssert.reverts(zkpElections.withdrawAllFunds({"from": userAccount}));
    });  

});
