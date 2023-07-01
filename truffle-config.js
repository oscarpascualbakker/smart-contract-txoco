module.exports = {
    networks: {
      development: {
        host: "ganache",
        port: 8545,
        network_id: "*"
      },
    },
    compilers: {
      solc: {
        version: "0.8.1",
      },
    },
    // contracts_build_directory: '/app/build/contracts',
    // contracts_build_directory: '/txoco/build/contracts',
  };
