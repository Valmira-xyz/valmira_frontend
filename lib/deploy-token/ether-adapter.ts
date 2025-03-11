import React from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  FallbackProvider,
  JsonRpcProvider,
  BrowserProvider,
  JsonRpcSigner,
} from "ethers";

// Define network type structure for ethers providers
interface Network {
  chainId: number;
  name: string;
  ensAddress?: string;
}

/**
 * Converts a wagmi any to an ethers Provider
 */
function publicClientToProvider(publicClient: any): JsonRpcProvider | FallbackProvider {
  const { chain, transport } = publicClient;
  const network: Network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  if (transport.type === "fallback") {
    const providers = (transport.transports as any[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    );
    if (providers.length === 1) return providers[0];
    return new FallbackProvider(providers);
  }
  
  return new JsonRpcProvider((transport as any).url, network);
}

/**
 * Converts a wagmi any to an ethers Signer
 */
function walletClientToSigner(walletClient: any): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  const network: Network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

interface ChainIdParam {
  chainId?: number;
}

/**
 * Hook to convert a viem Public Client to an ethers.js Provider.
 */
export function useEthersProvider({ chainId }: ChainIdParam): JsonRpcProvider | FallbackProvider {
  const publicClient = usePublicClient({ chainId });
  return React.useMemo(
    () => publicClientToProvider(publicClient),
    [publicClient]
  );
}

/**
 * Hook to convert a viem Wallet Client to an ethers.js Signer.
 */
export function useEthersSigner({ chainId }: ChainIdParam): JsonRpcSigner | undefined {
  const { data: walletClient } = useWalletClient({ chainId });
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
}