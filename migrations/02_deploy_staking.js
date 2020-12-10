const BigNumber = require('bignumber.js');

const StakingToken = artifacts.require('./StakingToken.sol');

module.exports = (deployer, network, accounts) => {
    deployer.deploy(
        StakingToken,
        'Staking Token',
        'STT',
        accounts[1],
        new BigNumber(10).pow(18).multipliedBy(525).toString(10),
    );
};
