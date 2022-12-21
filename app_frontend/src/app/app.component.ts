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
  accountBalance: number | undefined
  account: ethers.providers.JsonRpcSigner | undefined
  matchFactoryContract: ethers.Contract | undefined
  activeMatches: IMatch[] = []
  matchHistory: IMatch[] = []
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
      this.getPlayerBalance()
      this.getActiveMatches()
      this.getLastMatchHistory()
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
        this.activeMatches = []
        activeMatchAddresses.forEach(async (matchAddress) => {
          this.getMatch(matchAddress).then((match) => {
            if (match) {
              this.activeMatches.unshift(match)
            }
          })
        })
      }
    )
  }

  async getMatchHistory() {
    if (!this.matchFactoryContract) return
    if (!this.account) return
    await this.matchFactoryContract['getMatchHistory']().then(
      (matchHistory: string[]) => {
        console.log(matchHistory)
        this.matchHistory = []
        matchHistory.forEach(async (matchAddress) => {
          this.getMatch(matchAddress, true).then((match) => {
            if (match) {
              this.matchHistory.unshift(match)
            }
          })
        })
      }
    )
  }

  async getLastMatchHistory() {
    if (!this.matchFactoryContract) return
    if (!this.account) return
    await this.matchFactoryContract['getLatestMatch']().then(
      (matchHistory: string) => {
        this.matchHistory = []
        this.getMatch(matchHistory, true).then((match) => {
          if (match) {
            this.matchHistory.unshift(match)
          }
        })
      }
    )
  }

  private async getMatch(matchAddress: string, isHistory = false) {
    if (!this.account) return
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
    return match
  }

  formatPlayerAddress(name: string) {
    if (!this.account) return
    if (name === this.accountAddress) return 'You'
    return name.slice(0, 7) + '...' + name.slice(-7)
  }

  getWinner(match: IMatch) {
    if (match.winner === '0x0000000000000000000000000000000000000000') {
      return 'Tie'
    } else if (match.winner === this.accountAddress) {
      return 'You'
    } else {
      return match.winner.slice(0, 7) + '...' + match.winner.slice(-7)
    }
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
          this.getPlayerBalance()
          this.getActiveMatches()
          this.getLastMatchHistory()
        })
      })
      .catch((error: any) => {
        console.log('error', error)
        this.isSendingTransaction = false
      })
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
          this.getPlayerBalance()
          this.getActiveMatches()
          this.getLastMatchHistory()
        })
      })
      .catch((error: any) => {
        console.log('error', error)
        this.isSendingTransaction = false
      })
  }

  async getPlayerBalance() {
    if (!this.account) return
    const balance = parseFloat(
      ethers.utils.formatEther(await this.account.getBalance())
    )
    console.log('balance', balance)
    this.accountBalance = Math.round(balance * 100) / 100
  }
}
