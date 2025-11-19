// ---- Load Tokenlist ----
let TOKENLIST = {};

async function loadTokenList() {
  const res = await fetch("./tokenlist.json");
  const data = await res.json();
  TOKENLIST = data.tokens.reduce((map, t) => {
    map[t.mint] = t;
    return map;
  }, {});
}

loadTokenList();

// ---- AUTODETECT TOKEN ----
async function autoDetectToken(mint, side) {
  mint = mint.trim();
  if (!mint || mint.length < 32) return;

  let boxId = side === "from" ? "#fromMeta" : "#toMeta";

  // 1. Cek di tokenlist.json
  if (TOKENLIST[mint]) {
    displayTokenMetadata(boxId, TOKENLIST[mint]);
    return TOKENLIST[mint];
  }

  // 2. Fetch metadata dari on-chain (Jupiter API)
  try {
    const metaURL = `https://tokens.jup.ag/token/${mint}`;
    const res = await fetch(metaURL);
    const json = await res.json();

    if (json && json.address) {
      const meta = {
        mint: json.address,
        symbol: json.symbol || "???",
        name: json.name || "Unknown Token",
        decimals: json.decimals || 0,
        logo: json.logoURI || "./assets/default.png"
      };

      displayTokenMetadata(boxId, meta);
      return meta;
    }
  } catch (err) {
    console.log("Metadata error:", err);
  }

  // Tidak ditemukan
  document.querySelector(boxId).innerHTML =
    `<p style="color:#f55">Token not found</p>`;
  return null;
}

// ---- Tampilkan Metadata ----
function displayTokenMetadata(target, meta) {
  document.querySelector(target).innerHTML = `
    <div class="token-row">
      <div class="token-meta">
        <img src="${meta.logo}"/>
        <div>
          <div><b>${meta.symbol}</b></div>
          <small>${meta.name}</small>
        </div>
      </div>
      <div>
        <small>Decimals: ${meta.decimals}</small>
      </div>
    </div>
  `;
}
