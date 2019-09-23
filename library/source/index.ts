import { EncodableTuple, Encodable, Bytes, EncodableArray, Address, FixedBytesLike, Bytes32, Bytes31, Bytes30, Bytes29, Bytes28, Bytes27, Bytes26, Bytes25, Bytes24, Bytes23, Bytes22, Bytes21, Bytes20, Bytes19, Bytes18, Bytes17, Bytes16, Bytes15, Bytes14, Bytes13, Bytes12, Bytes11, Bytes10, Bytes9, Bytes8, Bytes7, Bytes6, Bytes5, Bytes4, Bytes3, Bytes2, Bytes1 } from '@zoltu/ethereum-types'

interface FunctionDescription {
	readonly type?: 'function'
	readonly name: string
	readonly inputs: ReadonlyArray<ParameterDescription>
	readonly outputs?: ReadonlyArray<ParameterDescription>
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

interface EventDescription {
	readonly type: 'event'
	readonly name: string
	readonly inputs: ReadonlyArray<EventParameterDescription>
	readonly anonymous?: boolean
}

interface ConstructorDescription {
	readonly type: 'constructor'
	readonly inputs?: ReadonlyArray<ParameterDescription>
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

interface FallbackDescription {
	readonly type: 'fallback'
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

type AbiDescription = FunctionDescription | EventDescription | ConstructorDescription | FallbackDescription

interface ParameterDescription {
	readonly name: string
	readonly type: string
	readonly components?: ReadonlyArray<ParameterDescription>
}

interface EventParameterDescription extends ParameterDescription {
	readonly indexed: boolean
}

interface DecodedEvent {
	readonly name: string
	readonly parameters: EncodableTuple
}


// signature parsing

export function parseSignature(functionSignature: string): FunctionDescription {
	const signatureMatcher = /^([a-zA-Z_][a-zA-Z0-9_]+)\((.*)\)$/
	const matchedSignature = signatureMatcher.exec(functionSignature)
	if (matchedSignature === null) throw new Error(`${functionSignature} is not a valid Solidity function signature.`)
	const name = matchedSignature[1]
	const inputs = parseParameters(matchedSignature[2])
	return { type: 'function', name, inputs, outputs: [] }
}

function parseParameters(functionParameters: string): Array<ParameterDescription> {
	const parameters: Array<ParameterDescription> = []
	let remainingParameters = functionParameters.trim()
	while (remainingParameters.length !== 0) {
		let {parameterDescription, remaining} = extractNextParameter(remainingParameters)
		remainingParameters = remaining
		parameters.push(parameterDescription)
	}
	return parameters
}

function extractNextParameter(functionParameters: string): {parameterDescription: ParameterDescription, remaining: string} {
	let nesting = 0
	let typeAndName = ''
	for (const character of functionParameters) {
		// walk until we reach either the end of the string or a comma outside of all parenthesis
		if (character === '(') ++nesting
		if (character === ')') --nesting
		if (nesting < 0) throw new Error(`${functionParameters} does not have matching number of open and close parenthesis`)
		if (nesting > 0) {
			typeAndName += character
			continue
		}
		if (character === ',') break
		typeAndName += character
	}
	const typeAndNameMatch = /^\s*(.+?)\s*(?:\s([a-zA-Z_][a-zA-Z0-9_]*))?\s*$/.exec(typeAndName)
	if (typeAndNameMatch === null) throw new Error(`${typeAndNameMatch} is not a valid parameter/name pair.`)
	let parameterType = typeAndNameMatch[1]
	let components: Array<ParameterDescription> | undefined = undefined
	if (parameterType.startsWith('(')) {
		const tupleTypes = parameterType.slice(1, parameterType.lastIndexOf(')'))
		parameterType = `tuple${parameterType.slice(tupleTypes.length + 2)}`
		components = parseParameters(tupleTypes)
	}
	const parameterName = typeAndNameMatch[2] || ''
	let remaining = functionParameters.slice(typeAndName.length)
	if (remaining.startsWith(',')) remaining = remaining.slice(1)
	remaining = remaining.trim()
	const parameterDescription: ParameterDescription = {
		name: parameterName,
		type: parameterType,
		components: components,
	}
	return { parameterDescription, remaining }
}


// signature generation

export function generateSignature(functionDescription: FunctionDescription): string {
	return `${functionDescription.name}(${toCanonicalParameters(functionDescription.inputs)})`
}

function toCanonicalParameters(parameters: ReadonlyArray<ParameterDescription>): string {
	return parameters.map(toCanonicalParameter).join(',')
}

function toCanonicalParameter(parameter: ParameterDescription): string {
	if (parameter.type.startsWith('tuple')) {
		if (parameter.components === undefined) throw new Error(`Encountered a 'tuple' type that had no components.  Did you mean to include an empty array?`)
		return `(${toCanonicalParameters(parameter.components)})${parameter.type.slice('tuple'.length)}`
	} else {
		return parameter.type
	}
}


// decoding

export function decodeParameters(descriptions: ReadonlyArray<ParameterDescription>, data: Uint8Array): EncodableTuple {
	let offset = 0
	const decoded: EncodableTuple = {}
	for (let description of descriptions) {
		const { result, consumed } = decodeParameter(description, data, offset)
		offset += consumed
		// it is possible that name is missing/null/empty string if there is only a single parameter, in which case we use the placeholder name 'result'
		decoded[description.name || 'result'] = result
	}
	return decoded
}

function decodeParameter(description: ParameterDescription, data: Uint8Array, offset: number): { result: Encodable, consumed: number } {
	return tryDecodeFixedArray(description, data, offset)
		|| tryDecodeDynamicArray(description, data, offset)
		|| tryDecodeTuple(description, data, offset)
		|| tryDecodeDynamicBytes(description, data, offset)
		|| tryDecodeString(description, data, offset)
		|| tryDecodeBoolean(description, data, offset)
		|| tryDecodeNumber(description, data, offset)
		|| tryDecodeNumber(description, data, offset)
		|| tryDecodeAddress(description, data, offset)
		|| tryDecodeFixedBytes(description, data, offset)
		|| tryDecodeFixedPointNumber(description, data, offset)
		|| tryDecodeFunction(description, data, offset)
		|| function () { throw new Error(`Unsupported parameter type ${description.type}`) }()
}

function tryDecodeFixedArray(description: ParameterDescription, data: Uint8Array, offset: number): { result: EncodableArray, consumed: number } | null {
	const match = /^(.*)\[(\d+)\]$/.exec(description.type)
	if (match === null) return null
	const subdescription = Object.assign({}, description, { type: match[1] })
	const length = Number.parseInt(match[2], 10)
	if (isDynamic(subdescription)) {
		const pointer = Number(Bytes32.fromByteArray(data.subarray(offset, offset + 32)).toUnsignedBigint())
		const result: Encodable[] = []
		let consumed = 0
		for (let i = 0; i < length; ++i) {
			const { result: itemResult, consumed: itemConsumed } = decodeParameter(subdescription, data.subarray(pointer), consumed)
			consumed += itemConsumed
			result.push(itemResult)
		}
		return { result, consumed }
	} else {
		const result: Encodable[] = []
		let consumed = 0
		for (let i = 0; i < length; ++i) {
			const { result: itemResult, consumed: itemConsumed } = decodeParameter(subdescription, data, offset + consumed)
			consumed += itemConsumed
			result.push(itemResult)
		}
		return { result, consumed }
	}
}

function tryDecodeDynamicArray(description: ParameterDescription, data: Uint8Array, offset: number): { result: EncodableArray, consumed: number } | null {
	if (!description.type.endsWith('[]')) return null
	const subtype = description.type.substring(0, description.type.length - 2)
	const subdescription = Object.assign({}, description, { type: subtype })
	const pointer = Number(Bytes32.fromByteArray(data.subarray(offset, offset + 32)).toUnsignedBigint())
	const length = Number(Bytes32.fromByteArray(data.subarray(pointer, pointer + 32)).toUnsignedBigint())
	const result: Encodable[] = []
	let consumed = 0
	for (let i = 0; i < length; ++i) {
		const { result: itemResult, consumed: itemConsumed } = decodeParameter(subdescription, data.subarray(pointer + 32), consumed)
		consumed += itemConsumed
		result.push(itemResult)
	}
	return { result, consumed }
}

function tryDecodeTuple(description: ParameterDescription, data: Uint8Array, offset: number): { result: EncodableTuple, consumed: number } | null {
	if (description.type !== 'tuple') return null
	const result: EncodableTuple = {}
	let consumed: number = 0
	if (description.components === undefined || description.components.length === 0) {
	} else if (anyIsDynamic(description.components)) {
		const pointer = Number(Bytes32.fromByteArray(data.subarray(offset, offset + 32)).toUnsignedBigint())
		for (let component of description.components) {
			const { result: componentResult, consumed: componentConsumed } = decodeParameter(component, data.subarray(pointer), consumed)
			consumed += componentConsumed
			result[component.name] = componentResult
		}
		// from the point of view of the caller, we only consumed 32 bytes (the pointer)
		consumed = 32
	} else {
		for (let component of description.components) {
			const { result: componentResult, consumed: componentConsumed } = decodeParameter(component, data, offset + consumed)
			consumed += componentConsumed
			result[component.name] = componentResult
		}
	}
	return { result, consumed }
}

function tryDecodeDynamicBytes(description: ParameterDescription, data: Uint8Array, offset: number): { result: Bytes, consumed: 32 } | null {
	if (description.type !== 'bytes') return null
	const pointer = Number(Bytes32.fromByteArray(data.subarray(offset, offset + 32)).toUnsignedBigint())
	const length = Number(Bytes32.fromByteArray(data.subarray(pointer, pointer + 32)).toUnsignedBigint())
	const bytes = Bytes.fromByteArray(data.subarray(pointer + 32, pointer + 32 + length))
	return { result: bytes, consumed: 32 }
}

function tryDecodeString(description: ParameterDescription, data: Uint8Array, offset: number): { result: string, consumed: 32 } | null {
	if (description.type !== 'string') return null
	const pointer = Number(Bytes32.fromByteArray(data.subarray(offset, offset + 32)).toUnsignedBigint())
	const length = Number(Bytes32.fromByteArray(data.subarray(pointer, pointer + 32)).toUnsignedBigint())
	const bytes = Bytes.fromByteArray(data.subarray(pointer + 32, pointer + 32 + length))
	const decoded = new TextDecoder().decode(bytes)
	return { result: decoded, consumed: 32 }
}

function tryDecodeBoolean(description: ParameterDescription, data: Uint8Array, offset: number): { result: boolean, consumed: 32 } | null {
	if (description.type !== 'bool') return null
	const bytes = Bytes32.fromByteArray(data.subarray(offset, offset + 32))
	const decoded = (bytes.toUnsignedBigint() === 0n) ? false : true
	return { result: !!decoded, consumed: 32 }
}

function tryDecodeNumber(description: ParameterDescription, data: Uint8Array, offset: number): { result: bigint, consumed: 32 } | null {
	const match = /^(u?)int(\d*)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[2])
	if (size <= 0 || size > 256 || size % 8) return null
	const signed = !match[1]
	const bytes = Bytes32.fromByteArray(data.subarray(offset, offset + 32))
	const decoded = signed ? bytes.toSignedBigint() : bytes.toUnsignedBigint()
	if (decoded >= 2n**BigInt(size)) throw new Error(`Encoded number is bigger than the expected size.  Expected ${size}, but decoded ${decoded}.`)
	return { result: decoded, consumed: 32 }
}

function tryDecodeAddress(description: ParameterDescription, data: Uint8Array, offset: number): { result: Address, consumed: 32 } | null {
	if (description.type !== 'address') return null
	return { result: Address.fromByteArray(data.subarray(offset + 12, offset + 32)), consumed: 32 }
}

function tryDecodeFixedBytes(description: ParameterDescription, data: Uint8Array, offset: number): { result: FixedBytesLike, consumed: 32} | null {
	const match = /^bytes(\d+)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	const dataSubset = data.subarray(offset, offset + size)
	if (size == 32) return { result: Bytes32.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 31) return { result: Bytes31.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 30) return { result: Bytes30.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 29) return { result: Bytes29.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 28) return { result: Bytes28.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 27) return { result: Bytes27.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 26) return { result: Bytes26.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 25) return { result: Bytes25.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 24) return { result: Bytes24.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 23) return { result: Bytes23.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 22) return { result: Bytes22.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 21) return { result: Bytes21.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 20) return { result: Bytes20.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 19) return { result: Bytes19.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 18) return { result: Bytes18.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 17) return { result: Bytes17.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 16) return { result: Bytes16.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 15) return { result: Bytes15.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 14) return { result: Bytes14.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 13) return { result: Bytes13.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 12) return { result: Bytes12.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 11) return { result: Bytes11.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 10) return { result: Bytes10.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 9) return { result: Bytes9.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 8) return { result: Bytes8.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 7) return { result: Bytes7.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 6) return { result: Bytes6.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 5) return { result: Bytes5.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 4) return { result: Bytes4.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 3) return { result: Bytes3.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 2) return { result: Bytes2.fromByteArray(dataSubset), consumed: 32 }
	else if (size == 1) return { result: Bytes1.fromByteArray(dataSubset), consumed: 32 }
	return null
}

function tryDecodeFixedPointNumber(description: ParameterDescription, _data: Uint8Array, _offset: number): never | null {
	if (!/^u?fixed\d+x\d+$/.test(description.type)) return null
	throw new Error(`Encoding an EVM type ${description.type} is not supported`)
}

function tryDecodeFunction(description: ParameterDescription, _data: Uint8Array, _offset: number): never | null {
	if (description.type !== 'function') return null
	throw new Error(`Decoding an EVM type ${description.type} is not supported`)
}


// encoding

export function encodeParameters(descriptions: ReadonlyArray<ParameterDescription>, parameters: ReadonlyArray<Encodable>): Bytes {
	if (descriptions.length !== parameters.length) throw new Error(`Number of provided parameters (${parameters.length}) does not match number of expected parameters (${descriptions.length})`)
	const encodedParameters = parameters.map((nestedParameter, index) => encodeParameter(descriptions[index], nestedParameter))
	return encodeDynamicData(encodedParameters)
}

function encodeParameter(description: ParameterDescription, parameter: Encodable): { isDynamic: boolean, bytes: Uint8Array } {
	return tryEncodeFixedArray(description, parameter)
		|| tryEncodeDynamicArray(description, parameter)
		|| tryEncodeTuple(description, parameter)
		|| tryEncodeDynamicBytes(description, parameter)
		|| tryEncodeString(description, parameter)
		|| tryEncodeBoolean(description, parameter)
		|| tryEncodeNumber(description, parameter)
		|| tryEncodeAddress(description, parameter)
		|| tryEncodeFixedBytes(description, parameter)
		|| tryEncodeFixedPointNumber(description)
		|| tryEncodeFunction(description)
		|| function () { throw new Error(`Unsupported parameter type ${description.type}`) }()
}

function tryEncodeFixedArray(description: ParameterDescription, parameter: Encodable): { isDynamic: boolean, bytes: Uint8Array } | null {
	const match = /^(.*)\[(\d+)\]$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[2])
	if (!Array.isArray(parameter) || parameter.length !== size) throw new Error(`Can only encode a JavaScript 'array' of length ${size} into an EVM 'array' of length ${size}\n${parameter}`)
	const nestedDescription = Object.assign({}, description, { type: match[1] })
	const encodedParameters = parameter.map(nestedParameter => encodeParameter(nestedDescription, nestedParameter))
	const isDynamic = encodedParameters.some(x => x.isDynamic)
	if (isDynamic) {
		return { isDynamic: isDynamic, bytes: encodeDynamicData(encodedParameters)}
	} else {
		return { isDynamic: isDynamic, bytes: concatenateBytes(encodedParameters.map(x => x.bytes)) }
	}
}

function tryEncodeDynamicArray(description: ParameterDescription, parameter: Encodable): { isDynamic: true, bytes: Uint8Array } | null {
	if (!description.type.endsWith('[]')) return null
	if (!Array.isArray(parameter)) throw new Error(`Can only encode a JavaScript 'array' into an EVM 'array'\n${parameter}`)
	const nestedDescription = Object.assign({}, description, { type: description.type.substring(0, description.type.length - 2) })
	const encodedParameters = parameter.map(nestedParameter => encodeParameter(nestedDescription, nestedParameter))
	const lengthBytes = Bytes32.fromUnsignedInteger(encodedParameters.length)
	return { isDynamic: true, bytes: concatenateBytes([lengthBytes, encodeDynamicData(encodedParameters)]) }
}

function tryEncodeTuple(description: ParameterDescription, parameter: Encodable): { isDynamic: boolean, bytes: Uint8Array } | null {
	if (description.type !== 'tuple') return null
	if (typeof parameter !== 'object') throw new Error(`Can only encode a JavaScript 'object' or a JavaScript array into an EVM 'tuple'\n${parameter}`)
	if (description.components === undefined || description.components.length === 0) {
		return { isDynamic: false, bytes: new Bytes(0) }
	} else {
		const encodableTupleOrArray = parameter as EncodableTuple | EncodableArray
		const encodedComponents = description.components.map((component, index) => {
			const parameter = isEncodableArray(encodableTupleOrArray) ? encodableTupleOrArray[index] : encodableTupleOrArray[component.name]
			return encodeParameter(component, parameter)
		})
		const isDynamic = encodedComponents.some(x => x.isDynamic)
		return { isDynamic: isDynamic, bytes: isDynamic ? encodeDynamicData(encodedComponents) : concatenateBytes(encodedComponents.map(x => x.bytes)) }
	}
}

function tryEncodeDynamicBytes(description: ParameterDescription, parameter: Encodable): { isDynamic: true, bytes: Uint8Array } | null {
	if (description.type !== 'bytes') return null
	if (!(parameter instanceof Uint8Array)) throw new Error(`Can only encode a JavaScript 'Uint8Array' into EVM 'bytes'\n${parameter}`)
	return { isDynamic: true, bytes: padAndLengthPrefix(parameter) }
}

function tryEncodeString(description: ParameterDescription, parameter: Encodable): { isDynamic: true, bytes: Uint8Array } | null {
	if (description.type !== 'string') return null
	if (typeof parameter !== 'string') throw new Error(`Can only encode a JavaScript 'string' into an EVM 'string'\n${parameter}`)
	const encoded = new TextEncoder().encode(parameter)
	return { isDynamic: true, bytes: padAndLengthPrefix(encoded) }
}

function tryEncodeBoolean(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	if (description.type !== 'bool') return null
	if (typeof parameter !== 'boolean') throw new Error(`Can only encode JavaScript 'boolean' into EVM 'bool'\n${parameter}`)
	const bytes = new Bytes32()
	bytes.set([parameter ? 1 : 0], 31)
	return { isDynamic: false, bytes }
}

function tryEncodeNumber(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	const match = /^(u?)int(\d*)$/.exec(description.type)
	if (match === null) return null
	if (typeof parameter !== 'bigint') throw new Error(`Can only encode a JavaScript 'bigint' into an EVM '${description.type}'\n${parameter}`)
	const size = Number.parseInt(match[2])
	if (size <= 0 || size > 256 || size % 8) throw new Error(`EVM numbers must be in range [8, 256] and must be divisible by 8.`)
	if (parameter >= 2n**BigInt(size)) throw new Error(`Attempted to encode ${parameter} into a ${description.type}, but it is too big to fit.`)
	const signed = !match[1]
	const bytes = signed ? Bytes32.fromSignedInteger(parameter) : Bytes32.fromUnsignedInteger(parameter)
	return { isDynamic: false, bytes }
}

function tryEncodeAddress(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	if (description.type !== 'address') return null
	if (!(parameter instanceof Uint8Array) || parameter.length !== 20) throw new Error(`Can only encode JavaScript 'Uint8Array(20)' into EVM 'address'\n${parameter}`)
	return { isDynamic: false, bytes: padLeftTo32Bytes(parameter) }
}

function tryEncodeFixedBytes(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	const match = /^bytes(\d+)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (!(parameter instanceof Uint8Array) || parameter.length !== size) throw new Error(`Can only encode JavaScript 'Uint8Array(${size})' into EVM 'bytes${size}'\n${parameter}`)
	return { isDynamic: false, bytes: padRightTo32Bytes(parameter) }
}

function tryEncodeFixedPointNumber(description: ParameterDescription): { isDynamic: never, bytes: Uint8Array } | null {
	if (!/^u?fixed\d+x\d+$/.test(description.type)) return null
	throw new Error(`Encoding into EVM type ${description.type} is not supported`)
}

function tryEncodeFunction(description: ParameterDescription): { isDynamic: never, bytes: Uint8Array } | null {
	if (description.type !== 'function') return null
	throw new Error(`Encoding into EVM type ${description.type} is not supported`)
}


// events

export async function decodeUnknownEvent(keccak256: (message: Uint8Array) => Promise<bigint>, abi: ReadonlyArray<AbiDescription>, topics: ReadonlyArray<Bytes32>, data: Bytes): Promise<DecodedEvent> {
	for (const eventDescription of abi) {
		if (!isEventDescription(eventDescription)) continue
		const canonicalSignature = `${eventDescription.name}(${eventDescription.inputs.map(parameter => parameter.type).join(",")})`
		const signatureHash = Bytes32.fromUnsignedInteger(await keccak256(new TextEncoder().encode(canonicalSignature)))
		if (!topics[0].equals(signatureHash)) continue
		return decodeEvent(eventDescription, topics, data)
	}
	throw new Error(`No event description matched the event ${topics[0]}`)
}

export function decodeEvent(eventDescription: EventDescription, topics: ReadonlyArray<Bytes32>, data: Bytes): DecodedEvent {
	// CONSIDER: should we take in a hash function so we can verify topics[0] matches, or just blindly extract?
	const decodedParameters = decodeEventParameters(eventDescription.inputs, topics, data)
	return { name: eventDescription.name, parameters: decodedParameters }
}

function decodeEventParameters(parameters: ReadonlyArray<EventParameterDescription>, topics: ReadonlyArray<Bytes32>, data: Bytes): EncodableTuple {
	const indexedTypesForDecoding = parameters.filter(parameter => parameter.indexed).map(getTypeForEventDecoding)
	const nonIndexedTypesForDecoding = parameters.filter(parameter => !parameter.indexed)
	const indexedData = concatenateBytes(topics.slice(1))
	const nonIndexedData = data
	const decodedIndexedParameters = decodeParameters(indexedTypesForDecoding, indexedData)
	if (!decodedIndexedParameters) throw new Error(`Failed to decode topics for event ${topics[0]}.\n${indexedData}`)
	const decodedNonIndexedParameters = decodeParameters(nonIndexedTypesForDecoding, nonIndexedData)
	if (!decodedNonIndexedParameters) throw new Error(`Failed to decode data for event ${topics[0]}.\n${nonIndexedData}`)
	return Object.assign({}, decodedIndexedParameters, decodedNonIndexedParameters)
}

function getTypeForEventDecoding(parameter: EventParameterDescription): EventParameterDescription {
	if (!parameter.indexed) return parameter
	if (parameter.type !== 'string'
		&& parameter.type !== 'bytes'
		// TODO: check to see if we need to collapse fixed size tuples or not
		&& !parameter.type.startsWith('tuple')
		// TODO: check to see if we need to collapse fixed length arrays here or not
		&& !parameter.type.endsWith('[]'))
		return parameter
	return Object.assign({}, parameter, { type: 'bytes32' })
}

function isEventDescription(maybe: AbiDescription): maybe is EventDescription { return maybe.type === 'event' }


// helpers

function padLeftTo32Bytes(input: Uint8Array): Bytes {
	const length = (input.length % 32)
		? input.length + 32 - input.length % 32
		: input.length
	const result = new Bytes(length)
	result.set(input, result.length - input.length)
	return result
}

function padRightTo32Bytes(input: Uint8Array): Bytes {
	const length = (input.length % 32)
		? input.length + 32 - input.length % 32
		: input.length
	const result = new Bytes(length)
	result.set(input, 0)
	return result
}

function concatenateBytes(source: ReadonlyArray<Uint8Array>): Bytes {
	return Bytes.fromByteArray(source.flatMap(x => [...x]))
}

function padAndLengthPrefix(source: Uint8Array): Bytes {
	const length = source.length
	const padded = padRightTo32Bytes(source)
	return concatenateBytes([Bytes32.fromUnsignedInteger(length), padded])
}

function encodeDynamicData(encodedData: ReadonlyArray<{ isDynamic: boolean, bytes: Uint8Array }>): Bytes {
	let staticBytesSize = 0
	for (let encodedParameter of encodedData) {
		if (encodedParameter.isDynamic) staticBytesSize += 32
		else staticBytesSize += encodedParameter.bytes.length
	}
	const staticBytes: Array<Uint8Array> = []
	const dynamicBytes: Array<Uint8Array> = []
	for (let encodedParameter of encodedData) {
		if (encodedParameter.isDynamic) {
			const dynamicBytesAppendedSoFar = dynamicBytes.reduce((total, bytes) => total += bytes.length, 0)
			staticBytes.push(Bytes32.fromUnsignedInteger(staticBytesSize + dynamicBytesAppendedSoFar))
			dynamicBytes.push(encodedParameter.bytes)
		} else {
			staticBytes.push(encodedParameter.bytes)
		}
	}
	return concatenateBytes([...staticBytes, ...dynamicBytes])
}

function anyIsDynamic(descriptions: ReadonlyArray<ParameterDescription>): boolean {
	for (let description of descriptions) {
		if (isDynamic(description)) return true
	}
	return false
}

function isDynamic(description: ParameterDescription): boolean {
	if (description.type === 'string') return true
	if (description.type === 'bytes') return true
	if (description.type.endsWith('[]')) return true
	const fixedArrayMatcher = /^(.*)\[(\d+)\]$/.exec(description.type)
	if (fixedArrayMatcher !== null && isDynamic(Object.assign({}, description, { type: fixedArrayMatcher[1] }))) return true
	if (description.type === 'tuple' && anyIsDynamic(description.components || [])) return true
	return false
}

function isEncodableArray(maybe: EncodableArray | EncodableTuple): maybe is EncodableArray {
	return Array.isArray(maybe)
}
