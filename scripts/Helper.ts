import * as dotenv from "dotenv"
import { ethers } from "ethers"

dotenv.config()

export const getProvider = () => {
  const provider = ethers.getDefaultProvider(process.env.NETWORK, {
    etherscan: process.env.ETHERSCAN_API_KEY,
    alchemy: process.env.ALCHEMY_API_KEY,
    infura: process.env.INFURA_API_KEY,
  })
  return provider
}

export const getSigner = (accountNo: number = 0) => {
  const provider = getProvider()
  const accountPath = `m/44'/60'/0'/0/${accountNo}`
  const wallet = ethers.Wallet.fromMnemonic(
    process.env.MNEMONIC ?? "",
    accountPath
  )
  return wallet.connect(provider)
}
