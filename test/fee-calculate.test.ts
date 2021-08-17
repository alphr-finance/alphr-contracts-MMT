// @ts-ignore
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/dist/src/signers";
import { utils } from "ethers";
import { FeeStorage, ManualTrade, ERC20Mock } from "../typechain";
import { expect } from "chai";
import {
  deployMockContract,
  MockContract,
} from "@ethereum-waffle/mock-contract";

const UNI = require("../artifacts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json");

describe("ManualTrade :: fee calculations test", () => {
  const tokenAddress = "0xaa99199d1e9644b588796F3215089878440D58e0";
  const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  let deployer, user, vault: SignerWithAddress;
  const feeQuota = 20;
  const feeQuotaDecimals = 10000;
  const WETHDecimals = 18;
  const WBTCDecimals = 8;

  before("init signers", async () => {
    [deployer, user, vault] = await ethers.getSigners();
  });

  let fs: FeeStorage;
  let uniswapMock: MockContract;

  before("deploy fee storage", async () => {
    const FeeStorage = await ethers.getContractFactory("FeeStorage");
    fs = (await FeeStorage.connect(deployer).deploy(
      tokenAddress,
      uniswapRouterAddress,
      vault.address
    )) as FeeStorage;
    await fs.deployed();
    await fs.deployTransaction.wait();
  });

  let mt: ManualTrade;

  before("deploy manual trade contract", async () => {
    const ManualTrade = await ethers.getContractFactory("ManualTrade");
    uniswapMock = await deployMockContract(user, UNI.abi);
    mt = (await ManualTrade.connect(deployer).deploy(
      fs.address,
      feeQuota,
      feeQuotaDecimals,
      uniswapMock.address
    )) as ManualTrade;
    await mt.deployed();
    await mt.deployTransaction.wait();
  });

  describe("WETH fee calculation", () => {
    it("correct fee for 1 WETH", async () => {
      const amount = ethers.utils.parseUnits("1", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.002", WETHDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 100 WETH", async () => {
      const amount = ethers.utils.parseUnits("100", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.2", WETHDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 34523 WETH", async () => {
      const amount = ethers.utils.parseUnits("34523", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("69.046", WETHDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 2.1 WETH", async () => {
      const amount = ethers.utils.parseUnits("2.1", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.0042", WETHDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 2.113125123 WETH", async () => {
      const amount = ethers.utils.parseUnits("2.113125123", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits(
        "0.004226250246",
        WETHDecimals
      );
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 1234567890.12345 WETH", async () => {
      const amount = ethers.utils.parseUnits("1234567890.12345", WETHDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits(
        "2469135.7802469",
        WETHDecimals
      );
      const actual = ethers.utils.formatUnits(actualFeeAmount, WETHDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WETHDecimals
      );
      expect(actual).to.be.eq(expected);
    });
  });

  describe("WBTC fee calculation", () => {
    it("correct fee for 1 WBTC", async () => {
      const amount = ethers.utils.parseUnits("1", WBTCDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WBTCDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.002", WBTCDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WBTCDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WBTCDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 100 WBTC", async () => {
      const amount = ethers.utils.parseUnits("100", WBTCDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WBTCDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.2", WBTCDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WBTCDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WBTCDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 34523 WBTC", async () => {
      const amount = ethers.utils.parseUnits("34523", WBTCDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WBTCDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("69.046", WBTCDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WBTCDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WBTCDecimals
      );
      expect(actual).to.be.eq(expected);
    });

    it("correct fee for 2.1 WBTC", async () => {
      const amount = ethers.utils.parseUnits("2.1", WBTCDecimals);
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WBTCDecimals,
        amount
      );
      const expectedFeeAmount = ethers.utils.parseUnits("0.0042", WBTCDecimals);
      const actual = ethers.utils.formatUnits(actualFeeAmount, WBTCDecimals);
      const expected = ethers.utils.formatUnits(
        expectedFeeAmount,
        WBTCDecimals
      );
      expect(actual).to.be.eq(expected);
    });
  });

  describe.skip("mt-test swap ERC20 for ETH token", () => {
    let token: ERC20Mock;

    before("deploy ERC20 mock and mint", async () => {
      const Erc20Mock = await ethers.getContractFactory("ERC20Mock");
      token = (await Erc20Mock.connect(deployer).deploy(
        "MockToken",
        "MT"
      )) as ERC20Mock;
      await token.deployed();
      await token.connect(user).mint();
    });

    it("mt-test swapExactTokensForETH", async () => {
      const actualFeeAmount = await mt.calculateFee(
        feeQuota,
        feeQuotaDecimals,
        WETHDecimals,
        utils.parseEther("2")
      );

      uniswapMock.mock.swapExactTokensForETH.returns([]);
      await token.connect(user).approve(mt.address, utils.parseEther("2"));
      await mt
        .connect(user)
        .swapExactTokensForETH(utils.parseEther("2"), utils.parseEther("4"), [
          token.address,
          "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
        ]);

      expect(await (await token.balanceOf(fs.address)).toString()).to.be.eq(
        actualFeeAmount.toString()
      );
    });
  });

  after("reset node fork", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            blockNumber: 12419631,
          },
        },
      ],
    });
  });
});
