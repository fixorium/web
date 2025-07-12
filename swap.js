 // Handles swap logic, expects FIXORIUM.wallet to be set up

window.FIXORIUM = window.FIXORIUM || {};
const F = window.FIXORIUM;

F.swap = {
  enableForm(enabled) {
    document.getElementById('swapBtn').disabled = !enabled;
  },

  async getTokenAddress(symbol, chainId) {
    try {
      const apiBase = F.swap.get1inchApiBase(chainId);
      const tokensRes = await fetch(`${apiBase}/tokens`);
      const tokens = await tokensRes.json();
      const tokenObj = Object.values(tokens.tokens).find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
      return tokenObj?.address || null;
    } catch (e) {
      return null;
    }
  },

  async getTokenDecimals(tokenAddress) {
    if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') return 18;
    const erc20ABI = [
      { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" }
    ];
    const tokenContract = new F.wallet.web3.eth.Contract(erc20ABI, tokenAddress);
    return await tokenContract.methods.decimals().call();
  },

  get1inchApiBase(chainId) {
    return `https://api.1inch.dev/swap/v5.2/${chainId}`;
  },

  async doSwap() {
    const statusBox = document.getElementById('statusBox');
    statusBox.style.display = 'block';
    statusBox.className = 'status info';
    statusBox.textContent = 'Checking token data and preparing swap...';

    const network = document.getElementById('networkSelect').value;
    const fromToken = document.getElementById('fromTokenInput').value.trim();
    const toToken = document.getElementById('toTokenInput').value.trim();
    const amount = document.getElementById('amountInput').value.trim();

    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      statusBox.className = 'status error';
      statusBox.textContent = 'Please fill out all fields with valid values.';
      return;
    }
    if (!F.wallet.currentAccount || !F.wallet.web3) {
      statusBox.className = 'status error';
      statusBox.textContent = 'Connect your EVM wallet first.';
      return;
    }

    try {
      const fromTokenAddr = fromToken.startsWith('0x') ? fromToken : await F.swap.getTokenAddress(fromToken, network);
      const toTokenAddr = toToken.startsWith('0x') ? toToken : await F.swap.getTokenAddress(toToken, network);

      if (!fromTokenAddr || !toTokenAddr) {
        statusBox.className = 'status error';
        statusBox.textContent = 'Invalid token address or symbol.';
        return;
      }

      const decimals = await F.swap.getTokenDecimals(fromTokenAddr);
      const amountWei = (BigInt(Math.floor(Number(amount) * 10 ** decimals))).toString();

      statusBox.textContent = 'Requesting best price route from 1inch...';
      const apiBase = F.swap.get1inchApiBase(network);
      const quoteUrl = `${apiBase}/quote?fromTokenAddress=${fromTokenAddr}&toTokenAddress=${toTokenAddr}&amount=${amountWei}`;
      const quoteRes = await fetch(quoteUrl);
      if (!quoteRes.ok) throw new Error('Failed to get quote');
      const quoteData = await quoteRes.json();

      statusBox.className = 'status info';
      statusBox.textContent = `Expected output: ${BigInt(quoteData.toTokenAmount) / BigInt(10 ** quoteData.toToken.decimals)} ${quoteData.toToken.symbol}. Preparing swap...`;

      if (fromTokenAddr !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const allowanceUrl = `${apiBase}/approve/allowance?tokenAddress=${fromTokenAddr}&walletAddress=${F.wallet.currentAccount}`;
        const allowanceRes = await fetch(allowanceUrl);
        const allowanceData = await allowanceRes.json();
        if (BigInt(allowanceData.allowance) < BigInt(amountWei)) {
          statusBox.textContent = 'Approving token...';
          const approveUrl = `${apiBase}/approve/transaction?tokenAddress=${fromTokenAddr}&amount=${amountWei}`;
          const approveRes = await fetch(approveUrl);
          const approveData = await approveRes.json();
          await F.wallet.web3.eth.sendTransaction({
            from: approveData.from,
            to: approveData.to,
            data: approveData.data,
            value: approveData.value || '0x0'
          });
        }
      }

      statusBox.textContent = 'Please confirm the transaction in your wallet...';
      const swapUrl = `${apiBase}/swap?fromTokenAddress=${fromTokenAddr}&toTokenAddress=${toTokenAddr}&amount=${amountWei}&fromAddress=${F.wallet.currentAccount}&slippage=1`;
      const swapRes = await fetch(swapUrl);
      if (!swapRes.ok) throw new Error('Swap API request failed');
      const swapData = await swapRes.json();

      const txParams = {
        from: swapData.tx.from,
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0x0',
        gas: swapData.tx.gas || undefined,
      };
      const txHash = await F.wallet.web3.eth.sendTransaction(txParams);
      statusBox.className = 'status success';
      statusBox.textContent = `Swap successful! Tx Hash: ${txHash.transactionHash || txHash}`;
    } catch (e) {
      statusBox.className = 'status error';
      statusBox.textContent = 'Swap failed: ' + (e.message || e);
    }
  }
};
