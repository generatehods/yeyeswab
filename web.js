// web.js – Jupiter Terminal + Affiliate Fee (pendapatan masuk ke wallet kamu)
import { Jupiter } from "https://terminal.jup.ag/main/v1";

let jupiter;
let wallet;

// GANTI DENGAN WALLET SOLANA KAMU (Phantom / Solflare)
const MY_WALLET = "GANTI_DENGAN_WALLET_MU_DISINI"; // contoh: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"

// Fee yang masuk ke kamu (50 = 0.5%, 85 = 0.85%, max 100)
const FEE_BPS = 85;  // 0.85% — boleh naik-turunin sesuka hati

document.getElementById("connectWalletBtn").addEventListener("click", async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      await window.solana.connect();
      wallet = window.solana;
      document.getElementById("connectWalletBtn").textContent = 
        `\( {wallet.publicKey.toBase58().slice(0,4)}... \){wallet.publicKey.toBase58().slice(-4)}`;
      
      // Init Jupiter setelah wallet connect
      jupiter = await Jupiter.load({
        endpoint: "https://terminal.jup.ag",
        wallet: wallet,
        feeBps: FEE_BPS,
        affiliateWallet: MY_WALLET,
        affiliateName: "yeyeswab"
      });
      
      alert("Wallet connected! YEYESWAB siap dipakai 🔥");
    } catch (err) {
      alert("Gagal connect wallet");
    }
  } else {
    alert("Install Phantom wallet dulu ya bro!");
    window.open("https://phantom.app", "_blank");
  }
});

// Tombol Swap langsung pakai Jupiter Terminal (paling gampang)
document.getElementById("swapBtn").addEventListener("click", () => {
  if (!jupiter) {
    alert("Connect wallet dulu bro!");
    return;
  }

  // Buka Jupiter modal dengan token yang sudah dipilih user
  jupiter.openModal({
    inputMint: document.getElementById("payToken").textContent.trim() === "SOL" 
      ? "So11111111111111111111111111111111111111112" 
      : "", // tambah token lain nanti
    outputMint: document.getElementById("receiveToken").textContent.trim() === "USDC"
      ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      : "",
    amount: parseFloat(document.getElementById("payAmount").value || 0) * 1_000_000_000 // SOL → lamports
  });
});
