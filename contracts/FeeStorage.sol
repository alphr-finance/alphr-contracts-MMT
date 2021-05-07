// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract FeeStorage is Ownable {
    address private alphrTokenAddress;
    address private uniswapRouterAddress;
    EnumerableSet.AddressSet private tokens;

    event SendETH(uint256, address, bytes);

    function swapToETHAndSend(address payable _to) external onlyOwner {
        for (uint256 index = EnumerableSet.length(tokens); index > 0; index--) {
            address token = EnumerableSet.at(tokens, index - 1);
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).approve(uniswapRouterAddress, balance);

            address[] memory path = new address[](2);
            path[0] = token;
            path[1] = IUniswapV2Router02(uniswapRouterAddress).WETH();

            uint256[] memory amounts =
                IUniswapV2Router02(uniswapRouterAddress).getAmountsOut(
                    balance,
                    path
                );

            uint256 amountOutMin = amounts[1];
            uint256[] memory ethAmounts =
                IUniswapV2Router02(uniswapRouterAddress).swapExactTokensForETH(
                    balance,
                    amountOutMin,
                    path,
                    address(this),
                    block.timestamp
                );

            (bool sent, bytes memory data) = _to.call{value: ethAmounts[1]}("");
            require(sent, "Failed to send Ether");
            emit SendETH(ethAmounts[1], _to, data);
        }
    }

    function swapTokensForAlphrAndBurn() external onlyOwner {
        for (uint256 index = EnumerableSet.length(tokens); index > 0; index--) {
            address token = EnumerableSet.at(tokens, index - 1);
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).approve(uniswapRouterAddress, balance);
            address[] memory path = new address[](2);
            path[0] = token;
            path[1] = alphrTokenAddress;
            uint256[] memory amounts =
                IUniswapV2Router02(uniswapRouterAddress).getAmountsOut(
                    balance,
                    path
                );
            uint256 amountOutMin = amounts[1];
            IUniswapV2Router02(uniswapRouterAddress).swapExactTokensForTokens(
                balance,
                amountOutMin,
                path,
                address(this),
                block.timestamp
            );
        }

        uint256 alphrBalance =
            IERC20(alphrTokenAddress).balanceOf(address(this));
        ERC20Burnable(alphrTokenAddress).burn(alphrBalance);
    }

    function swapETHForAlphrAndBurn() external onlyOwner {}

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function setAlphrTokenAddress(address _alphrTokenAddress)
        external
        onlyOwner
    {
        alphrTokenAddress = _alphrTokenAddress;
    }

    function setUniswapRouterAddress(address _uniswapRouterAddress)
        external
        onlyOwner
    {
        uniswapRouterAddress = _uniswapRouterAddress;
    }

    function addTokenToBalanceList(address token) external onlyOwner {
        EnumerableSet.add(tokens, token);
    }

    function getNumberOfTokens() external view onlyOwner returns (uint256) {
        return EnumerableSet.length(tokens);
    }
}
