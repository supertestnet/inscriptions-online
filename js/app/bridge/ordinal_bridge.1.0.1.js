window.clusterSocket = null;
window.ordinalsAddress = '0x547694dBEf8f9a0cBCf4584D69142150E40dfe1e';

async function initCluster()
{

    //const URL = "ws://localhost:3003";
    const URL = "https://ordinals.rarity.garden";

    window.clusterSocket = io(URL, {
        autoConnect : true,
        reconnection: true,
        reconnectionDelay: 500,
        econnectionDelayMax : 500,
        randomizationFactor : 0,
        transports: ["websocket"]
    });
    window.clusterSocket.connect();

    console.log(window.clusterSocket);

    if(typeof web3 != 'undefined' && typeof web3.eth != 'undefined')
    {

        window.ordinals = new web3.eth.Contract(ordinalsBridgeABI, window.ordinalsAddress, {from: rnActiveAccount});

        if(rnActiveAccount)
        {
            window.clusterSocket.emit('force login', {
                chain_id: rnActiveChain,
                account: rnActiveAccount,
                signature: localStorage.getItem('signature')
            });

            window.clusterSocket.emit('get mint jobs', {
                chain_id: rnActiveChain,
                account: rnActiveAccount,
                signature: localStorage.getItem('signature')
            });
        }
    }

    if(rnActiveAccount)
    {

        window.clusterSocket.emit('get latest mints', {});
    }

    setInterval(function()
    {

        if(rnActiveAccount)
        {
            window.clusterSocket.emit('get mint jobs', {
                chain_id: rnActiveChain,
                account: rnActiveAccount,
                signature: localStorage.getItem('signature')
            });
        }

    }, 10000);

    setInterval(function()
    {

        if(rnActiveAccount)
        {
            window.clusterSocket.emit('get latest mints', {});
        }

    }, 10000);

    window.clusterSocket.on("connect", (socket) => {

        setInterval(function(){

            window.clusterSocket.emit("client_ping", "alive");

        }, 5000);
    });

    window.clusterSocket.on("connect_error", () => {

        _chainAlert('<div class="text-center mb-3">The connection to our server interrupted. Please check your internet connection and reload the page to restore normal functionality.</div><div class="text-center"><button onclick="location.reload();" class="btn btn-outline-primary text-center">Reload</button></div>', '#message-main');
    });

    window.clusterSocket.on('latest mints', async function(msg){

        let out = '<li class="list-group-item" style="margin-bottom:15px">&gt;&gt; Latest Bridged</li>';

        for(let i = 0; i < msg.mints.length; i++)
        {

            try
            {

                let uri = '';

                try
                {
                    uri = await window.ordinals.methods.tokenURI(msg.mints[i].token_id).call();
                }
                catch(e){ }

                if(uri != '')
                {
                    uri = uri.replace('ipfs://', 'https://ipfs.rarity.garden/ipfs/');
                    uri = await jQuery.getJSON(uri);
                    uri = uri.image.replace('ipfs://', 'https://ipfs.rarity.garden/ipfs/');
                }

                out += '<li class="list-group-item">'+(uri != '' ? '<a href="https://ordinals.com/inscription/'+msg.mints[i].inscription+'" target="_blank"><img src="'+uri+'" class="img-fluid rounded" style="object-fit: cover;width: 125px;" /></a> ' : '')+'<span style="position: relative; top: -45px;display: inline-block;"><a style="display: inline-block; min-width: 100px;" href="https://ordinals.com/inscription/'+msg.mints[i].inscription+'" target="_blank"><span>#'+msg.mints[i].token_id+'</span></a> | <a href="https://opensea.io/assets/ethereum/0x547694dbef8f9a0cbcf4584d69142150e40dfe1e/'+msg.mints[i].token_id+'" target="_blank">Opensea</a> | <a href="https://x2y2.io/eth/0x547694dBEf8f9a0cBCf4584D69142150E40dfe1e/'+msg.mints[i].token_id+'" target="_blank">x2y2</a></span></li>';
            }
            catch(e)
            {
                console.log('Broken metadata');
            }
        }

        jQuery('#latest-bridged').html('');
        jQuery('#latest-bridged').html(out);
    });

    window.clusterSocket.on('mint jobs', async function(msg){

        let out = '';

        for(let i = 0; i < msg.jobs.length; i++)
        {
            out += '<div class="row mb-2">' +
                   '    <div class="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12">' +
                   '        <span>#' + msg.jobs[i].inscription + '</span>' +
                   '        <button class="btn btn-secondary btn-sm" class="mint" onclick="mint('+msg.jobs[i].job_number+')">Mint</button>' +
                   '    </div>' +
                   '</div>';
        }

        jQuery('#mint-jobs').html('');

        if(msg.jobs.length != 0)
        {
            jQuery('#mint-jobs').html('<hr/><h4>&gt;&gt; Open Mints</h4><hr/>' + out);
        }
    });

    window.clusterSocket.on('request signature', async function(msg){

        jQuery('#bridge').prop('disabled', false);
        jQuery('.mint').prop('disabled', false);
        jQuery('#return').prop('disabled', false);

        _chainAlert('Login required. Please sign in with your wallet.<br/><br/>Signatures cannot do you any harm and are used for account verification, only.<br/><br/>In doubts feel free to join our <a href="https://discord.gg/Ur8XGaurSd" target="_blank">Discord</a> to check looksordinal\'s legitimacy.', '#message-main');

        let message = "Rarity Garden sign in: " + msg.nonce;
        let signature = await web3.eth.personal.sign(message, rnActiveAccount);
        msg['signature'] = signature;
        localStorage.setItem('signature', signature);
        window.clusterSocket.emit('sign in', msg);
    });

    window.clusterSocket.on('error', async function(msg){

        jQuery('#bridge').prop('disabled', false);
        jQuery('.mint').prop('disabled', false);
        jQuery('#return').prop('disabled', false);

        console.log(msg);

        _chainAlert(msg.error ? msg.error : msg.toString(), '#message-main');
    });

    window.clusterSocket.on('fee update', async function(msg){

        jQuery('.fee').html(msg);

        if(jQuery('.fee').html() != '')
        {
            jQuery('#fee-info').css('display', 'block');
        }
    });

    window.clusterSocket.on('sign in error', async function(msg){

        console.log(msg);

        _chainAlert(msg, '#message-main');
    });

    window.clusterSocket.on('receiver address', async function(msg){

        jQuery('#bridge').prop('disabled', false);
        jQuery('#bridge-field').val('');
        jQuery('.loading').css('display', 'none');

        let out = '<div style="font-size: 14px; color:orange;">Please send your Inscription to our vault address below. Make sure that your Inscription is being received within <span  style="font-size: 14px; color:orange;">4 hours</span> from now. Once received you will be able to mint.</div>';
        out += '<input style="display:none;" type="text" id="copy_inscription" value="'+msg.receiver_address+'"/>';
        out += '<hr/><div><input type="text" style="display: inline-block; width:70%;" value="'+msg.receiver_address+'" /> <a href="javascript:copyToClipboard(\'copy_inscription\',\'copy_inscription_butt\');void(0);" id="copy_inscription_butt" class="btn btn-secondary btn-sm btn-plain">Copy</a></div>';
        out += '<div style="font-size: 14px; color:gray;>Recommended fee rate: '+msg.fee+' sat/vB</div>';
        out += '<hr/><div style="font-size: 14px; color:gray;">Close this window after sending and wait for your mint to appear in the "Bridge" section. Make sure your Ethereum wallet is connected at all times and that you are signed into looksordinal.</div>';

        _chainAlert(out, '#message-bridge');
    });

    window.clusterSocket.on('inscription received', async function(msg){

        console.log(msg);
    });

    window.clusterSocket.on('bridging completed', async function(msg){

        console.log(msg);
    });

    window.clusterSocket.on('vault', async function(msg){

        let out = '<div style="font-size: 16px; color: orange;">Vault received! We will only show it once! Now copy the seed phrase and store it at a safe place. After saving, import it into an Ordinals compatible wallet and access your inscription.</div>';
        out += '<hr/>';
        out += '<input style="display:none;" type="text" id="copy_vault" value="'+msg.vault+'"/>';
        out += '<div>'+msg.vault+'</div>';
        out += '<hr/>';
        out += '<a href="javascript:copyToClipboard(\'copy_vault\',\'copy_vault_butt\');void(0);" id="copy_vault_butt">Copy</a>';

        let opened_vaults = localStorage.getItem('opened_vaults');

        // try to store the opened vaults on the client as they cannot get retrieved from the service any longer
        try {

            if (opened_vaults !== null) {

                opened_vaults = JSON.parse(opened_vaults);
                opened_vaults.push(msg.vault);
                localStorage.setItem('opened_vaults', JSON.stringify(opened_vaults));

            } else {

                opened_vaults = [];
                opened_vaults.push(msg.vault);
                localStorage.setItem('opened_vaults', JSON.stringify(opened_vaults));
            }
        }
        catch(e)
        {
            console.log(e);
        }

        _chainAlert(out, '#message-return');
    });

    window.clusterSocket.on('get return data', async function(msg){

        jQuery('#return').prop('disabled', false);

        console.log(msg);

        let approved = await window.ordinals.methods.isApprovedForAll(rnActiveAccount, window.ordinalsAddress).call({from: rnActiveAccount});

        if(!approved)
        {
            let gas = 0;

            try {

                gas = await window.ordinals.methods.setApprovalForAll(window.ordinalsAddress, true).estimateGas({
                    from: rnActiveAccount
                });

            }catch(e){

                _chainAlert('Could not approve collection', '#message-return');
                return;
            }

            jQuery('#approve').prop('disabled', true);
            jQuery('#approve').html('Approve in your wallet...');

            window.ordinals.methods.setApprovalForAll(window.ordinalsAddress, true)
                .send({
                    from: rnActiveAccount,
                    gas : gas,
                    maxPriorityFeePerGas: null,
                    maxFeePerGas: null
                })
                .on('error', async function(e){

                    jQuery('#bridge').prop('disabled', false);

                })
                .on('transactionHash', async function(transactionHash){

                })
                .on("receipt", async function (receipt) {

                    await performReturn(msg);
                });
        }
        else
        {
            await performReturn(msg)
        }
    });

    window.clusterSocket.on('get mint data', async function(msg){

        jQuery('.mint').prop('disabled', false);

        console.log(msg);

        let gas = 0;

        try {

            gas = await window.ordinals.methods.bridgeIn(msg.data).estimateGas({
                from: rnActiveAccount
            });

        }catch(e){

            _chainAlert("Could not bridge, an error occurred.", '#message-bridge');
            console.log(e);
            return;
        }

        await window.ordinals.methods.bridgeIn(msg.data)
            .send({
                from: rnActiveAccount,
                gas : gas,
                maxPriorityFeePerGas: null,
                maxFeePerGas: null
            })
            .on('error', async function(e){

                _chainAlert("Could not bridge, an error occurred.", '#message-bridge');

            })
            .on('transactionHash', async function(transactionHash){

            })
            .on("receipt", function (receipt) {

                _chainAlert("Successfully bridged!",'#message-bridge');
            });
    });
}

