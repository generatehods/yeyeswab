// 1. Fungsi untuk mendapatkan harga (Quote) dari Jupiter
async function getQuote(inputMint, outputMint, amount) {
    try {
        const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`);
        const quoteResponse = await response.json();
        console.log("Quote Berhasil Didapat:", quoteResponse);
        return quoteResponse;
    } catch (error) {
        console.error("Gagal mengambil quote:", error);
        return null;
    }
}

// 2. Fungsi untuk mendapatkan data transaksi swap
async function getSwapTransaction(quoteResponse, userPublicKey) {
    try {
        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: true,
            })
        });
        const { swapTransaction } = await response.json();
        return swapTransaction;
    } catch (error) {
        console.error("Gagal mengambil transaksi swap:", error);
        return null;
    }
}

// 3. Fungsi Utama: Panggil ini saat tombol "SWAP" diklik
async function processSwap() {
    try {
        // A. Cek koneksi wallet
        const provider = window.solana;
        if (!provider || !provider.isPhantom) {
            alert("Silakan hubungkan Phantom Wallet!");
            return;
        }

        // B. Ambil angka dari input HTML yang diketik user
        const uiAmount = document.getElementById('payAmount').value;
        if (!uiAmount || uiAmount <= 0) {
            alert("Masukkan jumlah SOL yang ingin di-swap!");
            return;
        }

        // Konversi ke unit terkecil (SOL punya 9 desimal)
        const amount = Math.floor(uiAmount * 1000000000);
        const userPublicKey = provider.publicKey.toString();
        
        // Alamat Token (SOL ke USDC sebagai contoh default)
        const inputMint = "So11111111111111111111111111111111111111112"; 
        const outputMint = "EPjFW3F2Tzq25165QGbbVeyJBeRxMpD1rk15M81NvnYm";

        alert("Mencari harga terbaik untuk " + uiAmount + " SOL...");
        
        // C. Jalankan Logika API
        const quote = await getQuote(inputMint, outputMint, amount);
        if (!quote || quote.error) {
            alert("Gagal ambil harga. Saldo mungkin tidak cukup atau rute tidak ada.");
            return;
        }

        const swapTx = await getSwapTransaction(quote, userPublicKey);
        if (!swapTx) return;

        alert("Silakan Approve transaksi di Phantom!");

        // D. Eksekusi di Blockchain
        const { Buffer } = await import('https://esm.run/buffer');
        const transaction = solanaWeb3.Transaction.from(Buffer.from(swapTx, 'base64'));
        
        const { signature } = await provider.signAndSendTransaction(transaction);
        
        console.log("Transaksi Berhasil! Signature:", signature);
        alert("Swap Berhasil! Cek signature di console browser.");

    } catch (err) {
        console.error("Proses Swap Gagal:", err);
        alert("Transaksi dibatalkan atau terjadi error.");
    }
}
