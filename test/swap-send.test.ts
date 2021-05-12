// @ts-ignore
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { utils } from 'ethers';
import { FeeStorage } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IERC20 } from "../typechain/IERC20";
import { UNISWAP_ROUTER_V2 } from "../constants/uniswap";

const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
const daiDecimals = 18
const daiHolderAddress = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"

const uniAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
const uniDecimals = 18
const uniHolderAddress = "0x47173b170c64d16393a52e6c480b3ad8c302ba1e"

const tokenAmout = "15"
const defaultRecepientBalance = "10000"
const etherToPayForTx = "100"

describe('Fs-storage :: swap and send test suite', () => {
    let owner, user, receipient: SignerWithAddress;
    let fs: FeeStorage;

    before('init signers', async () => {
        [owner, user, receipient] = await ethers.getSigners();
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

    before('send 15 UNI to fee storage', async () => {
        await fs.connect(owner).addTokenToBalanceList(uniAddress)
        const uni = await ethers.getContractAt("IERC20", uniAddress) as IERC20

        await network.provider.send("hardhat_impersonateAccount", [uniHolderAddress])
        const uniHolder = await ethers.provider.getSigner(uniHolderAddress)

        await owner.sendTransaction({ to: uniHolderAddress, value: utils.parseEther(etherToPayForTx) })

        await uni.connect(uniHolder).transfer(fs.address, ethers.utils.parseUnits(tokenAmout, uniDecimals))
    });

    describe('balance', async () => {
        it('check balance of DAI in fs', async () => {
            expect(await fs.getBalanceOf(daiAddress)).to.be.eq(ethers.utils.parseUnits(tokenAmout, daiDecimals))
        });

        it('check balance of UNI in fs', async () => {
            expect(await fs.getBalanceOf(uniAddress)).to.be.eq(ethers.utils.parseUnits(tokenAmout, uniDecimals))
        });
    });

    describe('swap to ETH and send', async () => {
        it('swapToETHAndSend', async () => {
            expect(await ethers.provider.getBalance(receipient.address)).to.be.eq(utils.parseEther(defaultRecepientBalance))

            await fs.connect(owner).swapToETHAndSend(receipient.address);

            let expectedBalance = utils.parseEther("10000.151642693837014965");
            expect(await ethers.provider.getBalance(receipient.address)).to.be.eq(expectedBalance)

        });

        it('swapToETHAndSend from another signer', async () => {
            await expect(fs.connect(user).swapToETHAndSend(receipient.address)).to.be.revertedWith('revert Ownable: caller is not the owner')
        });
    });

    after('reset node fork', async () => {
        await network.provider.request({
            method: "hardhat_reset",
            params: [{
                forking: {
                    jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB",
                    blockNumber: 12419631
                }
            }]
        });
    });
});
