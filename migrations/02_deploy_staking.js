const BigNumber = require('bignumber.js');

const TestStakingToken = artifacts.require('./TestStakingToken.sol');

module.exports = (deployer, network, accounts) => {
    deployer.deploy(
        TestStakingToken,
        'Test Staking Token',
        'TST',
        accounts[1],
        new BigNumber(10).pow(18).multipliedBy(525).toString(10),
    );
};
