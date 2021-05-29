// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IWETH9.sol";

contract FeeStorage is Ownable, AccessControl {
  using SafeERC20 for IERC20;
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 public constant TOKEN_LIST_OPERATOR_ROLE =
    keccak256("TOKEN_LIST_OPERATOR_ROLE");

  address private alphrTokenAddress;
  address private uniswapRouterAddress;

  event SendETH(uint256, address);

  // Function to receive Ether. msg.data must be empty
  receive() external payable {}

  // Fallback function is called when msg.data is not empty
  fallback() external payable {}

  function addTokenOperatorRole(address to) public onlyOwner {
    _setupRole(TOKEN_LIST_OPERATOR_ROLE, to);
  }

  function swapToETHAndSend(address payable _to) external payable onlyOwner {
    for (uint256 index = EnumerableSet.length(tokens); index > 0; index--) {
      address token = EnumerableSet.at(tokens, index - 1);
      uint256 balance = IERC20(token).balanceOf(address(this));

      // USDT approve doesn’t comply with the ERC20 standard
      IERC20(token).safeApprove(uniswapRouterAddress, balance);

      // can not use swapExactTokensForETH if token is WETH
      if (token == IUniswapV2Router02(uniswapRouterAddress).WETH()) {
        // unwrap WETH
        IWETH9(token).withdraw(IERC20(token).balanceOf(address(this)));
        // transfer ETH to Fee Storage
        IERC20(token).transfer(
          address(this),
          IERC20(token).balanceOf(address(this))
        );

        continue;
      }

      address[] memory path = new address[](2);
      path[0] = token;
      path[1] = IUniswapV2Router02(uniswapRouterAddress).WETH();

      uint256[] memory amounts =
        IUniswapV2Router02(uniswapRouterAddress).getAmountsOut(balance, path);

      uint256 amountOutMin = amounts[1];
      IUniswapV2Router02(uniswapRouterAddress).swapExactTokensForETH(
        balance,
        amountOutMin,
        path,
        address(this),
        block.timestamp
      );
    }

    _to.transfer(address(this).balance);
    emit SendETH(address(this).balance, _to);
  }

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function setAlphrTokenAddress(address _alphrTokenAddress) external onlyOwner {
    alphrTokenAddress = _alphrTokenAddress;
  }

  function setUniswapRouterAddress(address _uniswapRouterAddress)
    external
    onlyOwner
  {
    uniswapRouterAddress = _uniswapRouterAddress;
  }

  function addTokenToBalanceList(address token) external {
    require(
      hasRole(TOKEN_LIST_OPERATOR_ROLE, msg.sender),
      "Caller is not a token list operator"
    );
    tokens.add(token);
  }

  function getNumberOfTokens() external view onlyOwner returns (uint256) {
    return EnumerableSet.length(tokens);
  }

  /**
   * @dev returns array of token addresses which are on balance of FeeStorage
   */
  function getAddressesOfTokens()
    external
    view
    returns (address[] memory tokenAddresses)
  {
    tokenAddresses = new address[](tokens.length());
    for (uint256 i = 0; i < tokens.length(); i++) {
      tokenAddresses[i] = tokens.at(i);
    }
  }
}
