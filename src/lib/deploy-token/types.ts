export interface SocialLinks {
  website: string;
  telegram: string;
  discord: string;
  twitter: string;
}

export interface DeploymentParams {
  tokenName: string;
  tokenSymbol: string;
  tokenTotalSupply: string;
  buyFee: number;
  sellFee: number;
  maxHoldingLimit_: number;
  maxBuyLimit_: number;
  maxSellLimit_: number;  
  socialLinks: SocialLinks;
  templateNumber: number;
}

export interface DeploymentStatus {
  state: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
}

export interface ContractResponse {
  success: boolean;
  message?: string;
  byteCode?: string;
  filePath?: string;
}

export interface DeploymentJobResponse {
  success: boolean;
  message?: string;
  jobId: string;
  contractAddress: string;
}

export interface JobStatusResponse {
  success: boolean;
  message?: string;
  state: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
}

export interface ProjectData {
  name: string;
  tokenAddress: string;
  chainId: number;
  chainName?: string;
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    websiteLink: string;
    telegramLink: string;
    twitterLink: string;
    discordLink: string;
    buyFee: number;
    sellFee: number;
    maxHoldingLimit_: number;
    maxBuyLimit_: number;
    maxSellLimit_: number;
    templateNumber: number;
    owner: string;
  };
}

export interface ProjectResponse {
  success: boolean;
  message?: string;
  project?: {
    id: string;
    name: string;
    tokenAddress: string;
    chainId: number;
    chainName?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface VerifyContractParams extends DeploymentParams {
  contractAddress: string;
  deployArgs: any[];
  contractPath?: string;
} 