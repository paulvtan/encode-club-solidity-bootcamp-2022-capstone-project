import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { MatchFactory } from "../typechain-types"

enum Hand {
  ROCK,
  PAPER,
  SCISSORS,
  GUN,
}

describe("MatchFactory", () => {
  let accounts: SignerWithAddress[] = []
  let matchFactoryContract: MatchFactory
  beforeEach(async () => {
    accounts = await ethers.getSigners()
    matchFactoryContract = (await ethers
      .getContractFactory("MatchFactory")
      .then((contract) => contract.deploy())) as MatchFactory
  })
  it("should launch a match", async () => {
    const wager = ethers.utils.parseEther("1")
    const match = await matchFactoryContract.launchMatch(Hand.ROCK, {
      value: wager,
    })
    expect(match).not.to.be.undefined
  })
  it("should fail to launch a match with 0 wager", async () => {
    await expect(matchFactoryContract.launchMatch(0)).to.be.revertedWith(
      "Wager must be greater than 0"
    )
  })
  it("it should fail to launch a match with invalid hand", async () => {
    const invalidStartingHand = Hand.GUN
    await expect(
      matchFactoryContract.launchMatch(invalidStartingHand)
    ).to.be.revertedWith("Invalid starting hand")
  })
  it("should have the correct owner", async () => {
    const owner = await matchFactoryContract.owner()
    expect(owner).to.equal(accounts[0].address)
  })
})
