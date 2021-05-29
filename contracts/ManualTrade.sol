// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./FeeStorage.sol";

contract ManualTrade is Ownable {
  using SafeMath for uint256;

  event NewManualTrade(
    address indexed tokenIn,
    address indexed tokenOut,
    uint256 amountIn,
    uint256 amountOut
  );

  uint256 private feeQuota;
  uint256 private feeQuotaDecimals;

  FeeStorage private feeStorage;
  IUniswapV2Router02 private uniswap;

  constructor(
    address payable _feeStorage,
    uint256 _feeQuota,
    uint256 _feeQuotaDecimals,
    address _uniswap
  ) public {
    feeQuota = _feeQuota;
    feeQuotaDecimals = _feeQuotaDecimals;
    feeStorage = FeeStorage(_feeStorage);
    uniswap = IUniswapV2Router02(_uniswap);
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path
  ) public {
    address tokenIn = path[0];

    // step 0: transfer tokenIn from user to contracts balance
    require(
      ERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
      "low allowance for contract"
    );

    // step 1: calculate fee amount
    uint256 tokenInDecimals = ERC20(tokenIn).decimals();
    uint256 feeAmount =
      calculateFee(feeQuota, feeQuotaDecimals, tokenInDecimals, amountIn);

    // step 2: sub fee from amountIn
    uint256 swapAmountIn = amountIn.sub(feeAmount);

    // step 3: approve uniswap router
    require(IERC20(tokenIn).approve(address(uniswap), swapAmountIn));

    // step 4: send token to feeStorage
    ERC20(tokenIn).transfer(address(feeStorage), feeAmount);

    // step 5: execute swap
    uniswap.swapExactTokensForTokens(
      swapAmountIn,
      amountOutMin,
      path,
      msg.sender,
      block.timestamp
    );
  }

  function swapExactTokensForETH(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path
  ) public {
    address tokenIn = path[0];

    // step 0: transfer tokenIn from user to cotnracts balance
    require(
      ERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
      "low allowance for contract"
    );

    // step 1: calculate fee amount
    uint256 tokenInDecimals = ERC20(tokenIn).decimals();
    uint256 feeAmount =
      calculateFee(feeQuota, feeQuotaDecimals, tokenInDecimals, amountIn);

    // step 2: sub fee from amountIn
    uint256 swapAmountIn = amountIn.sub(feeAmount);
    // step 3: approve uniswap router
    require(IERC20(tokenIn).approve(address(uniswap), swapAmountIn));

    // step 4: send token to feeStorage
    ERC20(tokenIn).transfer(address(feeStorage), feeAmount);

    // step 5: execute swap
    uniswap.swapExactTokensForETH(
      swapAmountIn,
      amountOutMin,
      path,
      msg.sender,
      block.timestamp
    );
  }

  function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path)
    public
    payable
  {
    // step 0: calculate fee amount
    uint256 feeAmount = calculateFee(feeQuota, feeQuotaDecimals, 18, msg.value);

    // step 1: sub fee from amountIn
    uint256 swapAmountIn = uint256(msg.value).sub(feeAmount);

    (bool sent, bytes memory result) =
      address(feeStorage).call{value: feeAmount}("");
    require(sent, "Failed to sent fee");
    // step 3: execute swap
    uniswap.swapExactETHForTokens{value: swapAmountIn}(
      amountOutMin,
      path,
      msg.sender,
      block.timestamp
    );
  }

  function setFeeQuota(uint256 _feeQuota, uint256 _feeQuotaDecimals)
    public
    onlyOwner
  {
    feeQuota = _feeQuota;
    feeQuotaDecimals = _feeQuotaDecimals;
  }

  function calculateFee(
    uint256 feeQuota,
    uint256 feeQuotaDecimals,
    uint256 tokenDecimals,
    uint256 amount
  ) public view returns (uint256) {
    uint256 feeQuoteNormalized =
      feeQuota.mul(10**tokenDecimals).div(feeQuotaDecimals);

    uint256 feeAmount = amount.mul(feeQuoteNormalized).div(10**tokenDecimals);
    return feeAmount;
  }

  function getAmountsOut(uint256 amountIn, address[] memory path)
    public
    view
    returns (uint256)
  {
    address tokenIn = path[0];
    uint256 tokenInDecimals = ERC20(tokenIn).decimals();
    uint256 feeAmount =
      calculateFee(feeQuota, feeQuotaDecimals, tokenInDecimals, amountIn);
    uint256 amountInWoFee = amountIn.sub(feeAmount);
    uint256[] memory amountsOut = uniswap.getAmountsOut(amountInWoFee, path);
    return amountsOut[amountsOut.length - 1];
  }
}
