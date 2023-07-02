// Archivo en la carpeta migrations, por ejemplo 2_deploy_contracts.js
var TxocoCalPadri = artifacts.require("./TxocoCalPadri.sol");

module.exports = function(deployer) {
  const initialBaseURI = "https://ipfs.io/ipfs/QmNkgQe8meF31ZZ7fZ3rAvSEYtjnfxtWgiXgh7Xte7ack3";
  deployer.deploy(TxocoCalPadri, initialBaseURI);
};