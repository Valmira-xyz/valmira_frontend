import { ethers } from 'ethers';

/**
 * Fetches the BNB balance for a given wallet address
 * @param provider - The ethers provider
 * @param address - The wallet address to check
 * @returns The BNB balance in ethers (as a number)
 */
export const getBnbBalance = async (
  provider: ethers.Provider,
  address: string
): Promise<number> => {
  try {
    const balanceWei = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balanceWei));
  } catch (error) {
    console.error('Error fetching BNB balance:', error);
    throw new Error(`Failed to fetch BNB balance: ${error}`);
  }
};

/**
 * Transfers BNB from the signer's wallet to the target address
 * @param signer - The ethers signer
 * @param toAddress - The recipient wallet address
 * @param amount - The amount of BNB to transfer in ether
 * @returns The transaction receipt
 */
export const transferBnb = async (
  signer: ethers.Signer,
  toAddress: string,
  amount: number
): Promise<ethers.TransactionReceipt | null> => {
  try {
    // Convert amount from ether to wei
    const amountWei = ethers.parseEther(amount.toString());

    // Create transaction object
    const tx = {
      to: toAddress,
      value: amountWei,
    };

    // Send the transaction
    const transaction = await signer.sendTransaction(tx);

    // Wait for the transaction to be mined
    const receipt = await transaction.wait();
    return receipt;
  } catch (error) {
    console.error('Error transferring BNB:', error);
    throw new Error(`Failed to transfer BNB: ${error}`);
  }
};

/**
 * Check if the user has sufficient BNB balance for a transfer
 * @param provider - The ethers provider
 * @param address - The wallet address to check
 * @param amount - The amount of BNB to check against
 * @returns Boolean indicating if the balance is sufficient
 */
export const hasSufficientBalance = async (
  provider: ethers.Provider,
  address: string,
  amount: number
): Promise<boolean> => {
  try {
    const balanceWei = await provider.getBalance(address);
    const balanceEther = parseFloat(ethers.formatEther(balanceWei));

    // Leave a small amount for gas
    const gasBuffer = 0.005; // 0.005 BNB buffer for gas
    return balanceEther >= amount + gasBuffer;
  } catch (error) {
    console.error('Error checking BNB balance:', error);
    throw new Error(`Failed to check BNB balance: ${error}`);
  }
};
