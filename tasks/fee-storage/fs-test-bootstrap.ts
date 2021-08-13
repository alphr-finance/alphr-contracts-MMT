import { ALPHR_TOKEN } from './../../constants/tokens';
import { task } from 'hardhat/config';
import { FS_DEPLOY } from './fs-deploy.names';
import { FS_TEST_BOOTSRAP } from './fs-test-bootstrap.names';
import { UNISWAP_ROUTER_V2 } from '../../constants/uniswap';
import { utils } from 'ethers';

export default task(FS_TEST_BOOTSRAP.NAME, FS_TEST_BOOTSRAP.DESC).setAction(
  async (args, hre) => {
    const [vault] = await hre.ethers.getSigners();
    const fs = await hre.run(FS_DEPLOY.NAME, {
        alphr: ALPHR_TOKEN,
        dex: UNISWAP_ROUTER_V2,
        vault: vault.address
    })
        
    const fsContract = await hre.ethers.getContractAt(FS_TEST_BOOTSRAP.CONTRACT_NAME, fs)
    console.log('Address before sending ETH to FeeStorage: ', (await fsContract.getBalance()).toString())
    await vault.sendTransaction({ from: vault.address, to: fs, value: utils.parseEther('5') })
        console.log('Address after sending ETH to FeeStorage: ', (await fsContract.getBalance()).toString())
    return fs
  }
);