'use client';

import { useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import ProjectFeeModal from '@/components/fee-management/project-fee-dialog';
import { AddressDisplay } from '@/components/ui/address-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
  FeeCollectionResponse,
  FeeConfig,
  feeService,
  GlobalFeeConfig,
  ProjectFeeSummary,
} from '@/services/feeService';

export default function FeeManagement() {
  const [globalFees, setGlobalFees] = useState<GlobalFeeConfig | null>(null);
  const [projectFees, setProjectFees] = useState<ProjectFeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectFeeSummary | null>(null);
  const [selectedProjectFee, setSelectedProjectFee] =
    useState<FeeConfig | null>(null);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);

  // Fee collection state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [targetAdminWallet, setTargetAdminWallet] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('BSC_MAINNET');
  const [collecting, setCollecting] = useState(false);
  const [collectionResults, setCollectionResults] =
    useState<FeeCollectionResponse | null>(null);

  // const [fees, setFees] = useState({
  //   projectSetupFee: 0,
  //   dailyBotFee: 0,
  //   liquidationBotProfitPercentage: 0,
  //   volumeBotPercentage: 0,
  //   bundleSnipePercentage: 0,
  //   distributionBotPercentage: 0,
  //   bundleSnipeExecutionFee: 0,
  //   distributionWalletFee: 0,
  //   dailyFeeCap: 0,
  //   monthlyFeeCap: 0,
  //   liquidationProfitMinimum: 0,
  //   isActive: true,
  // });

  useEffect(() => {
    fetchGlobalFees();
    fetchProjectFees();
  }, []);

  const fetchGlobalFees = async () => {
    try {
      const data = await feeService.getGlobalFees();
      setGlobalFees(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch global fees',
        variant: 'destructive',
      });
    }
  };

  const fetchProjectFees = async (page = currentPage, size = pageSize) => {
    try {
      const response = await feeService.getAllProjectFees(page, size);
      setProjectFees(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalProjects(response.pagination.totalCount);
      setCurrentPage(response.pagination.pageIndex);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch project fees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalFeeChange = (field: keyof GlobalFeeConfig, value: any) => {
    if (!globalFees) return;

    setGlobalFees((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  const handleSaveGlobalFees = async () => {
    if (!globalFees) return;

    try {
      setSaving(true);
      await feeService.updateGlobalFees(globalFees);
      toast({
        title: 'Success',
        description: 'Global fees updated successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update global fees',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProjectFeeEdit = async (project: ProjectFeeSummary) => {
    try {
      const feeConfig = await feeService.getFeeConfig(project.projectId);
      setSelectedProject(project);
      setSelectedProjectFee(feeConfig);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch project fee configuration',
        variant: 'destructive',
      });
    }
  };

  const handleProjectFeeSave = async (updatedFee: FeeConfig) => {
    if (!selectedProject) return;

    try {
      await feeService.updateFeeConfig(selectedProject.projectId, updatedFee);
      toast({
        title: 'Success',
        description: 'Project fees updated successfully',
      });
      fetchProjectFees(); // Refresh the project fees list
      setSelectedProject(null);
      setSelectedProjectFee(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update project fees',
        variant: 'destructive',
      });
    }
  };

  // Fee collection handlers
  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    } else {
      setSelectedProjectIds(
        selectedProjectIds.filter((id) => id !== projectId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select only projects from the selected chain
      const chainProjects = projectFees
        .filter((project) => project.chainName === selectedChain)
        .map((project) => project.projectId);
      setSelectedProjectIds(chainProjects);
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleCollectFees = async () => {
    if (!targetAdminWallet || selectedProjectIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter target wallet and select projects',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCollecting(true);

      // Start the collection job
      const jobResponse = await feeService.startFeeCollection(
        targetAdminWallet,
        selectedProjectIds,
        selectedChain
      );

      const jobId = jobResponse.data.jobId;

      // Show immediate feedback
      toast({
        title: 'Fee Collection Started',
        description: `Job ${jobId} started. Expected duration: ${jobResponse.data.expectedDuration}`,
      });

      // Poll for completion with progress updates
      const pollForResults = async () => {
        const maxWaitTime = 20 * 60 * 1000; // 20 minutes
        const pollInterval = 3000; // 3 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
          try {
            const statusResponse =
              await feeService.getFeeCollectionJobStatus(jobId);
            const status = statusResponse.data.status;

            if (status === 'completed') {
              if (statusResponse.data.results) {
                setCollectionResults(statusResponse.data.results);
                toast({
                  title: 'Success',
                  description: `Fee collection completed! Collected $${statusResponse.data.results.summary.totalUsdCollected.toFixed(2)} from ${statusResponse.data.results.summary.successfulCollections} wallets`,
                });

                // Reset selection after successful collection
                setSelectedProjectIds([]);
                setTargetAdminWallet('');
                return;
              } else {
                throw new Error('Job completed but no results available');
              }
            } else if (status === 'failed') {
              throw new Error(
                statusResponse.data.error || 'Fee collection failed'
              );
            }

            // Update progress
            if (status === 'processing') {
              const duration = Math.floor(
                (Date.now() - statusResponse.data.startTime) / 1000
              );
              toast({
                title: 'Processing...',
                description: `Fee collection in progress... (${duration}s)`,
              });
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
          } catch (error) {
            console.error('Error polling for job completion:', error);
            throw error;
          }
        }

        throw new Error('Fee collection timed out after 20 minutes');
      };

      await pollForResults();
    } catch (error: any) {
      console.error('Fee collection error:', error);
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ||
          error.message ||
          'Failed to collect fees',
        variant: 'destructive',
      });
    } finally {
      setCollecting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProjectFees(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
    fetchProjectFees(0, size);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Fee Management</h1>

      {/* Global Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Fee Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Setup Fee</Label>
              <Input
                type="number"
                value={globalFees?.projectSetupFee || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'projectSetupFee',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Daily Bot Fee</Label>
              <Input
                type="number"
                value={globalFees?.dailyBotFee || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'dailyBotFee',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Liquidation Bot Profit Percentage</Label>
              <Input
                type="number"
                value={globalFees?.liquidationBotProfitPercentage || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'liquidationBotProfitPercentage',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Volume Bot Percentage</Label>
              <Input
                type="number"
                value={globalFees?.volumeBotPercentage || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'volumeBotPercentage',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bundle Snipe Percentage</Label>
              <Input
                type="number"
                value={globalFees?.bundleSnipePercentage || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'bundleSnipePercentage',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Distribution Bot Percentage</Label>
              <Input
                type="number"
                value={globalFees?.distributionBotPercentage || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'distributionBotPercentage',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bundle Snipe Execution Fee</Label>
              <Input
                type="number"
                value={globalFees?.bundleSnipeExecutionFee || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'bundleSnipeExecutionFee',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Distribution Wallet Fee</Label>
              <Input
                type="number"
                value={globalFees?.distributionWalletFee || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'distributionWalletFee',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            {/* <div className="space-y-2">
              <Label>Daily Fee Cap</Label>
              <Input
                type="number"
                value={globalFees?.dailyFeeCap || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'dailyFeeCap',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Fee Cap</Label>
              <Input
                type="number"
                value={globalFees?.monthlyFeeCap || 0}
                onChange={(e) =>
                  handleGlobalFeeChange(
                    'monthlyFeeCap',
                    parseFloat(e.target.value)
                  )
                }
              />
            </div> */}
            <Button
              onClick={handleSaveGlobalFees}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Global Fees'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Collection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Fee Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Admin Wallet</Label>
                <Input
                  placeholder="0x..."
                  value={targetAdminWallet}
                  onChange={(e) => setTargetAdminWallet(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Chain</Label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BSC_MAINNET">BSC Mainnet</SelectItem>
                    <SelectItem value="ETH_MAINNET">
                      Ethereum Mainnet
                    </SelectItem>
                    <SelectItem value="SOMNIA_TESTNET">
                      Somnia Testnet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedProjectIds.length} project(s) selected for collection
              </span>
              <Button
                onClick={() => setShowCollectionDialog(true)}
                disabled={selectedProjectIds.length === 0 || !targetAdminWallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Collect Fees
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Fee Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project Fee Settings</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="pageSize">Page Size:</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={
                  selectedProjectIds.length ===
                    projectFees.filter((p) => p.chainName === selectedChain)
                      .length &&
                  projectFees.filter((p) => p.chainName === selectedChain)
                    .length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="text-sm">
                Select all projects on{' '}
                {selectedChain === 'BSC_MAINNET'
                  ? 'Binance Smart Chain'
                  : selectedChain === 'ETH_MAINNET'
                    ? 'Ethereum'
                    : selectedChain === 'SOMNIA_TESTNET'
                      ? 'Somnia Testnet'
                      : selectedChain}
              </Label>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Token Name</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Token Address</TableHead>
                  <TableHead>Fee Wallet Address</TableHead>
                  <TableHead>Custom Fee Applied</TableHead>
                  <TableHead>Active Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectFees.map((project) => (
                  <TableRow key={project.projectId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProjectIds.includes(project.projectId)}
                        onCheckedChange={(checked) =>
                          handleProjectSelection(
                            project.projectId,
                            checked as boolean
                          )
                        }
                        disabled={project.chainName !== selectedChain}
                      />
                    </TableCell>
                    <TableCell>{project.tokenName}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          project.chainName === 'BSC_MAINNET'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.chainName === 'ETH_MAINNET'
                              ? 'bg-blue-100 text-blue-800'
                              : project.chainName === 'SOMNIA_TESTNET'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.chainName === 'BSC_MAINNET'
                          ? 'BSC'
                          : project.chainName === 'ETH_MAINNET'
                            ? 'ETH'
                            : project.chainName === 'SOMNIA_TESTNET'
                              ? 'SOMNIA'
                              : project.chainName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AddressDisplay
                        address={project.tokenAddress}
                        displayLength={8}
                        addressType="token"
                        chainName={project.chainName}
                        className="justify-start"
                      />
                    </TableCell>
                    <TableCell>
                      <AddressDisplay
                        address={project.feeWalletAddress}
                        displayLength={8}
                        addressType="address"
                        chainName={project.chainName}
                        className="justify-start"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={project.hasCustomFees} disabled={true} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={project.isActive} disabled={true} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProjectFeeEdit(project)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {currentPage * pageSize + 1} to{' '}
                {Math.min((currentPage + 1) * pageSize, totalProjects)} of{' '}
                {totalProjects} projects
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Collection Confirmation Dialog */}
      <Dialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Fee Collection</DialogTitle>
            <DialogDescription>
              You are about to collect fees from {selectedProjectIds.length}{' '}
              project(s) on{' '}
              {selectedChain === 'BSC_MAINNET'
                ? 'Binance Smart Chain'
                : selectedChain === 'ETH_MAINNET'
                  ? 'Ethereum'
                  : selectedChain === 'SOMNIA_TESTNET'
                    ? 'Somnia Testnet'
                    : selectedChain}{' '}
              to the admin wallet:
              <br />
              <code className="px-2 py-2 rounded mt-2 block text-green-400">
                {targetAdminWallet}
              </code>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCollectionDialog(false)}
              disabled={collecting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowCollectionDialog(false);
                handleCollectFees();
              }}
              disabled={collecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {collecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Collecting...
                </>
              ) : (
                'Confirm Collection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collection Results Dialog */}
      {collectionResults && (
        <Dialog
          open={!!collectionResults}
          onOpenChange={() => setCollectionResults(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Fee Collection Results</DialogTitle>
              <DialogDescription>Collection completed</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Successful</div>
                  <div className="text-2xl font-bold text-green-700">
                    {collectionResults.summary.successfulCollections}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">Failed</div>
                  <div className="text-2xl font-bold text-red-700">
                    {collectionResults.summary.failedCollections}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Total USD</div>
                  <div className="text-2xl font-bold text-blue-700">
                    ${collectionResults.summary.totalUsdCollected.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Total Wallets</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {collectionResults.summary.totalWallets}
                  </div>
                </div>
              </div>

              {/* Results by Project */}
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Successful</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>USD Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionResults.resultsByProject.map((project) => (
                      <TableRow key={project.projectId}>
                        <TableCell className="font-mono text-sm">
                          {project.projectId}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {project.successCount}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {project.failCount}
                        </TableCell>
                        <TableCell className="font-bold">
                          ${project.totalUsdValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCollectionResults(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Project Fee Dialog */}
      {selectedProject && selectedProjectFee && (
        <ProjectFeeModal
          isOpen={!!selectedProject}
          onClose={() => {
            setSelectedProject(null);
            setSelectedProjectFee(null);
          }}
          projectFee={selectedProjectFee}
          onSave={handleProjectFeeSave}
        />
      )}
    </div>
  );
}
