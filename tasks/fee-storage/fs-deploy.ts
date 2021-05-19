import { task } from 'hardhat/config';
import { FS_DEPLOY } from './fs-deploy.names';

export default task(FS_DEPLOY.NAME, FS_DEPLOY.DESC).setAction(
  async (_, hre) =>
    await hre.ethers
      .getContractFactory(FS_DEPLOY.CONTRACT_NAME)
      .then((deployer) => deployer.deploy())
      .then((fs) => fs.deployed())
      .then((fsDeployed) => fsDeployed.address)
);
