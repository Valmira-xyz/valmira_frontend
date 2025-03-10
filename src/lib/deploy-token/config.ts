import MemeTemplateAbi from "./abi/MemeTemplate.json";

export const isMainnet = true;

export const Config = {
  scanUrl: isMainnet ? "https://bscscan.com/" : "https://testnet.bscscan.com/",
  templates: [
    "Meme Template",
  ],
  template2AbiMap: {
    0: MemeTemplateAbi
  }
};

export const PANCAKESWAP_V2_ROUTER = "0x10ed43c718714eb63d5aa57b78b54704e256024e"
