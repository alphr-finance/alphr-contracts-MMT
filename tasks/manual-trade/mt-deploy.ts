import { task } from 'hardhat/config';
import { MT_DEPLOY } from './mt-deploy.names';

export default task(MT_DEPLOY.NAME, MT_DEPLOY.DESC)
  .addParam(MT_DEPLOY.FEE_VAULT_ADDRESS, MT_DEPLOY.FEE_VAULT_ADDRESS_DESC)
  .addParam(MT_DEPLOY.FEE_QUOTA, MT_DEPLOY.FEE_QUOTA_DESC)
  .addParam(MT_DEPLOY.FEE_QUOTA_DECIMALS, MT_DEPLOY.FEE_QUOTA_DECIMALS_DESC)
  .addParam(MT_DEPLOY.DEX_ADDRESS, MT_DEPLOY.DEX_ADDRESS_DESC)
  .setAction(
    async ({ fs, fq, fqd, dex }, hre) =>
      await hre.ethers
        .getContractFactory(MT_DEPLOY.CONTRACT_NAME)
        .then((deployer) => deployer.deploy(fs, fq, fqd, dex))
        .then((mt) => mt.deployed())
        .then((mtDeployed) => mtDeployed.address)
  );
