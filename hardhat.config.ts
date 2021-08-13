import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
//import "solidity-coverage"

import { HardhatUserConfig } from "hardhat/types";
require("hardhat-log-remover");
require("./tasks/index");

import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.7.6",
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB",
        blockNumber: 12419631,
      },
    },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/DrIn1-yF8pYUbrqLsKeWEywjEKb2KKJM",
      accounts: {
        mnemonic:
          "penalty sorry discover tissue curious wage purity monster mammal labor market lonely",
      },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  mocha: {
    bail: true,
  },
};
export default config;
