/* tslint:disable */
/* eslint-disable */

/**
 * Parse a Beancount source string.
 *
 * Returns a JSON object with the parsed ledger and any errors.
 */
export function parse(source: string): any;

/**
 * Run a BQL query on a Beancount source string.
 *
 * Parses the source, then executes the query.
 */
export function query(source: string, query_str: string): any;

/**
 * Validate a parsed ledger.
 *
 * Takes a ledger JSON object and returns validation errors.
 */
export function validate(ledger_json: string): any;

/**
 * Validate a Beancount source string directly.
 *
 * Parses and validates in one step.
 */
export function validate_source(source: string): any;

/**
 * Get version information.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly parse: (a: number, b: number) => number;
  readonly query: (a: number, b: number, c: number, d: number) => number;
  readonly validate: (a: number, b: number) => number;
  readonly validate_source: (a: number, b: number) => number;
  readonly version: (a: number) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
