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
import { Address, Bytes } from '@zoltu/ethereum-types'
import { encodeParameters, decodeParameters, parseSignature, generateSignature } from '@zoltu/ethereum-abi-encoder'

// generate description that is aligned with Solidity JSON output
const functionDescription = parseSignature('transfer(address recipient, uint256 value)')
// Result:
// {
// 	name: 'transfer',
// 	inputs: [
// 		{ name: 'recipient', type: 'address', components: undefined },
// 		{ name: 'value', type: 'uint256', components: undefined },
// 	],
// }

// from Solidity JSON output, generate a canonical signature (ready for hashing into 4-byte selector)
const functionSignature = generateSignature(functionDescription)
// Result: transfer(address,uint256)

// generate ABI encoded function parameters from parameter array and Solidity JSON output parameter descriptions
const encodedParameters = encodeParameters(functionSignature.inputs, [Address.fromHexString('0x0000000000000000000000000000000000000000'), 2000000000000000000n])
// Result: 00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001bc16d674ec80000 as Bytes

// can go the other way too, turning Bytes into JS objects (keyed by function parameter names)
const decodedParameters = decodeParameters(functionSignature.inputs, Bytes.fromHexString('00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001bc16d674ec80000'))
// Result: { recipient: 0000000000000000000000000000000000000000 as Address, value: 2000000000000000000n }
