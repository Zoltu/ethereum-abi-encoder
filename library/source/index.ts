export type Encodable = EncodablePrimitive | EncodableTuple | EncodableArray;
export type EncodablePrimitive = Uint8Array | string | boolean | bigint;
export interface EncodableTuple { [x: string]: Encodable }
export interface EncodableArray extends ReadonlyArray<Encodable> {}

export interface FunctionDescription {
	readonly type?: 'function'
	readonly name: string
	readonly inputs: ReadonlyArray<ParameterDescription>
	readonly outputs?: ReadonlyArray<ParameterDescription>
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

export interface EventDescription {
	readonly type: 'event'
	readonly name: string
	readonly inputs: ReadonlyArray<EventParameterDescription>
	readonly anonymous?: boolean
}

export interface ConstructorDescription {
	readonly type: 'constructor'
	readonly inputs?: ReadonlyArray<ParameterDescription>
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

export interface FallbackDescription {
	readonly type: 'fallback'
	readonly stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable'
}

export type AbiDescription = FunctionDescription | EventDescription | ConstructorDescription | FallbackDescription

export interface ParameterDescription {
	readonly name: string
	readonly type: string
	readonly components?: ReadonlyArray<ParameterDescription>
}

export interface EventParameterDescription extends ParameterDescription {
	readonly indexed: boolean
}

export interface DecodedEvent {
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
		const pointer = Number(bytesToInteger(data.subarray(offset, offset + 32)))
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
	const pointer = Number(bytesToInteger(data.subarray(offset, offset + 32)))
	const length = Number(bytesToInteger(data.subarray(pointer, pointer + 32)))
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
		const pointer = Number(bytesToInteger(data.subarray(offset, offset + 32)))
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

function tryDecodeDynamicBytes(description: ParameterDescription, data: Uint8Array, offset: number): { result: Uint8Array, consumed: 32 } | null {
	if (description.type !== 'bytes') return null
	const pointer = Number(bytesToInteger(data.subarray(offset, offset + 32)))
	const length = Number(bytesToInteger(data.subarray(pointer, pointer + 32)))
	const bytes = data.subarray(pointer + 32, pointer + 32 + length)
	return { result: bytes, consumed: 32 }
}

function tryDecodeString(description: ParameterDescription, data: Uint8Array, offset: number): { result: string, consumed: 32 } | null {
	if (description.type !== 'string') return null
	const pointer = Number(bytesToInteger(data.subarray(offset, offset + 32)))
	const length = Number(bytesToInteger(data.subarray(pointer, pointer + 32)))
	const bytes = data.subarray(pointer + 32, pointer + 32 + length)
	const decoded = new TextDecoder().decode(bytes)
	return { result: decoded, consumed: 32 }
}

function tryDecodeBoolean(description: ParameterDescription, data: Uint8Array, offset: number): { result: boolean, consumed: 32 } | null {
	if (description.type !== 'bool') return null
	const bytes = data.subarray(offset, offset + 32)
	const decoded = (bytesToInteger(bytes) === 0n) ? false : true
	return { result: !!decoded, consumed: 32 }
}

function tryDecodeNumber(description: ParameterDescription, data: Uint8Array, offset: number): { result: bigint, consumed: 32 } | null {
	const match = /^(u?)int(\d*)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[2])
	if (size <= 0 || size > 256 || size % 8) return null
	const signed = !match[1]
	const bytes = data.subarray(offset, offset + 32)
	const decoded = bytesToInteger(bytes, signed)
	if (!signed && decoded >= 2n**BigInt(size)) throw new Error(`Encoded number is bigger than the expected size.  Expected smaller than ${2n**BigInt(size)}, but decoded ${decoded}.`)
	if (signed && decoded >= 2n**BigInt(size-1)) throw new Error(`Encoded number is bigger than the expected size.  Expected smaller than ${2n**BigInt(size-1)}, but decoded ${decoded}.`)
	if (signed && decoded < -(2n**BigInt(size-1))) throw new Error(`Encoded number is bigger (negative) than the expected size.  Expected smaller (negative) than -${2n**BigInt(size-1)}, but decoded ${decoded}.`)
	return { result: decoded, consumed: 32 }
}

function tryDecodeAddress(description: ParameterDescription, data: Uint8Array, offset: number): { result: bigint, consumed: 32 } | null {
	if (description.type !== 'address') return null
	const bytes = data.subarray(offset, offset + 32)
	const decoded = bytesToInteger(bytes)
	if (decoded >= 2n**160n) throw new Error(`Encoded value is bigger than the largest possible address.  Decoded value: 0x${decoded.toString(16)}.`)
	return { result: decoded, consumed: 32 }
}

function tryDecodeFixedBytes(description: ParameterDescription, data: Uint8Array, offset: number): { result: bigint, consumed: 32} | null {
	const match = /^bytes(\d+)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (size < 1 || size > 32) throw new Error(`Can only decode fixed length bytes values between 1 and 32 bytes.  Receivede 'bytes${size}'.`)
	const bytes = data.subarray(offset, offset + size)
	const decoded = bytesToInteger(bytes)
	const padding = data.subarray(offset + size, offset + 32)
	if (padding.some(x => x !== 0)) throw new Error(`Encoded value contains extraneous unexpected bytes.  Extraneous bytes: 0x${Array.from(padding).map(x=>x.toString(16).padStart(2,'0')).join('')}.`)
	return { result: decoded, consumed: 32 }
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

export async function encodeMethod(keccak256: (message: Uint8Array) => Promise<bigint>, functionDescription: FunctionDescription, parameters: EncodableArray): Promise<Uint8Array>
export async function encodeMethod(keccak256: (message: Uint8Array) => Promise<bigint>, functionSignature: string, parameters: EncodableArray): Promise<Uint8Array>
export function encodeMethod(functionSelector: number, parameterDescriptions: ReadonlyArray<ParameterDescription>, parameters: EncodableArray): Uint8Array
export function encodeMethod(first: ((message: Uint8Array) => Promise<bigint>) | number, second: FunctionDescription | string | ReadonlyArray<ParameterDescription> | EncodableArray, parameters: EncodableArray): Promise<Uint8Array> | Uint8Array {
	if (typeof first === 'number') return encodeMethodWithSelector(first, second as ReadonlyArray<ParameterDescription>, parameters)
	else if (typeof second === 'string') return encodeMethodWithSignature(first, second, parameters)
	else return encodeMethodWithDescription(first, second as FunctionDescription, parameters)
}

async function encodeMethodWithDescription(keccak256: (message: Uint8Array) => Promise<bigint>, functionDescription: FunctionDescription, parameters: EncodableArray): Promise<Uint8Array> {
	const canonicalSignature = generateSignature(functionDescription)
	const canonicalSignatureHash = await keccak256(new TextEncoder().encode(canonicalSignature))
	const functionSelector = canonicalSignatureHash >> 224n
	return encodeMethod(Number(functionSelector), functionDescription.inputs, parameters)
}

async function encodeMethodWithSignature(keccak256: (message: Uint8Array) => Promise<bigint>, functionSignature: string, parameters: EncodableArray): Promise<Uint8Array> {
	const functionDescription = parseSignature(functionSignature)
	return await encodeMethodWithDescription(keccak256, functionDescription, parameters)
}

function encodeMethodWithSelector(functionSelector: number, parameterDescriptions: ReadonlyArray<ParameterDescription>, parameters: EncodableArray): Uint8Array {
	const encodedParameters = encodeParameters(parameterDescriptions, parameters)
	return new Uint8Array([...integerToBytes(functionSelector, 4), ...encodedParameters])
}

export function encodeParameters(descriptions: ReadonlyArray<ParameterDescription>, parameters: EncodableArray): Uint8Array {
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
	const lengthBytes = integerToBytes(encodedParameters.length)
	return { isDynamic: true, bytes: concatenateBytes([lengthBytes, encodeDynamicData(encodedParameters)]) }
}

function tryEncodeTuple(description: ParameterDescription, parameter: Encodable): { isDynamic: boolean, bytes: Uint8Array } | null {
	if (description.type !== 'tuple') return null
	if (typeof parameter !== 'object') throw new Error(`Can only encode a JavaScript 'object' or a JavaScript array into an EVM 'tuple'\n${parameter}`)
	if (description.components === undefined || description.components.length === 0) {
		return { isDynamic: false, bytes: new Uint8Array(0) }
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
	const bytes = new Uint8Array(32)
	bytes.set([parameter ? 1 : 0], 31)
	return { isDynamic: false, bytes }
}

function tryEncodeNumber(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	const match = /^(u?)int(\d*)$/.exec(description.type)
	if (match === null) return null
	if (typeof parameter !== 'bigint') throw new Error(`Can only encode a JavaScript 'bigint' into an EVM '${description.type}'\n${parameter}`)
	const size = Number.parseInt(match[2])
	if (size <= 0 || size > 256 || size % 8) throw new Error(`EVM numbers must be in range [8, 256] and must be divisible by 8.`)
	const signed = !match[1]
	if (!signed && parameter >= 2n**BigInt(size)) throw new Error(`Attempted to encode ${parameter} into a ${description.type}, but it is too big to fit.`)
	if (!signed && parameter < 0n) throw new Error(`Attempted to encode ${parameter} into a ${description.type}, but you cannot encode negative numbers into a ${description.type}.`)
	if (signed && parameter >= 2n**BigInt(size-1)) throw new Error(`Attempted to encode ${parameter} into a ${description.type}, but it is too big to fit.`)
	if (signed && parameter < -(2n**BigInt(size-1))) throw new Error(`Attempted to encode ${parameter} into a ${description.type}, but it is too big (of a negative number) to fit.`)
	const bytes = integerToBytes(parameter, 32, signed)
	return { isDynamic: false, bytes }
}

function tryEncodeAddress(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	if (description.type !== 'address') return null
	if (typeof parameter !== 'bigint') throw new Error(`Can only encode JavaScript 'bigint' into EVM 'address'\n${parameter}`)
	if (parameter > 0xffffffffffffffffffffffffffffffffffffffffn) throw new Error(`Attempted to encode 0x${parameter.toString(16)} into an EVM address, but it is too big to fit.`)
	if (parameter < 0n) throw new Error(`Attempted to encode ${parameter} into an EVM address, but addresses must be positive numbers.`)
	return { isDynamic: false, bytes: padLeftTo32Bytes(integerToBytes(parameter, 20)) }
}

function tryEncodeFixedBytes(description: ParameterDescription, parameter: Encodable): { isDynamic: false, bytes: Uint8Array } | null {
	const match = /^bytes(\d+)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (typeof parameter !== 'bigint') throw new Error(`Can only encode JavaScript 'bigint' into EVM 'bytes${size}'\n${parameter}`)
	if (parameter >= 2n**BigInt(size * 8)) throw new Error(`Attempted to encode 0x${parameter.toString(16)} into an EVM ${description.type}, but it is too big to fit.`)
	if (parameter < 0n) throw new Error(`Attempted to encode -0x${parameter.toString(16).slice(1)} into an EVM ${description.type}, but you cannot encode negative numbers into a ${description.type}.`)
	return { isDynamic: false, bytes: padRightTo32Bytes(integerToBytes(parameter, size)) }
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

export async function decodeUnknownEvent(keccak256: (message: Uint8Array) => Promise<bigint>, abi: ReadonlyArray<AbiDescription>, topics: ReadonlyArray<bigint>, data: Uint8Array): Promise<DecodedEvent> {
	for (const eventDescription of abi) {
		if (!isEventDescription(eventDescription)) continue
		const canonicalSignature = `${eventDescription.name}(${eventDescription.inputs.map(parameter => parameter.type).join(",")})`
		const signatureHash = await keccak256(new TextEncoder().encode(canonicalSignature))
		if (topics[0] !== signatureHash) continue
		return decodeEvent(eventDescription, topics, data)
	}
	throw new Error(`No event description matched the event ${topics[0]}`)
}

export function decodeEvent(eventDescription: EventDescription, topics: ReadonlyArray<bigint>, data: Uint8Array): DecodedEvent {
	// CONSIDER: should we take in a hash function so we can verify topics[0] matches, or just blindly extract?
	const decodedParameters = decodeEventParameters(eventDescription.inputs, topics, data)
	return { name: eventDescription.name, parameters: decodedParameters }
}

function decodeEventParameters(parameters: ReadonlyArray<EventParameterDescription>, topics: ReadonlyArray<bigint>, data: Uint8Array): EncodableTuple {
	const indexedTypesForDecoding = parameters.filter(parameter => parameter.indexed).map(getTypeForEventDecoding)
	const nonIndexedTypesForDecoding = parameters.filter(parameter => !parameter.indexed)
	const indexedData = concatenateBytes(topics.slice(1).map(topic => integerToBytes(topic)))
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

function padLeftTo32Bytes(input: Uint8Array): Uint8Array {
	const length = (input.length % 32)
		? input.length + 32 - input.length % 32
		: input.length
	const result = new Uint8Array(length)
	result.set(input, result.length - input.length)
	return result
}

function padRightTo32Bytes(input: Uint8Array): Uint8Array {
	const length = (input.length % 32)
		? input.length + 32 - input.length % 32
		: input.length
	const result = new Uint8Array(length)
	result.set(input, 0)
	return result
}

function concatenateBytes(source: ReadonlyArray<Uint8Array>): Uint8Array {
	return new Uint8Array(source.flatMap(x => [...x]))
}

function padAndLengthPrefix(source: Uint8Array): Uint8Array {
	const length = source.length
	const padded = padRightTo32Bytes(source)
	return concatenateBytes([integerToBytes(length), padded])
}

function encodeDynamicData(encodedData: ReadonlyArray<{ isDynamic: boolean, bytes: Uint8Array }>): Uint8Array {
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
			staticBytes.push(integerToBytes(staticBytesSize + dynamicBytesAppendedSoFar))
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

function bytesToInteger(bytes: Uint8Array, signed = false): bigint {
	return signed
		? bytesToSigned(bytes)
		: bytesToUnsigned(bytes)
}

function integerToBytes(value: bigint | number, byteWidth = 32, signed = false): Uint8Array {
	return signed
		? signedToBytes(value, byteWidth)
		: unsignedToBytes(value, byteWidth)
}

function bytesToUnsigned(bytes: Uint8Array) {
	let value = 0n
	for (let byte of bytes) {
		value = (value << 8n) + BigInt(byte)
	}
	return value
}

function bytesToSigned(bytes: Uint8Array) {
	const unsignedValue = bytesToUnsigned(bytes)
	return twosComplement(unsignedValue, bytes.length * 8)
}

function unsignedToBytes(value: bigint | number, byteWidth: number = 32): Uint8Array {
	if (typeof value === 'number') value = BigInt(value)
	const bits = byteWidth * 8
	if (value >= 2n ** BigInt(bits) || value < 0n) throw new Error(`Cannot fit ${value} into a ${bits}-bit unsigned integer.`)
	const result = new Uint8Array(byteWidth)
	for (let i = 0; i < byteWidth; ++i) {
		result[i] = Number((value >> BigInt(bits - i * 8 - 8)) & 0xffn)
	}
	return result
}

function signedToBytes(value: bigint | number, byteWidth: number = 32): Uint8Array {
	if (typeof value === 'number') value = BigInt(value)
	const bits = byteWidth * 8
	if (value >= 2n ** (BigInt(bits) - 1n) || value < -(2n ** (BigInt(bits) - 1n))) throw new Error(`Cannot fit ${value} into a ${bits}-bit signed integer.`)
	const unsignedValue = twosComplement(value, bits)
	return unsignedToBytes(unsignedValue)
}

function twosComplement(value: bigint, numberOfBits: number): bigint {
	const mask = 2n ** (BigInt(numberOfBits) - 1n) - 1n
	return (value & mask) - (value & ~mask)
}

// https://github.com/microsoft/TypeScript/issues/17002
declare global {
	interface ArrayConstructor {
		isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any>
	}
}
