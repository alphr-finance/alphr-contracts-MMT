import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
//import "solidity-coverage"

import { HardhatUserConfig } from 'hardhat/types';
require('hardhat-log-remover');
require('./tasks/index');

const config: HardhatUserConfig = {
  solidity: {
    version: '0.7.6',
    settings: {
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url:
          'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
        blockNumber: 12419631,
      },
    },
  },
  mocha: {
    bail: true,
  },
};
export default config;
