import { task } from 'hardhat/config';
import { FS_DEPLOY } from './fs-deploy.names';

export default task(FS_DEPLOY.NAME, FS_DEPLOY.DESC).
  addParam(FS_DEPLOY.ALPHR_TOKEN, FS_DEPLOY.ALPHR_TOKEN_DESC).
  addParam(FS_DEPLOY.DEX, FS_DEPLOY.DEX_DESC).
  addParam(FS_DEPLOY.VAULT, FS_DEPLOY.VAULT_DESC).setAction(
    async ({ alphr, dex, vault }, hre) =>
      await hre.ethers
        .getContractFactory(FS_DEPLOY.CONTRACT_NAME)
        .then((deployer) => deployer.deploy(alphr, dex, vault))
        .then((fs) => fs.deployed())
        .then((fsDeployed) => fsDeployed.address));
