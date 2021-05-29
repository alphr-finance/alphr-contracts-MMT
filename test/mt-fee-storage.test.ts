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

const UNI = require('../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json');

describe('Fs-storage :: deploy test suite', () => {
  let owner, user, token1, token2: SignerWithAddress;
  let fs: FeeStorage;
  let alphrToken: ERC20Mock;
  let uniswapMock: MockContract;

  before('init signers', async () => {
    [owner, user, token1, token2] = await ethers.getSigners();
  });

  async function getToken(token: SignerWithAddress) {
    const Erc20Mock = await ethers.getContractFactory('ERC20Mock');
    const t = (await Erc20Mock.connect(token).deploy(
      'MockToken',
      'MT'
    )) as ERC20Mock;
    await t.deployed();
    return t;
  }

  before('deploy fee storage', async () => {
    const FeeStorage = await ethers.getContractFactory('FeeStorage');
    fs = (await FeeStorage.connect(owner).deploy()) as FeeStorage;
    await fs.deployed();
    await fs.deployTransaction.wait();

    await owner.sendTransaction({
      to: fs.address,
      value: utils.parseEther('100'),
    });
  });

  before('add manual trade as token list operator', async () => {
    await fs.addTokenOperatorRole(owner.address);
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
    it('check balance of fs', async () => {
      expect(await fs.getBalance()).to.be.eq(utils.parseEther('100'));
    });
  });

  describe('check token number in list', () => {
    let tokenA: ERC20Mock;
    before('deploy and mint token', async () => {
      tokenA = await getToken(token1);
    });

    it('add tokenA', async () => {
      await fs.connect(owner).addTokenToBalanceList(tokenA.address);
      expect(await fs.connect(owner).getNumberOfTokens()).to.be.eq('1');
    });

    it('add tokenB', async () => {
      await expect(
        fs.connect(user).addTokenToBalanceList(tokenA.address)
      ).to.be.revertedWith('revert Caller is not a token list operator');
    });

    it('check balance by non-owner', async () => {
      await expect(fs.connect(user).getNumberOfTokens()).to.be.revertedWith(
        'revert Ownable: caller is not the owner'
      );
    });
  });

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
