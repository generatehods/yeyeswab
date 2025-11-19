// web.js - FIXED FOR GITHUB PAGES + PHANTOM MOBILE
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js";

// ---- SAFE RPC FOR BROWSER ----
const RPC_PRIMARY =
  "https://mainnet.helius-rpc.com/?api-key=fa9ea42b-0cc0-4ab9-bc5f-384d219ab5d9";

const RPC_FALLBACK = "https://rpc.hellomoon.io";

let connection = new Connection(RPC_PRIMARY, "confirmed");

async function ensureConnection() {
  try {
    await connection.getEpochInfo();
  } catch (e) {
    console.warn("Switching RPC → fallback");
    connection = new Connection(RPC_FALLBACK, "confirmed");
  }
}

// ---- DOM ----
const connectBtn = document.getElementById("connectBtn");
const walletAddressEl = document.getElementById("walletAddress");
const balanceSOLEl = document.getElementById("balanceSOL");
const balanceTokenEl = document.getElementById("balanceToken");
const tokenMintInput = document.getElementById("tokenMint");
const detectBtn = document.getElementById("detectBtn");
const tokenInfoEl = document.getElementById("tokenInfo");
const statusBox = document.getElementById("status");
const swapBtn = document.getElementById("swapBtn");

let provider = null;
let connectedPubkey = null;

function setStatus(t) {
  if (statusBox) statusBox.innerText = t || "";
}
function set(el, t) {
  if (el) el.innerText = t;
}

// ---- Phantom Detection ----
function getPhantom() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

// ---- Load SOL ----
async function loadSolBalance(pubkey) {
  try {
    await ensureConnection();
    set(balanceSOLEl, "SOL: loading...");
    const lamports = await connection.getBalance(new PublicKey(pubkey));
    const sol = (lamports / 1e9).toFixed(6);
    set(balanceSOLEl, `SOL: ${sol}`);
  } catch (e) {
    console.error(e);
    set(balanceSOLEl, "SOL: error");
  }
}

// ---- Load Token ----
async function loadTokenBalance(pubkey, mint) {
  try {
    if (!mint) return set(balanceTokenEl, "Token: -");
    await ensureConnection();
    set(balanceTokenEl, "Token: loading...");

    const resp = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(pubkey),
      { mint: new PublicKey(mint) }
    );

    if (!resp.value.length) return set(balanceTokenEl, "Token:
