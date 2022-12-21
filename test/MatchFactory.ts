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

describe("MatchFactory", async () => {
  let accounts: SignerWithAddress[] = []
  let matchFactoryContract: MatchFactory
  let matchContractFactory: Match__factory
  beforeEach(async () => {
    accounts = await ethers.getSigners()
    matchFactoryContract = (await ethers
      .getContractFactory("MatchFactory")
      .then((contract) => contract.deploy())) as MatchFactory
    matchContractFactory = (await ethers.getContractFactory(
      "Match"
    )) as Match__factory
  })
  it("should have the correct owner", async () => {
    const owner = await matchFactoryContract.owner()
    expect(owner).to.equal(accounts[0].address)
  })
  it("should launch a match", async () => {
    const wager = ethers.utils.parseEther("1")
    const match = await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    expect(match).not.to.be.undefined
  })
  it("should fail to launch a match with 0 wager", async () => {
    await expect(
      matchFactoryContract.launchMatch(Hand.PAPER)
    ).to.be.revertedWith("Wager must be greater than 0")
  })
  it("it should fail to launch a match with invalid hand", async () => {
    const wager = ethers.utils.parseEther("1")
    const invalidStartingHand = Hand.GUN
    await expect(
      matchFactoryContract.launchMatch(invalidStartingHand, { value: wager })
    ).to.be.revertedWith("Invalid starting hand")
  })
  it("should return the correct number of matches", async () => {
    const wager = ethers.utils.parseEther("1")
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    await matchFactoryContract.launchMatch(Hand.PAPER, {
      value: wager,
    })
    const matchCount = await matchFactoryContract.getMatchCount()
    expect(matchCount).to.equal(2)
  })
  it("should return the same match history for both player1 and player 2", async () => {
    const wager = ethers.utils.parseEther("1")
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    await matchFactoryContract.launchMatch(Hand.PAPER, {
      value: wager,
    })
    const matchAddress1 = (await matchFactoryContract.getMatchHistory())[0]
    const matchContract1 = matchContractFactory.attach(matchAddress1)
    await matchContract1.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const matchAddress2 = (await matchFactoryContract.getMatchHistory())[1]
    const matchContract2 = matchContractFactory.attach(matchAddress2)
    await matchContract2.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const player1MatchHistory = await matchFactoryContract
      .connect(accounts[0])
      .getMatchHistory()
    const player2MatchHistory = await matchFactoryContract
      .connect(accounts[1])
      .getMatchHistory()
    expect(player1MatchHistory).to.deep.equal(player2MatchHistory)
  })
  it("should return the correct match history outcome for winner", async () => {
    const wager = ethers.utils.parseEther("1")
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    const matchAddress = (await matchFactoryContract.getMatchHistory())[0]
    const matchContract = matchContractFactory.attach(matchAddress)
    await matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const player1MatchHistory = await matchFactoryContract
      .connect(accounts[0])
      .getMatchHistory()
    const winner = await matchContract.winner()
    expect(accounts[1].address).to.equal(winner)
  })
  it("should return activeMatches", async () => {
    const wager = ethers.utils.parseEther("1")
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    const activeMatches = await matchFactoryContract.getActiveMatches()
    expect(activeMatches.length).to.equal(1)
  })
  it("should return correct activeMatches after match is completed", async () => {
    const wager = ethers.utils.parseEther("1")
    await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    const matchAddress = (await matchFactoryContract.getMatchHistory())[0]
    const matchContract = matchContractFactory.attach(matchAddress)
    await matchContract.connect(accounts[1]).joinMatch(Hand.PAPER, {
      value: wager,
    })
    const activeMatches = await matchFactoryContract.getActiveMatches()
    expect(activeMatches.length).to.equal(0)
  })
})
