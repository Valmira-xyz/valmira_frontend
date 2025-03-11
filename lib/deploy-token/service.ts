import { ethers } from "ethers";
import { contractDeployByCustomByteCode, getPairAddress } from "./deploy-token";
import { getContractWithSocialLinks, verifyContract, getJobStatus } from "./api";
import type { DeploymentParams, DeploymentStatus, VerificationParams } from "./types";
import type { PublicClient, WalletClient } from "viem";

type TemplateNumber = 0 | 1 | 2;

export class TokenDeploymentService {
  private static instance: TokenDeploymentService;
  private provider: PublicClient;
  private walletClient: WalletClient;
  private signer: any;

  private constructor(provider: PublicClient, walletClient: WalletClient, signer: any) {
    this.provider = provider;
    this.walletClient = walletClient;
    this.signer = signer;
  }

  public static getInstance(provider: PublicClient, walletClient: WalletClient, signer: any): TokenDeploymentService {
    if (!TokenDeploymentService.instance) {
      TokenDeploymentService.instance = new TokenDeploymentService(provider, walletClient, signer);
    }
    return TokenDeploymentService.instance;
  }

  private validateParams(params: DeploymentParams): void {
    if (!params.tokenName) {
      throw new Error("Token name is required");
    }
    if (!params.tokenSymbol) {
      throw new Error("Token symbol is required");
    }
    if (!params.tokenTotalSupply) {
      throw new Error("Total supply is required");
    }
    if (params.buyFee !== undefined && (params.buyFee < 0 || params.buyFee > 25)) {
      throw new Error("Marketing buy fee must be between 0 and 25");
    }
    if (params.sellFee !== undefined && (params.sellFee < 0 || params.sellFee > 25)) {
      throw new Error("Marketing sell fee must be between 0 and 25");
    }
  }

  private async getDeployArgs(params: DeploymentParams): Promise<any[]> {

    return [
      params.tokenName,
      params.tokenSymbol,
      params.tokenTotalSupply,
      params.buyFee || 3,
      params.sellFee || 3,
      params.maxHoldingLimit_,
      params.maxBuyLimit_ || 0,
      params.maxSellLimit_ || 0, 
      this.walletClient.account?.address || "0x0000000000000000000000000000000000000000"
    ];
  }

  public async deployToken(params: DeploymentParams): Promise<{ 
    contractAddress: string; 
    pairAddress: string,
    success: boolean,
    message: string }> {
    try {
      // Check wallet connection
      if (!this.walletClient.account) {
        throw new Error("Please connect your wallet before deploying");
      }

      // Validate parameters
      this.validateParams(params);

      // Get contract with social links
      const contractResponse = await getContractWithSocialLinks(
        params.socialLinks,
        params.templateNumber,
        params.tokenName
      );

      if (!contractResponse.success || !contractResponse.byteCode ) {
        throw new Error(contractResponse.message || "Failed to get contract");
      }

      console.log("contractResponse : ", contractResponse);
      
      // Get deployment arguments
      const deployArgs = await this.getDeployArgs(params);
      
      console.log('Deployment preparation:', {
        walletAddress: this.walletClient.account.address,
        templateNumber: params.templateNumber,
        argumentsCount: deployArgs.length
      });

      // Deploy contract
      const contractAddress = await contractDeployByCustomByteCode(
        contractResponse.byteCode,
        deployArgs,
        this.signer,
        params.templateNumber,
      );

      if (!contractAddress) {
        throw new Error("Failed to deploy contract");
      }

      // Fetch pair address with native currency at here
      const pairAddress = await getPairAddress(contractAddress as string, this.signer);
      console.log("pairAddress : ", pairAddress);

      // Notify backend for verification
      const verifyParams: VerificationParams = {
        deployedAddress: contractAddress as string,
        constructorArguments: deployArgs,
        customContractPath: contractResponse.path || "",
        templateNumber: params?.templateNumber || 0,
        tokenName: params.tokenName
        
      };
      console.log("auth token: ", localStorage.getItem("token"));
      console.log("verifyParams : ", verifyParams);
      const response = await verifyContract(verifyParams);

      return {
        contractAddress: contractAddress as string,
        pairAddress: pairAddress as string,
        success: response.success || false,
        message: response.message || "Failed to verify contract"
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      throw error;
    }
  }

} 

