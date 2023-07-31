import fetch from "cross-fetch";
import fs from "fs";

class ChainsAtlasLib {
  private apiToken;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async getBytecodeAndKey(
    filePath: string,
    nargs: number,
    language = "c",
  ): Promise<any | unknown> {
    try {
      let srcCode = fs.readFileSync(filePath, "utf8");
      let data = {
        source_code: srcCode,
        language: language,
        entrypoint_nargs: nargs,
      };

      let response = await fetch("https://api.chainsatlas.com/build/generate", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "x-access-tokens": this.apiToken,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error: ${error}`);
      return error;
    }
  }

  composeInput(bytecodeStruct: any, inputData: any[]) {
    try {
      let bytecode = bytecodeStruct.data.bytecode;
      let key = BigInt(bytecodeStruct.data.key);
      let nargs = bytecodeStruct.data.nargs;
      if (nargs !== inputData.length) {
        throw new Error(
          `The number of argument is a constant, to update it please generate new bytecodeStruct through the API`,
        );
      }

      for (let i = 0; i < nargs; i++) {
        let lookup = (key + BigInt(i)).toString(16);
        let replacement = BigInt(inputData[i]).toString(16).padStart(32, "0");

        if (bytecode.includes(lookup)) {
          bytecode = bytecode.replace(lookup, replacement);
        } else {
          throw new Error(`Failed to adjust the bytecode.`);
        }
      }

      return "0x" + bytecode;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
}

module.exports = ChainsAtlasLib;
