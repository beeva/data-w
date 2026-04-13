import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  getAddress,
  isAddress,
} from "ethers";
import {
  DATAW_TOKEN_ABI,
  DATAW_TOKEN_ADDRESS,
  ERC20_ABI,
  SEPOLIA_CHAIN_ID,
} from "@/lib/web3/contracts";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

export const METAMASK_INSTALL_URL =
  "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn";

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).ethereum);
}

export function openMetaMaskInstallPage(): void {
  if (typeof window === "undefined") return;
  window.open(METAMASK_INSTALL_URL, "_blank", "noopener,noreferrer");
}

function getInjectedProvider(): EthereumProvider {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed in this browser");
  }
  return (window as any).ethereum as EthereumProvider;
}

export async function connectMetaMask(): Promise<string> {
  const injected = getInjectedProvider();
  const accounts = (await injected.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts?.[0]) {
    throw new Error("No wallet account returned by MetaMask");
  }
  return getAddress(accounts[0]);
}

export async function ensureSepoliaNetwork(): Promise<void> {
  const injected = getInjectedProvider();
  const chainIdHex = `0x${SEPOLIA_CHAIN_ID.toString(16)}`;

  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: any) {
    // 4902: Chain not added to wallet
    if (err?.code === 4902) {
      await injected.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: "Sepolia",
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

async function getBrowserProvider(): Promise<BrowserProvider> {
  const injected = getInjectedProvider();
  return new BrowserProvider(injected as any);
}

export async function getDatawBalance(address: string): Promise<number> {
  if (!isAddress(address)) {
    throw new Error("Invalid wallet address");
  }
  const provider = await getBrowserProvider();
  const token = new Contract(getAddress(DATAW_TOKEN_ADDRESS), DATAW_TOKEN_ABI, provider);

  const [raw, decimals] = await Promise.all([
    token.balanceOf(address),
    token.decimals(),
  ]);

  return Number(formatUnits(raw, Number(decimals)));
}

export async function getErc20Balance(
  tokenAddress: string,
  ownerAddress: string,
  decimals: number,
): Promise<number> {
  if (!isAddress(tokenAddress)) {
    throw new Error("Invalid token address");
  }
  if (!isAddress(ownerAddress)) {
    throw new Error("Invalid owner address");
  }
  const provider = await getBrowserProvider();
  const token = new Contract(getAddress(tokenAddress), ERC20_ABI, provider);
  const raw = await token.balanceOf(ownerAddress);
  return Number(formatUnits(raw, decimals));
}
