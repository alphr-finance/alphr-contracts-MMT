import { task } from 'hardhat/config';
import { MT_TEST_BOOTSTRAP } from './mt-test-bootstrap.names';
import { FS_DEPLOY } from '../fee-storage/fs-deploy.names';
import { MT_DEPLOY } from './mt-deploy.names';
import { UNISWAP_ROUTER_V2 } from '../../constants/uniswap';

export default task(MT_TEST_BOOTSTRAP.NAME, MT_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    await hre.run(FS_DEPLOY.NAME).then((fsAddress) =>
      hre.run(MT_DEPLOY.NAME, {
        fs: fsAddress,
        fq: '20',
        fqd: '10000',
        dex: UNISWAP_ROUTER_V2,
      })
    );
  }
);