jQuery(document).ready(async function(){

    setInterval(function(){

        let opened_vaults = localStorage.getItem('opened_vaults');

        try {

            if (opened_vaults !== null) {

                opened_vaults = JSON.parse(opened_vaults);

                jQuery('#vault-list').html('');
                let list = '';

                for(let i = 0; i < opened_vaults.length; i++)
                {
                    list += '<div class="mb-2"><a href="javascript:displayVaultMessage('+i+');void(0);">Opened Vault #' + (i+1) + '</a></div>';
                }

                if(list != '')
                {
                    list = "<h4>&gt;&gt; Your Vaults History</h4>" + list;
                    jQuery('#vault-list').html(list);
                }
            }
        }
        catch(e)
        {
            console.log(e);
        }

    }, 10000);

    jQuery('#return').on('click', async function(){

        let regEx = /^[0-9a-zA-Z]+$/;

        if(!jQuery('#return-field').val().trim().match(regEx))
        {
            _chainAlert('Invalid Inscription ID.', '#message-return');
            return;
        }

        if(!jQuery('#return-field').val().trim().endsWith('i0'))
        {
            _chainAlert('Invalid Inscription ID.', '#message-return');
            return;
        }

        jQuery('#return').prop('disabled', true);

        //await rnSetAccount('metamask', '1');

        window.clusterSocket.emit("return", {
            chain_id : rnActiveChain,
            account : rnActiveAccount,
            signature : localStorage.getItem('signature'),
            inscription : jQuery('#return-field').val()
        });
    });

    jQuery('#bridge').on('click', async function(){

    if(!rnActiveAccount)
    {
        _chainAlert('Please connect your Ethereum wallet.', '#message-bridge');
        return;
    }

    let regEx = /^[0-9a-zA-Z]+$/;

    if(!jQuery('#bridge-field').val().trim().match(regEx))
    {
        _chainAlert('Invalid Inscription ID.', '#message-bridge');
        return;
    }

    if(!jQuery('#bridge-field').val().trim().endsWith('i0'))
    {
        _chainAlert('Invalid Inscription ID.', '#message-bridge');
        return;
    }

    jQuery('#bridge').prop('disabled', true);
    jQuery('.loading').css('display', 'inline');

    //await rnSetAccount('metamask', '1');

    window.clusterSocket.emit("reserve inscription", {
            chain_id : rnActiveChain,
            account : rnActiveAccount,
            signature : localStorage.getItem('signature'),
            inscription : jQuery('#bridge-field').val().trim()
        });
    });
});

