// 1. Fungsi untuk mendapatkan harga (Quote) dari Jupiter
async function getQuote(// Ambil angka dari input HTML (ID: payAmount)
const uiAmount = document.getElementById('payAmount').value;
if (!uiAmount || uiAmount <= 0) {
    alert("Masukkan jumlah SOL yang ingin di-swap!");
    return;
}

// Konversi ke Lamports (SOL punya 9 desimal)
const amount = Math.floor(uiAmount * 1000000000); 
) {
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
        // Cek apakah wallet (Phantom) terhubung
        const provider = window.solana;
        if (!provider || !provider.isPhantom) {
            alert("Silakan pasang dan hubungkan Phantom Wallet!");
            return;
        }

        const userPublicKey = provider.publicKey.toString();
        
        // Contoh: Ambil input dari UI (Sesuaikan ID element dengan HTML Anda)
        // Misal: SOL ke USDC
        const inputMint = "So11111111111111111111111111111111111111112"; 
        const outputMint = "EPjFW3F2Tzq25165QGbbVeyJBeRxMpD1rk15M81NvnYm";
        const amount = 100000000; // Contoh 0.1 SOL (SOL pakai 9 desimal)

        alert("Sedang mencari rute terbaik...");
        
        // Langkah A: Ambil Quote
        const quote = await getQuote(inputMint, outputMint, amount);
        if (!quote) return;

        // Langkah B: Ambil Data Transaksi
        const swapTx = await getSwapTransaction(quote, userPublicKey);
        if (!swapTx) return;

        alert("Konfirmasi transaksi di wallet Anda!");

        // Langkah C: Kirim ke Wallet untuk di-Sign & Broadcast
        const { Buffer } = await import('https://esm.run/buffer'); // Load buffer untuk browser
        const transaction = solanaWeb3.Transaction.from(Buffer.from(swapTx, 'base64'));
        
        const { signature } = await provider.signAndSendTransaction(transaction);
        
        console.log("Transaksi Berhasil! Signature:", signature);
        alert("Swap Berhasil! Cek signature di console.");

    } catch (err) {
        console.error("Proses Swap Gagal:", err);
        alert("Terjadi kesalahan atau transaksi dibatalkan.");
    }
}
