var taskToken = artifacts.require("taskToken");

module.exports = function(deployer) {
    deployer.deploy(taskToken);
};
