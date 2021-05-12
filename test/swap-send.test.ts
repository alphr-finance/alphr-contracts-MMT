// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, providers, utils } from 'ethers';
import { ContractReceipt, ContractTransaction } from "ethers"
import { FeeStorage, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { IERC20 } from "../typechain/IERC20";
import { UNISWAP_ROUTER_V2 } from "../constants/uniswap";

const UNI = require("../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json");

const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
const daiDecimals = 18
const daiHolderAddress = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"

const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"
const usdtDecimals = 6
const usdtHolderAddress = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const wethDecimals = 18
const wethHolderAddress = "0x0f4ee9631f4be0a63756515141281a3e2b293bbe"

const tokenAmout = "15"
const defaultRecepientBalance = "10000"
const etherToPayForTx = "100"

describe('Fs-storage :: swap and send test suite', () => {
    let owner, user, receipient, token1: SignerWithAddress;
    let fs: FeeStorage;
    let alphrToken: ERC20Mock;
    let uniswapMock: MockContract;
    let tx: ContractTransaction
    let txr: ContractReceipt

    before('init signers', async () => {
        [owner, user, token1, receipient] = await ethers.getSigners();
    });

    before('deploy fee storage', async () => {
        const FeeStorage = await ethers.getContractFactory('FeeStorage');
        fs = await FeeStorage.connect(owner).deploy() as FeeStorage;
        await fs.deployed();
        await fs.connect(owner).setUniswapRouterAddress(UNISWAP_ROUTER_V2)
    });

    before('send 15 DAI to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(daiAddress)
        const dai = await ethers.getContractAt("IERC20", daiAddress) as IERC20

        await network.provider.send("hardhat_impersonateAccount", [daiHolderAddress])
        const daiHolder = await ethers.provider.getSigner(daiHolderAddress)

        await owner.sendTransaction({ to: daiHolderAddress, value: utils.parseEther(etherToPayForTx) })

        await dai.connect(daiHolder).transfer(fs.address, ethers.utils.parseUnits(tokenAmout, daiDecimals))
    });

    before('send 15 USDT to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(usdtAddress)
        const usdt = await ethers.getContractAt("IERC20", usdtAddress) as IERC20

        await network.provider.send("hardhat_impersonateAccount", [usdtHolderAddress])
        const usdtHolder = await ethers.provider.getSigner(usdtHolderAddress)

        await owner.sendTransaction({ to: usdtHolderAddress, value: utils.parseEther(etherToPayForTx) })

        await usdt.connect(usdtHolder).transfer(fs.address, ethers.utils.parseUnits(tokenAmout, usdtDecimals))
    });

    before('send 15 WETH to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(wethAddress)
        const weth = await ethers.getContractAt("IERC20", wethAddress) as IERC20

        await network.provider.send("hardhat_impersonateAccount", [wethHolderAddress])
        const wethHolder = await ethers.provider.getSigner(wethHolderAddress)

        await owner.sendTransaction({ to: wethHolderAddress, value: utils.parseEther(etherToPayForTx) })

        await weth.connect(wethHolder).transfer(fs.address, ethers.utils.parseUnits(tokenAmout, wethDecimals))
    });

    describe('balance', async () => {
        it('check balance of DAI in fs', async () => {
            expect(await fs.getBalanceOf(daiAddress)).to.be.eq(ethers.utils.parseUnits(tokenAmout, daiDecimals))
        });

        it('check balance of USDT in fs', async () => {
            expect(await fs.getBalanceOf(usdtAddress)).to.be.eq(ethers.utils.parseUnits(tokenAmout, usdtDecimals))
        });

        it('check balance of WETH in fs', async () => {
            expect(await fs.getBalanceOf(wethAddress)).to.be.eq(ethers.utils.parseUnits(tokenAmout, wethDecimals))
        });
    });

    describe('swap to ETH and send', async () => {
        it('swapToETHAndSend', async () => {
            expect(await ethers.provider.getBalance(receipient.address)).to.be.eq(utils.parseEther(defaultRecepientBalance))
            console.log("Old balance: ", utils.formatEther(await ethers.provider.getBalance(receipient.address)))

            await fs.connect(owner).swapToETHAndSend(receipient.address);

            console.log("New balance: ", utils.formatEther(await ethers.provider.getBalance(receipient.address)))
            expect(await ethers.provider.getBalance(receipient.address)).to.not.be.eq(utils.parseEther(defaultRecepientBalance))
        });

        it('swapToETHAndSend from another signer', async () => {
            await expect(fs.connect(user).swapToETHAndSend(receipient.address)).to.be.revertedWith('revert Ownable: caller is not the owner')
        });
    });
});
