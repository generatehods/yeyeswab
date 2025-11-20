import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js";

// --- CONFIG MAINNET ---
const connection = new Connection("https://api.mainnet-beta.solana.com");

// DOM ELEMENTS
const connectBtn = document.getElementById("connectWalletBtn");
const balanceEl = document.querySelector(".balance");

let walletPublicKey = null;

// --- HELPER FUNCTION TO GET SOL BALANCE ---
async function getSolBalance(pubkey) {
  const balanceLamports = await connection.getBalance(pubkey);
  const balanceSOL = balanceLamports / 1e9;
  return balanceSOL.toFixed(4);
}

// --- CONNECT PHANTOM WALLET ---
async function connectWallet() {
  try {
    if (!window.solana) {
      alert("Please install Phantom wallet!");
      return;
    }

    const resp = await window.solana.connect();
    walletPublicKey = resp.publicKey;
    connectBtn.innerText = walletPublicKey.toString().slice(0, 4) + "..." + walletPublicKey.toString().slice(-4);

    // load balance
    const solBal = await getSolBalance(walletPublicKey);
    balanceEl.innerText = `Balance: ${solBal} SOL`;

    // Optional: auto-refresh every 10s
    setInterval(async () => {
      const solBal = await getSolBalance(walletPublicKey);
      balanceEl.innerText = `Balance: ${solBal} SOL`;
    }, 10000);

  } catch (err) {
    console.error("Wallet connect failed", err);
  }
}

// --- DISCONNECT (Optional) ---
async function disconnectWallet() {
  try {
    if (window.solana && window.solana.isConnected) {
      await window.solana.disconnect();
      walletPublicKey = null;
      connectBtn.innerText = "Connect Wallet";
      balanceEl.innerText = `Balance: 0.00`;
    }
  } catch (err) {
    console.error("Disconnect failed", err);
  }
}

// --- EVENT LISTENER ---
connectBtn.addEventListener("click", async () => {
  if (!walletPublicKey) {
    await connectWallet();
  } else {
    await disconnectWallet();
  }
});
