import { Component } from '@angular/core'
import { ExternalProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import MatchFactory from '../../../artifacts/contracts/MatchFactory.sol/MatchFactory.json'
import { environment } from '../environments/environment'

declare global {
  interface Window {
    ethereum: ExternalProvider
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gesture-strike'

  account: ethers.providers.JsonRpcSigner | undefined
  matchContract: ethers.Contract | undefined
  matchFactoryContract: ethers.Contract | undefined

  constructor() {}

  connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    provider.send('eth_requestAccounts', []).then(async () => {
      this.account = provider.getSigner()
    })
    this.initializeContracts(environment.matchFactoryContractAddress)
  }

  private initializeContracts(address: string) {
    console.log('initializing contract', address)
    if (!this.account) return
    this.matchFactoryContract = new ethers.Contract(
      environment.matchFactoryContractAddress,
      MatchFactory.abi,
      this.account
    )
  }

  private async getBalance() {
    if (!this.account) return
    const balance = parseFloat(
      ethers.utils.formatEther(await this.account.getBalance())
    )
    console.log('balance', balance)
    return Math.round(balance * 100) / 100
  }
}
