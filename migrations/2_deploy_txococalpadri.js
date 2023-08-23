// Archivo en la carpeta migrations, por ejemplo 2_deploy_contracts.js
var TxocoCalPadri = artifacts.require("./TxocoCalPadri.sol");

module.exports = function(deployer) {
  deployer.deploy(TxocoCalPadri);
};