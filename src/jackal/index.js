import testnetWalletConfig from "./testnet";
import mainnetWalletConfig from "./mainnet";

const selectedWallet = "keplr";

const walletConfig =
  import.meta.env.MODE === "production"
    ? mainnetWalletConfig
    : testnetWalletConfig;

walletConfig.selectedWallet = selectedWallet;

console.log({ walletConfig });

export default {
  walletConfig,
  isMainnet: walletConfig.chainConfig.chainId === "jackal-1",
};
