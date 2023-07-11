import testnetWalletConfig from "./testnet";
import mainnetWalletConfig from "./mainnet";

const selectedWallet = "keplr";

const walletConfig =
  import.meta.env.MODE === "production"
    ? mainnetWalletConfig
    : testnetWalletConfig;

walletConfig.selectedWallet = selectedWallet;

export default {
  walletConfig,
};
