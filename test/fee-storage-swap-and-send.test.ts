// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { utils } from 'ethers';
import { FeeStorage } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IERC20 } from '../typechain/IERC20';
import { UNISWAP_ROUTER_V2 } from '../constants/uniswap';

const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const daiDecimals = 18;
const daiHolderAddress = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';

const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const usdtDecimals = 6;
const usdtHolderAddress = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const wethDecimals = 18;
const wethHolderAddress = '0x0f4ee9631f4be0a63756515141281a3e2b293bbe';

const uniAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
const uniDecimals = 18;
const uniHolderAddress = '0x47173b170c64d16393a52e6c480b3ad8c302ba1e';

const tokenAmount = '15';
let startingRecipientBalance;
const etherToPayForTx = '100';

describe.skip('Fs-storage :: swap and send test suite', () => {
  const tokenAddress = '0xaa99199d1e9644b588796F3215089878440D58e0';
  const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
  let owner, vault, recipient: SignerWithAddress;
  let fs: FeeStorage;
  let dai, usdt, weth, uni: IERC20;

  before('init signers', async () => {
    [owner, vault, recipient] = await ethers.getSigners();
    startingRecipientBalance = await ethers.provider.getBalance(
      recipient.address
    );
  });

  before('deploy fee storage', async () => {
    const FeeStorage = await ethers.getContractFactory('FeeStorage');
    fs = (await FeeStorage.connect(owner).deploy(
      tokenAddress,
      uniswapRouterAddress,
      vault.address
    )) as FeeStorage;
    await fs.deployed();
    await fs.connect(owner).setUniswapRouterAddress(UNISWAP_ROUTER_V2);
  });

  before('send 15 DAI to fee storage', async () => {
    dai = (await ethers.getContractAt('IERC20', daiAddress)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      daiHolderAddress,
    ]);
    const daiHolder = await ethers.provider.getSigner(daiHolderAddress);

    await owner.sendTransaction({
      to: daiHolderAddress,
      value: utils.parseEther(etherToPayForTx),
    });

    await dai
      .connect(daiHolder)
      .transfer(fs.address, ethers.utils.parseUnits(tokenAmount, daiDecimals));
  });

  before('send 15 USDT to fee storage', async () => {
    usdt = (await ethers.getContractAt('IERC20', usdtAddress)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      usdtHolderAddress,
    ]);
    const usdtHolder = await ethers.provider.getSigner(usdtHolderAddress);

    await owner.sendTransaction({
      to: usdtHolderAddress,
      value: utils.parseEther(etherToPayForTx),
    });

    await usdt
      .connect(usdtHolder)
      .transfer(fs.address, ethers.utils.parseUnits(tokenAmount, usdtDecimals));
  });

  before('send 15 WETH to fee storage', async () => {
    weth = (await ethers.getContractAt('IERC20', wethAddress)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      wethHolderAddress,
    ]);
    const wethHolder = await ethers.provider.getSigner(wethHolderAddress);

    await owner.sendTransaction({
      to: wethHolderAddress,
      value: utils.parseEther(etherToPayForTx),
    });

    await weth
      .connect(wethHolder)
      .transfer(fs.address, ethers.utils.parseUnits(tokenAmount, wethDecimals));
  });

  before('send 15 UNI to fee storage', async () => {
    uni = (await ethers.getContractAt('IERC20', uniAddress)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      uniHolderAddress,
    ]);
    const uniHolder = await ethers.provider.getSigner(uniHolderAddress);

    await owner.sendTransaction({
      to: uniHolderAddress,
      value: utils.parseEther(etherToPayForTx),
    });

    await uni
      .connect(uniHolder)
      .transfer(fs.address, ethers.utils.parseUnits(tokenAmount, uniDecimals));
  });

  describe('check fs token balances', () => {
    it('check balance of DAI in fs', async () => {
      expect(await dai.balanceOf(fs.address)).to.be.eq(
        ethers.utils.parseUnits(tokenAmount, daiDecimals)
      );
    });

    it('check balance of USDT in fs', async () => {
      expect(await usdt.balanceOf(fs.address)).to.be.eq(
        ethers.utils.parseUnits(tokenAmount, usdtDecimals)
      );
    });

    it('check balance of WETH in fs', async () => {
      expect(await weth.balanceOf(fs.address)).to.be.eq(
        ethers.utils.parseUnits(tokenAmount, wethDecimals)
      );
    });

    it('check balance of UNI in fs', async () => {
      expect(await uni.balanceOf(fs.address)).to.be.eq(
        ethers.utils.parseUnits(tokenAmount, daiDecimals)
      );
    });
  });

  describe('swap to ETH and send', () => {
    it('swapToETHAndSend', async () => {
      expect(await ethers.provider.getBalance(recipient.address)).to.be.eq(
        startingRecipientBalance.toString()
      );

      // await fs.connect(owner).swapToETHAndSend(recipient.address);
      let expectedBalance = utils
        .parseEther('15.155130126222795759')
        .add(startingRecipientBalance);
      expect(await ethers.provider.getBalance(recipient.address)).to.be.eq(
        expectedBalance
      );
    });

    // it('swapToETHAndSend from another signer', async () => {
    //   await expect(
    //     fs.connect(user).swapToETHAndSend(recipient.address)
    //   ).to.be.revertedWith('revert Ownable: caller is not the owner');
    // });
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
