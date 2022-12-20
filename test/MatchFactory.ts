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
})
