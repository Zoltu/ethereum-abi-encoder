# Description

A dependency free Ethereum ABI encoder/decoder.  Also handles signature parsing and generation!

### Features

 * No dependencies, just pure JS/TS.
 * ES and CommonJS module output.
 * Uses native ES bigint.
 * Simple functional interface.
 * Supports decoding to keyed objects rather than tuples.


# Usage

```bash
npm install @zoltu/ethereum-abi-encoder @zoltu/ethereum-types
```
```typescript
import { Bytes } from '@zoltu/ethereum-types'
import { encodeParameters, decodeParameters, parseSignature, generateCanonicalSignature } from '@zoltu/ethereum-abi-encoder'

// generate description that is aligned with Solidity JSON output
const functionDescription = parseSignature('transfer(address recipient, uint256 value)')
console.log(JSON.stringify(functionDescription, undefined, '\t'))
// Result:
// {
// 	"type": "function",
// 	"name": "transfer",
// 	"inputs": [
// 			{
// 					"name": "recipient",
// 					"type": "address"
// 			},
// 			{
// 					"name": "value",
// 					"type": "uint256"
// 			}
// 	],
// 	"outputs": []
// }

// from Solidity JSON output, generate a canonical signature (ready for hashing into 4-byte selector)
const functionSignature = generateCanonicalSignature(functionDescription)
console.log(functionSignature)
// Result: transfer(address,uint256)

// generate ABI encoded function parameters from parameter array and Solidity JSON output parameter descriptions
const encodedParameters = encodeParameters(functionDescription.inputs, [0x0000000000000000000000000000000000000000n, 2000000000000000000n])
console.log(Bytes.fromByteArray(encodedParameters).to0xString())
// Result: 0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001bc16d674ec80000

// can go the other way too, turning Bytes into JS objects (keyed by function parameter names)
const decodedParameters = decodeParameters(functionDescription.inputs, Bytes.fromHexString('00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001bc16d674ec80000'))
console.log(decodedParameters)
// Result: { recipient: 0n, value: 2000000000000000000n }
```
