// web.js – YEYESWAB DEX (Fix 100% Phantom Android & Desktop – Nov 2025)

let jupiter;
let connected = false;

// WALLET KAMU UNTUK TERIMA REFERRAL (SUDAH SAYA MASUKKAN)
const MY_WALLET = "FSqRLFnykDnCZ6mQdnn4GPPwNz6NEFYU7sHKmrrw1X5b";
const FEE_BPS = 85; // 0.85% referral fee

const FAST_RPC = "https://solana-rpc.tokodaring.com";

// Connect Wallet
async function connectWallet() {
  const provider = window.phantom?.solana || window.solana;

  if (!provider || !provider.isPhantom) {
    alert("Phantom tidak terdeteksi!\nInstall dulu: https://phantom.app");
    return;
  }

  try {
    const resp = await provider.connect({ onlyIfTrusted: false });
    const pubkey = resp.publicKey.toBase58();

    document.getElementById("connectWalletBtn").textContent =
      `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;

    updateBalance(pubkey);

    jupiter = await window.Jupiter.init({
      endpoint: FAST_RPC,
      formProps: { wallet: provider },
      feeBps: FEE_BPS,
      affiliateWallet: MY_WALLET,
      affiliateName: "yeyeswab"
    });

    connected = true;
    alert("YEYESWAB Connected! 🔥");
  } catch (err) {
    console.error(err);
    alert("Gagal connect: " + err.message);
  }
}

// Update balance
async function updateBalance(pubkey) {
  try {
    const { Connection, PublicKey } = window.solanaWeb3;
    const connection = new Connection(FAST_RPC);
    const balance = await connection.getBalance(new PublicKey(pubkey));

    document.querySelector('.balance').textContent =
      `Balance: ${(balance / 1e9).toFixed(4)} SOL`;
  } catch {
    document.querySelector('.balance').textContent = "Balance: --";
  }
}

// Button handlers
document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);

document.getElementById("swapBtn").addEventListener("click", () => {
  if (!connected || !jupiter) {
    alert("Connect wallet dulu bro!");
    return;
  }

  const amount = document.getElementById("payAmount").value;
  if (!amount || amount <= 0) {
    alert("Masukkan jumlah swap!");
    return;
  }

  jupiter.open({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: Math.floor(parseFloat(amount) * 1_000_000_000),
    slippageBps: 100
  });
});

// Load SDK
(async () => {
  if (!window.solanaWeb3) {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js";
    document.head.appendChild(s);
  }

  if (!window.Jupiter) {
    const j = document.createElement("script");
    j.src = "https://terminal.jup.ag/main/v1/sdk.js";
    j.onload = () => console.log("Jupiter SDK loaded");
    document.head.appendChild(j);
  }
})();
