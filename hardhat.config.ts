import { HardhatUserConfig, task } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import { ethers } from "ethers"

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

export default config
