// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

  const [deployer, tokenHolder] = await ethers.getSigners();
  console.log('Deploying contracts with the account: ' + deployer.address);
  console.log('Token holder: ' + tokenHolder.address);

  trst = deployContract("TRST0", "Cool TRST", "TRSTC", deployer.address, 1000)

  rate = 1000000
  buyToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //USDC
  deployContract("TRST0CrowdsaleERC20", rate, deployer.address, tokenHolder.address, trst, buyToken)

  deployContract("TRST0PaybackERC20", trst, buyToken, rate)
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

  console.log(
    `${contractName} address: ${contract.address}`
  );

  return contract.address
}
