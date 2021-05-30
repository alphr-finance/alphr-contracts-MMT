import { ethers } from 'ethers';
import { task } from 'hardhat/config';

const ownerAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

export default task(
  'fs:addTokens',
  'add tokens amount to fs balance'
)
  .addParam('fs', 'fs address')
  .addParam('token', 'token address')
  .addParam('decimals', 'token decimals')
  .addParam('holder', 'token holder address')
  .addParam('amount', 'amount to send')
  .setAction(
    async ({ fs, token, decimals, holder, amount }, hre) => {
      await hre.network.provider.send('hardhat_impersonateAccount', [holder]);
      const tokenHolder = await hre.ethers.provider.getSigner(holder);
      const owner = hre.ethers.provider.getSigner(ownerAddress);

      owner.sendTransaction({
        to: holder,
        value: ethers.utils.parseEther('100'),
      });

      let fsContract = await hre.ethers.getContractAt('FeeStorage', fs);
      await fsContract.connect(owner).setUniswapRouterAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
      await fsContract.connect(owner).addTokenOperatorRole(ownerAddress);
      await fsContract.connect(owner).addTokenToBalanceList(token);
      let tokenContract = await hre.ethers.getContractAt('IERC20', token);
      await tokenContract.connect(tokenHolder).transfer(fs, hre.ethers.utils.parseUnits(amount, decimals));
      console.log("Balance of new token:", hre.ethers.utils.formatUnits(await tokenContract.balanceOf(fs), decimals));
    }
  );
