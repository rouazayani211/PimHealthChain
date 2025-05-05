import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const NFTTimeAccess = await ethers.getContractFactory("NFTTimeAccess");
  const nftTimeAccess = await NFTTimeAccess.deploy(deployer.address);

  await nftTimeAccess.waitForDeployment();

  console.log("NFTTimeAccess deployed to:", await nftTimeAccess.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 