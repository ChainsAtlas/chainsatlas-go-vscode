import { ERROR_MESSAGE } from "../constants";
import type { BytecodeArg, BytecodeStructure } from "../types";

/**
 * Composes the final bytecode by replacing placeholders with the provided
 * input arguments.
 *
 * This method takes the base bytecode structure and replaces the placeholders
 * with the actual values provided in `inputArgs`. The placeholders are
 * determined using the `key` from the `bytecodeStructure` and the index of
 * the argument in `inputArgs`.
 *
 * @param bytecodeStructure
 * The structure of the bytecode that contains placeholders for arguments.
 *
 * @param inputArgs
 * An array of arguments to replace the placeholders in the bytecode.
 *
 * @returns The final composed bytecode string, prefixed with "0x".
 *
 * @throws {Error}
 * Throws an error if the number of arguments provided in `inputArgs` does not
 * match the expected number of arguments (`nargs`) in `bytecodeStructure`.
 */
export const composeInput = (
  bytecodeStructure: BytecodeStructure,
  inputArgs: BytecodeArg[],
): string => {
  const key = BigInt(bytecodeStructure.key);
  const nargs = bytecodeStructure.nargs;

  let bytecode = bytecodeStructure.bytecode;

  if (nargs !== inputArgs.length) {
    throw new Error(ERROR_MESSAGE.ARGS_MISMATCH);
  }

  for (let i = 0; i < nargs; i++) {
    const lookup = (key + BigInt(i)).toString(16);
    const replacement = BigInt(inputArgs[i]).toString(16).padStart(32, "0");

    if (bytecode.includes(lookup)) {
      bytecode = bytecode.replace(lookup, replacement);
    }
  }

  return `0x${bytecode}`;
};
