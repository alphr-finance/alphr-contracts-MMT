// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FeeStorage.sol";

contract ManualTrade is Ownable {
    using SafeMath for uint256;

    uint256 private feeQuota;
    uint256 private feeQuotaDecimals;

    FeeStorage private feeStorage;
    IUniswapV2Router02 private uniswap;

    constructor(
        address payable _feeStorage,
        uint256 _feeQuota,
        uint256 _feeQuotaDecimals,
        address _uniswap
    ) {
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

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path
    ) public payable {
        // step 0: calculate fee amount
        uint256 feeAmount =
            calculateFee(feeQuota, feeQuotaDecimals, 18, msg.value);

        // step 1: sub fee from amountIn
        uint256 swapAmountIn = uint256(msg.value).sub(feeAmount);

        // step 2: execute swap
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
        uint256 feeAmount =
            _amount.mul(feeQuoteNormalized).div(10**_tokenDecimals);
        return feeAmount;
    }
}