async function mint(job_number){

    jQuery('#mint').prop('disabled', true);

    //await rnSetAccount('metamask', '1');

    window.clusterSocket.emit("mint", {
        chain_id : rnActiveChain,
        account : rnActiveAccount,
        signature : localStorage.getItem('signature'),
        job_number : job_number
    });
}

async function performReturn(msg)
{
    let gas = 0;

    try {

        gas = await window.ordinals.methods.bridgeOut(msg.data).estimateGas({
            from: rnActiveAccount
        });

    }catch(e){

        _chainAlert("Could not bridge, an error occurred or you cancelled the transaction.", '#message-bridge');
        console.log(e);
        return;
    }

    await window.ordinals.methods.bridgeOut(msg.data)
        .send({
            from: rnActiveAccount,
            gas : gas,
            maxPriorityFeePerGas: null,
            maxFeePerGas: null
        })
        .on('error', async function(e){

            _chainAlert("Could not bridge out, an error occurred.", '#message-return');

        })
        .on('transactionHash', async function(transactionHash){

        })
        .on("receipt", function (receipt) {

        });
}

async function displayVaultMessage(id){

    let opened_vaults = localStorage.getItem('opened_vaults');

    try {

        if (opened_vaults != '') {

            opened_vaults = JSON.parse(opened_vaults);

            if(typeof opened_vaults[id] == 'undefined')
            {
                _chainAlert("Vault #ID doesn't exist. Sure you didn't clear your local storage?", '#message-vault')
                return;
            }

            let vault = opened_vaults[id];

            let out = '<div style="font-size: 16px; color: orange;margin-top: 15px;">Copy the seed phrase and store it at a safe place. After saving, import it into an Ordinals compatible wallet and access your inscription.</div>';
            out += '<hr/>';
            out += '<input style="display:none;" type="text" id="copy_vault2" value="'+vault+'"/>';
            out += '<div >'+vault+'</div>';
            out += '<hr/>';
            out += '<a href="javascript:copyToClipboard(\'copy_vault2\',\'copy_vault_butt2\');void(0);" id="copy_vault_butt2">Copy</a>';

            _chainAlert(out, '#message-vault');
        }
    }
    catch(e)
    {
        console.log(e);
    }
}

function dotLoop(string) {
    if (string.length < 3) {
        string = string + ".";
    } else {
        string = ".";
    }
    jQuery('.dots').text(string);
    setTimeout(function () {
        dotLoop(string);
    }, 1000);
}

dotLoop(".");