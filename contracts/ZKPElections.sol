pragma solidity ^0.5.11;

contract ZKPElections {

  enum VoterStatus { NoStatus, AwaitingVote, CastVote }
 
  struct Candidate {
    uint name;
    uint voteCount;
  }
 
  struct Election {
    address owner;
    bool isClosed;
        
    mapping (uint => Candidate) candidates;
    uint candidateCount;

    mapping (address => VoterStatus) voterToStatus;
    uint voterCount;
  }
 
  mapping (uint => Election) public elections;
  uint public electionCount;

  event ElectionAdded(uint _electionKey);
  event ElectionClosed(uint _electionKey);
  event VoteCast(uint _electionKey, uint _candidateKey);
  
  function addElection(uint [] calldata _candidates,
		       address [] calldata _voterAddresses) external {
        
    require(_candidates.length >= 1);
    require(_voterAddresses.length >= 1);
        
    electionCount += 1;
    Election storage election = elections[electionCount];
        
    election.owner = msg.sender;
    election.isClosed = false;
    election.candidateCount = _candidates.length;
    election.voterCount = _voterAddresses.length;
        
    for (uint i = 1; i <= _candidates.length; i ++ ) {
      for (uint j = 1; j <= _candidates.length; j ++) {
	election.candidates[j].name = _candidates[j-1];
      }
      for (uint j = 1; j <= _voterAddresses.length; j ++) {
	election.voterToStatus[_voterAddresses[j-1]] = VoterStatus.AwaitingVote;
      }           
    }

    emit ElectionAdded(electionCount);
  }
    
  function getElection(uint _electionKey)
    external view returns (uint [] memory, uint [] memory, uint, bool) {
        
    require (_electionKey <= electionCount);
        
    Election storage election = elections[_electionKey];
    uint cnt = election.candidateCount;
    uint [] memory cands = new uint[](cnt);
    uint [] memory vCnts = new uint[](cnt);
        
    for (uint i = 1; i <= cnt; i ++ ) {
      cands[i-1] = election.candidates[i].name;
      vCnts[i-1] = election.candidates[i].voteCount;
    }
        
    return (cands, vCnts, election.voterCount, election.isClosed);
  }

  function getElectionKeysForOwner()
    external view returns (uint [] memory) {

    uint keyCount = 0;
    for (uint i = 1; i <= electionCount; i ++) {
      if (elections[i].owner == msg.sender) {
	keyCount += 1;
      }
    }

    uint [] memory keys;
    if (keyCount == 0) {
      keys = new uint[](1);
      keys[0] = 0;

    } else {
    
      keys = new uint[](keyCount);
      keyCount = 0;
      for (uint i = 1; i <= electionCount; i ++) {
	if (elections[i].owner == msg.sender) {
	  keys[keyCount] = i;
	  keyCount += 1;
	}
      }
    }
    return keys;
  }
  

  function getVoterStatus(uint _electionKey, uint _voterKey)
    external view returns (VoterStatus) {

    require(_electionKey <= electionCount);
    require(_voterKey <= elections[_electionKey].voterCount);
    return elections[_electionKey].voterToStatus[msg.sender];
  }
  
  
  function castVote(uint _electionKey, uint _candidateKey) external {
    require(_electionKey <= electionCount);
        
    Election storage election = elections[_electionKey];
    require(!election.isClosed);
    require(election.voterToStatus[msg.sender] == VoterStatus.AwaitingVote);
    require(_candidateKey <= election.candidateCount);
        
    election.candidates[_candidateKey].voteCount += 1;
    election.voterToStatus[msg.sender] = VoterStatus.CastVote;

    emit VoteCast(_electionKey, _candidateKey);
  }
    
  function closeElection(uint _electionKey) external {
    require (_electionKey <= electionCount);
    Election storage election = elections[_electionKey];
    require (election.owner == msg.sender);
    require(!election.isClosed);
    election.isClosed = true;
        
    emit ElectionClosed(_electionKey);
  }
}
