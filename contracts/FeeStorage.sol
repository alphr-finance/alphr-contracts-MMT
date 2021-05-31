// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IWETH9.sol";

contract FeeStorage is Ownable, AccessControl {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  address private alphrTokenAddress;
  address private uniswapRouterAddress;
  address private vaultAddress;

  event SendETH(uint256, address);

  constructor(address _alphrToken, address _uniswapRouter, address _vault) public {
    alphrTokenAddress = _alphrToken;
    uniswapRouterAddress = _uniswapRouter;
    vaultAddress = _vault;
  }

  // Function to receive Ether. msg.data must be empty
  receive() external payable {}

  // Fallback function is called when msg.data is not empty
  fallback() external payable {}

  function swapToETHAndSend(address[] memory tokens, address payable _to)
    external
    onlyOwner
  {
    for (uint256 index = 0; index < tokens.length; index++) {
      address token = tokens[index];
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
  }

  function sendToken(address token, address to) public onlyOwner {
    uint256 balance = IERC20(token).balanceOf(address(this));
    IERC20(token).safeTransfer(to, balance);
  }

  function send(address payable _to) public onlyOwner {
    uint amount = address(this).balance;
    uint vaultShare = amount.mul(25).div(100);

    (bool successVault, ) = payable(vaultAddress).call{value: vaultShare}("");
    require(successVault, "failed to send eth to vault address");

    (bool success, ) = _to.call{value: amount.sub(vaultShare)}("");
    require(success, "failed to send eth to msg.seder");

    emit SendETH(address(this).balance, _to);
  }

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function setAlphrTokenAddress(address _alphrTokenAddress) public onlyOwner {
    alphrTokenAddress = _alphrTokenAddress;
  }

  function setVaultAddress(address _vault) public onlyOwner {
    vaultAddress = _vault;
  }

  function setUniswapRouterAddress(address _uniswapRouterAddress)
    public
    onlyOwner
  {
    uniswapRouterAddress = _uniswapRouterAddress;
  }
}
