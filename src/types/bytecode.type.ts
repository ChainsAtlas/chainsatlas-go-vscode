import type { Api } from "../lib";
import type { ExecutorModel } from "../models";
import type { ExecutorView } from "../views";

/**
 * Represents the supported argument types for bytecode input used
 * in the {@link ExecutorModel} `runBytecode` and `_composeInput` methods.
 */
export type BytecodeArg = number;

/**
 * Represents the bytecode structure returned by the `generateBytecodeStructure`
 * method of {@link Api}.
 *
 * The bytecode structure is used by the `runBytecode` method of the
 * {@link ExecutorModel} to compose the bytecode input with the user's
 * {@link BytecodeArg} through the private method `_composeInput`.
 */
export type BytecodeStructure = {
  bytecode: string;
  key: string;
  nargs: number;
};

/**
 * Represents the status of the bytecode compilation that controls
 * the events that the {@link ExecutorModel} emits so that the
 * {@link ExecutorView} can update appropriately to the compiler
 * status.
 */
export type BytecodeCompilerStatus = "compiling" | "done";
