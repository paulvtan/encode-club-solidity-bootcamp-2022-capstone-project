import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { Match, MatchFactory, Match__factory } from "../typechain-types"

enum Hand {
  ROCK,
  PAPER,
  SCISSORS,
  GUN,
}

describe("Match", async () => {
  let accounts: SignerWithAddress[] = []
  let matchFactoryContract: MatchFactory
  let matchContractFactory: Match__factory
  let matchContract: Match
  const wager = ethers.utils.parseEther("1")
  beforeEach(async () => {
    accounts = await ethers.getSigners()
    matchFactoryContract = (await ethers
      .getContractFactory("MatchFactory")
      .then((contract) => contract.deploy())) as MatchFactory
    matchContractFactory = (await ethers.getContractFactory(
      "Match"
    )) as Match__factory
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    const matchContractAddress = (
      await matchFactoryContract.getMatchHistory()
    )[0]
    matchContract = matchContractFactory.attach(matchContractAddress)
  })

  it("should have the correct player1", async () => {
    const player1 = await matchContract.player1()
    expect(player1).to.equal(accounts[0].address)
  })
  it("should only have player1 initially", async () => {
    const player2 = await matchContract.player2()
    expect(player2).to.equal("0x0000000000000000000000000000000000000000")
  })
  it("should not allow player1 to join twice", async () => {
    await expect(
      matchContract.connect(accounts[0]).joinMatch(Hand.PAPER, {
        value: wager,
      })
    ).to.be.revertedWith("Match: Player 1 already joined")
  })
  it("should have the correct player2", async () => {
    const matchContractAddress = (
      await matchFactoryContract.getMatchHistory()
    )[0]
    matchContract = matchContractFactory.attach(matchContractAddress)
    await matchContract
      .connect(accounts[1])
      .joinMatch(Hand.PAPER, { value: wager })
    const player2 = await matchContract.player2()
    expect(player2).to.equal(accounts[1].address)
  })
  it("should not allow player2 to join twice", async () => {
    await matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    await expect(
      matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
        value: wager,
      })
    ).to.be.revertedWith("Match full: Game already finished")
  })
  it("should not allowed player2 invalid hand", async () => {
    await expect(
      matchContract.connect(accounts[1]).joinMatch(Hand.GUN, {
        value: wager,
      })
    ).to.be.revertedWith("Match: Invalid hand")
  })
  it("should not allow player2 to join with invalid wager", async () => {
    const player2InvalidWager = ethers.utils.parseEther("2")
    await expect(
      matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
        value: player2InvalidWager,
      })
    ).to.be.revertedWith(
      `Match: Waged amount must be equal to player1 waged amount of 1`
    )
  })
  it("should have correct winner", async () => {
    await matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const winner = await matchContract.winner()
    expect(winner).to.equal(accounts[1].address)
  })
  it("should have no winner when draw", async () => {
    await matchContract.connect(accounts[1]).joinMatch(Hand.ROCK, {
      value: wager,
    })
    const winner = await matchContract.winner()
    expect(winner).to.equal("0x0000000000000000000000000000000000000000")
  })
  it("should have correct initial amount of balance", async () => {
    const balance = await matchContract.getBalance()
    expect(balance).to.equal(ethers.utils.parseEther("1"))
  })
  it("should refund each player correct amount when draw", async () => {
    const player1Balance = await accounts[0].getBalance()
    const player2Balance = await accounts[1].getBalance()
    const tx = await matchContract.connect(accounts[1]).joinMatch(Hand.ROCK, {
      value: wager,
    })
    const receipt = await tx.wait()
    const gasCosts = receipt.gasUsed.mul(receipt.effectiveGasPrice)
    const player1BalanceAfter = await accounts[0].getBalance()
    const player2BalanceAfter = await accounts[1].getBalance()
    expect(player1BalanceAfter).to.equal(player1Balance.add(wager))
    expect(player2BalanceAfter).to.equal(player2Balance.sub(gasCosts))
  })
  it("should send a correct amount of ether to winner", async () => {
    const winnerBalance = await accounts[1].getBalance()
    const tx = await matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const receipt = await tx.wait()
    const gasUsed = receipt.gasUsed
    const pricePerGas = receipt.effectiveGasPrice
    const gasCosts = gasUsed.mul(pricePerGas)
    const winnerBalanceAfter = await accounts[1].getBalance()
    expect(winnerBalanceAfter).to.equal(winnerBalance.add(wager).sub(gasCosts))
  })
})
