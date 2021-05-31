import { task } from 'hardhat/config';

export default task(
  'erc20mock:transferFromImpersonated',
  'transfer from selected address, as impersonated account'
)
  .addParam('from', 'address to impersonate and send erc20')
  .addParam('to', 'address of receiver')
  .addParam('token', 'address of ERC20 token')
  .addParam('amount', 'amount to send')
  .setAction(
    async ({ from, to, token, amount }, hre) =>
      await hre.network.provider
        .send('hardhat_impersonateAccount', [from])
        .then(() => hre.ethers.provider.getSigner(from))
        .then((signer) => hre.ethers.getContractAt('IERC20', token, signer))
        .then((token) => token.transfer(to, amount))
  );
