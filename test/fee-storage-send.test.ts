// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { utils } from 'ethers';
import { FeeStorage } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('FeeStorage.send :: unit test suite', () => {
  let owner, user: SignerWithAddress;
  let fs: FeeStorage;

  before('init signers', async () => {
    [owner, user] = await ethers.getSigners();
  });

  before('deploy fee storage contract', async () => {
    fs = await ethers
      .getContractFactory('FeeStorage')
      .then((feeStorageDeployFactory) =>
        feeStorageDeployFactory.connect(owner).deploy()
      )
      .then((contract) => contract.deployed())
      .then((deployedContract) => deployedContract as FeeStorage);
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
    await fs.connect(owner).send(user.address);
    const userBalanceAfter = await ethers.provider.getBalance(user.address);
    const actualDiff = userBalanceAfter.sub(userBalanceBefore);
    const expectDiff = utils.parseEther('100');
    expect(actualDiff).to.be.eq(expectDiff);
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
