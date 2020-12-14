pragma solidity >=0.6.0 <0.8.0;

import "./StakingToken.sol";


/**
 * @title Test Staking Token (TST)
 * @author Dusan Perisic
 * @notice Implementation of an abstract Staking Token.
 */
contract TestStakingToken is StakingToken {
    /**
     * @notice The constructor for the Staking Token.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _owner The address to receive all tokens on construction.
     * @param _supply The amount of tokens to mint on construction.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner,
        uint256 _supply
    )
    public
    StakingToken(_name, _symbol)
    {
        _mint(_owner, _supply);
    }
}
