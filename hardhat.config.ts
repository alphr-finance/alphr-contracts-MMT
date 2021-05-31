import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
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
        url: 'https://eth-rinkeby.alchemyapi.io/v2/DrIn1-yF8pYUbrqLsKeWEywjEKb2KKJM',
        // blockNumber: 12419631,
      },
    },
    rinkeby: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/DrIn1-yF8pYUbrqLsKeWEywjEKb2KKJM',
      accounts: {
        mnemonic:
          'penalty sorry discover tissue curious wage purity monster mammal labor market lonely',
      },
    },
  },
  mocha: {
    bail: true,
  },
};
export default config;
