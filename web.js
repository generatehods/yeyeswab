// web.js – Fixed Jupiter Terminal v2 + Phantom Connect (November 2025 Update)
import { Wallet, JupiterProvider } from 'https://terminal.jup.ag/main/v1/sdk.js';  // v2 modular import

let jupiter;
let wallet;
let connected = false;

// GANTI DENGAN WALLET SOLANA KAMU UNTUK FEE REFERRAL
const MY_WALLET = "GANTI_DENGAN_WALLET_MU_DISINI";  // Contoh: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
const FEE_BPS = 85;  // 0.85% fee ke kamu per swap

// Fungsi connect wallet yang lebih robust
async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    alert("Phantom wallet gak terdeteksi! Install/update Phantom app/extension dulu ya bro. Download: https://phantom.app");
    window.open("https://phantom.app", "_blank");
    return;
  }

  try {
    // Request connection dengan timeout
    const resp = await window.solana.connect({ onlyIfTrusted: false });
    wallet = window.solana;
    const pubkey = resp.publicKey.toBase58();
    document.getElementById("connectWalletBtn").textContent = 
      `\( {pubkey.slice(0,4)}... \){pubkey.slice(-4)}`;
    
    // Update balance display (opsional, pakai Jupiter API)
    updateBalance(pubkey);
    
    // Init Jupiter v2 setelah connect sukses
    jupiter = await JupiterProvider.init({
      endpoint: 'https://mainnet.helius-rpc.com/?api-key=your-free-key-if-needed',  // Atau pakai public RPC
      platform: 'unknown',  // Untuk custom DEX
      wallets: [new Wallet('Phantom', window.solana)],  // Explicit Phantom
      config: {
        feeBps: FEE_BPS,
        affiliateWallet: MY_WALLET,
        affiliateName: 'yeyeswab-dex'
      }
    });

    connected = true;
    alert("✅ Wallet connected! YEYESWAB siap swap via Jupiter. Coba klik Swap sekarang!");
    
  } catch (err) {
    console.error('Connect error:', err);  // Untuk debug
    alert(`Gagal connect: ${err.message}. Coba refresh halaman atau check Phantom settings (allow sites).`);
  }
}

// Update balance sederhana (pakai Solana web3.js)
async function updateBalance(pubkey) {
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const balance = await connection.getBalance(new PublicKey(pubkey));
    document.querySelector('.balance').textContent = `Balance: ${(balance / 1e9).toFixed(2)} SOL`;
  } catch (err) {
    document.querySelector('.balance').textContent = 'Balance: Loading...';
  }
}

// Event listener untuk tombol connect
document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);

// Event listener untuk tombol swap
document.getElementById("swapBtn").addEventListener("click", async () => {
  if (!connected || !jupiter) {
    alert("Connect wallet dulu bro! Kalau masih error, coba langkah troubleshoot di bawah.");
    return;
  }

  const amount = parseFloat(document.getElementById("payAmount").value || 0);
  if (amount <= 0) {
    alert("Masukin amount dulu!");
    return;
  }

  try {
    // Buka Jupiter swap modal dengan input user
    const { executeSwap } = await import('https://terminal.jup.ag/main/v1/sdk.js');
    await executeSwap({
      jupiter: jupiter,
      inputMint: 'So11111111111111111111111111111111111111112',  // SOL wrapped
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
      amount: Math.floor(amount * 1_000_000_000),  // Convert to lamports
      slippageBps: 50,  // 0.5% slippage tolerance
      wallet  // Pass wallet
    });
  } catch (err) {
    alert(`Swap error: ${err.message}. Coba kurangin amount atau check network.`);
  }
});

// Auto-detect Phantom on load (bonus)
window.addEventListener('load', () => {
  if (window.solana && window.solana.isPhantom && window.solana.isConnected) {
    connectWallet();  // Auto-connect kalau udah trusted
  }
});
