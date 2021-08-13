
import { task } from 'hardhat/config';
import { MT_TEST_BOOTSTRAP } from './mt-test-bootstrap.names';
import { FS_TEST_BOOTSRAP } from '../fee-storage/fs-test-bootstrap.names';
import { MT_DEPLOY } from './mt-deploy.names';
import { UNISWAP_ROUTER_V2 } from '../../constants/uniswap';
import fsAddTokens from '../fee-storage/fs-add-tokens';

export default task(MT_TEST_BOOTSTRAP.NAME, MT_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    await hre.run(FS_TEST_BOOTSRAP.NAME).then((fsAddress) =>
   hre.run(MT_DEPLOY.NAME, {
        fs: fsAddress,
        fq: '20',
        fqd: '10000',
        dex: UNISWAP_ROUTER_V2,
      })).then((mtAddress)=>{console.log('MT address: ', mtAddress)})
  }
);
