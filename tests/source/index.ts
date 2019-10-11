import { encodeParameters, decodeParameters, parseSignature, generateSignature, decodeEvent, decodeUnknownEvent, encodeMethod } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'

import Jasmine = require('jasmine');
const jasmine = new Jasmine({})

describe('encoding', () => {
	beforeAll(() => (jasmine.jasmine as any).addCustomEqualityTester(uint8ArrayCompare) )
	it('true', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const parameters = [ true ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('false', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const parameters = [ false ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint8: 5', async () => {
		const abi = [ {name: 'a', type: 'uint8'} ]
		const parameters = [ 5n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint32: max', async () => {
		const abi = [ {name: 'a', type: 'uint32'} ]
		const parameters = [ 2n**32n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint40: max', async () => {
		const abi = [ {name: 'a', type: 'uint40'} ]
		const parameters = [ 2n**40n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint256: max', async () => {
		const abi = [ {name: 'a', type: 'uint256'} ]
		const parameters = [ 2n**256n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int8: -5', async () => {
		const abi = [ {name: 'a', type: 'int8'} ]
		const parameters = [ -5n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int32: max', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const parameters = [ 2n**31n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int32: min', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const parameters = [ -(2n**31n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int40: max', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const parameters = [ 2n**39n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int40: min', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const parameters = [ -(2n**39n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int256: max', async () => {
		const abi = [ {name: 'a', type: 'int256'} ]
		const parameters = [ 2n**255n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int256: min', async () => {
		const abi = [ {name: 'a', type: 'int256'} ]
		const parameters = [ -(2n**255n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		8000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('address', async () => {
		const abi = [ {name: 'a', type: 'address'} ]
		const parameters = [ 0x1234567890abcdef1234567890abcdef12345678n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('string', async () => {
		const abi = [ {name: 'a', type: 'string'} ]
		const parameters = [ 'hello' ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('bytes', async () => {
		const abi = [ {name: 'a', type: 'bytes'} ]
		const parameters = [ new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('bytes16', async () => {
		const abi = [ {name: 'a', type: 'bytes16'} ]
		const parameters = [ 0x12345678901234567890123456789012n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('empty tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: []} ]
		const parameters = [ {} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes('')
		expect(encoded).toEqual(expected)
	})
	it('simple, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const parameters = [ {b: (2n**32n-1n)} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const parameters = [ {b: 'hello'} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }, { name: 'c', type: 'address' }]} ]
		const parameters = [ {b: (2n**32n-1n), c: 0x1234567890abcdef1234567890abcdef12345678n} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, positional tuple', async () => {
		const abi = [ {name: '', type: 'tuple', components: [{ name: '', type: 'uint32' }, { name: '', type: 'address' }]} ]
		const parameters = [ [ (2n**32n-1n), 0x1234567890abcdef1234567890abcdef12345678n ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const parameters = [ {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[2]' } ]
		const parameters = [ [ 2n**32n - 1n, 5n ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const parameters = [ [ { b: 2n**32n - 1n }, { b: 5n } ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'string[2]' } ]
		const parameters = [ [ 'hello', 'goodbye' ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const parameters = [ [ {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, static, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[]' } ]
		const parameters = [ [ 2n**32n - 1n, 5n ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const parameters = [ [ { b: 2n**32n - 1n }, { b: 5n } ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, dynamic, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'string[]' } ]
		const parameters = [ [ 'hello', 'goodbye' ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, dynamic, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const parameters = [ [ {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
})

describe('decoding', () => {
	beforeAll(() => (jasmine.jasmine as any).addCustomEqualityTester(uint8ArrayCompare) )
	it('boolean true', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: true }
		expect(decoded).toEqual(expected)
	})
	it('boolean false', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: false }
		expect(decoded).toEqual(expected)
	})
	it('uint32: max', async () => {
		const abi = [ {name: 'a', type: 'uint32'} ]
		const data = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**32n - 1n }
		expect(decoded).toEqual(expected)
	})
	it('int32: max', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = hexStringToBytes(`
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**31n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int32: min', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -(2n**31n) }
		expect(decoded).toEqual(expected)
	})
	it('int32: -1', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -1n }
		expect(decoded).toEqual(expected)
	})
	it('uint256: max', async () => {
		const abi = [ {name: 'a', type: 'uint256'} ]
		const data = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**256n-1n }
		expect(decoded).toEqual(expected)
	})
	it('uint40 max', async () => {
		const abi = [ {name: 'a', type: 'uint40'} ]
		const data = hexStringToBytes(`
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**40n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int40: max', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**39n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int40: min', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -(2n**39n) }
		expect(decoded).toEqual(expected)
	})
	it('int40: -1', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = hexStringToBytes(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -1n }
		expect(decoded).toEqual(expected)
	})
	it('address', async () => {
		const abi = [ {name: 'a', type: 'address'} ]
		const data = hexStringToBytes(`
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 0x1234567890abcdef1234567890abcdef12345678n }
		expect(decoded).toEqual(expected)
	})
	it('string', async () => {
		const abi = [ {name: 'a', type: 'string'} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a:  'hello'  }
		expect(decoded).toEqual(expected)
	})
	it('bytes', async () => {
		const abi = [ {name: 'a', type: 'bytes'} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]) }
		expect(decoded).toEqual(expected)
	})
	it('bytes16', async () => {
		const abi = [ {name: 'a', type: 'bytes16'} ]
		const data = hexStringToBytes(`
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 0x12345678901234567890123456789012n }
		expect(decoded).toEqual(expected)
	})
	it('empty tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: []} ]
		const data = new Uint8Array(0)
		const decoded = decodeParameters(abi, data)
		const expected = { a:  {}  }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const data = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 2n**32n-1n} }
		expect(decoded).toEqual(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 'hello'} }
		expect(decoded).toEqual(expected)
	})
	it('complex, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }, { name: 'c', type: 'address' }]} ]
		const data = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 2n**32n-1n, c: 0x1234567890abcdef1234567890abcdef12345678n} }
		expect(decoded).toEqual(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])} }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[2]' } ]
		const data = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ 2n**32n - 1n, 5n ] }
		expect(decoded).toEqual(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const data = hexStringToBytes(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ { b: 2n**32n - 1n }, { b: 5n } ] }
		expect(decoded).toEqual(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'string[2]' } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ 'hello', 'goodbye' ] }
		expect(decoded).toEqual(expected)
	})
	it('complex, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[]' } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ 2n**32n - 1n, 5n ] }
		expect(decoded).toEqual(expected)
	})
	it('complex, static, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ { b: 2n**32n - 1n }, { b: 5n } ] }
		expect(decoded).toEqual(expected)
	})
	it('simple, dynamic, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'string[]' } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ 'hello', 'goodbye' ] }
		expect(decoded).toEqual(expected)
	})
	it('complex, dynamic, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
		const data = hexStringToBytes(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000002
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000100
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000007
		676f6f6462796500000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000005
		1122334455000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ {b: 'hello', c: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
		expect(decoded).toEqual(expected)
	})
})

describe('parseSignature', () => {
	describe('invalid', () => {
		it('invalid function name', () => {
			expect(() => parseSignature('5foo()')).toThrow()
		})
		it('missing close paren', () => {
			expect(() => parseSignature('transfer(address from, uint256 amount')).toThrow()
		})
	})
	describe('canonical', () => {
		it('no parameters', () => {
			const functionDescription = parseSignature('transfer()')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('one parameter', () => {
			const functionDescription = parseSignature('transfer(address)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [{ name: '', type: 'address', components: undefined }],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('two parameters', () => {
			const functionDescription = parseSignature('transfer(address,uint256)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: '', type: 'address', components: undefined },
					{ name: '', type: 'uint256', components: undefined },
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('dynamic array parameter', () => {
			const functionDescription = parseSignature('transfer(address[])')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: '', type: 'address[]', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('fixed array', () => {
			const functionDescription = parseSignature('transfer(address[5])')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: '', type: 'address[5]', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('tuple parameter', () => {
			const functionDescription = parseSignature('transfer((address,uint256))')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple',
						components: [
							{ name: '', type: 'address', components: undefined },
							{ name: '', type: 'uint256', components: undefined },
						]
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('tuple array', () => {
			const functionDescription = parseSignature('transfer((address,uint256)[])')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple[]',
						components: [
							{ name: '', type: 'address', components: undefined },
							{ name: '', type: 'uint256', components: undefined },
						]
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('empty tuple', () => {
			const functionDescription = parseSignature('transfer(())')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple',
						components: [],
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('empty tuple array', () => {
			const functionDescription = parseSignature('transfer(()[])')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple[]',
						components: [],
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('nested tuple', () => {
			const functionDescription = parseSignature('transfer(((address,address),(uint256,uint256)))')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple',
						components: [
							{
								name: '',
								type: 'tuple',
								components: [
									{ name: '', type: 'address', components: undefined },
									{ name: '', type: 'address', components: undefined },
								],
							},
							{
								name: '',
								type: 'tuple',
								components: [
									{ name: '', type: 'uint256', components: undefined },
									{ name: '', type: 'uint256', components: undefined },
								],
							},
						],
					}
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('kitchen sink', () => {
			const functionDescription = parseSignature('transfer(((address,address[]),(uint256,uint256))[],bool,(int256[],bool))')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple[]',
						components: [
							{
								name: '',
								type: 'tuple',
								components: [
									{ name: '', type: 'address', components: undefined },
									{ name: '', type: 'address[]', components: undefined },
								],
							},
							{
								name: '',
								type: 'tuple',
								components: [
									{ name: '', type: 'uint256', components: undefined },
									{ name: '', type: 'uint256', components: undefined },
								],
							},
						],
					},
					{ name: '', type: 'bool', components: undefined },
					{
						name: '',
						type: 'tuple',
						components: [
							{ name: '', type: 'int256[]', components: undefined },
							{ name: '', type: 'bool', components: undefined },
						]
					}
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
	})
	describe('without names', () => {
		it('no parameters, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   )')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('one parameter, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address  )')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: '', type: 'address', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('two parameters, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address  ,   uint256   )')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: '', type: 'address', components: undefined },
					{ name: '', type: 'uint256', components: undefined },
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('array parameter', () => {
			const functionDescription = parseSignature('transfer(  address[]  )')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: '', type: 'address[]', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
	})
	describe('with names', () => {
		it('no extra whitespace', () => {
			const functionDescription = parseSignature('transfer(address recipient,uint256 value)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: 'recipient', type: 'address', components: undefined },
					{ name: 'value', type: 'uint256', components: undefined },
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address   recipient   ,   uint256   value   )')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: 'recipient', type: 'address', components: undefined },
					{ name: 'value', type: 'uint256', components: undefined },
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('short name', () => {
			const functionDescription = parseSignature('transfer(address a)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: 'a', type: 'address', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('array parameter', () => {
			const functionDescription = parseSignature('transfer(address[] recipients)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [ { name: 'recipients', type: 'address[]', components: undefined } ],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('tuple parameter', () => {
			const functionDescription = parseSignature('transfer((address recipient, uint256 value) payload)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: 'payload',
						type: 'tuple',
						components: [
							{ name: 'recipient', type: 'address', components: undefined },
							{ name: 'value', type: 'uint256', components: undefined },
						]
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('tuple array', () => {
			const functionDescription = parseSignature('transfer((address recipient, uint256 value)[] batches)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: 'batches',
						type: 'tuple[]',
						components: [
							{ name: 'recipient', type: 'address', components: undefined },
							{ name: 'value', type: 'uint256', components: undefined },
						]
					},
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('nested tuple', () => {
			const functionDescription = parseSignature('transfer(((address recipient,address value) transfer, (uint256 id, uint256 coorelation) metadata) payload)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: 'payload',
						type: 'tuple',
						components: [
							{
								name: 'transfer',
								type: 'tuple',
								components: [
									{ name: 'recipient', type: 'address', components: undefined },
									{ name: 'value', type: 'address', components: undefined },
								],
							},
							{
								name: 'metadata',
								type: 'tuple',
								components: [
									{ name: 'id', type: 'uint256', components: undefined },
									{ name: 'coorelation', type: 'uint256', components: undefined },
								],
							},
						],
					}
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
		it('kitchen sink', () => {
			const functionDescription = parseSignature('transfer(((address a,address[] b) apple, (uint256 aa, uint256 bb) banana)[] fruit, bool success, (int256[] numbers, bool boolean) metadata)')
			const expected = {
				type: 'function',
				name: 'transfer',
				inputs: [
					{
						name: 'fruit',
						type: 'tuple[]',
						components: [
							{
								name: 'apple',
								type: 'tuple',
								components: [
									{ name: 'a', type: 'address', components: undefined },
									{ name: 'b', type: 'address[]', components: undefined },
								],
							},
							{
								name: 'banana',
								type: 'tuple',
								components: [
									{ name: 'aa', type: 'uint256', components: undefined },
									{ name: 'bb', type: 'uint256', components: undefined },
								],
							},
						],
					},
					{ name: 'success', type: 'bool', components: undefined },
					{
						name: 'metadata',
						type: 'tuple',
						components: [
							{ name: 'numbers', type: 'int256[]', components: undefined },
							{ name: 'boolean', type: 'bool', components: undefined },
						]
					}
				],
				outputs: [],
			} as const
			expect(functionDescription).toEqual(expected)
		})
	})
})

describe('generateSignature', () => {
	it('no parameters', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [],
		} as const
		const expected = 'transfer()'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('one parameter', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'address' } ],
		} as const
		const expected = 'transfer(address)'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('two parameters', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [
				{ name: 'apple', type: 'address' },
				{ name: 'banana', type: 'uint256' },
			],
		} as const
		const expected = 'transfer(address,uint256)'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('array', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'address[]' } ],
		} as const
		const expected = 'transfer(address[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('empty tuple', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'tuple', components: [] } ],
		} as const
		const expected = 'transfer(())'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		} as const
		const expected = 'transfer((address,uint256))'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple dynamic array', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple[]',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		} as const
		const expected = 'transfer((address,uint256)[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple fixed array', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple[5]',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		} as const
		const expected = 'transfer((address,uint256)[5])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('nested tuple', () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple[]',
				components: [
					{ name: 'apple', type: 'address' },
					{
						name: 'banana',
						type: 'tuple',
						components: [
							{ name: 'apple', type: 'address' },
							{ name: 'banana', type: 'uint256' },
						],
					},
				]
			} ],
		} as const
		const expected = 'transfer((address,(address,uint256))[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
})

describe('eventDecoding', () => {
	beforeAll(() => (jasmine.jasmine as any).addCustomEqualityTester(uint8ArrayCompare) )
	it('no parameters', async () => {
		const description = {
			type: 'event',
			name: 'apple',
			inputs: [],
		} as const
		const topics = [0x5e88bc14e75dbc799d8b68e2ab1f9bd7a08806eb36c79a7ed5c5f88c6fa5e550n]
		const data = new Uint8Array()
		const expectedEvent = { name: 'apple', parameters: {} }
		const decodedEvent = decodeEvent(description, topics, data)
		expect(decodedEvent).toEqual(expectedEvent)
	})
	it('one indexed, one not', async () => {
		const description = {
			type: 'event',
			name: 'Apple',
			inputs: [
				{ name: 'banana', type: 'address', indexed: true },
				{ name: 'cherry', type: 'uint256', indexed: false },
			],
		} as const
		const topics = [
			0xcfc5ef59554fc2c2edac407ccac3369a9e9d930f56b04a7ac9adb4b2638749fdn,
			0x0000000000000000000000000000000000000000000000000000000000000003n,
		]
		const data = hexStringToBytes('0000000000000000000000000000000000000000000000000000000000000007')
		const expectedEvent = {
			name: 'Apple',
			parameters: {
				'banana': 0x0000000000000000000000000000000000000003n,
				'cherry': 7n,
			}
		}
		const decodedEvent = decodeEvent(description, topics, data)
		expect(decodedEvent).toEqual(expectedEvent)
	})
	it('one indexed, one not, find match', async () => {
		const descriptions = [
			{
				type: 'event',
				name: 'Apple',
				inputs: [
					{ name: 'banana', type: 'address', indexed: true },
					{ name: 'cherry', type: 'uint256', indexed: false },
				],
			},
			{
				type: 'event',
				name: 'apple',
				inputs: [],
			}
		] as const
		const topics = [
			0xcfc5ef59554fc2c2edac407ccac3369a9e9d930f56b04a7ac9adb4b2638749fdn,
			0x0000000000000000000000000000000000000000000000000000000000000003n,
		]
		const data = hexStringToBytes('0000000000000000000000000000000000000000000000000000000000000007')
		const expectedEvent = {
			name: 'Apple',
			parameters: {
				'banana': 0x0000000000000000000000000000000000000003n,
				'cherry': 7n,
			}
		}
		const decodedEvent = await decodeUnknownEvent(keccak256.hash, descriptions, topics, data)
		expect(decodedEvent).toEqual(expectedEvent)
	})
	const abi = [
		{
			"name": "TokenPurchase",
			"inputs": [
				{
					"type": "address",
					"name": "buyer",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "eth_sold",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "tokens_bought",
					"indexed": true
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "EthPurchase",
			"inputs": [
				{
					"type": "address",
					"name": "buyer",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "tokens_sold",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "eth_bought",
					"indexed": true
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "AddLiquidity",
			"inputs": [
				{
					"type": "address",
					"name": "provider",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "eth_amount",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "token_amount",
					"indexed": true
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "RemoveLiquidity",
			"inputs": [
				{
					"type": "address",
					"name": "provider",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "eth_amount",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "token_amount",
					"indexed": true
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "Transfer",
			"inputs": [
				{
					"type": "address",
					"name": "_from",
					"indexed": true
				},
				{
					"type": "address",
					"name": "_to",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "_value",
					"indexed": false
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "Approval",
			"inputs": [
				{
					"type": "address",
					"name": "_owner",
					"indexed": true
				},
				{
					"type": "address",
					"name": "_spender",
					"indexed": true
				},
				{
					"type": "uint256",
					"name": "_value",
					"indexed": false
				}
			],
			"anonymous": false,
			"type": "event"
		},
		{
			"name": "setup",
			"outputs": [],
			"inputs": [
				{
					"type": "address",
					"name": "token_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 175875
		},
		{
			"name": "addLiquidity",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "min_liquidity"
				},
				{
					"type": "uint256",
					"name": "max_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": true,
			"type": "function",
			"gas": 82616
		},
		{
			"name": "removeLiquidity",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				},
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "amount"
				},
				{
					"type": "uint256",
					"name": "min_eth"
				},
				{
					"type": "uint256",
					"name": "min_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 116814
		},
		{
			"name": "__default__",
			"outputs": [],
			"inputs": [],
			"constant": false,
			"payable": true,
			"type": "function"
		},
		{
			"name": "ethToTokenSwapInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "min_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": true,
			"type": "function",
			"gas": 12757
		},
		{
			"name": "ethToTokenTransferInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "min_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				}
			],
			"constant": false,
			"payable": true,
			"type": "function",
			"gas": 12965
		},
		{
			"name": "ethToTokenSwapOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": true,
			"type": "function",
			"gas": 50463
		},
		{
			"name": "ethToTokenTransferOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				}
			],
			"constant": false,
			"payable": true,
			"type": "function",
			"gas": 50671
		},
		{
			"name": "tokenToEthSwapInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_eth"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 47503
		},
		{
			"name": "tokenToEthTransferInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_eth"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 47712
		},
		{
			"name": "tokenToEthSwapOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "eth_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 50175
		},
		{
			"name": "tokenToEthTransferOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "eth_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 50384
		},
		{
			"name": "tokenToTokenSwapInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_tokens_bought"
				},
				{
					"type": "uint256",
					"name": "min_eth_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "token_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 51007
		},
		{
			"name": "tokenToTokenTransferInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_tokens_bought"
				},
				{
					"type": "uint256",
					"name": "min_eth_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				},
				{
					"type": "address",
					"name": "token_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 51098
		},
		{
			"name": "tokenToTokenSwapOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens_sold"
				},
				{
					"type": "uint256",
					"name": "max_eth_sold"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "token_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 54928
		},
		{
			"name": "tokenToTokenTransferOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens_sold"
				},
				{
					"type": "uint256",
					"name": "max_eth_sold"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				},
				{
					"type": "address",
					"name": "token_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 55019
		},
		{
			"name": "tokenToExchangeSwapInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_tokens_bought"
				},
				{
					"type": "uint256",
					"name": "min_eth_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "exchange_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 49342
		},
		{
			"name": "tokenToExchangeTransferInput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				},
				{
					"type": "uint256",
					"name": "min_tokens_bought"
				},
				{
					"type": "uint256",
					"name": "min_eth_bought"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				},
				{
					"type": "address",
					"name": "exchange_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 49532
		},
		{
			"name": "tokenToExchangeSwapOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens_sold"
				},
				{
					"type": "uint256",
					"name": "max_eth_sold"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "exchange_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 53233
		},
		{
			"name": "tokenToExchangeTransferOutput",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				},
				{
					"type": "uint256",
					"name": "max_tokens_sold"
				},
				{
					"type": "uint256",
					"name": "max_eth_sold"
				},
				{
					"type": "uint256",
					"name": "deadline"
				},
				{
					"type": "address",
					"name": "recipient"
				},
				{
					"type": "address",
					"name": "exchange_addr"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 53423
		},
		{
			"name": "getEthToTokenInputPrice",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "eth_sold"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 5542
		},
		{
			"name": "getEthToTokenOutputPrice",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_bought"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 6872
		},
		{
			"name": "getTokenToEthInputPrice",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "tokens_sold"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 5637
		},
		{
			"name": "getTokenToEthOutputPrice",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "uint256",
					"name": "eth_bought"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 6897
		},
		{
			"name": "tokenAddress",
			"outputs": [
				{
					"type": "address",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1413
		},
		{
			"name": "factoryAddress",
			"outputs": [
				{
					"type": "address",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1443
		},
		{
			"name": "balanceOf",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "address",
					"name": "_owner"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1645
		},
		{
			"name": "transfer",
			"outputs": [
				{
					"type": "bool",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "address",
					"name": "_to"
				},
				{
					"type": "uint256",
					"name": "_value"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 75034
		},
		{
			"name": "transferFrom",
			"outputs": [
				{
					"type": "bool",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "address",
					"name": "_from"
				},
				{
					"type": "address",
					"name": "_to"
				},
				{
					"type": "uint256",
					"name": "_value"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 110907
		},
		{
			"name": "approve",
			"outputs": [
				{
					"type": "bool",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "address",
					"name": "_spender"
				},
				{
					"type": "uint256",
					"name": "_value"
				}
			],
			"constant": false,
			"payable": false,
			"type": "function",
			"gas": 38769
		},
		{
			"name": "allowance",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [
				{
					"type": "address",
					"name": "_owner"
				},
				{
					"type": "address",
					"name": "_spender"
				}
			],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1925
		},
		{
			"name": "name",
			"outputs": [
				{
					"type": "bytes32",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1623
		},
		{
			"name": "symbol",
			"outputs": [
				{
					"type": "bytes32",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1653
		},
		{
			"name": "decimals",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1683
		},
		{
			"name": "totalSupply",
			"outputs": [
				{
					"type": "uint256",
					"name": "out"
				}
			],
			"inputs": [],
			"constant": true,
			"payable": false,
			"type": "function",
			"gas": 1713
		}
	] as const
	it('real world', async () => {
		const topics = [
			0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efn,
			0x00000000000000000000000090e765f06594d74a5513b45007fa5615778ed0b8n,
			0x00000000000000000000000009cabec1ead1c0ba254b09efb3ee13841712be14n,
		]
		const data = hexStringToBytes('000000000000000000000000000000000000000000000001231ac9b67a06c000')
		const decodedEvent = await decodeUnknownEvent(keccak256.hash, abi, topics, data)
		expect(decodedEvent).toEqual({
			name: 'Transfer',
			parameters: {
				_from: 0x90e765f06594d74a5513b45007fa5615778ed0b8n,
				_to: 0x9cabec1ead1c0ba254b09efb3ee13841712be14n,
				_value: 20976300000000000000n,
			}
		})
	})
	it('real world', async () => {
		const topics = [
			0x7f4091b46c33e918a0f3aa42307641d17bb67029427a5369e54b353984238705n,
			0x00000000000000000000000090e765f06594d74a5513b45007fa5615778ed0b8n,
			0x000000000000000000000000000000000000000000000001231ac9b67a06c000n,
			0x00000000000000000000000000000000000000000000000001632d58479e5427n,
		]
		const data = new Uint8Array()
		const decodedEvent = await decodeUnknownEvent(keccak256.hash, abi, topics, data)
		expect(decodedEvent).toEqual({
			name: 'EthPurchase',
			parameters: {
				buyer: 0x90e765f06594d74a5513b45007fa5615778ed0b8n,
				eth_bought: 99973473914213415n,
				tokens_sold: 20976300000000000000n,
			}
		})
	})
})

describe('encodeMethod', () => {
	beforeAll(() => (jasmine.jasmine as any).addCustomEqualityTester(uint8ArrayCompare) )
	it('no parameters', async () => {
		const description = {
			type: 'function',
			name: 'apple',
			inputs: [],
		} as const
		const expected = hexStringToBytes('0x5e88bc14')
		const encoded = await encodeMethod(keccak256.hash, description, [])
		expect(encoded).toEqual(expected)
	})
	it('transfer', async () => {
		const description = {
			type: 'function',
			name: 'transfer',
			inputs: [
				{ type: 'address', name: 'destination' },
				{ type: 'uint256', name: 'amount' },
			],
		} as const
		const expected = hexStringToBytes('0xa9059cbb000000000000000000000000add12e55add12e55add12e55add12e55add12e550000000000000000000000000000000000000000000000000de0b6b3a7640000')
		const encoded = await encodeMethod(keccak256.hash, description, [0xadd12e55add12e55add12e55add12e55add12e55n, 10n**18n])
		expect(encoded).toEqual(expected)
	})
	it('transfer with pre-calculated selector', async () => {
		const description = [
			{ type: 'address', name: 'destination' },
			{ type: 'uint256', name: 'amount' },
		] as const
		const expected = hexStringToBytes('0xa9059cbb000000000000000000000000add12e55add12e55add12e55add12e55add12e550000000000000000000000000000000000000000000000000de0b6b3a7640000')
		const encoded = encodeMethod(0xa9059cbb, description, [0xadd12e55add12e55add12e55add12e55add12e55n, 10n**18n])
		expect(encoded).toEqual(expected)
	})
})

jasmine.execute()

function uint8ArrayCompare(first: Uint8Array, second: Uint8Array) {
	if (first instanceof Uint8Array && second instanceof Uint8Array) {
		if (first.length !== second.length) return false
		for (let i = 0; i < first.length; ++i) {
			if (first[i] !== second[i]) return false
		}
		return true
	}
	return undefined
}

function hexStringToBytes(hex: string): Uint8Array {
	const match = /^(?:0x)?([a-fA-F0-9]*)$/.exec(hex)
	if (match === null) throw new Error(`Expected a hex string encoded byte array with an optional '0x' prefix but received ${hex}`)
	const normalized = match[1]
	if (normalized.length % 2) throw new Error(`Hex string encoded byte array must be an even number of charcaters long.`)
	const bytes = []
	for (let i = 0; i < normalized.length; i += 2) {
		bytes.push(Number.parseInt(`${normalized[i]}${normalized[i + 1]}`, 16))
	}
	return new Uint8Array(bytes)
}
