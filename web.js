import { Connection, PublicKey, VersionedTransaction } from "https://esm.sh/@solana/web3.js";

// --- CONFIG MAINNET ---
const connection = new Connection("https://api.mainnet-beta.solana.com");

// DOM
const connectBtn = document.getElementById("connectWalletBtn");
const payAmountEl = document.getElementById("payAmount");
const receiveAmountEl = document.getElementById("receiveAmount");
const payTokenEl = document.getElementById("payToken");
const receiveTokenEl = document.getElementById("receiveToken");
const swapBtn = document.getElementById("swapBtn");
const balanceEl = document.querySelector(".balance");

// SPL Token Example: USDC Mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AuHj4cA4C1QJDZ2sRfjMTFqonF9xS1k2s4");

// Wallet state
let walletPublicKey = null;

// --- UTILITIES ---
function showLoading(isLoading) {
  if (isLoading) {
    swapBtn.innerText = "Swapping...";
    swapBtn.disabled = true;
  } else {
    swapBtn.innerText = "Swap";
    swapBtn.disabled = false;
  }
}

// --- LOAD BALANCES ---
async function loadBalances() {
  if (!walletPublicKey) return;
  try {
    const lamports = await connection.getBalance(walletPublicKey);
    const sol = lamports / 1e9;
    balanceEl.innerText = `Balance: ${sol.toFixed(4)} SOL`;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, { mint: USDC_MINT });
    let usdc = 0.0;
    if (tokenAccounts.value.length > 0) {
      usdc = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }
    receiveAmountEl.value = usdc.toFixed(6);
  } catch (err) {
    console.error("Load balance error:", err);
  }
}

// --- CONNECT WALLET ---
connectBtn.addEventListener("click", async () => {
  try {
    const resp = await window.solana.connect();
    walletPublicKey = resp.publicKey;
    connectBtn.innerText = walletPublicKey.toString().slice(0,4) + "..." + walletPublicKey.toString().slice(-4);
    await loadBalances();
  } catch (err) {
    console.error("Connect wallet failed:", err);
    alert("Failed to connect wallet");
  }
});

// --- GET QUOTE FROM JUPITER ---
async function getJupiterQuote(inputMint, outputMint, amountLamports, slippageBps = 50) {
  const endpoint = "https://quote-api.jup.ag/v4/quote";
  const params = new URLSearchParams({
    inputMint: inputMint.toString(),
    outputMint: outputMint.toString(),
    amount: amountLamports.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false"
  });

  const res = await fetch(`${endpoint}?${params.toString()}`);
  const data = await res.json();
  if (!data.data || data.data.length === 0) throw new Error("No route found");
  return data.data[0]; // ambil route pertama
}

// --- GET SWAP TRANSACTION ---
async function getSwapTransaction(route, userPublicKey) {
  const endpoint = "https://quote-api.jup.ag/v4/swap";
  const body = { route: route, userPublicKey: userPublicKey.toString() };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.transaction) throw new Error("Swap transaction not found");
  return data.transaction;
}

// --- SWAP FUNCTION ---
async function doSwap() {
  if (!walletPublicKey) {
    alert("Connect wallet first!");
    return;
  }

  const payAmount = parseFloat(payAmountEl.value);
  if (!payAmount || payAmount <= 0) {
    alert("Enter valid amount");
    return;
  }

  let inputMint = payTokenEl.innerText.startsWith("SOL")
    ? new PublicKey("So11111111111111111111111111111111111111112")
    : USDC_MINT;

  let outputMint = receiveTokenEl.innerText.startsWith("USDC")
    ? USDC_MINT
    : new PublicKey("So11111111111111111111111111111111111111112");

  // Convert amount
  let amountLamports = inputMint.equals(new PublicKey("So11111111111111111111111111111111111111112"))
    ? payAmount * 1e9
    : Math.round(payAmount * 1e6); // USDC 6 decimals

  try {
    showLoading(true);

    // 1. Get quote
    const route = await getJupiterQuote(inputMint, outputMint, amountLamports);

    // 2. Get swap transaction
    const txBase64 = await getSwapTransaction(route, walletPublicKey);

    // 3. Deserialize
    const txBuffer = Buffer.from(txBase64, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // 4. Sign transaction
    const signed = await window.solana.signTransaction(transaction);

    // 5. Send transaction
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, "confirmed");

    alert("Swap sukses! Sig: " + sig);

    // Reload balances
    await loadBalances();

  } catch (err) {
    console.error("Swap error:", err);
    alert("Swap gagal: " + err.message);
  } finally {
    showLoading(false);
  }
}

// --- EVENT LISTENER SWAP ---
swapBtn.addEventListener("click", doSwap);

// --- OPTIONAL: Switch tokens (⇅) ---
document.querySelector(".switch-btn").addEventListener("click", () => {
  // Swap token names
  let temp = payTokenEl.innerText;
  payTokenEl.innerText = receiveTokenEl.innerText;
  receiveTokenEl.innerText = temp;

  // Swap input values
  let tempVal = payAmountEl.value;
  payAmountEl.value = receiveAmountEl.value;
  receiveAmountEl.value = tempVal;
});
