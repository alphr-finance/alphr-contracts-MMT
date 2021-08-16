// @ts-ignore
import { ethers } from 'hardhat';
import { UNISWAP_ROUTER_V2 } from '../constants/uniswap';
import { ALPHR_TOKEN } from '../constants/tokens';
import { TECH_MULTISIG } from '../constants/alphr';

async function main() {
  const feeStorage = await ethers
    .getContractFactory('FeeStorage')
    .then((deployFactory) =>
      deployFactory.deploy(ALPHR_TOKEN, UNISWAP_ROUTER_V2, TECH_MULTISIG)
    )
    .then((market) => market.address);
  console.log('FeeStorage contract deployed: %s', feeStorage);

  const feeQuota = 20;
  const feeQuotaDecimals = 10000;
  const manualTrade = await ethers
    .getContractFactory('ManualTrade')
    .then((deployFactory) =>
      deployFactory.deploy(
        feeStorage,
        feeQuota,
        feeQuotaDecimals,
        UNISWAP_ROUTER_V2
      )
    )
    .then((asset) => asset.address);
  console.log('ManualTrade contract deployed: %s', manualTrade);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
