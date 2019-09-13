pragma solidity ^0.5.11;


contract ZKPElections {

  address owner;

  // Data struture
  struct Vote {
    address addr;
  }

  struct Candidate {
    address addr;
    string name;
    string submission;

    mapping (uint => Vote) votes;
    uint voteCount;
  }

  struct Election {
    address ownerAddr;
    string ownerName;
    string challenge;
    uint prizeMoneyWei;

    mapping (uint => Candidate) candidates;
    uint candidateCount;
  }

  mapping (uint => Election) elections;
  uint public electionCount;

  event ElectionAdded(uint _electionCount, uint _prizeMoneyWei);
  event CandidateAdded(uint _candidateCount, string _candidateName);
  event VoteCast(string _candidateName, address _voterAddr);

  // Admin and required functions
  constructor() public {
    owner = msg.sender;
  }

  function () payable external {}

  function withdraw(uint _valueWei) external {
    require(msg.sender == owner);
    msg.sender.transfer(_valueWei);
  }

  function addElection(string calldata _ownerName,
		       string calldata _challenge) payable external {

    require(msg.value > 1000);
    electionCount += 1;
    elections[electionCount].ownerAddr = msg.sender;
    elections[electionCount].ownerName = _ownerName;
    elections[electionCount].challenge = _challenge;
    elections[electionCount].prizeMoneyWei = msg.value;
    emit ElectionAdded(electionCount, msg.value);
  }

  function getElection(uint _electionIndex)
    public view returns (string memory, uint, uint) {
    
    require(_electionIndex > 0);
    require(_electionIndex <= electionCount);

    return (elections[_electionIndex].challenge,
	    elections[_electionIndex].prizeMoneyWei,
	    elections[_electionIndex].candidateCount);
  }
  
  function addCandidate(uint _electionIndex,
			string calldata _name,
			string calldata _submission) payable external {

    // Check electionIndex validity
    require(_electionIndex > 0);
    require(_electionIndex <= electionCount);
    Election storage election = elections[_electionIndex];

    // Check candidate not already there
    for (uint idx = 1; idx <= election.candidateCount; idx ++) {
      require(!stringsAreEqual(election.candidates[idx].submission, _submission));
    }

    // Add candidate
    election.candidateCount += 1;
    election.candidates[election.candidateCount].addr = msg.sender;
    election.candidates[election.candidateCount].name = _name;
    election.candidates[election.candidateCount].submission = _submission;
    
    emit CandidateAdded(election.candidateCount, _name);
  }
  
  function getCandidate(uint _electionIndex, uint _candidateIndex)
    public view returns (string memory, string memory) {

    require(_electionIndex > 0);
    require(_electionIndex <= electionCount);
    require(_candidateIndex > 0);
    require(_candidateIndex <= elections[_electionIndex].candidateCount);
    Candidate memory candidate = elections[_electionIndex].candidates[_candidateIndex];
    return (candidate.name, candidate.submission);
  }

  function stringsAreEqual(string storage ss, string memory sm) internal view returns (bool) {
    bytes storage bs = bytes(ss);
    bytes memory bm = bytes(sm);
    if (bs.length != bm.length) {
      return false;
    }
    for (uint i=0; i<bs.length; i++){
      if (bs[i] != bm[i]) {
	return false;
      }
    }
    return true;
  }
  
}
