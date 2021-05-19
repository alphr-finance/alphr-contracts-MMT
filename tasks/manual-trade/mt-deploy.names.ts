// ManualTrade deploy task names
export const MT_DEPLOY = {
  // task name and desc
  NAME: 'mt:deploy',
  DESC: 'Deploy ManualTrade contract',

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
