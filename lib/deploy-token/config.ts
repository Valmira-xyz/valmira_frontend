import MemeTemplateAbi from './abi/MemeTemplate.json';

export const isMainnet = true;

export const Config = {
  scanUrl: isMainnet ? 'https://bscscan.com/' : 'https://testnet.bscscan.com/',
  templates: ['Meme Template'],
  template2AbiMap: {
    0: MemeTemplateAbi,
  },
};

export const PANCAKESWAP_V2_ROUTER =
  '0x10ed43c718714eb63d5aa57b78b54704e256024e';

export const SOMNIA_TESTNET_DEX_ROUTER =
  '0xb1618E58Fa411b94da5247Bc0d808DB43f3629BE'; // With WSTT support

export const SOMNIA_TESTNET_DEX_FACTORY =
  '0x96eE1a0cb578AB2F8d7769c155D4A694d5845477';

export const SOMNIA_TESTNET_DEX_WSTT =
  '0x40722b4Eb73194eDB6cf518B94b022f1877b0811';
