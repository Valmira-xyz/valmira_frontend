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

  await new Promise((resolve) => setTimeout(resolve, 150000)); // Poll every 10 seconds

  return contract?.target;
};


