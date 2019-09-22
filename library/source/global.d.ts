/** TextEncoder takes a stream of code points as input and emits a stream of bytes. For a more scalable, non-native library, see StringView – a C-like representation of strings based on typed arrays. */
declare class TextEncoder {
	/**
	 * Returns the result of running UTF-8's encoder.
	 */
	encode(input?: string): Uint8Array
}

/** A decoder for a specific method, that is a specific character encoding, like utf-8, iso-8859-2, koi8, cp1261, gbk, etc. A decoder takes a stream of bytes as input and emits a stream of code points. For a more scalable, non-native library, see StringView – a C-like representation of strings based on typed arrays. */
declare class TextDecoder {
	/**
	 * Returns the result of running encoding's decoder. The method can be invoked zero or more times with options's stream set to true, and then once without options's stream (or set to false), to process a fragmented stream. If the invocation without options's stream (or set to false) has no input, it's clearest to omit both arguments.
	 *
	 * ```
	 * var string = "", decoder = new TextDecoder(encoding), buffer;
	 * while(buffer = next_chunk()) {
	 *   string += decoder.decode(buffer, {stream:true});
	 * }
	 * string += decoder.decode(); // end-of-stream
	 * ```
	 *
	 * If the error mode is "fatal" and encoding's decoder returns error, throws a TypeError.
	 */
	decode(input?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string;
}
