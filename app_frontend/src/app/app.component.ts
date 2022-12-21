import { Component } from '@angular/core'
import { ExternalProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import MatchFactory from '../../../artifacts/contracts/MatchFactory.sol/MatchFactory.json'
import Match from '../../../artifacts/contracts/Match.sol/Match.json'
import { environment } from '../environments/environment'

declare global {
  interface Window {
    ethereum: ExternalProvider
  }
}

export interface IMatch {
  matchFactoryAddressOwner: string
  matchContractAddress: string
  totalWagerAmount: number
  player1: string
  player2: string
  winner: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gesture-strike'

  accountAddress: string | undefined
  account: ethers.providers.JsonRpcSigner | undefined
  matchFactoryContract: ethers.Contract | undefined
  activeMatches: IMatch[] = []
  isSendingTransaction = false

  constructor() {}

  connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    provider.send('eth_requestAccounts', []).then(async () => {
      this.account = provider.getSigner()
      this.matchFactoryContract = this.initializeContracts(
        environment.matchFactoryContractAddress,
        MatchFactory.abi
      )
      this.getActiveMatches()
      this.accountAddress = await this.account.getAddress()
    })
  }

  private initializeContracts(address: string, abi: any) {
    if (!this.account) return
    console.log('initializing contract', address)
    return new ethers.Contract(address, abi, this.account)
  }

  private async getActiveMatches() {
    if (!this.matchFactoryContract) return
    if (!this.account) return
    console.log('getting active matches')
    await this.matchFactoryContract['getActiveMatches']().then(
      (activeMatchAddresses: string[]) => {
        activeMatchAddresses.forEach(async (matchAddress) => {
          this.getMatch(matchAddress)
        })
      }
    )
  }

  private async getMatch(matchAddress: string) {
    if (!this.account) return
    this.activeMatches = []
    const matchContract = new ethers.Contract(
      matchAddress,
      Match.abi,
      this.account
    )
    const [totalWagerAmount, player1, player2, winner] = await Promise.all([
      matchContract['totalWagerAmount'](),
      matchContract['player1'](),
      matchContract['player2'](),
      matchContract['winner'](),
    ])
    const match: IMatch = {
      matchFactoryAddressOwner: matchAddress,
      matchContractAddress: matchAddress,
      totalWagerAmount: parseFloat(ethers.utils.formatEther(totalWagerAmount)),
      player1,
      player2,
      winner,
    }
    console.log('match', match)
    this.activeMatches.push(match)
  }

  formatPlayerAddress(name: string) {
    if (!this.account) return
    if (name === this.accountAddress) return 'You'
    return name.slice(0, 7) + '...' + name.slice(-7)
  }

  createMatch(hand: number, wager: string) {
    if (!this.matchFactoryContract) return
    this.isSendingTransaction = true
    this.matchFactoryContract['launchMatch'](hand, {
      value: ethers.utils.parseEther(wager),
    })
      .then((tx: ethers.ContractTransaction) => {
        console.log('tx', tx)
        tx.wait().then((receipt) => {
          console.log('receipt', receipt)
          this.isSendingTransaction = false
          this.getActiveMatches()
        })
      })
      .catch((error: any) => {
        console.log('error', error)
        this.isSendingTransaction = false
      })
  }

  private async getPlayerBalance() {
    if (!this.account) return
    const balance = parseFloat(
      ethers.utils.formatEther(await this.account.getBalance())
    )
    console.log('balance', balance)
    return Math.round(balance * 100) / 100
  }

  joinMatch(match: IMatch, hand: number) {
    if (!this.account) return
    this.isSendingTransaction = true
    const matchContract = new ethers.Contract(
      match.matchContractAddress,
      Match.abi,
      this.account
    )
    matchContract['joinMatch'](hand, {
      value: ethers.utils.parseEther(match.totalWagerAmount.toString()),
    })
      .then((tx: ethers.ContractTransaction) => {
        console.log('tx', tx)
        tx.wait().then((receipt) => {
          console.log('receipt', receipt)
          this.isSendingTransaction = false
          this.getActiveMatches()
        })
      })
      .catch((error: any) => {
        console.log('error', error)
        this.isSendingTransaction = false
      })
  }
}
