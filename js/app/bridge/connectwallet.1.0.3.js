rnConnectorPrevContent = '';
rnActiveAccount = null;
rnActiveChain = null;
rnActiveChainCurrency = 'ETH';

async function rnSetAccount(which)
{

    let targetChainName = 'Ethereum';
    let targetChain = arguments.length == 2 ? arguments[1] : '1';

    if(document.title.includes('Multi Send')){
        let _targetChain = localStorage.getItem('targetChain');
        targetChain = arguments.length == 2 ? arguments[1] : ( _targetChain != null ? _targetChain : '1' );
    }

    if(document.title.includes('Swap')){
        let _targetChain = localStorage.getItem('targetChain');
        targetChain = arguments.length == 2 ? arguments[1] : ( _targetChain != null ? _targetChain : '1' );
    }

    if(document.title.includes('Ordinals Bridge')){
        let _targetChain = localStorage.getItem('targetChain');
        targetChain = arguments.length == 2 ? arguments[1] : ( _targetChain != null ? _targetChain : '1' );
    }

    let currChain = -1;
    let accounts = [];
    let chainParams = null;
    
    switch(targetChain){

        case '1e14':
            
            chainParams = {
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0x'+targetChain,
                            rpcUrls: ['https://canto.slingshot.finance/'],
                            chainName: 'Canto',
                            nativeCurrency: { name: 'CANTO', decimals: 18, symbol: 'CANTO' },
                            blockExplorerUrls: ['https://evm.explorer.canto.io/']
                          }]
                        };
            
            break;
        
        case '89':
            
            chainParams = {
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0x'+targetChain,
                            rpcUrls: ['https://polygon-rpc.com'],
                            chainName: 'Polygon',
                            nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
                            blockExplorerUrls: ['https://polygonscan.com/']
                          }]
                        };
            
            break;
            
        case '38':
            
            chainParams = {
                          method: 'wallet_addEthereumChain',
                          params: [{
                            chainId: '0x'+targetChain,
                            rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                            chainName: 'Binance Smart Chain',
                            nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
                            blockExplorerUrls: ['https://bscscan.com/']
                          }]
                        };
            
            break;
    }
    
    if(chainParams == null && targetChain == '4'){
        
        targetChainName = 'Rinkeby';
    }
    else if(chainParams == null && targetChain == '5'){
        
        targetChainName = 'Goerli';
    }
    else if(chainParams != null){
        
        targetChainName = chainParams.params[0].chainName;
        rnActiveChainCurrency = chainParams.params[0].nativeCurrency.symbol;
    }

    switch (which)
    {

        case 'metamask':

            try
            {
                try {
                    
                    await ethereum.send('wallet_switchEthereumChain', [{ chainId: '0x'+targetChain}]);
                    localStorage.setItem('targetChain', targetChain);
                    
                } catch (switchError) {
                    
                    if (switchError.code === 4902) {
                        try{
                            await ethereum.request(chainParams);
                            localStorage.setItem('targetChain', targetChain);
                        }catch(e){
                            _chainAlert('Could not switch to the target chain.', '#message-main');
                        }
                    }
                }

                accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
                window.web3 = new Web3(ethereum);
                currChain = await web3.eth.getChainId();
                
                currChain = currChain.toString(16);

                console.log('Curr & Target Chains:', currChain, " = ", targetChain);

                if (currChain + "" != targetChain + "")
                {
                    _chainAlert('You are on the wrong network. Please switch to ' + targetChainName + '.', '#message-main');
                }

                window.ethereum.removeListener("accountsChanged", accountChanged);
                window.ethereum.on("accountsChanged", accountChanged);

                window.ethereum.on("chainChanged", async function (chain)
                {
                    rnActiveChain = chain.replace('0x', '').toString(16);
                    _chainAlert('Your account has changed. We are restarting the app. Please Wait...', '#message-main');
                    location.reload();
                });

            }
            catch (e)
            {

                console.log('Rarity Garden Connect Wallet: active account not present or there is a connectivity issue.');
            }

            break;
    }

    if (accounts.length != 0)
    {

        console.log("Wallet Connected");
        localStorage.setItem("wallet", which);
        rnConnectorPrevContent = jQuery('.rn-connect-wallet').html();
        jQuery('.rn-connect-wallet').html(accounts[0].substring(0, 6) + '...' + accounts[0].substring(38, 42));

        rnActiveAccount = accounts[0];
        rnActiveChain = currChain;

        initCluster();
        jQuery('#rn-connect-metamask').css('display','none');
    }
    else
    {

        localStorage.removeItem("wallet");
        jQuery('.rn-connect-wallet').html(rnConnectorPrevContent);
        rnActiveAccount = null;
        rnActiveChain = null;

    }
}

function accountChanged(accounts){

    if(accounts.length === 0)
    {
        localStorage.removeItem("wallet");
    }

    rnActiveAccount = accounts[0];
    _chainAlert('Your account has changed. We are restarting the app. Please Wait...', '#message-main');
    location.reload();
    
}

function closeMessage(id)
{
    jQuery(id).html('');
    jQuery(id).css('display', 'none');
}

function _chainAlert(msg, id)
{

    jQuery(id).html('<div class="message"><div style="margin-bottom: 15px;"><a style="text-decoration: none;" href="javascript:closeMessage(\''+id+'\')">[X]</a></div>' + msg + '</div>');
    jQuery(id).css('display', 'block');
}


jQuery(document).ready(function ()
{

    if (typeof window.ethereum != "undefined")
    {
        window.web3 = new Web3(window.ethereum);
    }
    else
    {
        window.web3 = new Web3(null);
    }

    rnConnectorPrevContent = jQuery('.rn-connect-wallet').html();
    let wallet = localStorage.getItem("wallet");

    console.log(wallet);

    if (wallet != null)
    {
        rnSetAccount(wallet);
        jQuery('#rn-connect-metamask').css('display', 'none');
    }
    else
    {
        jQuery('#rn-connect-metamask').css('display','block');
    }

    jQuery('#rn-connect-metamask').on('click', async function ()
    {

        if (typeof window.ethereum === 'undefined')
        {

            alert("Please connect your wallet.\nIf you don't own a wallet, please install and enable Metamask.");

        }
        else
        {

            rnSetAccount('metamask');
        }
    });
});