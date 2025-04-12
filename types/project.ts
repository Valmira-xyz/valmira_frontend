export interface Project {
  _id: string;
  name: string;
  symbol?: string;
  tokenAddress: string;
  addons: {
    AutoSellBot?: {
      _id?: string;
      isEnabled?: boolean;
      status?: string;
      depositWalletId: {
        _id: string;
        publicKey: string;
      };
      subWalletIds: {
        role: string;
        _id: string;
        publicKey: string;
      }[];
    };
    SnipeBot?: {
      _id: string;
      subWalletIds: {
        _id: string;
        publicKey: string;
      }[];
      depositWalletId?: {
        _id: string;
        publicKey: string;
      };
    };
  };
}

export type ProjectWithAddons = Project;
