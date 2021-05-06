// @ts-ignore
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { providers, utils } from 'ethers';
import { ContractReceipt, ContractTransaction } from "ethers"
import { FeeStorage, Erc20Mock} from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';

const UNI = require("../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json");

describe('Fs-storage :: deploy test suite', () => {
    let owner, user, token1, token2, weth: SignerWithAddress;
    let fs: FeeStorage;
    let fsDeployTxr: providers.TransactionReceipt;
    let alphrToken: Erc20Mock;
    let uniswapMock: MockContract;
    let tx: ContractTransaction
    let txr: ContractReceipt
    
    before('init signers', async () => {
        [owner, user, token1, token2, weth] = await ethers.getSigners();
    });
    
    async function getToken(token:SignerWithAddress) {
        const Erc20Mock = await ethers.getContractFactory("ERC20Mock")
        const  t = await Erc20Mock.connect(token).deploy("MockToken", "MT") as Erc20Mock
        await t.deployed()
        return t
    }

    before('deploy fee storage', async () => {
        const FeeStorage = await ethers.getContractFactory('FeeStorage');
        fs = await FeeStorage.connect(owner).deploy() as FeeStorage;
        await fs.deployed();
        fsDeployTxr = await fs.deployTransaction.wait();
        
        await owner.sendTransaction({ to: fs.address, value: utils.parseEther('100') })
    });
    
    before("deploy alphrToken mock and mint", async () => {
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock")
        alphrToken = await ERC20Mock.connect(owner).deploy("MockToken", "MT") as Erc20Mock
        await alphrToken.deployed()
        await alphrToken.connect(owner).mint()
        
        alphrToken.connect(owner).transfer(fs.address, utils.parseEther('2'))
    })

    describe('balance', () => {
        it('check balance of fs', async () => {
            expect(await fs.getBalance()).to.be.eq(utils.parseEther('100'))
        });
    });

    describe('check token number in list', () => {
        let tokenA : Erc20Mock
        before('deploy and mint token', async () => {
            tokenA = await getToken(token1)
        });

        it('add token', async () => {
            fs.addTokenToBalanceList(tokenA.address)
            expect(await fs.getNumberOfTokens()).to.be.eq('1')
        });
        
        it('add token', async () => {
            await expect(fs.connect(user).addTokenToBalanceList(tokenA.address)).to.be.revertedWith('revert Ownable: caller is not the owner')
        });
        
        it('check balance by non-owner', async () => {
            await expect(fs.connect(user).getNumberOfTokens()).to.be.revertedWith('revert Ownable: caller is not the owner')
        });
    });
    
    describe('swap tokens and burn', () => {
        let tokenA, tokenB: Erc20Mock
        before('deploy and mint tokens', async () => {
            tokenA = await getToken(token1)
            tokenA.mint()

            tokenB = await getToken(token2)
            tokenB.mint()
            
            tokenA.transfer(fs.address, utils.parseEther('2'))
            tokenB.transfer(fs.address, utils.parseEther('5'))
        });
        
        before('set uniswap router addres and alphr token ', async () =>  {
            uniswapMock = await deployMockContract(owner, UNI.abi);
            uniswapMock.mock.getAmountsOut.returns([0, utils.parseEther('2')]);
            uniswapMock.mock.swapExactTokensForTokens.returns([])
            await fs.setUniswapRouterAddress(uniswapMock.address);
            await fs.setAlphrTokenAddress(alphrToken.address);
        })

        
        it.skip('mt-swapTokensForAlphrAndBurn', async () => {
            await fs.addTokenToBalanceList(tokenA.address);
            let path1 = ['0x2e983a1ba5e8b38aaaec4b440b9ddcfbf72e15d1', '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0'];
            console.log(path1);
            let amounts = [0, utils.parseEther('2')]
            uniswapMock.mock.getAmountsOut.withArgs(utils.parseEther('10'), path1).returns(amounts);
            
            tx = await fs.swapTokensForAlphrAndBurn()
            txr = await tx.wait()
            
            const expectedEventName = fs.interface.events["Transfer(address,address, uint256)"].name
            const actualEventName = txr.events[0].event
            expect(actualEventName).to.be.equal(expectedEventName);
        });
    });
    
});
