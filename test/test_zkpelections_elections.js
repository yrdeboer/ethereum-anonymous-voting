var bigInt = require("bignumber.js");
const truffleAssert = require('truffle-assertions');

var zkpElectionsArtifact = artifacts.require("contracts/ZKPElections.sol");


contract("Test ZKP elections election management", function(accounts) {

    const ownerAccount = accounts[0];
    const userAccount = accounts[1];
    const candidate1Account = accounts[2];
    const candidate2Account = accounts[3];
    var zkpElections;

    let challenge1 = "Best financial quote?"
    let candidateName1 = "Candidate 1";
    let submission1 = "Submission 1";
    let prizeMoneyWei1 = 16000;
    let candidateName2 = "Candidate 2";

    let submission2 = "Submission 2";
    
    beforeEach("add election and 2 candidates", async function () {
	// Add election
	zkpElections = await zkpElectionsArtifact.new({"from": ownerAccount});

	var receipt = await zkpElections.addElection(
	    "Me me me",
	    challenge1,
	    {"from": userAccount, "value": prizeMoneyWei1});

	assert.equal(receipt.receipt.logs[0].event, "ElectionAdded");

	let cnt = new bigInt(receipt.receipt.logs[0].args._electionCount);
	assert(cnt.isEqualTo(bigInt(1)));

	let prizeWei = new bigInt(receipt.receipt.logs[0].args._prizeMoneyWei);
	assert(prizeWei.isEqualTo(prizeMoneyWei1));
	
	let electionCount = await zkpElections.electionCount();
	assert.equal(electionCount, 1);

	// Now add candiate
	receipt = await zkpElections.addCandidate(
	    electionCount,
	    candidateName1,
	    submission1,
	    {"from": candidate1Account});

	assert.equal(receipt.receipt.logs[0].event, "CandidateAdded");
	assert.equal(receipt.receipt.logs[0].args._candidateCount, 1);
	assert.equal(receipt.receipt.logs[0].args._candidateName, candidateName1);
	

	// Another candidate
	receipt = await zkpElections.addCandidate(
	    electionCount,
	    candidateName2,
	    submission2,
	    {"from": candidate2Account});

	assert.equal(receipt.receipt.logs[0].event, "CandidateAdded");
	assert.equal(receipt.receipt.logs[0].args._candidateCount, 2);
	assert.equal(receipt.receipt.logs[0].args._candidateName, candidateName2);
	
    });
    

    it("should not add same candidate", async function () {

	await truffleAssert.reverts(
	    zkpElections.addCandidate(
		1,
		candidateName1,
		submission1,
		{"from": candidate1Account}));

    });

    it("should not add candidate on wrong election", async function () {
	
	await truffleAssert.reverts(
	    zkpElections.addCandidate(
		2,
		candidateName1,
		submission1,
		{"from": candidate1Account}));
	
    });

    it("should give proper election details", async function () {
	var election = await zkpElections.getElection.call(1);
	assert.equal(election[0], challenge1);
	assert.equal(election[1], prizeMoneyWei1);
	assert.equal(election[2], 2);
    });
    
    it("should give proper candidate details", async function () {
	var election = await zkpElections.getElection.call(1);
	var candidate = await zkpElections.getCandidate.call(1, 2);
	assert.equal(candidate[0], candidateName2);
	assert.equal(candidate[1], submission2);
    });
    
});
