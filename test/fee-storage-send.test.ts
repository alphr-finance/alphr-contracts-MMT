// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { utils } from 'ethers';
import { FeeStorage } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('FeeStorage.send :: unit test suite', () => {
  const tokenAddress = '0xaa99199d1e9644b588796F3215089878440D58e0';
  const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
  let owner, user, vault: SignerWithAddress;
  let fs: FeeStorage;

  before('init signers', async () => {
    [owner, user, vault] = await ethers.getSigners();
  });

  before('deploy fee storage contract', async () => {
    const FeeStorage = await ethers.getContractFactory('FeeStorage');
    fs = (await FeeStorage.connect(owner).deploy(
      tokenAddress,
      uniswapRouterAddress,
      vault.address
    )) as FeeStorage;
    await fs.deployed();
  });

  before(
    'add 100 eth to FeeStorage trade as token list operator',
    async () =>
      await owner.sendTransaction({
        to: fs.address,
        value: utils.parseEther('100'),
      })
  );

  it('sends ETH from fee storage to address', async () => {
    const userBalanceBefore = await ethers.provider.getBalance(user.address);
    const vaultBalanceBefore = await ethers.provider.getBalance(vault.address);
    await fs.connect(owner).send(user.address);
    const userBalanceAfter = await ethers.provider.getBalance(user.address);
    const vaultBalanceAfter = await ethers.provider.getBalance(vault.address);
    const userDiff = userBalanceAfter.sub(userBalanceBefore);
    const vaultDiff = vaultBalanceAfter.sub(vaultBalanceBefore);
    const expectUserDiff = utils.parseEther('75');
    const expectVaultDiff = utils.parseEther('25');
    expect(userDiff).to.be.eq(expectUserDiff);
    expect(vaultDiff).to.be.eq(expectVaultDiff);
  });

  after('reset node fork', async () => {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl:
              'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
            blockNumber: 12419631,
          },
        },
      ],
    });
  });
});
