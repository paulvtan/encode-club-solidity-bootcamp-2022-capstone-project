import { ethers } from "hardhat"
import { MatchFactory__factory } from "../typechain-types"
import { getSigner } from "./Helper"

// yarn run ts-node --files ./scripts/deployMatchFactory.ts
async function main() {
  const signer = getSigner()
  const matchContractFactory = new MatchFactory__factory(signer)
  const matchFactory = await matchContractFactory.deploy()
  await matchFactory.deployed()

  console.log(`MatchFactory deployed to ${matchFactory.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
