import { ethers } from "hardhat";

async function main() {
  const FileNFT = await ethers.getContractFactory("FileNFT");
  const fileNFT = await FileNFT.deploy();

  await fileNFT.waitForDeployment();

  console.log("FileNFT deployed to:", await fileNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 