var verifierArtifact = artifacts.require("contracts/Verifier.sol");


contract("Test verifier", function(accounts) {

    const ownerAccount = accounts[0];
    const proof_valid = {
        "proof": {
            "a": ["0x22dd7d1382e839ab9fd86bff623cdc78a388125b7df85bfd338354b6be0be91d",
		  "0x1e70611c0410207d5f9d96e928560e553ae12866a2533369fc46fa57091227bc"],
            "b": [["0x229dc2a46a27e47058b917eb62ed4c0f3c03d7de2abc338b6c9b6781c02d6b34",
		   "0x093d3b9f5b937f39c851f16a0c3aa32de5b8acbdc5e55f5800c7cfdb09cdf665"],
		  ["0x2f67f34cc02f4ca52d7a3bb0b41cf98e27283c860e5acc5cf9178bf47e3f5c8f",
		   "0x057e0212034a5fb2ac1ddba4eabec7f4fd6e961db920c21a14b2d5e9063ebbc1"]],
            "c": ["0x179899195f3c1bcc7436c529913f0ceb0e229d90696cdddc3c7f454aec442aea",
		  "0x037b41121cf1d52c2fb48967b184315ef073561df8ed559b2b4c69553492571f"]
        },
        "inputs": ["0x0000000000000000000000000000000000000000000000000000000000000003",
		   "0x0000000000000000000000000000000000000000000000000000000000000002",
		   "0x0000000000000000000000000000000000000000000000000000000000000000",
		   "0x00000000000000000000000000000000c6481e22c5ff4164af680b8cfaa5e8ed",
		   "0x000000000000000000000000000000003120eeff89c4f307c4a6faaae059ce10",
		   "0x0000000000000000000000000000000000000000000000000000000000000001"]
    };
    
    it("should verify valid proof", async function () {

	var verifier = await verifierArtifact.new({"from": ownerAccount});
	var tx_receipt = await verifier.verifyTx(
	    proof_valid["proof"]["a"],
	    proof_valid["proof"]["b"],
	    proof_valid["proof"]["c"],
	    proof_valid["inputs"],
	    {"from": ownerAccount});

	assert.equal(tx_receipt.logs[0]["event"], "Verified");
    });


    const proof_invalid_output = {
        "proof": {
            "a": ["0x22dd7d1382e839ab9fd86bff623cdc78a388125b7df85bfd338354b6be0be91d",
		  "0x1e70611c0410207d5f9d96e928560e553ae12866a2533369fc46fa57091227bc"],
            "b": [["0x229dc2a46a27e47058b917eb62ed4c0f3c03d7de2abc338b6c9b6781c02d6b34",
		   "0x093d3b9f5b937f39c851f16a0c3aa32de5b8acbdc5e55f5800c7cfdb09cdf665"],
		  ["0x2f67f34cc02f4ca52d7a3bb0b41cf98e27283c860e5acc5cf9178bf47e3f5c8f",
		   "0x057e0212034a5fb2ac1ddba4eabec7f4fd6e961db920c21a14b2d5e9063ebbc1"]],
            "c": ["0x179899195f3c1bcc7436c529913f0ceb0e229d90696cdddc3c7f454aec442aea",
		  "0x037b41121cf1d52c2fb48967b184315ef073561df8ed559b2b4c69553492571f"]
        },
        "inputs": ["0x0000000000000000000000000000000000000000000000000000000000000003",
		   "0x0000000000000000000000000000000000000000000000000000000000000002",
		   "0x0000000000000000000000000000000000000000000000000000000000000000",
		   "0x00000000000000000000000000000000c6481e22c5ff4164af680b8cfaa5e8ed",
		   "0x000000000000000000000000000000003120eeff89c4f307c4a6faaae059ce10",
		   "0x0000000000000000000000000000000000000000000000000000000000000000"]
    };
    
    it("should not verify proof with invalid output", async function () {

	var verifier = await verifierArtifact.new({"from": ownerAccount});
	var tx_receipt = await verifier.verifyTx(
	    proof_invalid_output["proof"]["a"],
	    proof_invalid_output["proof"]["b"],
	    proof_invalid_output["proof"]["c"],
	    proof_invalid_output["inputs"],
	    {"from": ownerAccount});

	assert.equal(tx_receipt.logs.length, 0);
    });
});
