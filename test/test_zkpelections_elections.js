var bigInt = require("bignumber.js");
const truffleAssert = require('truffle-assertions');

var zkpElectionsArtifact = artifacts.require("contracts/ZKPElections.sol");


contract("Test ZKP elections election management", function(accounts) {

    const ownerAccount = accounts[0];
    const userAccount = accounts[1];

    // Added for all tests
    const challenge1 = "Best financial quote?";
    const prizeMoneyWei1 = 16000;

    // Added for all tests
    const candidate1Account = accounts[2];
    const candidateName1 = "Candidate 1";
    const  submission1 = "Submission 1";

    // Added for all tests
    const candidate2Account = accounts[3];
    const candidateName2 = "Candidate 2";
    const submission2 = "Submission 2";

    // Added in 1 test
    const candidate3Account = accounts[4];
    const candidateName3 = "Candidate 3";
    const submission3 = "Submission 3";

    // Added for all tests
    var zkpElections;    
    
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
    

    it("should not add other candidate with same submission", async function () {

	await truffleAssert.reverts(
	    zkpElections.addCandidate(
		1,
		candidateName3,
		submission1,
		{"from": candidate3Account}));
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
