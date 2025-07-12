 // Handles wallet connect/disconnect logic

window.FIXORIUM = window.FIXORIUM || {};
const F = window.FIXORIUM;

F.wallet = {
  currentProvider: null,
  currentAccount: null,
  web3: null,
  walletConnectProvider: null,

  async connectMetaMask() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        F.wallet.web3 = new Web3(window.ethereum);
        const accounts = await F.wallet.web3.eth.getAccounts();
        F.wallet.currentAccount = accounts[0];
        F.wallet.currentProvider = 'MetaMask';
        F.wallet.onConnect();
      } catch (err) {
        F.wallet.onError(err, 'MetaMask');
      }
    } else {
      alert('MetaMask is not installed.');
    }
  },

  async connectTrustWallet() {
    if (window.ethereum && window.ethereum.isTrust) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        F.wallet.web3 = new Web3(window.ethereum);
        const accounts = await F.wallet.web3.eth.getAccounts();
        F.wallet.currentAccount = accounts[0];
        F.wallet.currentProvider = 'Trust';
        F.wallet.onConnect();
      } catch (err) {
        F.wallet.onError(err, 'Trust');
      }
    } else {
      alert('Trust Wallet is not installed.');
    }
  },

  async connectWalletConnect() {
    if (F.wallet.walletConnectProvider) {
      await F.wallet.walletConnectProvider.disconnect();
      F.wallet.walletConnectProvider = null;
    }
    F.wallet.walletConnectProvider = new window.WalletConnectProvider.default({
      rpc: {
        1: "https://rpc.ankr.com/eth",
        56: "https://bsc-dataseed.binance.org/",
        137: "https://polygon-rpc.com",
        42161: "https://arb1.arbitrum.io/rpc",
        43114: "https://api.avax.network/ext/bc/C/rpc",
        8453: "https://mainnet.base.org",
        10: "https://mainnet.optimism.io"
      }
    });
    try {
      await F.wallet.walletConnectProvider.enable();
      F.wallet.web3 = new Web3(F.wallet.walletConnectProvider);
      const accounts = await F.wallet.web3.eth.getAccounts();
      F.wallet.currentAccount = accounts[0];
      F.wallet.currentProvider = 'WalletConnect';
      F.wallet.walletConnectProvider.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          F.wallet.disconnectWallet();
        } else {
          F.wallet.currentAccount = accounts[0];
          F.wallet.onConnect();
        }
      });
      F.wallet.walletConnectProvider.on("disconnect", () => {
        F.wallet.disconnectWallet();
      });
      F.wallet.onConnect();
    } catch (err) {
      F.wallet.onError(err, 'WalletConnect');
    }
  },

  async connectPhantomWallet() {
    if (window.phantom && window.phantom.solana) {
      try {
        const resp = await window.phantom.solana.connect();
        F.wallet.currentAccount = resp.publicKey.toString();
        F.wallet.currentProvider = 'Phantom';
        F.wallet.onConnect();
      } catch (e) {
        F.wallet.onError(e, 'Phantom');
      }
    } else {
      window.open("https://phantom.app/ul/v1/connect?app_url=" + encodeURIComponent(window.location.origin), "_blank");
    }
  },

  disconnectWallet() {
    F.wallet.currentProvider = null;
    F.wallet.currentAccount = null;
    F.wallet.web3 = null;
    if (F.wallet.walletConnectProvider) {
      F.wallet.walletConnectProvider.disconnect();
      F.wallet.walletConnectProvider = null;
    }
    F.wallet.onDisconnect();
  },

  // UI Callbacks: define in main.js for modularity
  onConnect: () => {},
  onDisconnect: () => {},
  onError: (err, walletName) => { console.error('Wallet error:', walletName, err); }
};
