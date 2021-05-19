# [alphr.finance](alphr.finance)
# Manual mirror trading contracts

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them

```
yarn version 1.22.5+
nodejs version 12+
```

### Installing

A step by step series of examples that tell you how to get a development env running

Install dependencies:
```
yarn
```

Test the project locally:
```
yarn test
```

## Local node 

### start hardhat node

    yarn hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/{alchemyapi-key} --fork-block-number {INT-block-number}

### deploy contracts

    yarn hardhat --network localhost mt:test:bootstrap

## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details
