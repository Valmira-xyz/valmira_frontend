import { ethers } from "ethers";
import { Config } from "./config";

export const contractDeployByCustomByteCode = async (byteCode: string, args: any[], signer: any, tokenTemplate: number) => {
  console.log("contractDeployByCustomByteCode log - 1 : ", args, signer, tokenTemplate);

  const TokenAbi = (Config.template2AbiMap as any)[tokenTemplate];

  const factory = new ethers.ContractFactory(
    TokenAbi.abi,
    byteCode,
    signer
  );

  const contract = await factory.deploy(...args);

  await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds

  return contract?.target;
};

export const getPairAddress = async (tokenAddress: string, signer: any) => {
  try {
    // Determine the ABI for the token contract
    const tokenAbi = [
      "function uniswapPair() view returns (address)"
    ]; // Modify this ABI if needed

    // Create an instance of the token contract
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    // Call the uniswapPair() function to get the pair address
    const pairAddress = await tokenContract.uniswapPair();

    return pairAddress;
  } catch (error) {
    console.error("Error fetching pair address:", error);
    return "0x0000000000000000000000000000000000000000"; // Return a zero address in case of failure
  }
};

