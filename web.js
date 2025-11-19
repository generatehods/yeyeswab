import {
  Connection,
  PublicKey
} from "https://esm.sh/@solana/web3.js";

// ---- MAINNET CONNECTION ----
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// ---- DOM ELEMENTS ----
const connectBtn = document.getElementById("connectBtn");
const walletAddress = document.getElementById("walletAddress");
const balanceSOL = document.getElementById("balanceSOL");
const balanceToken = document.getElementById("balanceToken");
const tokenMintInput = document.getElementById("tokenMint");
const tokenInfo = document.getElementById("tokenInfo");
const detectBtn = document.getElementById("detectBtn");
const swapBtn = document.getElementById("swapBtn");
const statusBox = document.getElementById("status");

let connectedKey = null;
let provider = null;

// helper: safe set text
function setText(el, text) {
  if (!el) return;
  el.innerText = text;
}

// wait until page fully loaded (extra safety)
window.addEventListener("load", () => {
  // attach listeners (if not already attached)
  connectBtn && (connectBtn.onclick = handleConnect);
  detectBtn && (detectBtn.onclick = handleDetect);
  swapBtn && (swapBtn.onclick = handleSwap);

  // optional: update balances when user types a mint and presses Enter
  tokenMintInput && tokenMintInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleDetect();
  });
});

// ------------------------------------------------------
// CONNECT WALLET
// ------------------------------------------------------
async function handleConnect() {
  try {
    provider = window.phantom?.solana;
    if (!provider) {
      alert("Phantom not installed! Please install Phantom Wallet on your device.");
      return;
    }

    // connect
    const resp = await provider.connect();
    connectedKey = new PublicKey(resp.publicKey.toString());

    setText(walletAddress, `Connected: ${connectedKey.toString()}`);

    // attach disconnect listener
    provider.on && provider.on("disconnect", () => {
      connectedKey = null;
      setText(walletAddress, "Not connected");
      setText(balanceSOL, "SOL: 0");
      setText(balanceToken, "Token: 0");
    });

    // load SOL balance
    const solBal = await loadSolBalance(connectedKey);
    setText(balanceSOL, `SOL: ${solBal}`);

    // if token mint is present, load token balance
    const mint = tokenMintInput.value.trim();
    if (mint.length > 0) {
      const tokenBal = await loadSplBalance(connectedKey, mint);
      setText(balanceToken, `Token: ${tokenBal}`);
    }

    setText(statusBox, "Wallet connected.");
  } catch (err) {
    console.error("connect error:", err);
    alert("Wallet connection failed. Check console for details.");
    setText(statusBox, "Connection failed.");
  }
}

// ------------------------------------------------------
// LOAD SOL BALANCE
// ------------------------------------------------------
async function loadSolBalance(pubkey) {
  try {
    const lamports = await connection.getBalance(pubkey);
    return (lamports / 1e9).toFixed(4);
  } catch (err) {
    console.error("loadSolBalance error", err);
    return "0";
  }
}

// ------------------------------------------------------
// LOAD SPL TOKEN BALANCE
// ------------------------------------------------------
async function loadSplBalance(pubkey, mintAddress) {
  try {
    const mint = new PublicKey(mintAddress);

    // get token accounts for owner filtered by mint
    const resp = await connection.getParsedTokenAccountsByOwner(pubkey, { mint });

    if (!resp || resp.value.length === 0) return 0;

    // find largest or first
    const info = resp.value[0].account.data.parsed.info;
    return info.tokenAmount.uiAmount ?? info.tokenAmount.amount ?? 0;
  } catch (err) {
    console.error("loadSplBalance error", err);
    return 0;
  }
}

// ------------------------------------------------------
// DETECT TOKEN INFO
// ------------------------------------------------------
async function handleDetect() {
  const mint = tokenMintInput.value.trim();

  if (!mint) {
    setText(tokenInfo, "Please input token mint");
    return;
  }

  setText(tokenInfo, "Detecting token...");
  setText(statusBox, "");

  try {
    const mintPk = new PublicKey(mint);
    const parsed = await connection.getParsedAccountInfo(mintPk);

    if (!parsed || !parsed.value) {
      setText(tokenInfo, "Invalid token mint or not found on-chain.");
      return;
    }

    // parsed.value.data may be an object with parsed info (for mint it depends)
    let info = parsed.value.data?.parsed?.info ?? null;

    // fallback: try to read some basic fields from the account
    let decimals = info?.decimals ?? (parsed.value?.data?.parsed?.info?.decimals ?? "unknown");
    let supply = info?.supply ?? "unknown";

    // build display (best-effort)
    const out = [];
    out.push(`Decimals: ${decimals}`);
    out.push(`Supply: ${supply}`);

    // try to show mint owner / authority if present
    if (info?.mintAuthority) out.push(`Mint Authority: ${info.mintAuthority}`);
    if (info?.freezeAuthority) out.push(`Freeze Authority: ${info.freezeAuthority}`);

    setText(tokenInfo, out.join(" | "));

    // auto load token balance if wallet connected
    if (connectedKey) {
      const bal = await loadSplBalance(connectedKey, mint);
      setText(balanceToken, `Token: ${bal}`);
    }

    setText(statusBox, "Token detection complete.");
  } catch (err) {
    console.error("detect error:", err);
    setText(tokenInfo, "Token detection error. Check console.");
    setText(statusBox, "Token detection failed.");
  }
}

// ------------------------------------------------------
// SWAP BUTTON (placeholder -> integrate Jupiter)
 // ------------------------------------------------------
async function handleSwap() {
  setText(statusBox, "Swap function not yet implemented. Integrate Jupiter API here.");
  // future: call Jupiter REST endpoints, sign transactions with provider.signTransaction, send, confirm
}
