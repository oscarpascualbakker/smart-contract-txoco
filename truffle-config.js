const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "ganache",
      port: 8545,
      network_id: "*"
    },
    mumbai_testnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, process.env.API_URL),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
  compilers: {
    solc: {
      version: "0.8.1",
    },
  },
  contracts_build_directory: '/app/build/contracts',
};
