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

  address payable private feeStorage;
  IUniswapV2Router02 private uniswap;

  constructor(
    address payable _feeStorage,
    uint256 _feeQuota,
    uint256 _feeQuotaDecimals,
    address _uniswap
  ) public {
    feeQuota = _feeQuota;
    feeQuotaDecimals = _feeQuotaDecimals;
    feeStorage = _feeStorage;
    uniswap = IUniswapV2Router02(_uniswap);
  }

  // Function to receive Ether. msg.data must be empty
  receive() external payable {}

  // Fallback function is called when msg.data is not empty
  fallback() external payable {}

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

    // step 1: approve uniswap router
    require(IERC20(tokenIn).approve(address(uniswap), amountIn));

    // step 2: calculate fee amount
    uint256 tokenInDecimals = ERC20(tokenIn).decimals();
    uint256 feeAmount =
      calculateFee(feeQuota, feeQuotaDecimals, tokenInDecimals, amountIn);

    // step 3: swap fee to eth and send to FeeStorage address
    // can fail if no pair
    address[] memory feePath = new address[](2);
    feePath[0] = tokenIn;
    feePath[1] = uniswap.WETH();

    uint256[] memory amounts = uniswap.getAmountsOut(feeAmount, feePath);
    uint256 amountFeeOutMin = amounts[1];
    uniswap.swapExactTokensForETH(
      feeAmount,
      amountFeeOutMin,
      feePath,
      feeStorage,
      block.timestamp
    );

    // step 4: sub fee from amountIn
    uint256 swapAmountIn = amountIn.sub(feeAmount);

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

    // step 0: transfer tokenIn from user to contract's balance
    require(
      ERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
      "low allowance for contract"
    );

    // step 1: approve uniswap router
    require(IERC20(tokenIn).approve(address(uniswap), amountIn));
    // step 2: execute swap
    uniswap.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      address(this),
      block.timestamp
    );
    // step 3: send eth fee and eth swap result
    // step 3.1: calculate eth fee amount
    //    uint256 feeAmount =
    //      calculateFee(feeQuota, feeQuotaDecimals, 18, address(this).balance);
    //step 3.2: send eth fee amount to fee feeStorage
    //    (bool feeSuccess, ) = feeStorage.call{value: feeAmount}("");
    //    require(
    //      feeSuccess,
    //      "failed to send eth fee amount to fee storage contract"
    //    );
    // step 3.3: send rest of eth to msg.sender
    //    (bool swapSuccess, ) = msg.sender.call{value: address(this).balance}("");
    //    require(swapSuccess, "failed to send eth to msg.seder");
  }

  function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path)
    public
    payable
  {
    // step 0: calculate fee amount
    uint256 feeAmount = calculateFee(feeQuota, feeQuotaDecimals, 18, msg.value);

    // step 1: sub fee from amountIn
    uint256 swapAmountIn = uint256(msg.value).sub(feeAmount);

    (bool sent, ) = address(feeStorage).call{value: feeAmount}("");
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
    uint256 _feeQuota,
    uint256 _feeQuotaDecimals,
    uint256 _tokenDecimals,
    uint256 _amount
  ) public pure returns (uint256) {
    uint256 feeQuoteNormalized =
      _feeQuota.mul(10**_tokenDecimals).div(_feeQuotaDecimals);

    uint256 feeAmount = _amount.mul(feeQuoteNormalized).div(10**_tokenDecimals);
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
