# Implementing Staking in Solidity


## With a few lines of solidity code you can implement a staking mechanism, one of the most powerful incentive schemes in token economics.


    Any mistakes that I make is an investment in my future. - Rose Namajunas


# Introduction to staking

Someone is said to have a stake in a venture when they contribute some assets in exchange of exercising some level of control, influence, or participation in its activities.

In the cryptocurrency world this is understood as giving users some kind of right or reward for as long as they don’t transfer some tokens in their possession. A staking mechanism usually encourages token holding against token trading, which in turn is expected to drive up the token valuation.

At [TechHQ](http://www.techhq.io) we believe that knowledge exists to be shared, and in this article we are going to show how to implement a staking mechanism in solidity. The whole project including development environment and tests is available from [our public github](https://github.com/HQ20/StakingToken).

To build this staking mechanism we will need:



*   A staking token.
*   Data structures to keep track of stakes, stakeholders and rewards.
*   Methods to create and remove stakes.
*   A rewards system.

Let’s get on with it.


# Staking Token

A staking token can be created as an ERC20 token. I’m going to need SafeMath and Ownable later on, so let’s import and use those as well.


```
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
* @title Staking Token (STK)
* @author Alberto Cuesta Canada
* @notice Implements a basic ERC20 staking token with incentive distribution.
*/
contract StakingToken is ERC20, Ownable {
   using SafeMath for uint256;

   /**
    * @notice The constructor for the Staking Token.
    * @param _owner The address to receive all tokens on construction.
    * @param _supply The amount of tokens to mint on construction.
    */
   constructor(address _owner, uint256 _supply)
       public
   {
       _mint(_owner, _supply);
   }
```


That’s it, nothing else is required.


# Stakeholders

In this implementation we are going to keep track of the stakeholders to facilitate a robust distribution of incentives later on. In theory it would be possible to not keep track of them as a normal ERC20 token would do, but in practice it is difficult to ensure that stakeholders don’t game the distribution system if you don’t track them.

For implementation we will just use a dynamic array of stakeholder addresses.


```
   /**
    * @notice We usually require to know who are all the stakeholders.
    */
   address[] internal stakeholders;
```


The methods implemented allow just to add a stakeholder, remove a stakeholder, and verify whether an address belongs to a stakeholder. Other more efficient implementations are surely possible but I like this one for readability.


```
   /**
    * @notice A method to check if an address is a stakeholder.
    * @param _address The address to verify.
    * @return bool, uint256 Whether the address is a stakeholder,
    * and if so its position in the stakeholders array.
    */
   function isStakeholder(address _address)
       public
       view
       returns(bool, uint256)
   {
       for (uint256 s = 0; s < stakeholders.length; s += 1){
           if (_address == stakeholders[s]) return (true, s);
       }
       return (false, 0);
   }

   /**
    * @notice A method to add a stakeholder.
    * @param _stakeholder The stakeholder to add.
    */
   function addStakeholder(address _stakeholder)
       public
   {
       (bool _isStakeholder, ) = isStakeholder(_stakeholder);
       if(!_isStakeholder) stakeholders.push(_stakeholder);
   }

   /**
    * @notice A method to remove a stakeholder.
    * @param _stakeholder The stakeholder to remove.
    */
   function removeStakeholder(address _stakeholder)
       public
   {
       (bool _isStakeholder, uint256 s) = isStakeholder(_stakeholder);
       if(_isStakeholder){
           stakeholders[s] = stakeholders[stakeholders.length - 1];
           stakeholders.pop();
       }
   }
```



# Stakes

A stake at its simplest form will need to record the _stake size_ and the _stake holder._ A really simple implementation of this could be just a mapping from the address of the stakeholder to the stake size.


```
   /**
    * @notice The stakes for each stakeholder.
    */
   mapping(address => uint256) internal stakes;
```


To make the code more readable I’m going to follow the function names from ERC20 and create equivalents to get the data from the stakes mapping.


```
   /**
    * @notice A method to retrieve the stake for a stakeholder.
    * @param _stakeholder The stakeholder to retrieve the stake for.
    * @return uint256 The amount of wei staked.
    */
   function stakeOf(address _stakeholder)
       public
       view
       returns(uint256)
   {
       return stakes[_stakeholder];
   }

   /**
    * @notice A method to the aggregated stakes from all stakeholders.
    * @return uint256 The aggregated stakes from all stakeholders.
    */
   function totalStakes()
       public
       view
       returns(uint256)
   {
       uint256 _totalStakes = 0;
       for (uint256 s = 0; s < stakeholders.length; s += 1){
           _totalStakes = _totalStakes.add(stakes[stakeholders[s]]);
       }
       return _totalStakes;
   }
```


We are now going to give STK holders the capability to create and remove stakes. We will burn the tokens as they are staked to stop users from transferring them until the stake is removed. 

Please note that on stake creation _burn will revert if the user tries to stake more tokens than he owns, and on stake removal the update of the stakes mapping will revert if there is an attempt to remove more tokens that were staked. 

Finally, we use addStakeholder and removeStakeholder to have a record of who has stakes, to be used later in the rewards system. 


```
   /**
    * @notice A method for a stakeholder to create a stake.
    * @param _stake The size of the stake to be created.
    */
   function createStake(uint256 _stake)
       public
   {
       _burn(msg.sender, _stake);
       if(stakes[msg.sender] == 0) addStakeholder(msg.sender);
       stakes[msg.sender] = stakes[msg.sender].add(_stake);
   }

   /**
    * @notice A method for a stakeholder to remove a stake.
    * @param _stake The size of the stake to be removed.
    */
   function removeStake(uint256 _stake)
       public
   {
       stakes[msg.sender] = stakes[msg.sender].sub(_stake);
       if(stakes[msg.sender] == 0) removeStakeholder(msg.sender);
       _mint(msg.sender, _stake);
   }
```



# Rewards

Rewards mechanisms can have many different implementations and be quite heavy to run. For this contract we will implement a very simple version where the stakeholders periodically receive a reward in STK tokens equivalent to a 1% of their individual stakes. 

In more sophisticated contracts the distribution of rewards would be automatically triggered when certain conditions are met, but in this case we will let the owner trigger it manually. Following best practice we will also keep track of the rewards and implement a method to withdraw them.

As before, to make the code readable we have followed the naming conventions from the ERC20.sol contract, first the data structure and data management methods:


```
   /**
    * @notice The accumulated rewards for each stakeholder.
    */
   mapping(address => uint256) internal rewards;


   /**
    * @notice A method to allow a stakeholder to check his rewards.
    * @param _stakeholder The stakeholder to check rewards for.
    */
   function rewardOf(address _stakeholder)
       public
       view
       returns(uint256)
   {
       return rewards[_stakeholder];
   }

   /**
    * @notice A method to the aggregated rewards from all stakeholders.
    * @return uint256 The aggregated rewards from all stakeholders.
    */
   function totalRewards()
       public
       view
       returns(uint256)
   {
       uint256 _totalRewards = 0;
       for (uint256 s = 0; s < stakeholders.length; s += 1){
           _totalRewards = _totalRewards.add(rewards[stakeholders[s]]);
       }
       return _totalRewards;
   }
```


Follow the methods to calculate, distribute and withdraw rewards:


```
   /**
    * @notice A simple method that calculates the rewards for each stakeholder.
    * @param _stakeholder The stakeholder to calculate rewards for.
    */
   function calculateReward(address _stakeholder)
       public
       view
       returns(uint256)
   {
       return stakes[_stakeholder] / 100;
   }

   /**
    * @notice A method to distribute rewards to all stakeholders.
    */
   function distributeRewards()
       public
       onlyOwner
   {
       for (uint256 s = 0; s < stakeholders.length; s += 1){
           address stakeholder = stakeholders[s];
           uint256 reward = calculateReward(stakeholder);
           rewards[stakeholder] = rewards[stakeholder].add(reward);
       }
   }

   /**
    * @notice A method to allow a stakeholder to withdraw his rewards.
    */
   function withdrawReward()
       public
   {
       uint256 reward = rewards[msg.sender];
       rewards[msg.sender] = 0;
       _mint(msg.sender, reward);
   }
```



# Testing

No contract can be complete without a comprehensive set of tests. I tend to produce a bug per function at least, and often things don’t work the way I think they do. You could say I get things wrong most of the time, and surely I'm not alone in this. 

Apart from allowing you to produce code that works, tests also are quite useful in developing a process to set up and use contracts. I always write my Getting Started documentation from the code that sets up the environment for the tests.

Follows an extract of how the test environment is set up and used. We will mint 1000 STK tokens and give them to a user to play with the system. We use truffle for testing which gives us the accounts to use.


```
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
```


When creating tests I always write the tests that make the code revert, but those are not very interesting to see. The test for createStake shows what needs to be done to create a stake, and what should change afterwards. 

It is important to notice how in this staking contract we have two parallel data structures, one for STK balances and one for stakes and how their sum remains constant through stake creation and removal. In this example we give 3 STK wei to the user, and the sum of balance plus stakes for that user will always be 3.


```
       it('createStake creates a stake.', async () => {
           await stakingToken.transfer(user, 3, { from: owner });
           await stakingToken.createStake(1, { from: user });

           assert.equal(await stakingToken.balanceOf(user), 2);
           assert.equal(await stakingToken.stakeOf(user), 1);
           assert.equal(
               await stakingToken.totalSupply(), 
               manyTokens.minus(1).toString(10),
           );
           assert.equal(await stakingToken.totalStakes(), 1);
       });
```


For rewards, the test below shows how the owner fires up the distribution of fees, with the user getting a reward of a 1% of his stake.


```
       it('rewards are distributed.', async () => {
           await stakingToken.transfer(user, 100, { from: owner });
           await stakingToken.createStake(100, { from: user });
           await stakingToken.distributeRewards({ from: owner });


           assert.equal(await stakingToken.rewardOf(user), 1);
           assert.equal(await stakingToken.totalRewards(), 1);
       });
```


The total supply for STK is increased when rewards are distributed, and this test shows how the three data structures (balances, stakes and rewards) relate to each other. The amount of existing and promised STK will always be the amount minted on creation plus the amount distributed in rewards, which might or might not be minted. The amount of STK minted on creation will be equal to the sum of balances and stakes until a distribution is done.


```
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
               initialSupply
                   .minus(existingStakes)
                   .plus(mintedAndWithdrawn)
                   .toString(10)
               );
           assert.equal(await stakingToken.totalStakes(), 100);
           assert.equal(await stakingToken.totalRewards(), 0);
       });
```



# Conclusion

A staking and rewards mechanism is a powerful incentive tool that only needs to be as complex as we want to make it. The methods provided in the ERC20 standard and SafeMath allows us to code it in about 200 lines of sparse code. 

Please feel free to use the code in[ our public github](https://github.com/HQ20/StakingToken) for your own purposes, or to[ contact us](https://www.techhq.io/#GetinTouch) if you would like our help to implement a production version of this pattern.


# Thanks

Thanks to [Vlad Fărcaş](https://www.linkedin.com/in/vladsilviufarcas/) for inspiring some of this code, to [Sergio Pereira](https://www.linkedin.com/in/sergiomcpereira/) and [Tiago Martins](https://www.linkedin.com/in/temmartins/) for their reviews for publication and especially to [Bernardo Vieira](https://www.linkedin.com/in/obernardovieira/) for teaching me how to do real world blockchain applications.
