import { HardhatUserConfig, task } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import { ethers } from "ethers"
import * as dotenv from "dotenv"
import { getSigner } from "./scripts/Helper"
import { MatchFactory__factory, Match__factory } from "./typechain-types"
import { string } from "hardhat/internal/core/params/argumentTypes"
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
  async ({ account, address, hand, wager }, hre) => {
    const signer = getSigner(Number(account))
    console.log(`Attaching to MatchFactoryContract at ${address}...`)
    const matchFactoryContract = new MatchFactory__factory(signer).attach(
      address
    )
    const tx = await matchFactoryContract.connect(signer).launchMatch(hand, {
      value: ethers.utils.parseEther(wager),
    })
    const receipt = await tx.wait()
    console.log(receipt)
  }
)
  .addOptionalParam("account", "The account number to use", "0")
  .addOptionalParam("hand", "Select index for Rock, Paper, Scissors", "0")
  .addOptionalParam(
    "address",
    "The address of the match factory contract",
    process.env.MATCH_FACTORY_CONTRACT_ADDRESS
  )
  .addOptionalParam("wager", "The amount of ETH to wager", "0.1")

task(
  "joinMatch",
  "Joins a match",
  async ({ account, address, hand, wager }, hre) => {
    const signer = getSigner(Number(account))
    console.log(`Attaching to MatchContract at ${address}...`)
    const matchContract = new Match__factory(signer).attach(address)
    const tx = await matchContract.connect(signer).joinMatch(hand, {
      value: ethers.utils.parseEther(wager),
    })
    const receipt = await tx.wait()
    console.log(receipt)
  }
)
  .addOptionalParam("account", "The account number to use", "0")
  .addOptionalParam("address", "The address of the match contract")
  .addOptionalParam("hand", "Select index for Rock, Paper, Scissors", "0")
  .addOptionalParam("wager", "The amount of ETH to wager", "0.1")

task("getMatchHistory", "Gets the match history", async ({ account }) => {
  interface Match {
    matchAddress: string
    player1: string
    player2: string
    wager: string
    winner: string
  }
  const signer = getSigner(Number(account))
  const matchFactoryContract = new MatchFactory__factory(signer).attach(
    process.env.MATCH_FACTORY_CONTRACT_ADDRESS || ""
  )
  const matchHistory = await matchFactoryContract.getMatchHistory()
  console.log(matchHistory)
  const Matches: Match[] = []
  for (let i = 0; i < matchHistory.length; i++) {
    const matchContract = new Match__factory(signer).attach(matchHistory[i])
    const [player1, player2, totalWagedAmount, winner] = await Promise.all([
      matchContract.player1(),
      matchContract.player2(),
      matchContract.totalWagerAmount(),
      matchContract.winner(),
    ])
    Matches.push({
      matchAddress: matchHistory[i],
      player1: player1,
      player2: player2,
      wager: ethers.utils.formatEther(totalWagedAmount),
      winner: winner,
    })
    console.log(Matches)
  }
}).addOptionalParam("account", "The account number to use", "0")

task(
  "getWinner",
  "Gets the winner of a match",
  async ({ account, address }) => {
    const signer = getSigner(Number(account))
    console.log(`Attaching to MatchContract at ${address}...`)
    const matchContract = new Match__factory(signer).attach(address)
    const winner = await matchContract.winner()
    console.log(`Winner: ${winner}`)
  }
)
  .addOptionalParam("account", "The account number to use", "0")
  .addOptionalParam("address", "The address of the match contract")
export default config
