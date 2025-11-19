import tokenList from "./tokenlist.json" assert { type: "json" };

let provider = null;
let publicKey = null;

// Detect Phantom
function getProvider() {
  if ("phantom" in window) {
    const prov = window.phantom?.solana;
    if (prov?.isPhantom) return prov;
  }
  return null;
}

provider = getProvider();

// Connect Wallet
document.getElementById("connectBtn").onclick = async () => {
  try {
    const resp = await provider.connect();
    publicKey = resp.publicKey.toString();
    document.getElementById("walletAddress").innerText = publicKey;
  } catch (e) {
    console.log("Wallet connection failed", e);
  }
};

// Load Token Dropdowns
const fromSel = document.getElementById("fromToken");
const toSel = document.getElementById("toToken");

tokenList.forEach(t => {
  fromSel.innerHTML += `<option value="${t.address}">${t.symbol}</option>`;
  toSel.innerHTML += `<option value="${t.address}">${t.symbol}</option>`;
});

// Get Quote (Jupiter)
document.getElementById("quoteBtn").onclick = async () => {
  const amount = document.getElementById("fromAmount").value;
  const fromToken = fromSel.value;
  const toToken = toSel.value;

  const result = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken}&outputMint=${toToken}&amount=${amount * 1e9}`
  );
  const data = await result.json();

  if (!data.data[0]) {
    document.getElementById("status").innerText = "No route found";
    return;
  }

  const out = data.data[0].outAmount / 1e9;
  document.getElementById("toAmount").value = out.toFixed(6);

  window.bestRoute = data.data[0];
  document.getElementById("status").innerText = "Route found";
};

// Swap
document.getElementById("swapBtn").onclick = async () => {
  if (!publicKey) return alert("Connect wallet first!");

  const tx = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: window.bestRoute,
      userPublicKey: publicKey,
      wrapAndUnwrapSol: true
    })
  });

  const swapData = await tx.json();
  const { swapTransaction } = swapData;

  // Decode & sign
  const decoded = bs58.decode(swapTransaction);
  const signed = await provider.signTransaction(
    window.solanaWeb3.Transaction.from(decoded)
  );

  // Send to network
  const txid = await window.solanaWeb3.sendAndConfirmRawTransaction(
    provider.connection,
    signed.serialize()
  );

  document.getElementById("status").innerText = "Swap Success: " + txid;
};
