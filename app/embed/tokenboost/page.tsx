'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AlertCircle, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useChainId, useDisconnect } from 'wagmi';

import { MultiStepDialogAmbassador } from '@/components/ambassador/ambassador-widget-config-multistep-dialogbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { WalletConnectionButton } from '@/components/wallet/wallet-connection-button';
import { useWeb3Auth } from '@/hooks/use-web3-auth';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import {
  createPack,
  createProject,
  fetchGlobalPackParameters,
  fetchPacks,
  fetchProjects,
} from '@/store/slices/projectSlice';
import type { AppDispatch, RootState } from '@/store/store';

export default function TokenBoostEmbedPage() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  // Web3 and authentication hooks
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const {
    user,
    isLoading: isAuthLoading,
    error: authError,
  } = useSelector((state: RootState) => state.auth);

  // Get pack configurations from Redux
  const projectState = useSelector((state: RootState) => state.projects);
  const globalPackParameters = projectState?.globalPackParameters;

  // Debug Redux state
  console.log('Debug - Full project state:', projectState);
  console.log('Debug - globalPackParameters from Redux:', globalPackParameters);
  const { authenticate } = useWeb3Auth();

  // Initialize toast
  const { toast } = useToast();

  // Token validation hook
  const {
    status: tokenValidationStatus,
    error: tokenValidationError,
    tokenInfo: validatedTokenInfo,
    validateToken,
    initializeState: initializeTokenValidation,
  } = useTokenValidation();

  // Track the address that was validated to detect changes
  const [validatedAddress, setValidatedAddress] = useState<string>('');

  // Configuration state from URL parameters
  const [config, setConfig] = useState({
    dataPartnerId: '',
    theme: 'light',
    primaryColor: '#3b82f6',
  });

  // State for detected tokens from parent window (used in Phase 3)
  const [_detectedTokens, setDetectedTokens] = useState<any[]>([]);

  // Widget state
  const [widgetState, setWidgetState] = useState<
    'connecting' | 'authenticating' | 'ready' | 'error'
  >('connecting');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  // Strategy deployment state
  const [_deploymentState, setDeploymentState] = useState({
    isDeploying: false,
    step: 'idle', // 'idle' | 'validating-token' | 'creating-project' | 'completed' | 'error'
    progress: 0,
    errors: [] as string[],
    deployedProject: null as any,
  });

  // Local state to store created items for immediate validation
  const [localCreatedItems, setLocalCreatedItems] = useState<any[]>([]);

  // Authentication attempt tracking to prevent infinite loops
  const [authAttempted, setAuthAttempted] = useState<boolean>(false);

  // Analytics tracking
  const [sessionId] = useState<string>(
    `tb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [analyticsEvents, setAnalyticsEvents] = useState<
    Array<{
      name: string;
      timestamp: number;
      data?: Record<string, any>;
    }>
  >([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  // Strategy presets are now only used for display in the dialog
  // No bot configuration is done in the widget
  const strategyPresets = {};

  // Helper function to get chain name from chainId
  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 56:
        return 'BSC_MAINNET';
      case 1:
        return 'ETH_MAINNET';
      default:
        return 'BSC_MAINNET'; // Default fallback
    }
  };

  // Track analytics events (defined early to be used in useEffect)
  const trackEvent = (name: string, data?: Record<string, any>) => {
    // Implement rate limiting for events
    const maxEventCount = 10; // Maximum number of same events in a session
    const currentCount = eventCounts[name] || 0;

    // Update event count
    setEventCounts((prev) => ({
      ...prev,
      [name]: currentCount + 1,
    }));

    // Skip if we've exceeded the max count for this event type
    // But always allow important events
    const importantEvents = [
      'strategy_deployed',
      'authentication_success',
      'widget_closed',
    ];
    if (currentCount >= maxEventCount && !importantEvents.includes(name)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Analytics] Skipped ${name} (rate limited)`, data);
      }
      return;
    }

    const event = {
      name,
      timestamp: Date.now(),
      data: data || {},
    };

    // Add to local events array
    setAnalyticsEvents((prev) => [...prev, event]);

    // Send to backend if production
    if (process.env.NODE_ENV === 'production') {
      // Batch send events every 10 events or on important events
      if (analyticsEvents.length >= 10 || importantEvents.includes(name)) {
        const eventsToSend = [...analyticsEvents, event];

        // Add rate limiting to API calls
        const apiCallDelay = Math.min(currentCount * 1000, 10000); // Exponential backoff up to 10s

        setTimeout(() => {
          fetch('/api/widget/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              partnerId: config.dataPartnerId,
              events: eventsToSend,
            }),
          })
            .then(() => {
              // Clear sent events on success
              setAnalyticsEvents([]);
            })
            .catch(() => {
              // Silently fail analytics to avoid infinite loops
            });
        }, apiCallDelay);
      }
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${name}:`, data);
    }
  };

  // Initialize configuration from URL parameters
  useEffect(() => {
    const partnerConfig = {
      dataPartnerId: searchParams.get('data-partner-id') || '',
      theme: searchParams.get('data-theme') || 'light',
      primaryColor: searchParams.get('data-primary-color') || '#3b82f6',
    };

    setConfig(partnerConfig);

    // Track widget initialization
    if (partnerConfig.dataPartnerId) {
      trackEvent('widget_initialized', {
        'data-partner-id': partnerConfig.dataPartnerId,
        theme: partnerConfig.theme,
        url: window.location.href,
      });
    }
  }, [searchParams]);

  // Apply theme to the page
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');

    // Handle 'auto' theme by checking system preference
    if (config.theme === 'auto') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      html.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      html.classList.add(config.theme);
    }

    // Apply primary color as CSS variable
    document.documentElement.style.setProperty(
      '--primary',
      config.primaryColor
    );
    document.documentElement.style.setProperty(
      '--primary-foreground',
      '#ffffff'
    );
  }, [config.theme, config.primaryColor]);

  // Handle wallet connection and authentication
  useEffect(() => {
    if (!isConnected) {
      // Reset auth state when wallet disconnects
      setWidgetState('connecting');
      setAuthAttempted(false);
      trackEvent('wallet_connection_needed');
    } else if (
      isConnected &&
      !user &&
      !isAuthLoading &&
      !authAttempted &&
      !authError
    ) {
      // Only attempt authentication once automatically
      setWidgetState('authenticating');
      setAuthAttempted(true);
      // Trigger authentication when wallet is connected but user is not authenticated
      trackEvent('authentication_started', {
        isConnected,
        partnerId: config.dataPartnerId,
      });
      // Use partnerId as the referral code since partnerId IS the referral code
      console.log(
        '🔍 Widget Authentication - Using partnerId as referral code:',
        config.dataPartnerId
      );

      // Pass the partnerId as referral code since they are the same
      authenticate(config.dataPartnerId || undefined);
    } else if (user) {
      // Authentication successful
      setWidgetState('ready');
      setAuthAttempted(false); // Reset for potential future attempts

      // Fetch pack configurations when user is authenticated
      if (!globalPackParameters) {
        console.log('Fetching global pack parameters...');
        dispatch(fetchGlobalPackParameters());
      } else {
        console.log(
          'Global pack parameters already available:',
          globalPackParameters
        );
      }

      // Also fetch user's projects and packs to ensure validation works
      console.log('Fetching user projects and packs for validation...');
      dispatch(fetchPacks() as any);
      dispatch(fetchProjects() as any);

      // Track successful authentication
      trackEvent('authentication_success', {
        userId: user._id,
        walletAddress: user.walletAddress,
        partnerId: config.dataPartnerId,
      });

      // Notify parent window that widget is ready
      window.parent.postMessage(
        {
          type: 'valmira-widget-ready',
          'data-partner-id': config.dataPartnerId,
          user: {
            address: user.walletAddress,
            id: user._id,
          },
        },
        '*'
      );
    } else if (authError) {
      // Authentication failed - check if it's a wallet connection error
      const errorMessage =
        typeof authError === 'string'
          ? authError
          : (authError as any)?.message || 'Unknown authentication error';

      if (
        errorMessage.includes('Proposal expired') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('rejected')
      ) {
        // Handle wallet-specific errors
        handleWalletConnectionError(authError);
      } else {
        // Handle other authentication errors
        setWidgetState('error');
        trackEvent('authentication_failed', {
          error: errorMessage,
          partnerId: config.dataPartnerId,
        });
        logError(authError, 'authentication-failure');
      }
    }
  }, [
    isConnected,
    user,
    isAuthLoading,
    authError,
    authAttempted,
    authenticate,
    config.dataPartnerId,
  ]);

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, add origin check for security
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = searchParams.get('data-allowed-origins');
        if (allowedOrigins) {
          const origins = allowedOrigins.split(',');
          if (!origins.includes(event.origin)) {
            console.warn(`Message from untrusted origin: ${event.origin}`);
            return;
          }
        }
      }

      if (event.data?.type === 'tokenDetection') {
        console.log('Widget received token from parent:', event.data.tokens);
        setDetectedTokens(event.data.tokens || []);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [searchParams]);

  const handleClose = () => {
    setIsDialogOpen(false);
    // Track widget closing
    trackEvent('widget_closed', { reason: 'user_initiated' });

    // Send a message to the parent window when the dialog is closed
    window.parent.postMessage(
      {
        type: 'valmira-widget-close',
        'data-partner-id': config.dataPartnerId,
      },
      '*'
    );
  };

  // Handle pack deployment using existing createPack system
  const handlePackDeployment = async (details: {
    tokenAddress: string;
    strategy: string | null;
    duration: string;
    partnerId?: string;
    buyTax?: number;
    sellTax?: number;
  }) => {
    console.log('Deploying pack with details:', details);

    // Set deployment state for pack creation
    setDeploymentState({
      isDeploying: true,
      step: 'creating-project', // Using same step name for consistency
      progress: 10,
      errors: [],
      deployedProject: null,
    });

    try {
      // Extract pack type from strategy ID (e.g., 'pack-Launch Day' -> 'Launch Day')
      const packType = details.strategy!.replace('pack-', '');

      // Find pack configuration
      const packConfig = globalPackParameters?.find(
        (pack: any) => pack.type === packType
      );

      if (!packConfig) {
        throw new Error(`Pack configuration not found for type: ${packType}`);
      }

      console.log('Found pack configuration:', packConfig);

      // Validate token info
      const chainName = getChainName(chainId);
      let tokenInfo = validatedTokenInfo;

      if (!tokenInfo || tokenValidationStatus !== 'valid') {
        console.log(
          'Validating token for pack deployment:',
          details.tokenAddress
        );
        tokenInfo = await validateToken(details.tokenAddress, chainName);
      }

      if (!tokenInfo) {
        throw new Error('Failed to validate token for pack deployment');
      }

      setDeploymentState((prev) => ({
        ...prev,
        progress: 50,
      }));

      // Create pack data structure
      const packData = {
        name: `${tokenInfo.name} - ${packType} Pack`,
        tokenAddress: details.tokenAddress,
        chainId: chainId,
        symbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply,
        isImported: true,
        pairAddress: tokenInfo.pairAddress || '',
        tokenData: {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals || 18,
          totalSupply: tokenInfo.totalSupply,
          websiteLink: '',
          telegramLink: '',
          twitterLink: '',
          discordLink: '',
          buyFee: (details as any).buyTax || 0,
          sellFee: (details as any).sellTax || 0,
          maxHoldingLimit_: 0,
          maxBuyLimit_: 0,
          maxSellLimit_: 0,
          templateNumber: 0,
        },
        chainName: chainName,
        packType: packType,
        packConfig: packConfig,
        containingBots: packConfig.containingBots || [],
        partnerId: details.partnerId,
      };

      console.log('Creating pack with data:', packData);

      // Track pack deployment start
      trackEvent('pack_deployment_started', {
        packType: packType,
        tokenAddress: details.tokenAddress,
        partnerId: details.partnerId,
      });

      // Dispatch pack creation
      const resultAction = await dispatch(createPack(packData) as any);

      if (createPack.fulfilled.match(resultAction)) {
        const pack = resultAction.payload;
        console.log('Pack created successfully:', pack);

        setDeploymentState((prev) => ({
          ...prev,
          step: 'completed',
          progress: 100,
          isDeploying: false,
          deployedProject: pack, // Store pack as "project" for consistency
        }));

        // Update Redux state manually to include the new pack for validation
        const updatedProjectState = {
          ...projectState,
          packs: [...(projectState?.packs || []), pack],
        };
        console.log(
          'Manually updated project state with new pack:',
          updatedProjectState
        );

        // Track successful pack deployment
        trackEvent('pack_deployed', {
          packId: pack._id,
          packType: packType,
          tokenAddress: details.tokenAddress,
          partnerId: details.partnerId,
        });

        // Notify parent window
        window.parent.postMessage(
          {
            type: 'valmira-pack-deployed',
            projectId: pack._id,
            packType: packType,
            tokenAddress: details.tokenAddress,
            partnerId: details.partnerId,
          },
          '*'
        );

        toast({
          title: 'Pack Created Successfully!',
          description: `${packType} pack has been deployed for ${tokenInfo.name}.`,
        });

        console.log('Pack deployment completed successfully');

        // Add to local created items for immediate validation
        setLocalCreatedItems((prev) => [...prev, { ...pack, type: 'pack' }]);

        // Clear validation state to prevent token reuse
        initializeTokenValidation();
        setValidatedAddress('');
      } else {
        const errorMessage = resultAction.payload || 'Failed to create pack';

        // Check if the error is due to existing token address
        if (
          typeof errorMessage === 'string' &&
          (errorMessage.includes('already exists') ||
            errorMessage.includes('already has'))
        ) {
          toast({
            title: 'Token Already in Use',
            description:
              'This token already has a project or pack created. Please use a different token address.',
            variant: 'destructive',
          });

          setDeploymentState((prev) => ({
            ...prev,
            step: 'error',
            isDeploying: false,
            errors: [...prev.errors, 'Token address already in use'],
          }));

          // Close dialog after showing error and reset validation state
          setTimeout(() => {
            setIsDialogOpen(false);
            initializeTokenValidation();
            setValidatedAddress('');
          }, 3000);

          trackEvent('pack_deployment_failed', {
            error: 'Token already exists',
            tokenAddress: details.tokenAddress,
            partnerId: details.partnerId,
          });
          return;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Pack deployment failed:', error);

      const errorMessage =
        error.response?.data?.errorMessage ||
        error.message ||
        'Unknown error occurred';

      setDeploymentState((prev) => ({
        ...prev,
        step: 'error',
        isDeploying: false,
        errors: [...prev.errors, errorMessage],
      }));

      // Track pack deployment failure
      trackEvent('pack_deployment_failed', {
        error: errorMessage,
        tokenAddress: details.tokenAddress,
        partnerId: details.partnerId,
      });

      // Notify parent window of error
      window.parent.postMessage(
        {
          type: 'valmira-deployment-error',
          error: errorMessage,
          tokenAddress: details.tokenAddress,
          partnerId: details.partnerId,
        },
        '*'
      );

      toast({
        title: 'Pack Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      // Log error for monitoring
      logError(error, 'pack-deployment');
    }
  };

  // This entire function replaces the old handleDeployStrategy function.
  const handleDialogAction = async (payload: any) => {
    console.log('Dialog action received:', payload);

    // Deploy a Strategy (create project/pack based on strategy type)
    if (payload.type === 'deployStrategy') {
      const details = payload;

      console.log('Deploying strategy with details:', details);

      if (!details.strategy || !details.tokenAddress) {
        console.error('Missing required strategy details');
        return;
      }

      if (!validatedTokenInfo) {
        toast({
          title: 'Deployment Error',
          description:
            'Token info is missing. Please validate the token first.',
          variant: 'destructive',
        });
        return;
      }

      // Detect if this is a pack strategy
      const isPackStrategy = details.strategy.startsWith('pack-');

      if (isPackStrategy) {
        // Handle pack deployment - details already includes buyTax and sellTax
        await handlePackDeployment(details);
        return;
      }

      // For bot strategies, we just create the project without enabling bots
      // Bot enabling and configuration will happen on the platform after payment
      console.log('Creating project for bot strategy:', details.strategy);

      // Reset deployment state
      setDeploymentState({
        isDeploying: true,
        step: 'validating-token',
        progress: 10,
        errors: [],
        deployedProject: null,
      });

      try {
        // Step 1: Validate token
        trackEvent('project_creation_started', {
          strategy: details.strategy,
          tokenAddress: details.tokenAddress,
          partnerId: details.partnerId,
        });

        setDeploymentState((prev) => ({
          ...prev,
          step: 'validating-token',
          progress: 20,
        }));

        const chainName = getChainName(chainId);
        let tokenInfo = validatedTokenInfo;

        // If token info is not already validated, validate it now
        if (!tokenInfo || tokenValidationStatus !== 'valid') {
          console.log('Validating token:', details.tokenAddress);
          tokenInfo = await validateToken(details.tokenAddress, chainName);
        }

        if (!tokenInfo) {
          throw new Error('Failed to validate token');
        }

        // Step 2: Create project for bot strategies
        setDeploymentState((prev) => ({
          ...prev,
          step: 'creating-project',
          progress: 50,
        }));

        const projectData = {
          name: tokenInfo.name,
          tokenAddress: details.tokenAddress,
          chainId: chainId,
          symbol: tokenInfo.symbol,
          totalSupply: tokenInfo.totalSupply,
          isImported: true, // Since we're importing an existing token
          pairAddress: tokenInfo.pairAddress || '',
          tokenData: {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals || 18,
            totalSupply: tokenInfo.totalSupply,
            websiteLink: '',
            telegramLink: '',
            twitterLink: '',
            discordLink: '',
            buyFee: details.buyTax || 0,
            sellFee: details.sellTax || 0,
            maxHoldingLimit_: 0,
            maxBuyLimit_: 0,
            maxSellLimit_: 0,
            templateNumber: 0,
          },
          chainName: chainName,
          partnerId: details.partnerId,
        };

        console.log('Creating project with data:', projectData);
        trackEvent('project_creation_started', {
          tokenAddress: details.tokenAddress,
        });
        const resultAction = await dispatch(createProject(projectData) as any);

        if (!createProject.fulfilled.match(resultAction)) {
          const errorMessage =
            resultAction.payload || 'Failed to create project';

          // Check if the error is due to existing token address
          if (
            typeof errorMessage === 'string' &&
            (errorMessage.includes('already exists') ||
              errorMessage.includes('already has'))
          ) {
            toast({
              title: 'Token Already in Use',
              description:
                'This token already has a project or pack created. Please use a different token address.',
              variant: 'destructive',
            });

            // Reset deployment state
            setDeploymentState((prev) => ({
              ...prev,
              step: 'error',
              isDeploying: false,
              errors: [...prev.errors, 'Token address already in use'],
            }));

            // Close dialog after showing error and reset validation state
            setTimeout(() => {
              setIsDialogOpen(false);
              initializeTokenValidation();
              setValidatedAddress('');
            }, 3000);

            trackEvent('project_creation_failed', {
              error: 'Token already exists',
              tokenAddress: details.tokenAddress,
            });
            return;
          }

          throw new Error(errorMessage);
        }

        const project = resultAction.payload;
        console.log('Project created successfully:', project);
        trackEvent('project_creation_success', { projectId: project._id });

        // Update Redux state manually to include the new project for validation
        const updatedProjectState = {
          ...projectState,
          projects: [...(projectState?.projects || []), project],
        };
        console.log(
          'Manually updated project state with new project:',
          updatedProjectState
        );

        // Add to local created items for immediate validation
        setLocalCreatedItems((prev) => [
          ...prev,
          { ...project, type: 'project' },
        ]);

        setDeploymentState((prev) => ({
          ...prev,
          deployedProject: project,
          step: 'completed',
          progress: 100,
        }));

        // Step 3: Project creation completed
        setDeploymentState((prev) => ({
          ...prev,
          step: 'completed',
          progress: 100,
          currentBot: null,
          isDeploying: false,
        }));

        // Track successful project creation
        trackEvent('project_created', {
          strategy: details.strategy,
          projectId: project._id,
          tokenAddress: details.tokenAddress,
          partnerId: details.partnerId,
        });

        // Notify parent window
        window.parent.postMessage(
          {
            type: 'valmira-project-created',
            projectId: project._id,
            strategy: details.strategy,
            tokenAddress: details.tokenAddress,
            partnerId: details.partnerId,
          },
          '*'
        );

        console.log('Project creation completed successfully');

        // Clear validation state to prevent token reuse
        initializeTokenValidation();
        setValidatedAddress('');
      } catch (error: any) {
        console.error('Project creation failed:', error);

        const errorMessage =
          error.response?.data?.errorMessage ||
          error.message ||
          'Unknown error occurred';

        setDeploymentState((prev) => ({
          ...prev,
          step: 'error',
          isDeploying: false,
          errors: [...prev.errors, errorMessage],
        }));

        // Track project creation failure
        trackEvent('project_creation_failed', {
          strategy: details.strategy,
          error: errorMessage,
          tokenAddress: details.tokenAddress,
          partnerId: details.partnerId,
        });

        // Notify parent window of error
        window.parent.postMessage(
          {
            type: 'valmira-deployment-error',
            error: errorMessage,
            strategy: details.strategy,
            tokenAddress: details.tokenAddress,
            partnerId: details.partnerId,
          },
          '*'
        );

        // Log error for monitoring
        logError(error, 'project-creation');
      }
    }
  };

  // Token validation wrapper for the dialog
  const handleTokenValidation = async (address: string) => {
    try {
      const chainName = getChainName(chainId);
      console.log(`Validating token ${address} on ${chainName}`);

      trackEvent('token_validation_started', {
        tokenAddress: address,
        chainName: chainName,
        partnerId: config.dataPartnerId,
      });

      // First check if this token already exists in user's projects/packs BEFORE validating
      console.log('Debug - Checking token conflicts for:', address);
      console.log('Debug - projectState:', projectState);
      console.log('Debug - projectState.projects:', projectState?.projects);
      console.log('Debug - projectState.packs:', projectState?.packs);

      let existingProject = null;
      let existingPack = null;

      // Check projects array
      if (projectState?.projects && Array.isArray(projectState.projects)) {
        existingProject = projectState.projects.find((project: any) => {
          const projectToken = project?.tokenAddress?.toLowerCase();
          const checkToken = address.toLowerCase();
          console.log(
            'Debug - Comparing project token:',
            projectToken,
            'with:',
            checkToken
          );
          return projectToken === checkToken;
        });
      }

      // Check packs array
      if (projectState?.packs && Array.isArray(projectState.packs)) {
        existingPack = projectState.packs.find((pack: any) => {
          const packToken = pack?.tokenAddress?.toLowerCase();
          const checkToken = address.toLowerCase();
          console.log(
            'Debug - Comparing pack token:',
            packToken,
            'with:',
            checkToken
          );
          return packToken === checkToken;
        });
      }

      // Also check local created items (for items created in this session)
      const localExisting = localCreatedItems.find((item: any) => {
        const itemToken = item?.tokenAddress?.toLowerCase();
        const checkToken = address.toLowerCase();
        console.log(
          'Debug - Comparing local item token:',
          itemToken,
          'with:',
          checkToken,
          'type:',
          item.type
        );
        return itemToken === checkToken;
      });

      console.log('Debug - Found existing project:', existingProject);
      console.log('Debug - Found existing pack:', existingPack);
      console.log('Debug - Found local existing item:', localExisting);

      if (existingProject || existingPack || localExisting) {
        const existingType = existingProject
          ? 'project'
          : existingPack
            ? 'pack'
            : localExisting?.type || 'item';
        const existingName =
          existingProject?.name ||
          (existingPack as any)?.name ||
          localExisting?.name ||
          'Unknown';

        console.log('Debug - Token conflict detected:', {
          existingType,
          existingName,
          source: existingProject
            ? 'redux-project'
            : existingPack
              ? 'redux-pack'
              : 'local',
        });

        const errorMessage = `Token already has a ${existingType} created`;

        toast({
          title: 'Token Already in Use',
          description: `This token already has a ${existingType} "${existingName}" created. Please use a different token address.`,
          variant: 'destructive',
        });

        trackEvent('token_validation_conflict', {
          tokenAddress: address,
          existingType,
          existingName,
          partnerId: config.dataPartnerId,
        });

        // Throw error to prevent validation from succeeding
        throw new Error(errorMessage);
      }

      console.log(
        'Debug - No token conflicts found, proceeding with validation'
      );

      // Only validate if no conflicts found
      const result = await validateToken(address, chainName);

      // Track the validated address
      setValidatedAddress(address);

      trackEvent('token_validation_success', {
        tokenAddress: address,
        tokenName: result?.name,
        tokenSymbol: result?.symbol,
        chainName: chainName,
        partnerId: config.dataPartnerId,
      });

      return result;
    } catch (error: any) {
      console.error('Token validation failed:', error);

      trackEvent('token_validation_failed', {
        tokenAddress: address,
        error: error.message || 'Unknown validation error',
        chainName: getChainName(chainId),
        partnerId: config.dataPartnerId,
      });

      throw error;
    }
  };

  // Reset validation state when address changes
  const handleTokenAddressChange = (newAddress: string) => {
    // If the address is different from the validated one, reset validation state
    if (
      newAddress !== validatedAddress &&
      (tokenValidationStatus === 'valid' || tokenValidationStatus === 'invalid')
    ) {
      console.log(
        `Address changed from ${validatedAddress} to ${newAddress}, resetting validation state`
      );
      initializeTokenValidation();
      setValidatedAddress('');

      trackEvent('token_address_changed', {
        previousAddress: validatedAddress,
        newAddress: newAddress,
        partnerId: config.dataPartnerId,
      });
    }
  };

  const handleRetryAuth = () => {
    if (isConnected && !user) {
      setWidgetState('authenticating');
      // Reset the auth attempted flag for manual retry
      setAuthAttempted(false);
      trackEvent('authentication_retry');
      // Use partnerId as the referral code since partnerId IS the referral code
      console.log(
        '🔍 Widget Retry Authentication - Using partnerId as referral code:',
        config.dataPartnerId
      );

      // Pass the partnerId as referral code since they are the same
      authenticate(config.dataPartnerId || undefined);
    }
  };

  // Enhanced error handling for wallet connection issues
  const handleWalletConnectionError = (error: any) => {
    console.error('Wallet connection error in iframe:', error);

    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (
      errorMessage.includes('Proposal expired') ||
      errorMessage.includes('expired')
    ) {
      // Handle proposal expiration specifically
      trackEvent('wallet_proposal_expired', {
        error: errorMessage,
        partnerId: config.dataPartnerId,
        iframe: true,
      });

      // Notify parent window of the specific error
      window.parent.postMessage(
        {
          type: 'valmira-wallet-error',
          error: 'Connection timeout. Please try connecting your wallet again.',
          code: 'PROPOSAL_EXPIRED',
          originalError: errorMessage,
          suggestion:
            'This can happen in embedded widgets. Try refreshing the page or connecting directly.',
        },
        '*'
      );

      // Reset auth state to allow retry
      setAuthAttempted(false);
      setWidgetState('connecting');
    } else if (
      errorMessage.includes('User rejected') ||
      errorMessage.includes('rejected')
    ) {
      // Handle user rejection
      trackEvent('wallet_connection_rejected', {
        error: errorMessage,
        partnerId: config.dataPartnerId,
      });

      setWidgetState('connecting');
      setAuthAttempted(false);
    } else {
      // Handle other wallet errors
      trackEvent('wallet_connection_error', {
        error: errorMessage,
        partnerId: config.dataPartnerId,
      });

      window.parent.postMessage(
        {
          type: 'valmira-wallet-error',
          error: errorMessage,
          code: 'CONNECTION_ERROR',
        },
        '*'
      );
    }
  };

  // Handle wallet disconnect
  const handleDisconnectWallet = () => {
    // Track disconnect event
    trackEvent('wallet_disconnected', {
      reason: 'user_initiated',
      previousWallet: user?.walletAddress,
    });

    // Disconnect wallet
    disconnect();

    // Reset authentication state
    setAuthAttempted(false);
    setWidgetState('connecting');

    // Send disconnect event to parent window
    window.parent.postMessage(
      {
        type: 'valmira-wallet-disconnected',
        partnerId: config.dataPartnerId,
        timestamp: Date.now(),
      },
      '*'
    );
  };

  // Enhanced error logging and monitoring with rate limiting
  const logError = (error: any, context: string) => {
    // Implement rate limiting for errors
    const errorKey = `${context}-${error.code || 'unknown'}`;
    const currentCount = eventCounts[errorKey] || 0;

    // Update error count
    setEventCounts((prev) => ({
      ...prev,
      [errorKey]: currentCount + 1,
    }));

    // Skip if we've exceeded the max count for this error type
    const maxErrorCount = 5; // Maximum number of same errors in a session
    if (currentCount >= maxErrorCount) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Error] Skipped logging ${errorKey} (rate limited)`);
      }
      return;
    }

    const errorData = {
      timestamp: new Date().toISOString(),
      partnerId: config.dataPartnerId,
      context,
      error: {
        code: error?.code || 'UNKNOWN_ERROR',
        message:
          error &&
          typeof error === 'object' &&
          error !== null &&
          'message' in error
            ? (error as any).message
            : 'An unknown error occurred',
        stack: error?.stack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      widgetState,
      user: user ? { id: user._id, address: user.walletAddress } : null,
    };

    // Log to console for development
    console.error('Widget error:', errorData);

    // Send to parent window
    window.parent.postMessage(
      {
        type: 'valmira-widget-error',
        ...errorData,
      },
      '*'
    );

    // Send to monitoring service (if configured)
    if (process.env.NODE_ENV === 'production') {
      // Add exponential backoff for repeated errors
      const apiCallDelay = Math.min(currentCount * 1000, 10000); // Exponential backoff up to 10s

      setTimeout(() => {
        fetch('/api/widget/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(() => {
          // Silently fail error reporting to avoid infinite loops
        });
      }, apiCallDelay);
    }
  };

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error ? event.error : { message: 'Global error' },
        },
        'global-error'
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(
        {
          message: 'Unhandled promise rejection',
          reason: event.reason ? event.reason : 'Unhandled rejection',
        },
        'unhandled-rejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [config.dataPartnerId, widgetState, user]);

  const renderWidgetContent = () => {
    switch (widgetState) {
      case 'connecting':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Wallet className="h-5 w-5" />
                Connect Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Connect your wallet to deploy market-making bots for your
                tokens.
              </p>
              <div className="flex justify-center border rounded-lg ">
                <WalletConnectionButton />
              </div>
            </CardContent>
          </Card>
        );

      case 'authenticating':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Authenticating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Please sign the message in your wallet to authenticate.
              </p>
              <div className="flex justify-center">
                <Button onClick={handleRetryAuth} variant="outline">
                  Retry Authentication
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="w-full max-w-md border-red-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Authentication Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {typeof authError === 'string'
                  ? authError
                  : (authError as any)?.message ||
                    'Failed to authenticate. Please try again.'}
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={handleRetryAuth}>Try Again</Button>
                <Button onClick={handleClose} variant="secondary">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'ready':
        return (
          <div className="w-full max-w-md mx-auto">
            {/* Wallet Status Card */}
            <Card className="mb-4">
              <CardContent className="p-4">
                {/* Header with status and close button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Wallet Connected</span>
                  </div>
                  <Button onClick={handleClose} variant="ghost" size="sm">
                    Close
                  </Button>
                </div>

                {/* Wallet Address */}
                <div className="text-sm text-muted-foreground mb-3 font-mono">
                  {user?.walletAddress?.slice(0, 6)}...
                  {user?.walletAddress?.slice(-4)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDisconnectWallet}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Change Wallet
                  </Button>
                  {!isDialogOpen && (
                    <Button
                      onClick={() => {
                        setIsDialogOpen(true);
                        // Fetch latest data to ensure validation works
                        console.log(
                          'Fetching latest projects/packs on dialog reopen'
                        );
                        dispatch(fetchPacks() as any);
                        dispatch(fetchProjects() as any);
                        trackEvent('dialog_reopened', {
                          reason: 'user_action',
                        });
                      }}
                      size="sm"
                      className="flex-1"
                      variant={'default'}
                    >
                      Deploy Strategy
                    </Button>
                  )}
                </div>

                {/* Status message when dialog is closed */}
                {!isDialogOpen && (
                  <div className="mt-3 text-xs text-muted-foreground text-center">
                    Ready to deploy market-making strategies
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strategy Deployment Dialog */}
            <MultiStepDialogAmbassador
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onDeploy={handleDialogAction}
              partnerId={config.dataPartnerId}
              detectedTokens={_detectedTokens}
              enableTokenValidation={true}
              onTokenValidation={handleTokenValidation}
              onTokenAddressChange={handleTokenAddressChange}
              tokenValidationStatus={tokenValidationStatus}
              tokenValidationError={tokenValidationError}
              validatedTokenInfo={validatedTokenInfo}
              strategyPresets={{
                ...strategyPresets,
                packConfigurations: globalPackParameters,
              }}
              onReset={() => {
                console.log('Resetting local created items');
                setLocalCreatedItems([]);
                initializeTokenValidation();
                setValidatedAddress('');
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main
      className="p-4 bg-transparent min-h-screen flex items-center justify-center"
      style={
        {
          '--primary': config.primaryColor,
          '--primary-foreground': '#ffffff',
        } as React.CSSProperties
      }
    >
      {renderWidgetContent()}
    </main>
  );
}
