// @ts-ignore
import { ethers, network } from 'hardhat';
import { ManualTrade, FeeStorage } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { TX_RECEIPT_OK } from '../constants/tx-receipt-status';
import { providers } from 'ethers';
import { UNISWAP_ROUTER_V2 } from '../constants/uniswap';

describe('ManualTrade :: deploy test suite', () => {
  let deployer: SignerWithAddress;

  before('init signers', async () => {
    [deployer] = await ethers.getSigners();
  });

  let fs: FeeStorage;
  let fsDeployTxr: providers.TransactionReceipt;

  before('deploy fee storage', async () => {
    const FeeStorage = await ethers.getContractFactory('FeeStorage');
    fs = (await FeeStorage.connect(deployer).deploy()) as FeeStorage;
    await fs.deployed();
    fsDeployTxr = await fs.deployTransaction.wait();
  });

  it('Fee storage contract OK deploy', async () =>
    expect(fsDeployTxr.status).to.be.eq(TX_RECEIPT_OK));

  let mt: ManualTrade;
  let mtDeployTxr: providers.TransactionReceipt;

  before('deploy manual trade contract', async () => {
    const feeQuota = 20;
    const feeQuotaDecimals = 10000;
    const ManualTrade = await ethers.getContractFactory('ManualTrade');
    mt = (await ManualTrade.connect(deployer).deploy(
      fs.address,
      feeQuota,
      feeQuotaDecimals,
      UNISWAP_ROUTER_V2
    )) as ManualTrade;
    await mt.deployed();
    mtDeployTxr = await mt.deployTransaction.wait();
  });

  it('Manual trade contract OK deploy', async () =>
    expect(mtDeployTxr.status).to.be.eq(TX_RECEIPT_OK));

  after('reset node fork', async () => {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl:
              'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
          },
        },
      ],
    });
  });
});
