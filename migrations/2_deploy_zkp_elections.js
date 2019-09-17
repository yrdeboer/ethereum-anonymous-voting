const ZKPElections = artifacts.require("ZKPElections");

module.exports = function(deployer) {
    deployer.deploy(ZKPElections);
};
