async function getQuote(inputMint, outputMint, amount) {
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`);
    const quoteResponse = await response.json();
    console.log(quoteResponse);
    return quoteResponse;
}

