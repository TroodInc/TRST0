// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { USDC } = process.env;

async function main() {

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account: ' + deployer.address);
  console.log('Token holder: ' + deployer.address);

  supply = ethers.utils.parseEther("380000");
  token = deployContract("TRST0", "Cool BBHZ", "BBHZ", deployer.address, supply)

  rate = 1000000000000
  buyToken = USDC;
  deployContract("TRST0CrowdsaleERC20", rate, deployer.address, deployer.address, token, buyToken)

  deployContract("TRST0PaybackERC20", token, buyToken, rate)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function deployContract(contractName, ...args) {
  const factory = await hre.ethers.getContractFactory(contractName);

  const contract = await factory.deploy(...args);
  await contract.deployed();
  console.log(`${contractName} address: ${contract.address}`);

  return contract.address
}
