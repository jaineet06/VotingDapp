import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { VotingContractFactory } from '../artifacts/voting/VotingContractClient'

export async function deploy() {
  console.log('=== Deploying VotingContract to Testnet ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  console.log(`Deployer address: ${deployer.addr}`)

  const factory = algorand.client.getTypedAppFactory(VotingContractFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({ 
    onUpdate: 'append', 
    onSchemaBreak: 'append' 
  })

  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  }

  console.log(`✅ VotingContract deployed!`)
  console.log(`   App ID: ${appClient.appClient.appId}`)
  console.log(`   App Address: ${appClient.appAddress}`)
  
  return appClient
}
