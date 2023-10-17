const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("fundMe", deployer);
  console.log(`Got contract fundMe at ${fundMe.target}`);
  console.log("Withdrawing...");
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait();
  console.log("Got It Back!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
