 // Initialization, DOM event binding, UI update logic

window.FIXORIUM = window.FIXORIUM || {};
const F = window.FIXORIUM;

document.addEventListener('DOMContentLoaded', function () {
  // Wallet UI callbacks
  F.wallet.onConnect = function () {
    document.getElementById('userAddress').innerText = F.wallet.currentAccount || '';
    document.getElementById('userAddress').style.display = 'inline-block';
    document.getElementById('connectWalletBtn').style.display = 'none';
    document.getElementById('disconnectWalletBtn').style.display = 'inline-block';
    document.getElementById('swapSection').style.display = 'block';
    document.getElementById('walletPopupBg').style.display = 'none';
    F.swap.enableForm(F.wallet.currentProvider !== 'Phantom'); // Only enable swap for EVM
  };

  F.wallet.onDisconnect = function () {
    document.getElementById('userAddress').innerText = '';
    document.getElementById('userAddress').style.display = 'none';
    document.getElementById('connectWalletBtn').style.display = 'inline-block';
    document.getElementById('disconnectWalletBtn').style.display = 'none';
    document.getElementById('swapSection').style.display = 'none';
    F.swap.enableForm(false);
  };

  // Wallet connect popup logic
  document.getElementById('connectWalletBtn').addEventListener('click', () => {
    document.getElementById('walletPopupBg').style.display = 'block';
  });
  document.getElementById('popupClose').addEventListener('click', () => {
    document.getElementById('walletPopupBg').style.display = 'none';
  });

  document.getElementById('metamaskBtn').addEventListener('click', F.wallet.connectMetaMask);
  document.getElementById('phantomBtn').addEventListener('click', F.wallet.connectPhantomWallet);
  document.getElementById('trustBtn').addEventListener('click', F.wallet.connectTrustWallet);
  document.getElementById('walletConnectBtn').addEventListener('click', F.wallet.connectWalletConnect);
  document.getElementById('disconnectWalletBtn').addEventListener('click', F.wallet.disconnectWallet);

  // Swap logic
  document.getElementById('swapBtn').addEventListener('click', F.swap.doSwap);

  // Initially disable swap
  F.swap.enableForm(false);
});
