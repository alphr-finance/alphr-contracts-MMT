pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name_, string memory symbol_)
        public
        ERC20(name_, symbol_)
    {}

    function mint() public {
        _mint(msg.sender, 100 ether);
    }
}
