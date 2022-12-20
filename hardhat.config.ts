import { HardhatUserConfig, task } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import { ethers } from "ethers"
import * as dotenv from "dotenv"
import { getSigner } from "./scripts/Helper"
import { MatchFactory__factory } from "./typechain-types"
dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.17",
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task("getLastBlock", "Prints the last block number", async (taskArgs, hre) => {
  const provider = ethers.getDefaultProvider("goerli", {
    alchemy: process.env.ALCHEMY_API_KEY,
    etherscan: process.env.ETHERSCAN_API_KEY,
    infura: process.env.INFURA_API_KEY,
  })
  const block = await provider.getBlockNumber()
  console.log(block)
})

task("hello", "Pass in greeting parameter", async ({ greeting }, hre) => {
  console.log(greeting)
}).addOptionalParam("greeting", "The greeting to print", "Hello, world!")

task(
  "launchMatch",
  "Launches a match",
  async ({ accountNo, matchFactoryContractAddr, startingHand, wager }, hre) => {
    const signer = getSigner(Number(accountNo))
    console.log(
      `Attaching to MatchFactoryContract at ${matchFactoryContractAddr}...`
    )
    const matchFactoryContract = new MatchFactory__factory(signer).attach(
      matchFactoryContractAddr
    )
    const tx = await matchFactoryContract
      .connect(signer)
      .launchMatch(startingHand, {
        value: ethers.utils.parseEther(wager),
      })
    const receipt = await tx.wait()
    console.log(receipt)
  }
)
  .addOptionalParam("accountNo", "The account number to use", "0")
  .addOptionalParam(
    "startingHand",
    "Select index for Rock, Paper, Scissors",
    "0"
  )
  .addOptionalParam(
    "matchFactoryContractAddr",
    "The address of the match factory contract",
    process.env.MATCH_FACTORY_CONTRACT_ADDRESS
  )
  .addOptionalParam("wager", "The amount of ETH to wager", "0.1")
export default config
