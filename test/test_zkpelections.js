var bigInt = require("bignumber.js");
const truffleAssert = require('truffle-assertions');

var zkpElectionsArtifact = artifacts.require("contracts/ZKPElections.sol");


contract("Test ZKP empty calls", function(accounts) {

    const ownerAccount = accounts[0];
    const someUserAccount = accounts[5];

    var zkpElections;

    beforeEach("deploy contract", async function () {
	zkpElections = await zkpElectionsArtifact.new({"from": ownerAccount});
    });
    
    it("should get 0 elections from new contract", async function () {
	
	var electionCount = new bigInt(
	    await zkpElections.electionCount.call({"from": someUserAccount}));
	assert(electionCount.isZero());
    });

    it("should get empty array from new contract for user election keys", async function () {
	
	var keys = await zkpElections.getElectionKeysForOwner.call({"from": someUserAccount});
	assert.equal(keys.length, 0);

    });    
});

contract("Test ZKP elections election management", function(accounts) {

    const electionName1 = '0x456c656374';  // "Election 1"
    const electionName2 = '0x456c656374696f6e2032';  // "Election 2"
    
    const ownerAccount = accounts[0];

    const candidateAccount1 = accounts[1];
    const candidateName1 = 0x43616e2031;  // "Can 1"
    const candidateAccount2 = accounts[2];
    const candidateName2 = 0x43616e2032;  // "Can 2"

    const voterAccount1 = accounts[3];
    const voterName1 = 0x566f7465722031;  // "Voter 1"
    const voterAccount2 = accounts[4];
    const voterName2 = 0x566f7465722032;  // "Voter 2"

    const someUserAccount = accounts[5];
    
    // Added for all tests
    var zkpElections;    
    
    beforeEach("add election and cast a vote", async function () {

	// Get contract
	zkpElections = await zkpElectionsArtifact.new({"from": ownerAccount});

	// Add election
	var receipt = await zkpElections.addElection(
	    electionName1,
	    [candidateName1, candidateName2],
	    [voterAccount1, voterAccount2],
	    {"from": ownerAccount});

	assert.equal(receipt.logs[0].event, "ElectionAdded");

	let cnt = new bigInt(receipt.logs[0].args._electionKey);
	assert(cnt.isEqualTo(bigInt(1)));
	
	let electionCount = new bigInt(await zkpElections.electionCount());
	assert(electionCount.isEqualTo('1'));

	// Cast vote to first candidate
	let candidateKey = new bigInt('1');
	receipt = await zkpElections.castVote(
	    electionCount,
	    candidateKey,
	    {"from": voterAccount1});

	// Check event
	assert.equal(receipt.logs[0].event, "VoteCast");
	let eKey = new bigInt(receipt.logs[0].args._electionKey);
	assert(eKey.isEqualTo(electionCount));
	let eCan = new bigInt(receipt.logs[0].args._candidateKey);
	assert(eCan.isEqualTo(candidateKey));
    });
    

    it("should return proper voter status of non voter", async function () {

	let status = new bigInt(await zkpElections.getVoterStatus.call(
	    1,
	    {"from": someUserAccount}));
	assert(status.isEqualTo(bigInt('0')));
    });
    
    it("should return proper voter status of voter that cast", async function () {

	let status = new bigInt(await zkpElections.getVoterStatus.call(
	    1,
	    {"from": voterAccount1}));
	assert(status.isEqualTo(bigInt('2')));
    });
    
    it("should return proper voter status of voter that dit not yet vote",
       async function () {

	let status = new bigInt(await zkpElections.getVoterStatus.call(
	    1,
	    {"from": voterAccount2}));
	assert(status.isEqualTo(bigInt('1')));
    });
    
    it("should get an existing election", async function () {
	var electionKey = new bigInt('1');
	var result = await zkpElections.getElection.call(
	    electionKey,
	    {"from": someUserAccount});

	assert(bigInt(result[0]).isEqualTo(bigInt(electionName1)));
	assert.equal(result[1].length, 2);
	assert.equal(result[1][0], candidateName1);
	assert.equal(result[1][1], candidateName2);	
	assert.equal(result[2].length, 2);
	assert.equal(result[2][0], 1);
	assert.equal(result[2][1], 0);
	assert.equal(result[3], 2);
	assert.equal(result[4], false);
    });

    it("should get election keys for owner", async function () {

	var result = await zkpElections.getElectionKeysForOwner.call(
	    {"from": ownerAccount});

	assert.equal(result.length, 1);
	assert.equal(result[0], 1);
    });

    it("should get zero election keys for non owner", async function () {

	var result = await zkpElections.getElectionKeysForOwner.call(
	    {"from": someUserAccount});

	assert.equal(result.length, 1);
	assert.equal(result[0], 0);
    });

    it("should accept another valid vote", async function () {
	
	var electionKey = new bigInt('1');
	var candidateKey = new bigInt('1');
	var receipt = await zkpElections.castVote(
	    electionKey,
	    candidateKey,
	    {"from": voterAccount2});

	var result = await zkpElections.getElection.call(
	    electionKey,
	    {"from": someUserAccount});

	// First candidate now has 2 votes
	assert.equal(result[2][0], 2);	
    });

    it("should not accept vote by non registered voter", async function () {
	
	var electionKey = new bigInt('1');
	var candidateKey = new bigInt('1');
	await truffleAssert.reverts(zkpElections.castVote(
	    electionKey,
	    candidateKey,
	    {"from": someUserAccount}));
    });

    it("should not close by non owner", async function () {
	
	await truffleAssert.reverts(zkpElections.closeElection(
	    1,
	    {"from": someUserAccount}));
    });

    it("should close by owner and not accept more votes", async function () {

	let electionKey = new bigInt('1');
	var receipt = await zkpElections.closeElection(
	    electionKey,
	    {"from": ownerAccount});

	// Check event
	assert.equal(receipt.logs[0].event, "ElectionClosed");
	let eKey = new bigInt(receipt.logs[0].args._electionKey);
	assert(eKey.isEqualTo(electionKey));

	// Should not accept more votes
	await truffleAssert.reverts(zkpElections.castVote(
	    electionKey,
	    bigInt('1'),
	    {"from": voterAccount2}));
    });

    it("should deploy keys in right order", async function () {

	// Add second election
	var receipt = await zkpElections.addElection(
	    electionName2,
	    [candidateName1, candidateName2],
	    [voterAccount1, voterAccount2],
	    {"from": someUserAccount});

	// Check election count
	var electionCount = new bigInt(await zkpElections.electionCount.call());
	assert(electionCount.isEqualTo(bigInt('2')));

	// Check keys for owner of second election
	var keys = await zkpElections.getElectionKeysForOwner(
	    {"from": someUserAccount});
	
	assert.equal(keys.length, 2);
	assert.equal(keys[0], 0);
	assert.equal(keys[1], 1);
	
    });

});
