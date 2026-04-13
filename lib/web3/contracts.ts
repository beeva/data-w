export const SEPOLIA_CHAIN_ID = 11155111;

export const DATAW_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_DATAW_TOKEN_ADDRESS ||
  "0xd5578b2241cbD889334C92FB6DCc1a9c3009140a";

export type SupportedStableSymbol = "USDT" | "USDC";

export type StableTokenConfig = {
  symbol: SupportedStableSymbol;
  address: string;
  decimals: number;
  label: string;
};

function parseTokenAddress(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  // Ignore placeholder values like 0x123...abcd
  if (trimmed.includes("...")) return "";
  return trimmed;
}

export const STABLE_TOKENS: StableTokenConfig[] = [
  {
    symbol: "USDT",
    address: parseTokenAddress(process.env.NEXT_PUBLIC_USDT_ADDRESS),
    decimals: Number(process.env.NEXT_PUBLIC_USDT_DECIMALS || 6),
    label: "USDT (ERC-20)",
  },
  {
    symbol: "USDC",
    address: parseTokenAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS),
    decimals: Number(process.env.NEXT_PUBLIC_USDC_DECIMALS || 6),
    label: "USDC (ERC-20)",
  },
];

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

// Minimal ABI fragment needed for balance display
export const DATAW_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;
