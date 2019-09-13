const ZKPElections = artifacts.require("ZKPElections");

module.exports = function(deployer) {
    console.log("Deploying ZKPElections");
    deployer.deploy(ZKPElections);
};
