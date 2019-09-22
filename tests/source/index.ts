import { Bytes, Address, Bytes16 } from '@zoltu/ethereum-types'
import { encodeParameters, decodeParameters, parseSignature, generateSignature, FunctionDescription } from '@zoltu/ethereum-abi-encoder'

import Jasmine = require('jasmine');
const jasmine = new Jasmine({})

describe('encoding', () => {
	beforeAll(() => (jasmine.jasmine as any).addCustomEqualityTester(uint8ArrayCompare) )
	it('true', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const parameters = [ true ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('false', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const parameters = [ false ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint8: 5', async () => {
		const abi = [ {name: 'a', type: 'uint8'} ]
		const parameters = [ 5n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint32: max', async () => {
		const abi = [ {name: 'a', type: 'uint32'} ]
		const parameters = [ 2n**32n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint40: max', async () => {
		const abi = [ {name: 'a', type: 'uint40'} ]
		const parameters = [ 2n**40n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('uint256: max', async () => {
		const abi = [ {name: 'a', type: 'uint256'} ]
		const parameters = [ 2n**256n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int8: -5', async () => {
		const abi = [ {name: 'a', type: 'int8'} ]
		const parameters = [ -5n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int32: max', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const parameters = [ 2n**31n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int32: min', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const parameters = [ -(2n**31n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int40: max', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const parameters = [ 2n**39n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int40: min', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const parameters = [ -(2n**39n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int256: max', async () => {
		const abi = [ {name: 'a', type: 'int256'} ]
		const parameters = [ 2n**255n - 1n ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('int256: min', async () => {
		const abi = [ {name: 'a', type: 'int256'} ]
		const parameters = [ -(2n**255n) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		8000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('address', async () => {
		const abi = [ {name: 'a', type: 'address'} ]
		const parameters = [ Address.fromHexString('1234567890abcdef1234567890abcdef12345678') ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('string', async () => {
		const abi = [ {name: 'a', type: 'string'} ]
		const parameters = [ 'hello' ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('bytes', async () => {
		const abi = [ {name: 'a', type: 'bytes'} ]
		const parameters = [ new Bytes([0xaa, 0xbb, 0xcc, 0xdd]) ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('bytes16', async () => {
		const abi = [ {name: 'a', type: 'bytes16'} ]
		const parameters = [ Bytes16.fromHexString('12345678901234567890123456789012') ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('empty tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: []} ]
		const parameters = [ {} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString('')
		expect(encoded).toEqual(expected)
	})
	it('simple, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const parameters = [ {b: (2n**32n-1n)} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const parameters = [ {b: 'hello'} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }, { name: 'c', type: 'address' }]} ]
		const parameters = [ {b: (2n**32n-1n), c: Address.fromHexString('1234567890abcdef1234567890abcdef12345678')} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, positional tuple', async () => {
		const abi = [ {name: '', type: 'tuple', components: [{ name: '', type: 'uint32' }, { name: '', type: 'address' }]} ]
		const parameters = [ [ (2n**32n-1n), Address.fromHexString('1234567890abcdef1234567890abcdef12345678') ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const parameters = [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])} ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
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
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const parameters = [ [ { b: 2n**32n - 1n }, { b: 5n } ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		expect(encoded).toEqual(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'string[2]' } ]
		const parameters = [ [ 'hello', 'goodbye' ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
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
		const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
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
		const expected = Bytes.fromHexString(`
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
		const expected = Bytes.fromHexString(`
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
		const expected = Bytes.fromHexString(`
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
		const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
		const encoded = encodeParameters(abi, parameters)
		const expected = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000001
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: true }
		expect(decoded).toEqual(expected)
	})
	it('boolean false', async () => {
		const abi = [ {name: 'a', type: 'bool'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: false }
		expect(decoded).toEqual(expected)
	})
	it('uint32: max', async () => {
		const abi = [ {name: 'a', type: 'uint32'} ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**32n - 1n }
		expect(decoded).toEqual(expected)
	})
	it('int32: max', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000007fffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**31n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int32: min', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -(2n**31n) }
		expect(decoded).toEqual(expected)
	})
	it('int32: -1', async () => {
		const abi = [ {name: 'a', type: 'int32'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -1n }
		expect(decoded).toEqual(expected)
	})
	it('uint256: max', async () => {
		const abi = [ {name: 'a', type: 'uint256'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**256n-1n }
		expect(decoded).toEqual(expected)
	})
	it('uint40 max', async () => {
		const abi = [ {name: 'a', type: 'uint40'} ]
		const data = Bytes.fromHexString(`
		000000000000000000000000000000000000000000000000000000ffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**40n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int40: max', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000007fffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: 2n**39n-1n }
		expect(decoded).toEqual(expected)
	})
	it('int40: min', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -(2n**39n) }
		expect(decoded).toEqual(expected)
	})
	it('int40: -1', async () => {
		const abi = [ {name: 'a', type: 'int40'} ]
		const data = Bytes.fromHexString(`
		ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: -1n }
		expect(decoded).toEqual(expected)
	})
	it('address', async () => {
		const abi = [ {name: 'a', type: 'address'} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: Address.fromHexString('1234567890abcdef1234567890abcdef12345678') }
		expect(decoded).toEqual(expected)
	})
	it('string', async () => {
		const abi = [ {name: 'a', type: 'string'} ]
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: new Bytes([0xaa, 0xbb, 0xcc, 0xdd]) }
		expect(decoded).toEqual(expected)
	})
	it('bytes16', async () => {
		const abi = [ {name: 'a', type: 'bytes16'} ]
		const data = Bytes.fromHexString(`
		1234567890123456789012345678901200000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: Bytes16.fromHexString('12345678901234567890123456789012') }
		expect(decoded).toEqual(expected)
	})
	it('empty tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: []} ]
		const data = new Bytes(0)
		const decoded = decodeParameters(abi, data)
		const expected = { a:  {}  }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint32' }]} ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 2n**32n-1n} }
		expect(decoded).toEqual(expected)
	})
	it('simple, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000001234567890abcdef1234567890abcdef12345678
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 2n**32n-1n, c: Address.fromHexString('1234567890abcdef1234567890abcdef12345678')} }
		expect(decoded).toEqual(expected)
	})
	it('complex, dynamic, tuple', async () => {
		const abi = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
		const data = Bytes.fromHexString(`
		0000000000000000000000000000000000000000000000000000000000000020
		0000000000000000000000000000000000000000000000000000000000000040
		0000000000000000000000000000000000000000000000000000000000000080
		0000000000000000000000000000000000000000000000000000000000000005
		68656c6c6f000000000000000000000000000000000000000000000000000000
		0000000000000000000000000000000000000000000000000000000000000004
		aabbccdd00000000000000000000000000000000000000000000000000000000
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])} }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[2]' } ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ 2n**32n - 1n, 5n ] }
		expect(decoded).toEqual(expected)
	})
	it('complex, static, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint32' } ] } ]
		const data = Bytes.fromHexString(`
		00000000000000000000000000000000000000000000000000000000ffffffff
		0000000000000000000000000000000000000000000000000000000000000005
		`.replace(/[\n\t]/g, ''))
		const decoded = decodeParameters(abi, data)
		const expected = { a: [ { b: 2n**32n - 1n }, { b: 5n } ] }
		expect(decoded).toEqual(expected)
	})
	it('simple, dynamic, fixed length, array', async () => {
		const abi = [ { name: 'a', type: 'string[2]' } ]
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
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
		const expected = { a: [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
		expect(decoded).toEqual(expected)
	})
	it('simple, static, dynamic length, array', async () => {
		const abi = [ { name: 'a', type: 'uint32[]' } ]
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
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
		const data = Bytes.fromHexString(`
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
		const expected = { a: [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] }
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
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('one parameter', () => {
			const functionDescription = parseSignature('transfer(address)')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [{ name: '', type: 'address', components: undefined }],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('two parameters', () => {
			const functionDescription = parseSignature('transfer(address,uint256)')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{ name: '', type: 'address', components: undefined },
					{ name: '', type: 'uint256', components: undefined },
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('dynamic array parameter', () => {
			const functionDescription = parseSignature('transfer(address[])')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: '', type: 'address[]', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('fixed array', () => {
			const functionDescription = parseSignature('transfer(address[5])')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: '', type: 'address[5]', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('tuple parameter', () => {
			const functionDescription = parseSignature('transfer((address,uint256))')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('tuple array', () => {
			const functionDescription = parseSignature('transfer((address,uint256)[])')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('empty tuple', () => {
			const functionDescription = parseSignature('transfer(())')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple',
						components: [],
					},
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('empty tuple array', () => {
			const functionDescription = parseSignature('transfer(()[])')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{
						name: '',
						type: 'tuple[]',
						components: [],
					},
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('nested tuple', () => {
			const functionDescription = parseSignature('transfer(((address,address),(uint256,uint256)))')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('kitchen sink', () => {
			const functionDescription = parseSignature('transfer(((address,address[]),(uint256,uint256))[],bool,(int256[],bool))')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
	})
	describe('without names', () => {
		it('no parameters, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   )')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('one parameter, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address  )')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: '', type: 'address', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('two parameters, excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address  ,   uint256   )')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{ name: '', type: 'address', components: undefined },
					{ name: '', type: 'uint256', components: undefined },
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('array parameter', () => {
			const functionDescription = parseSignature('transfer(  address[]  )')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: '', type: 'address[]', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
	})
	describe('with names', () => {
		it('no extra whitespace', () => {
			const functionDescription = parseSignature('transfer(address recipient,uint256 value)')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{ name: 'recipient', type: 'address', components: undefined },
					{ name: 'value', type: 'uint256', components: undefined },
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('excessive whitespace', () => {
			const functionDescription = parseSignature('transfer(   address   recipient   ,   uint256   value   )')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [
					{ name: 'recipient', type: 'address', components: undefined },
					{ name: 'value', type: 'uint256', components: undefined },
				],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('short name', () => {
			const functionDescription = parseSignature('transfer(address a)')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: 'a', type: 'address', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('array parameter', () => {
			const functionDescription = parseSignature('transfer(address[] recipients)')
			const expected: FunctionDescription = {
				name: 'transfer',
				inputs: [ { name: 'recipients', type: 'address[]', components: undefined } ],
			}
			expect(functionDescription).toEqual(expected)
		})
		it('tuple parameter', () => {
			const functionDescription = parseSignature('transfer((address recipient, uint256 value) payload)')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('tuple array', () => {
			const functionDescription = parseSignature('transfer((address recipient, uint256 value)[] batches)')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('nested tuple', () => {
			const functionDescription = parseSignature('transfer(((address recipient,address value) transfer, (uint256 id, uint256 coorelation) metadata) payload)')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
		it('kitchen sink', () => {
			const functionDescription = parseSignature('transfer(((address a,address[] b) apple, (uint256 aa, uint256 bb) banana)[] fruit, bool success, (int256[] numbers, bool boolean) metadata)')
			const expected: FunctionDescription = {
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
			}
			expect(functionDescription).toEqual(expected)
		})
	})
})

describe('generateSignature', () => {
	it('no parameters', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [],
		}
		const expected = 'transfer()'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('one parameter', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'address' } ],
		}
		const expected = 'transfer(address)'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('two parameters', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [
				{ name: 'apple', type: 'address' },
				{ name: 'banana', type: 'uint256' },
			],
		}
		const expected = 'transfer(address,uint256)'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('array', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'address[]' } ],
		}
		const expected = 'transfer(address[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('empty tuple', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ { name: 'apple', type: 'tuple', components: [] } ],
		}
		const expected = 'transfer(())'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		}
		const expected = 'transfer((address,uint256))'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple dynamic array', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple[]',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		}
		const expected = 'transfer((address,uint256)[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('simple tuple fixed array', () => {
		const description: FunctionDescription = {
			name: 'transfer',
			inputs: [ {
				name: 'apple',
				type: 'tuple[5]',
				components: [
					{ name: 'apple', type: 'address' },
					{ name: 'banana', type: 'uint256' },
				]
			} ],
		}
		const expected = 'transfer((address,uint256)[5])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
	})
	it('nested tuple', () => {
		const description: FunctionDescription = {
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
		}
		const expected = 'transfer((address,(address,uint256))[])'
		const actual = generateSignature(description)
		expect(actual).toEqual(expected)
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
