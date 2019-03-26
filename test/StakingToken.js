const StakingToken = artifacts.require('./StakingToken.sol');

const BigNumber = require('bignumber.js');
const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('StakingToken', (accounts) => {
    let stakingToken;
    const manyTokens = BigNumber(10).pow(18).multipliedBy(1000);
    const owner = accounts[0];
    const user = accounts[1];

    before(async () => {
        stakingToken = await StakingToken.deployed();
    });

    describe('Staking', () => {
        beforeEach(async () => {
            stakingToken = await StakingToken.new(
                owner,
                manyTokens.toString(10)
            );
        });

        itShouldThrow(
            'createStake requires a StakingToken balance equal or above the stake.',
            async () => {    
                await stakingToken.createStake(1, { from: user });
            },
            'revert',
        );

        it('createStake creates a stake.', async () => {
            await stakingToken.transfer(user, 3, { from: owner });
            await stakingToken.createStake(1, { from: user });

            assert.equal(await stakingToken.balanceOf(user), 2);
            assert.equal(await stakingToken.stakeOf(user), 1);
            assert.equal(await stakingToken.totalSupply(), manyTokens.minus(1).toString(10));
            assert.equal(await stakingToken.totalStakes(), 1);
        });

        it('createStake adds a stakeholder.', async () => {
            await stakingToken.transfer(user, 3, { from: owner });
            await stakingToken.createStake(1, { from: user });
            
            assert.isTrue((await stakingToken.isStakeholder(user))[0]);
        });

        itShouldThrow(
            'removeStake requires a stake equal or above the amount to remove.',
            async () => {    
                await stakingToken.removeStake(1, { from: user });
            },
            'revert',
        );

        it('removeStake removes a stake.', async () => {
            await stakingToken.transfer(user, 3, { from: owner });
            await stakingToken.createStake(3, { from: user });
            await stakingToken.removeStake(1, { from: user });

            assert.equal(await stakingToken.balanceOf(user), 1);
            assert.equal(await stakingToken.stakeOf(user), 2);
            assert.equal(await stakingToken.totalSupply(), manyTokens.minus(2).toString(10));
            assert.equal(await stakingToken.totalStakes(), 2);
        });

        it('removeStake removes a stakeholder.', async () => {
            await stakingToken.transfer(user, 3, { from: owner });
            await stakingToken.createStake(3, { from: user });
            await stakingToken.removeStake(3, { from: user });

            assert.isFalse((await stakingToken.isStakeholder(user))[0]);
        });

        itShouldThrow(
            'rewards can only be distributed by the contract owner.',
            async () => {    
                await stakingToken.distributeRewards({ from: user });
            },
            'revert',
        );

        it('rewards are distributed.', async () => {
            await stakingToken.transfer(user, 100, { from: owner });
            await stakingToken.createStake(100, { from: user });
            await stakingToken.distributeRewards({ from: owner });
            
            assert.equal(await stakingToken.rewardOf(user), 1);
            assert.equal(await stakingToken.totalRewards(), 1);
        });

        it('rewards can be withdrawn.', async () => {
            await stakingToken.transfer(user, 100, { from: owner });
            await stakingToken.createStake(100, { from: user });
            await stakingToken.distributeRewards({ from: owner });
            await stakingToken.withdrawReward({ from: user });
            
            const initialSupply = manyTokens;
            const existingStakes = 100;
            const mintedAndWithdrawn = 1;

            assert.equal(await stakingToken.balanceOf(user), 1);
            assert.equal(await stakingToken.stakeOf(user), 100);
            assert.equal(await stakingToken.rewardOf(user), 0);
            assert.equal(
                await stakingToken.totalSupply(), 
                initialSupply.minus(existingStakes).plus(mintedAndWithdrawn).toString(10));
            assert.equal(await stakingToken.totalStakes(), 100);
            assert.equal(await stakingToken.totalRewards(), 0);
        });
    });
});
