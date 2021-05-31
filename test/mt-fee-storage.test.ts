// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { utils } from 'ethers';
import { FeeStorage, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';
import * as UNI from '../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json';

describe('FeeStorage :: send test suite', () => {
  let owner, user: SignerWithAddress;
  let fs: FeeStorage;
  let alphrToken: ERC20Mock;
  let uniswapMock: MockContract;

  before('init signers', async () => {
    [owner, user] = await ethers.getSigners();
  });


  before('deploy fee storage contract', async () => {
    fs = await ethers.getContractFactory('FeeStorage')
        .then(feeStorageDeployFactory => feeStorageDeployFactory.connect(owner).deploy())
        .then(contract => contract.deployed())
        .then(deployedContract => deployedContract as FeeStorage);


  });

  before('add 100 eth to FeeStorage trade as token list operator', async () => {
    await owner.sendTransaction({
      to: fs.address,
      value: utils.parseEther('100'),
    });
  });

  before('deploy alphrToken mock and mint', async () => {
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
    alphrToken = (await ERC20Mock.connect(owner).deploy(
      'MockToken',
      'MT'
    )) as ERC20Mock;
    await alphrToken.deployed();
    await alphrToken.connect(owner).mint();

    alphrToken.connect(owner).transfer(fs.address, utils.parseEther('2'));
  });

  describe('balance', () => {

  describe('swap tokens and burn', () => {
    let tokenA, tokenB: ERC20Mock;
    before('deploy and mint tokens', async () => {
      tokenA = await getToken(token1);
      await tokenA.mint();

      tokenB = await getToken(token2);
      await tokenB.mint();

      tokenA.transfer(fs.address, utils.parseEther('2'));
      tokenB.transfer(fs.address, utils.parseEther('5'));
    });

    before('set uniswap router address and alphr token ', async () => {
      uniswapMock = await deployMockContract(owner, UNI.abi);
      uniswapMock.mock.getAmountsOut.returns([0, utils.parseEther('2')]);
      uniswapMock.mock.swapExactTokensForTokens.returns([]);
      await fs.setUniswapRouterAddress(uniswapMock.address);
      await fs.setAlphrTokenAddress(alphrToken.address);
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
});
