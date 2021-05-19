// env for manual trade task names
export const MT_TEST_BOOTSTRAP = {
  // task name and desc
  NAME: 'mt:test:bootstrap',
  DESC:
    'Bootstrap test environment for manual trade:' +
    '\n\t\t\t\t * deploys fee storage contract ' +
    '\n\t\t\t\t * deploys manual trade contract',

  // task params
  FEE_VAULT_ADDRESS: 'fs',
  FEE_VAULT_ADDRESS_DESC: 'Address of FeeStorage contract',
  FEE_QUOTA: 'fq',
  FEE_QUOTA_DESC: 'fee percentage, relative to FEE_QUOTA_DECIMALS',
  FEE_QUOTA_DECIMALS: 'fqd',
  FEE_QUOTA_DECIMALS_DESC: 'fee decimals',
  DEX_ADDRESS: 'dex',
  DEX_ADDRESS_DESC: 'address of dex contract (UNISWAP ROUTER)',

  // common
  CONTRACT_NAME: 'ManualTrade',
};
