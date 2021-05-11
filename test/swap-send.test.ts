// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, providers, utils } from 'ethers';
import { ContractReceipt, ContractTransaction } from "ethers"
import { FeeStorage, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { IERC20 } from "../typechain/IERC20";

const UNI = require("../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json");

const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

describe('Fs-storage :: swap and send test suite', () => {
    let owner, user, receipient, token1: SignerWithAddress;
    let fs: FeeStorage;
    let alphrToken: ERC20Mock;
    let uniswapMock: MockContract;
    let tx: ContractTransaction
    let txr: ContractReceipt

    async function getToken(token: SignerWithAddress) {
        const Erc20Mock = await ethers.getContractFactory("ERC20Mock")
        const t = await Erc20Mock.connect(token).deploy("MockToken", "MT") as ERC20Mock
        await t.deployed()
        return t
    }

    before('init signers', async () => {
        [owner, user, token1, receipient] = await ethers.getSigners();
    });

    before('deploy fee storage', async () => {
        const FeeStorage = await ethers.getContractFactory('FeeStorage');
        fs = await FeeStorage.connect(owner).deploy() as FeeStorage;
        await fs.deployed();
    });

    before('send 15 DAI to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(daiAddress)
        const dai = await ethers.getContractAt("IERC20", daiAddress) as IERC20

        const daiHolderAddress = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"

        await network.provider.send("hardhat_impersonateAccount", [daiHolderAddress])
        const daiHolder = await ethers.provider.getSigner(daiHolderAddress)

        await owner.sendTransaction({ to: daiHolderAddress, value: utils.parseEther('100') })

        await dai.connect(daiHolder).transfer(fs.address, BigNumber.from("15000000000000000000"))
    });

    before('send 15 USDT to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(usdtAddress)
        const usdt = await ethers.getContractAt("IERC20", usdtAddress) as IERC20

        const usdtHolderAddress = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"

        await network.provider.send("hardhat_impersonateAccount", [usdtHolderAddress])
        const usdtHolder = await ethers.provider.getSigner(usdtHolderAddress)

        await owner.sendTransaction({ to: usdtHolderAddress, value: utils.parseEther('100') })

        await usdt.connect(usdtHolder).transfer(fs.address, BigNumber.from("15000000"))
    });

    before('send 15 WETH to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(wethAddress)
        const weth = await ethers.getContractAt("IERC20", wethAddress) as IERC20

        const wethHolderAddress = "0x0f4ee9631f4be0a63756515141281a3e2b293bbe"

        await network.provider.send("hardhat_impersonateAccount", [wethHolderAddress])
        const wethHolder = await ethers.provider.getSigner(wethHolderAddress)

        await owner.sendTransaction({ to: wethHolderAddress, value: utils.parseEther('100') })

        await weth.connect(wethHolder).transfer(fs.address, BigNumber.from("15000000000000000000"))
    });

    describe('balance', () => {
        it.skip('check balance of DAI in fs', async () => {
            expect(await fs.getBalanceOf(daiAddress)).to.be.eq(BigNumber.from("15000000000000000000"))
        });

        it.skip('check balance of USDT in fs', async () => {
            expect(await fs.getBalanceOf(usdtAddress)).to.be.eq(BigNumber.from("15000000"))
        });

        it.skip('check balance of WETH in fs', async () => {
            expect(await fs.getBalanceOf(wethAddress)).to.be.eq(BigNumber.from("15000000000000000000"))
        });
    });

    describe('swap to ETH and send', () => {
        before('set uniswap router address', async () => {
            uniswapMock = await deployMockContract(owner, UNI.abi);
            uniswapMock.mock.WETH.returns(utils.getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'));
            uniswapMock.mock.getAmountsOut.returns([0, utils.parseEther('2')]);
            uniswapMock.mock.swapExactTokensForETH.returns([]);
            uniswapMock.mock.swapExactTokensForTokens.returns([]);
            await fs.setUniswapRouterAddress(uniswapMock.address);
        })

        it.skip('swapToETHAndSend', async () => {
            let prov = providers.getDefaultProvider("http://127.0.0.1:8545/")

            expect(await prov.getBalance(receipient.address)).to.be.eq(BigNumber.from("10000000000000000000000"))
            console.log("Old balance: ", utils.formatEther(await prov.getBalance(receipient.address)))

            await fs.connect(owner).swapToETHAndSend(receipient.address);

            console.log("New balance: ", utils.formatEther(await prov.getBalance(receipient.address)))
            expect(await prov.getBalance(receipient.address)).to.not.be.eq(BigNumber.from("10000000000000000000000"))
        });

        it('swapToETHAndSend from another signer', async () => {
            await expect(fs.connect(user).swapToETHAndSend(receipient.address)).to.be.revertedWith('revert Ownable: caller is not the owner')
        });
    });
});