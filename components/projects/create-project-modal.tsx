'use client';

import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { useDispatch } from 'react-redux';

import { ethers } from 'ethers';
import {
  AlertCircle,
  ChevronDown,
  Globe,
  Loader2,
  Send,
  Twitter,
} from 'lucide-react';
import { useChainId, usePublicClient, useWalletClient } from 'wagmi';

import { AddressDisplay } from '@/components/ui/address-display';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { useEthersSigner } from '@/lib/ether-adapter';
import { cn, getChainName } from '@/lib/utils';
import { TokenDeploymentService } from '@/services/deployTokenService';
import {
  createPack,
  createProject,
  fetchPacks,
  fetchProjects,
} from '@/store/slices/projectSlice';

// PackData type is now defined in the pack slice
import { Spinner } from '../ui/spinner';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: any) => void;
  isStrategyPackMode?: boolean;
  packConfig?: {
    packType: string;
    packConfig: any;
    containingBots?: string[];
  };
  hideDialog?: boolean;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
  isStrategyPackMode = false,
  packConfig,
  hideDialog = false,
}: CreateProjectModalProps) {
  const [activeTab, setActiveTab] = useState('deploy');
  const { toast } = useToast();
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId });
  const [deploymentStatusText, setDeploymentStatusText] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // State for deploying new token
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenSymbol, setNewTokenSymbol] = useState('');
  const [newTokenTotalSupply, setNewTokenTotalSupply] = useState('');
  const [newTokenBuyTax, setNewTokenBuyTax] = useState('0');
  const [newTokenSellTax, setNewTokenSellTax] = useState('0');
  const [newTokenMaxHoldingRate, setNewTokenMaxHoldingRate] = useState('10');
  const [newTokenMaxBuySellRate, setNewTokenMaxBuySellRate] = useState('10');
  const [tokenTemplate, setTokenTemplate] = useState('0');
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<
    string | null
  >(null);
  const [pairAddress, setPairAddress] = useState<string | null>(null);

  // Add social links state
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [twitter, setTwitter] = useState('');

  // State for deploying new token

  const [_deploymentError, setDeploymentError] = useState('');

  // State for importing existing token
  const [existingContractAddress, setExistingContractAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('BSC_MAINNET');
  const {
    status: tokenImportStatus,
    error: importError,
    tokenInfo: analyzedToken,
    validateToken,
    initializeState,
  } = useTokenValidation();

  const dispatch = useDispatch();

  const validateTokenInputs = () => {
    const errors: string[] = [];

    // Validate name
    if (!newTokenName || newTokenName.length < 3 || newTokenName.length > 50) {
      errors.push('Token name must be between 3 and 50 characters');
    }

    // Validate symbol
    if (
      !newTokenSymbol ||
      newTokenSymbol.length < 2 ||
      newTokenSymbol.length > 10
    ) {
      errors.push('Token symbol must be between 2 and 10 characters');
    }

    // Validate total supply
    const totalSupply = parseFloat(newTokenTotalSupply);
    if (isNaN(totalSupply) || totalSupply <= 0 || totalSupply > 1e18) {
      errors.push('Total supply must be between 0 and 1e18');
    }

    // Validate fees
    const buyTax = parseFloat(newTokenBuyTax);
    const sellTax = parseFloat(newTokenSellTax);
    if (isNaN(buyTax) || buyTax < 0 || buyTax > 5) {
      errors.push('Buy tax must be between 0 and 5');
    }
    if (isNaN(sellTax) || sellTax < 0 || sellTax > 5) {
      errors.push('Sell tax must be between 0 and 5');
    }

    // Validate limits
    // const maxHolding = parseFloat(newTokenMaxHoldingRate);
    // const maxBuySell = parseFloat(newTokenMaxBuySellRate);
    // if (isNaN(maxHolding) || maxHolding <= 0 || maxHolding > 100) {
    //   errors.push("Max holding rate must be between 0 and 100");
    // }
    // if (isNaN(maxBuySell) || maxBuySell <= 0 || maxBuySell > 100) {
    //   errors.push("Max buy/sell rate must be between 0 and 100");
    // }

    // Validate social links
    if (website && !isValidUrl(website)) {
      errors.push('Invalid website URL');
    }
    if (telegram && !isValidUrl(telegram)) {
      errors.push('Invalid Telegram URL');
    }
    if (discord && !isValidUrl(discord)) {
      errors.push('Invalid Discord URL');
    }
    if (twitter && !isValidUrl(twitter)) {
      errors.push('Invalid Twitter URL');
    }

    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeployNewToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicClient || !walletClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    // in case of deploy, check if the connected wallets chainId is of the selected network
    if (getChainName(chainId) !== selectedNetwork) {
      console.log('chainId', chainId);
      console.log('selectedNetwork', selectedNetwork);
      toast({
        title: 'Error',
        description: `Please connect to the correct network. Please check you wallet is switched to ${selectedNetwork}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate inputs
    const errors = validateTokenInputs();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    // Get the connected wallet address
    if (!walletClient) {
      toast({
        title: 'Error',
        description: 'Failed to get wallet address',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatusText('Initializing deployment...');

    try {
      const deploymentService = TokenDeploymentService.getInstance(
        publicClient,
        walletClient,
        signer
      );

      setDeploymentStatusText(
        'Processing token deployment and waiting for confirmation of 5 blocks and verification on the blockchain explorer...'
      );
      const { contractAddress, pairAddress: newPairAddress } =
        await deploymentService.deployToken({
          tokenName: newTokenName,
          tokenSymbol: newTokenSymbol,
          tokenTotalSupply: newTokenTotalSupply,
          buyFee: parseFloat(newTokenBuyTax) || 0,
          sellFee: parseFloat(newTokenSellTax) || 0,
          maxHoldingLimit_: parseFloat(newTokenMaxHoldingRate) || 0,
          maxBuyLimit_: parseFloat(newTokenMaxBuySellRate) || 0,
          maxSellLimit_: parseFloat(newTokenMaxBuySellRate) || 0,
          socialLinks: {
            websiteLink: website || '',
            telegramLink: telegram || '',
            discordLink: discord || '',
            twitterLink: twitter || '',
          },
          templateNumber: parseInt(tokenTemplate),
        });

      setDeployedTokenAddress(contractAddress);
      setPairAddress(newPairAddress);
      setDeploymentStatusText('Token is deployed and verified successfully.');

      setIsDeploying(false);
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentStatusText('Deployment failed');
      setIsDeploying(false);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to deploy token. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!existingContractAddress || !selectedNetwork) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both contract address and network.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await validateToken(existingContractAddress, selectedNetwork);
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to validate token',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    // Prevent multiple simultaneous calls
    e.preventDefault();

    if (isCreatingProject) {
      return;
    }

    if (activeTab === 'deploy' && !deployedTokenAddress) {
      toast({
        title: 'Error',
        description: 'Please deploy a token first',
        variant: 'destructive',
      });
      return;
    }

    // in case of deploy, check if the connected wallets chainId is of the selected network
    if (activeTab === 'deploy' && getChainName(chainId) !== selectedNetwork) {
      console.log('chainId', chainId);
      console.log('selectedNetwork', selectedNetwork);
      toast({
        title: 'Error',
        description: `Please connect to the correct network. Please check you wallet is switched to ${selectedNetwork}`,
        variant: 'destructive',
      });
      return;
    }

    if (activeTab === 'import' && tokenImportStatus !== 'valid') {
      toast({
        title: 'Error',
        description: 'Please validate an existing token first',
        variant: 'destructive',
      });
      return;
    }

    const tokenAddress =
      activeTab === 'deploy' ? deployedTokenAddress : existingContractAddress;
    if (!tokenAddress) {
      toast({
        title: 'Error',
        description: 'Invalid token address',
        variant: 'destructive',
      });
      return;
    }

    if (!walletClient) {
      toast({
        title: 'Error',
        description: 'Failed to get wallet address',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingProject(true);
    console.log('🚀 handleCreateProject called at:', Date.now());
    console.log('analyzedToken', analyzedToken);
    try {
      const projectData = {
        name: activeTab === 'deploy' ? newTokenName : analyzedToken?.name || '',
        tokenAddress: tokenAddress,
        chainId: chainId,
        symbol:
          activeTab === 'deploy' ? newTokenSymbol : analyzedToken?.symbol || '',
        totalSupply:
          activeTab === 'deploy'
            ? newTokenTotalSupply
            : analyzedToken?.totalSupply || '',
        isImported: activeTab?.toString() === 'import' ? true : false,
        pairAddress:
          activeTab === 'deploy'
            ? pairAddress || ''
            : analyzedToken?.pairAddress || '',
        tokenData: {
          name:
            activeTab === 'deploy' ? newTokenName : analyzedToken?.name || '',
          symbol:
            activeTab === 'deploy'
              ? newTokenSymbol
              : analyzedToken?.symbol || '',
          decimals: activeTab === 'deploy' ? 18 : analyzedToken?.decimals || 18,
          totalSupply:
            activeTab === 'deploy'
              ? newTokenTotalSupply
              : analyzedToken?.totalSupply || '',
          websiteLink: website,
          telegramLink: telegram,
          twitterLink: twitter,
          discordLink: discord,
          buyFee:
            activeTab === 'deploy'
              ? parseFloat(newTokenBuyTax)
              : analyzedToken?.buyTax || 0,
          sellFee:
            activeTab === 'deploy'
              ? parseFloat(newTokenSellTax)
              : analyzedToken?.sellTax || 0,
          maxHoldingLimit_:
            activeTab === 'deploy' ? parseFloat(newTokenMaxHoldingRate) : 0,
          maxBuyLimit_:
            activeTab === 'deploy' ? parseFloat(newTokenMaxBuySellRate) : 0,
          maxSellLimit_:
            activeTab === 'deploy' ? parseFloat(newTokenMaxBuySellRate) : 0,
          templateNumber: activeTab === 'deploy' ? parseInt(tokenTemplate) : 0,
        },
        chainName: selectedNetwork,
      };

      let resultAction;

      if (isStrategyPackMode && packConfig) {
        // In strategy pack mode, create pack instead of project
        const signature = await signer?.signTypedData(
          {
            name: 'Trading Token',
            version: '1',
            chainId: chainId,
            verifyingContract: tokenAddress,
          },
          {
            Permit: [
              { name: 'content', type: 'string' },
              { name: 'nonce', type: 'uint256' },
            ],
          },
          {
            content: 'Enable Trading',
            nonce: 0,
          }
        );

        console.log('signature', signature);
        const unpackedSig = ethers.Signature.from(signature);
        console.log('unpackedSig', unpackedSig);

        const packData = {
          packType: packConfig.packType,
          packConfig: packConfig.packConfig,
          containingBots: packConfig.containingBots || [],
          signature: unpackedSig
            ? {
                v: unpackedSig.v,
                r: unpackedSig.r,
                s: unpackedSig.s,
              }
            : null,
          // Spread all project data fields for pack creation
          ...projectData,
        };

        console.log('packData', packData);
        resultAction = await dispatch(createPack(packData) as any);
      } else {
        // Normal mode, create project
        resultAction = await dispatch(createProject(projectData) as any);
      }

      if (
        isStrategyPackMode
          ? createPack.fulfilled.match(resultAction)
          : createProject.fulfilled.match(resultAction)
      ) {
        // Emit custom event to notify sidebar about creation
        if (isStrategyPackMode) {
          window.dispatchEvent(new CustomEvent('packsChanged'));
        } else {
          window.dispatchEvent(new CustomEvent('projectsChanged'));
        }

        toast({
          title: 'Success',
          description: isStrategyPackMode
            ? 'Strategy pack created successfully'
            : 'Project created successfully',
        });

        // Add a simple refresh mechanism
        // Dispatch appropriate fetch to update the sidebar immediately
        if (isStrategyPackMode) {
          dispatch(fetchPacks() as any);
        } else {
          dispatch(fetchProjects() as any);
        }

        setIsCreatingProject(false);

        if (isStrategyPackMode && onProjectCreated) {
          // In strategy pack mode, call the callback with the pack data
          onProjectCreated(resultAction.payload);
        } else {
          // Reset form and close modal for normal project creation
          resetForm();
          onClose();
        }
      } else if (
        isStrategyPackMode
          ? createPack.rejected.match(resultAction)
          : createProject.rejected.match(resultAction)
      ) {
        setIsCreatingProject(false);
        console.log('resultAction', resultAction);
        const [errorType, errorMessage] = resultAction.payload as any;
        if (errorType === 'E11000 duplicate key error collection') {
          toast({
            title: isStrategyPackMode
              ? 'Failed to create pack'
              : 'Failed to create project',
            description: `${isStrategyPackMode ? 'Pack' : 'Project'} with this token already exists. Please try again with a different token.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title:
              errorType ||
              (isStrategyPackMode
                ? 'Pack Creation Error'
                : 'Project Creation Error'),
            description: errorMessage || 'Something went wrong',
            variant: 'destructive',
          });
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to create project');
      }
    } catch (error: any) {
      setIsCreatingProject(false);
      if (
        error.response?.data?.errorType ===
        'E11000 duplicate key error collection'
      ) {
        toast({
          title: isStrategyPackMode
            ? 'Failed to create pack'
            : 'Failed to create project',
          description: `${isStrategyPackMode ? 'Pack' : 'Project'} with this token already exists. Please try again with a different token.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: error.response?.data?.errorType,
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            (isStrategyPackMode
              ? 'Failed to create pack'
              : 'Failed to create project'),
          variant: 'destructive',
        });
      }
    }
  };

  const resetForm = useCallback(() => {
    // Reset deploy token form
    setNewTokenName('');
    setNewTokenSymbol('');
    setNewTokenTotalSupply('');
    setNewTokenBuyTax('');
    setNewTokenSellTax('');
    setNewTokenMaxHoldingRate('');
    setNewTokenMaxBuySellRate('');
    setTokenTemplate('0');
    setDeploymentStatusText('');
    setDeployedTokenAddress(null);
    setPairAddress(null);
    setDeploymentError('');
    setIsDeploying(false);

    // Reset import token form
    setExistingContractAddress('');
    setSelectedNetwork('BSC_MAINNET');

    // Reset project creation
    setIsCreatingProject(false);

    // Reset social links
    setWebsite('');
    setTelegram('');
    setDiscord('');
    setTwitter('');
    setShowSocialLinks(false);

    // Reset active tab
    setActiveTab('deploy');

    // Reset token validation state
    initializeState();
  }, [initializeState]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const modalContent = (
    <div className="m-4 sm:max-w-[580px]">
      <div className="flex flex-col gap-4 mt-5 ">
        <div className="space-y-2 z-[5] ">
          <Select
            onValueChange={(value) => {
              if (value === 'BSC_MAINNET') {
                setSelectedNetwork('BSC_MAINNET');
              } else if (value === 'ETH_MAINNET') {
                setSelectedNetwork('ETH_MAINNET');
              }
            }}
            value={selectedNetwork}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BSC_MAINNET">
                Binance Smart Chain (BSC)
              </SelectItem>
              <SelectItem value="ETH_MAINNET">Ethereum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mt-5">
          <TabsTrigger value="deploy">Deploy New Token</TabsTrigger>
          <TabsTrigger value="import">Import Existing Token</TabsTrigger>
        </TabsList>
        <TabsContent value="deploy">
          <div className="!my-4">
            <p className="text-sm text-muted-foreground">
              Deploying a new (
              <span className="font-semibold text-primary">
                {selectedNetwork === 'BSC_MAINNET'
                  ? 'Pancakeswap V2'
                  : selectedNetwork === 'ETH_MAINNET'
                    ? 'Uniswap V2'
                    : 'Raydium AMM'}
              </span>
              ) token to create a {isStrategyPackMode ? 'pack' : 'project'}.
            </p>
          </div>
          <form onSubmit={handleDeployNewToken}>
            <div className={`grid grid-cols-2 gap-4 py-4`}>
              <div className="col-span-2 flex flex-col gap-x-8 gap-4">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="newTokenName">Token Name</Label>
                    <Input
                      id="newTokenName"
                      value={newTokenName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTokenName(e.target.value)
                      }
                      required
                      disabled={
                        deploymentStatusText === 'deploying' ||
                        deploymentStatusText === 'success'
                      }
                    />
                  </div>
                  <div className="space-y-2 w-full">
                    <Label htmlFor="newTokenSymbol">Token Symbol</Label>
                    <Input
                      id="newTokenSymbol"
                      value={newTokenSymbol}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTokenSymbol(e.target.value)
                      }
                      required
                      disabled={
                        deploymentStatusText === 'deploying' ||
                        deploymentStatusText === 'success'
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newTokenTotalSupply">Total Supply</Label>
                  <Input
                    id="newTokenTotalSupply"
                    type="number"
                    value={newTokenTotalSupply}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTokenTotalSupply(e.target.value)
                    }
                    required
                    disabled={
                      deploymentStatusText === 'deploying' ||
                      deploymentStatusText === 'success'
                    }
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-between w-full">
                  <div className="space-y-2 w-1/2">
                    <Label htmlFor="newTokenBuyTax">Buy Tax (%)</Label>
                    <Input
                      id="newTokenBuyTax"
                      type="number"
                      className="w-full"
                      value={newTokenBuyTax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTokenBuyTax(e.target.value)
                      }
                      required
                      min="1"
                      max="10"
                      step="0.1"
                      disabled={
                        deploymentStatusText === 'deploying' ||
                        deploymentStatusText === 'success'
                      }
                    />
                  </div>
                  <div className="space-y-2 w-1/2">
                    <Label htmlFor="newTokenSellTax">Sell Tax (%)</Label>
                    <Input
                      id="newTokenSellTax"
                      type="number"
                      className="w-full"
                      value={newTokenSellTax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTokenSellTax(e.target.value)
                      }
                      required
                      min="0"
                      max="10"
                      step="0.1"
                      disabled={
                        deploymentStatusText === 'deploying' ||
                        deploymentStatusText === 'success'
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Collapsible
                  open={showSocialLinks}
                  onOpenChange={setShowSocialLinks}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex w-full justify-between"
                      disabled={
                        deploymentStatusText === 'deploying' ||
                        deploymentStatusText === 'success'
                      }
                    >
                      <span>Social Links</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          showSocialLinks && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-4">
                      <div className="col-span-1 space-y-2">
                        <Label
                          htmlFor="website"
                          className="flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4" /> Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          value={website}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setWebsite(e.target.value)
                          }
                          disabled={
                            deploymentStatusText === 'deploying' ||
                            deploymentStatusText === 'success'
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label
                          htmlFor="telegram"
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" /> Telegram
                        </Label>
                        <Input
                          id="telegram"
                          type="url"
                          value={telegram}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTelegram(e.target.value)
                          }
                          disabled={
                            deploymentStatusText === 'deploying' ||
                            deploymentStatusText === 'success'
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label
                          htmlFor="discord"
                          className="flex items-center gap-2"
                        >
                          <FaDiscord className="h-4 w-4" /> Discord
                        </Label>
                        <Input
                          id="discord"
                          type="url"
                          value={discord}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDiscord(e.target.value)
                          }
                          disabled={
                            deploymentStatusText === 'deploying' ||
                            deploymentStatusText === 'success'
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label
                          htmlFor="twitter"
                          className="flex items-center gap-2"
                        >
                          <Twitter className="h-4 w-4" /> Twitter
                        </Label>
                        <Input
                          id="twitter"
                          type="url"
                          value={twitter}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTwitter(e.target.value)
                          }
                          disabled={
                            deploymentStatusText === 'deploying' ||
                            deploymentStatusText === 'success'
                          }
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {isDeploying && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Deployment Status</span>
                  <span className="text-sm text-muted-foreground">
                    {deploymentStatusText}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              {!deployedTokenAddress ? (
                <Button type="submit" disabled={isDeploying}>
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying and verifying
                    </>
                  ) : (
                    'Deploy & verify Token'
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={isCreatingProject}
                >
                  {isCreatingProject ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isStrategyPackMode
                        ? 'Creating Pack'
                        : 'Creating Project'}
                    </>
                  ) : isStrategyPackMode ? (
                    'Create Pack'
                  ) : (
                    'Create Project'
                  )}
                </Button>
              )}
            </div>
          </form>
        </TabsContent>
        <TabsContent value="import">
          <div className="!my-4">
            <p className="text-sm text-muted-foreground">
              Importing an existing (
              <span className="font-semibold text-primary">
                {selectedNetwork === 'BSC_MAINNET'
                  ? 'Pancakeswap V2'
                  : selectedNetwork === 'ETH_MAINNET'
                    ? 'Uniswap V2'
                    : 'Raydium AMM'}
              </span>
              ) token to create a {isStrategyPackMode ? 'pack' : 'project'}.
            </p>
          </div>
          <div>
            <div className="grid gap-4 py-4">
              <div className="grid gap-x-8">
                <div className="space-y-2">
                  <Label htmlFor="existingContractAddress">
                    Contract Address
                  </Label>
                  <Input
                    id="existingContractAddress"
                    value={existingContractAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExistingContractAddress(e.target.value)
                    }
                    required
                    disabled={
                      tokenImportStatus === 'validating' ||
                      tokenImportStatus === 'valid'
                    }
                  />
                </div>
              </div>
            </div>

            {importError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {tokenImportStatus !== 'valid' ? (
              <div className="flex justify-end">
                <Button
                  onClick={handleImportToken}
                  disabled={
                    tokenImportStatus === 'validating' ||
                    !existingContractAddress ||
                    !selectedNetwork
                  }
                >
                  {tokenImportStatus === 'validating' ? (
                    <>
                      <Spinner size="sm" className="mr-2" hasText={false} />
                      Validating
                    </>
                  ) : (
                    'Validate Token'
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {analyzedToken && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Token Details</h4>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted">
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {analyzedToken.name}
                  </p>
                  <p>
                    <strong>Symbol:</strong> {analyzedToken.symbol}
                  </p>
                  <p>
                    <strong>Decimals:</strong> {analyzedToken.decimals}
                  </p>
                  <p>
                    <strong>Total Supply:</strong> {analyzedToken.totalSupply}
                  </p>

                  <AddressDisplay
                    address={analyzedToken.pairAddress}
                    label="Pair Address"
                    displayLength={9}
                    showEnd={false}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2 justify-between w-full">
                    <div className="space-y-2 w-1/2">
                      <Label htmlFor="newTokenBuyTax">Buy Tax (%)</Label>
                      <Input
                        id="newTokenBuyTax"
                        type="number"
                        className="w-full"
                        value={
                          analyzedToken?.buyTax >= 0
                            ? analyzedToken?.buyTax
                            : newTokenBuyTax
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewTokenBuyTax(e.target.value)
                        }
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        disabled={
                          deploymentStatusText === 'deploying' ||
                          deploymentStatusText === 'success'
                        }
                        placeholder="Max 5%"
                      />
                    </div>
                    <div className="space-y-2 w-1/2">
                      <Label htmlFor="newTokenSellTax">Sell Tax (%)</Label>
                      <Input
                        id="newTokenSellTax"
                        type="number"
                        className="w-full"
                        value={
                          analyzedToken?.sellTax >= 0
                            ? analyzedToken?.sellTax
                            : newTokenSellTax
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewTokenSellTax(e.target.value)
                        }
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        placeholder="Max 5%"
                        disabled={
                          deploymentStatusText === 'deploying' ||
                          deploymentStatusText === 'success'
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Feel free to adjust these values if you have more accurate
                    tax information.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={isCreatingProject}
                >
                  {isCreatingProject ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isStrategyPackMode
                        ? 'Creating Pack'
                        : 'Creating Project'}
                    </>
                  ) : isStrategyPackMode ? (
                    'Create Pack'
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (hideDialog) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isStrategyPackMode ? 'Create New Pack' : 'Create New Project'}
            </h2>
          </div>
          {modalContent}
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="m-4 sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>
            {isStrategyPackMode ? 'Create New Pack' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}

export default memo(CreateProjectModal);
