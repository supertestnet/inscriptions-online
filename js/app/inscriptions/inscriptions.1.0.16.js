const buf = buffer;
const TAPSCRIPT = window.tapscript;

let db;
let active_plugin = null;
let $ = document.querySelector.bind(document);
let $$ = document.querySelectorAll.bind(document);
let url_params = new URLSearchParams(window.location.search);
let url_keys = url_params.keys();
let $_GET = {}
for (let key of url_keys) $_GET[key] = url_params.get(key);

// no changes from here
let privkey = bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
let pushing = false;
let files = [];

sessionStorage.clear();

let slider = document.getElementById("sats_range");
let output = document.getElementById("sats_per_byte");
output.innerHTML = slider.value;
slider.oninput = function () {
    output.innerHTML = this.value;
    sessionStorage["feerate"] = this.value;
    $$('.fee .num').forEach(function (item) {
        item.style.backgroundColor = "grey";
    });
}

window.onload = async function () {

    $('#padding').value = padding;
    $('.text').onclick = showText;
    $('.upload_file').onclick = showUploader;
    $('.registration').onclick = showRegister;
    $('.unisat').onclick = showUnisat;
    $('.brc20_mint').onclick = showBrc20Mint;
    $('.brc20_deploy').onclick = showBrc20Deploy;
    $('.brc20_transfer').onclick = showBrc20Transfer;
    $('#backup-usage').onclick = showBackupUsage;
    $('#tip').onfocus = async function(){

        this.value = '';
    };
    $('#tip').onkeyup = async function(){

        let tip = $('#tip').value.replace(/[^0-9]/g, '');

        if(isNaN(parseInt($('#tip').value)) || parseInt(tip) < 0){

            $('#tip').value = '';
        }

        $('#tip-usd').innerHTML = Number(await satsToDollars(tip)).toFixed(2);
    };

    await initDatabase();

    let quota = await insQuota();
    let usage = Math.round(( (quota.usage/quota.quota) + Number.EPSILON) * 10000) / 10000;
    $('#db-quota').innerHTML = usage + '%';

    setInterval(async function(){

        let quota = await insQuota();
        let usage = Math.round(( (quota.usage/quota.quota) + Number.EPSILON) * 10000) / 10000;
        $('#db-quota').innerHTML = usage + '%';

    }, 5000);

    loadPlugins();

    try
    {
        await fetch('https://www3.doubleclick.net', {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-store",
        });

        let adBoxEl = document.querySelector(".ad-box")
        let hasAdBlock = window.getComputedStyle(adBoxEl)?.display === "none"

        if(hasAdBlock)
        {
            throw new Error('Adblock detected');
        }
    }
    catch (e)
    {
        alert('To make sure inscribing will work properly, disable all adblockers for this app. If you use brave, turn off its shield.' + "\n\n" + 'We do NOT place ads nor will we track you.');
    }
};

async function showBackupUsage()
{
    if($('#backup-list').style.display == 'none')
    {
        $('#backup-list').style.display = 'block';

        let html = '';
        let keys = await insGetAllKeys();

        for(let i = 0; i < keys.length; i++)
        {
            let date = await insDateGet(keys[i]);
            html += '<div style="font-size: 14px;" id="backup-item-'+keys[i]+'">[<a href="javascript:void(0);" onclick="startInscriptionRecovery(\''+keys[i]+'\')" style="font-size: 14px;">recover</a>] [<a href="javascript:void(0);" onclick="deleteInscription(\''+keys[i]+'\')" style="font-size: 14px;">delete</a>] '+date+'<hr/></div>';
        }

        $('#backup-list').innerHTML = html;
    }
    else
    {
        $('#backup-recovery').style.display = 'none';
        $('#backup-list').style.display = 'none';
        $('#backup-list').innerHTML = '';
    }
}

async function deleteInscription(key){

    let result = confirm('Are you sure you want to delete this backup entry? If you are not sure, check if there is anything to recover first.');

    if(result)
    {
        await insDelete(key);
        await insDateDelete(key);
        $('#backup-item-'+key).remove();
    }
}

async function startInscriptionRecovery(key) {

    $('#backup-recovery').innerHTML = '<div id="recovery-info">Please wait, searching for UTXOs<span class="dots">.</span></div>';
    $('#backup-recovery').style.display = 'block';

    let utxos_found = false;
    let processed = [];
    let tx = JSON.parse(await insGet(key));

    for (let i = 0; i < tx.length; i++) {

        let plainTapKey = tx[i].output.scriptPubKey.replace('5120', '');

        if (processed.includes(plainTapKey)) {

            continue;
        }

        let response = await getData('https://mempool.space/'+mempoolNetwork+'api/address/' + TAPSCRIPT.Address.P2TR.encode(plainTapKey, encodedAddressPrefix) + '/utxo');
        let utxos = JSON.parse(response);
        let utxo = null;

        for (let j = 0; j < utxos.length; j++) {

            utxo = utxos[j];

            if (utxo !== null) {
                utxos_found = true;
                $('#recovery-info').style.display = 'none';
                $('#backup-recovery').innerHTML += '<div id="recovery-item-' + key + '-'+utxo.vout+'" style="font-size: 14px;">Found UTXO with ' + utxo.value + ' sats [<a style="font-size: 14px;" href="javascript:void(0);" onclick="recover(' + i + ', ' + utxo.vout + ', $(\'#taproot_address\').value, \'' + key + '\')">recover</a>]</div>';
                $('#backup-recovery').innerHTML += '<hr/>';

                console.log(utxo);
            }
        }

        processed.push(plainTapKey);

        await sleep(1000);
    }

    if(!utxos_found)
    {
        $('#backup-recovery').innerHTML = '<div id="recovery-info">No UTXOs found</div>';
    }
}

function showUnisat() {
    $('#padding').value = '546';
    padding = '546';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.dns').value = "";
    $('.unisat_form').style.display = "block";
    $('.unisat_checker').style.display = "block";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.add('active');
    document.getElementById('text_nav').classList.remove('active');
}

function showText() {
    $('#padding').value = '546';
    padding = '546';
    files = [];

    let cloned = $$('.text_area')[0].cloneNode(true);
    cloned.value = '';
    $('#form_container').innerHTML = '';
    document.getElementById("form_container").appendChild(cloned);

    $('#text-addrow').style.display = 'none';

    $('#app-form').reset();
    $('.text_form').style.display = "inline";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.dns').value = "";
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.add('active');
}

function showRegister() {
    $('#padding').value = '546';
    padding = '546';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "block";
    $('.dns_checker').style.display = "inline";
    $('.dns').value = "";
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.add('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.remove('active');
}

function showUploader() {
    $('#padding').value = '10000';
    padding = '10000';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "block";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.add('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.remove('active');
}

function showBrc20Deploy() {
    $('#padding').value = '546';
    padding = '546';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "block";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.registration').onclick = showRegister;
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.add('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.remove('active');
}

function showBrc20Mint() {
    $('#padding').value = '546';
    padding = '546';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "block";
    $('.brc20_transfer_form').style.display = "none";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.registration').onclick = showRegister;
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.add('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.remove('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.remove('active');
}

function showBrc20Transfer() {
    $('#padding').value = '546';
    padding = '546';
    files = [];
    $('#app-form').reset();
    $('.text_form').style.display = "none";
    $('.brc20_deploy_form').style.display = "none";
    $('.brc20_mint_form').style.display = "none";
    $('.brc20_transfer_form').style.display = "block";
    $('.file_form').style.display = "none";
    $('.dns_form').style.display = "none";
    $('.dns_checker').style.display = "none";
    $('.registration').onclick = showRegister;
    $('.unisat_form').style.display = "none";
    $('.unisat_checker').style.display = "none";
    $('.unisat').value = "";
    $('#plugin_form').style.display = 'none';
    $$('.options a').forEach(function(item){
        item.classList.remove('active');
    });
    active_plugin = null;
    document.getElementById('brc20_mint_nav').classList.remove('active');
    document.getElementById('brc20_deploy_nav').classList.remove('active');
    document.getElementById('brc20_transfer_nav').classList.add('active');
    document.getElementById('upload_file_nav').classList.remove('active');
    document.getElementById('registration_nav').classList.remove('active');
    document.getElementById('unisat_nav').classList.remove('active');
    document.getElementById('text_nav').classList.remove('active');

    $('#brc-transfer-container').innerHTML = '<div class="brc-transfer-block">' + $$('.brc-transfer-block')[0].innerHTML + '</div>';

    async function addTransferBlock(e)
    {
        e.preventDefault();
        let div = document.createElement('div');
        div.classList.add('brc-transfer-block');
        div.innerHTML = '<hr/>' + '<div class="brc-transfer-block">' + $$('.brc-transfer-block')[0].innerHTML + '</div>';
        $('#brc-transfer-container').appendChild(div);
        return false;
    }

    $('#add_transfer_button').onclick = addTransferBlock;
}

showUploader();

$('.form').addEventListener("change", async function () {

    files = [];

    let limit_reached = 0;

    for (let i = 0; i < this.files.length; i++) {

        let b64;
        let mimetype = this.files[i].type;

        if (mimetype.includes("text/plain")) {

            mimetype += ";charset=utf-8";
        }

        if (this.files[i].size >= 350000) {

            limit_reached += 1;

        } else {

            b64 = await encodeBase64(this.files[i]);
            let base64 = b64.substring(b64.indexOf("base64,") + 7);
            let hex = base64ToHex(base64);

            //console.log( "hex:", hex );
            //console.log( "bytes:", hexToBytes( hex ) );

            console.log(this.files[i]);

            let sha256 = await fileToSha256Hex(this.files[i]);
            files.push({
                name: this.files[i].name,
                hex: hex,
                mimetype: mimetype,
                sha256: sha256.replace('0x', '')
            });
        }
    }

    if (limit_reached != 0) {
        alert(limit_reached + " of your desired inscriptions exceed(s) the maximum of 350kb.")
    }

    console.log(files);
});

$('.startover').addEventListener("click", async function () {

    location.reload();
});

$('.estimate').addEventListener("click", async function () {

    run(true);
});

$('.submit').addEventListener("click", async function () {

    run(false);
});

async function run(estimate) {

    if (!estimate && !isValidAddress()) {
        alert('Invalid taproot address.');
        return;
    }

    let mempool_success = await probeAddress($('.address').value, true);

    if (!estimate && !mempool_success) {
        alert('Could not establish a connection to Mempool.space. Most likely you got rate limited. Please wait a few minutes before you try inscribing.');
        return;
    }

    if ($('.brc20_deploy_form').style.display != "none") {

        files = [];

        let deploy = '{ \n' +
            '  "p": "brc-20",\n' +
            '  "op": "deploy",\n' +
            '  "tick": "",\n' +
            '  "max": "",\n' +
            '  "lim": ""\n' +
            '}';

        if (isNaN(parseInt($('#brc20-deploy-max').value))) {
            alert('Invalid supply.');
            return;
        }

        if (isNaN(parseInt($('#brc20-deploy-lim').value))) {
            alert('Invalid limit.');
            return;
        }

        if ($('#brc20-deploy-ticker').value == '' || $('#brc20-deploy-ticker').value.length < 2) {
            alert('Invalid ticker length. Must be at least 2 characters.');
            return;
        }

        deploy = JSON.parse(deploy);
        deploy.tick = $('#brc20-deploy-ticker').value;
        deploy.max = $('#brc20-deploy-max').value;
        deploy.lim = $('#brc20-deploy-lim').value;

        let mimetype = "text/plain;charset=utf-8";
        files.push({text: JSON.stringify(deploy), name: deploy.tick, hex: textToHex(JSON.stringify(deploy)), mimetype: mimetype, sha256: ''});

        console.log(files);
    }

    if ($('.brc20_transfer_form').style.display != "none") {

        files = [];

        let _transfer = '{ \n' +
            '  "p": "brc-20",\n' +
            '  "op": "transfer",\n' +
            '  "tick": "",\n' +
            '  "amt": ""\n' +
            '}';

        let transfers = $$('.brc20-transfer-amount');
        let tickers = $$('.brc20-transfer-ticker');

        for(let i = 0; i < transfers.length; i++)
        {

            if (isNaN(parseInt(transfers[i].value))) {
                alert('Invalid transfer amount at ticker #' + (i+1));
                return;
            }

            if (tickers[i].value == '' || tickers[i].value.length < 2) {
                alert('Invalid ticker length. Must be at least 2 characters at ticker #' + (i+1));
                return;
            }

            let transfer = JSON.parse(_transfer);
            transfer.tick = tickers[i].value;
            transfer.amt = transfers[i].value;

            let mimetype = "text/plain;charset=utf-8";
            files.push({text: JSON.stringify(transfer), name: transfer.tick, hex: textToHex(JSON.stringify(transfer)), mimetype: mimetype, sha256: ''});
        }

        console.log(files);
    }

    if ($('.brc20_mint_form').style.display != "none") {

        files = [];

        let mint = '{ \n' +
            '  "p": "brc-20",\n' +
            '  "op": "mint",\n' +
            '  "tick": "",\n' +
            '  "amt": ""\n' +
            '}';

        if (isNaN(parseInt($('#brc20-mint-amount').value))) {
            alert('Invalid mint amount.');
            return;
        }

        if ($('#brc20-mint-ticker').value == '' || $('#brc20-mint-ticker').value.length < 2) {
            alert('Invalid ticker length. Must be at least 2 characters.');
            return;
        }

        mint = JSON.parse(mint);
        mint.tick = $('#brc20-mint-ticker').value;
        mint.amt = $('#brc20-mint-amount').value;

        let repeat = parseInt($('#brc20-mint-repeat').value);

        if (isNaN(repeat)) {
            alert('Invalid repeat amount.');
            return;
        }

        for (let i = 0; i < repeat; i++) {
            let mimetype = "text/plain;charset=utf-8";
            files.push({
                text: JSON.stringify(mint),
                name: mint.tick + '_' + i,
                hex: textToHex(JSON.stringify(mint)),
                mimetype: mimetype,
                sha256: ''
            });
        }

        console.log(files);
    }

    if ($('.unisat_form').style.display != "none") {

        files = [];

        let sats_domains = $('.unisat_text').value.split("\n");
        let sats_domains_cleaned = [];

        for (let sats_domain in sats_domains) {

            let domain = sats_domains[sats_domain].trim();

            if (domain == '' || sats_domains_cleaned.includes(domain)) {

                continue;
            }

            let splitted = domain.split('.');

            if(splitted.length == 1 || splitted[splitted.length - 1].toLowerCase() != 'unisat')
            {
                alert('Invalid unisat domain: ' + domain);
                return;
            }

            sats_domains_cleaned.push(domain);
        }

        for (let sats_domain in sats_domains_cleaned) {

            let mimetype = "text/plain;charset=utf-8";
            let domain = {"p": "sns", "op": "reg", "name": sats_domains_cleaned[sats_domain].trim()};
            files.push({
                text: JSON.stringify(domain),
                name: sats_domains_cleaned[sats_domain].trim(),
                hex: textToHex(JSON.stringify(domain)),
                mimetype: mimetype,
                sha256: ''
            });
            console.log(domain);
        }
    }

    if ($('.dns_form').style.display != "none") {

        files = [];

        let sats_domains = $('.dns').value.split("\n");
        let sats_domains_cleaned = [];

        for (let sats_domain in sats_domains) {

            let domain = sats_domains[sats_domain].trim();

            if (domain == '' || sats_domains_cleaned.includes(domain)) {

                continue;
            }

            let splitted = domain.split('.');

            if(splitted.length == 1 || splitted[splitted.length - 1].toLowerCase() != 'sats')
            {
                alert('Invalid sats domain: ' + domain);
                return;
            }

            sats_domains_cleaned.push(domain);
        }

        for (let sats_domain in sats_domains_cleaned) {

            let mimetype = "text/plain;charset=utf-8";
            let domain = {"p": "sns", "op": "reg", "name": sats_domains_cleaned[sats_domain].trim()};
            files.push({
                text: JSON.stringify(domain),
                name: sats_domains_cleaned[sats_domain].trim(),
                hex: textToHex(JSON.stringify(domain)),
                mimetype: mimetype,
                sha256: ''
            });
            console.log(domain);
        }
    }

    if ($('.text_form').style.display != "none") {

        let repeat = parseInt($('#text-repeat').value);

        if (isNaN(repeat)) {
            alert('Invalid repeat amount.');
            return;
        }

        files = [];

        if(!$('#text-multirow').checked)
        {
            let text = $$('.text_area')[0];
            let rows = text.value.split("\n");

            for(let i = 0; i < rows.length; i++)
            {
                let value = rows[i].trim();

                if (value != '') {
                    let mimetype = "text/plain;charset=utf-8";
                    files.push({
                        text: JSON.stringify(value),
                        name: textToHex(value),
                        hex: textToHex(value),
                        mimetype: mimetype,
                        sha256: ''
                    });
                }
            }
        }
        else
        {
            let texts = $$('.text_area');

            texts.forEach(function (text) {

                if (text.value.trim() != '') {
                    let mimetype = "text/plain;charset=utf-8";
                    files.push({
                        text: JSON.stringify(text.value),
                        name: textToHex(text.value),
                        hex: textToHex(text.value),
                        mimetype: mimetype,
                        sha256: ''
                    });
                }
            });
        }

        let newFiles = [];

        for (let i = 0; i < repeat; i++) {

            for (let j = 0; j < files.length; j++) {

                newFiles.push(files[j]);
            }
        }

        files = newFiles;

        console.log(files);
    }

    if(active_plugin !== null)
    {
        let plugin_result = await active_plugin.instance.prepare();

        if(plugin_result === false)
        {
            return;
        }
    }

    if (files.length == 0) {
        alert('Nothing to inscribe. Please upload some files or use one of the additional options.');
        return;
    }

    if (files.length > 100) {
        alert('Max. batch size is 100. Please remove some of your inscriptions and split them into many batches.');
        return;
    }

    let is_bin = files[0].sha256 != '' ? true : false;
    let min_padding = !is_bin ? 546 : 1000;
    let _padding = parseInt($('#padding').value);

    if (!isNaN(_padding) && _padding <= Number.MAX_SAFE_INTEGER && _padding >= min_padding) {
        padding = _padding;
    } else {
        alert('Invalid padding. Please enter at minimum ' + min_padding + ' sats amount for each inscription.');
        return;
    }

    let tip_check = parseInt($('#tip').value);
    tip_check = isNaN(tip_check) ? 0 : tip_check;

    /*
    if(!estimate && parseInt(tip_check) > 0 && tip_check < 500)
    {
        alert('Minimum tipping is 500 sats due to technical reasons. Thank you anyway!');
        return;
    }*/

    if(active_plugin === null)
    {
        if($('.file_form').style.display == 'block')
        {
            if(!estimate && tip_check < 500 * files.length)
            {
                $('#tip').value = 500 * files.length;
                $('#tip-usd').innerHTML = Number(await satsToDollars($('#tip').value)).toFixed(2);
                alert('Minimum tipping is ' + (500 * files.length) + ' sats based on your bulk amount. A suggestion has been added to the tip.');
                return;
            }
        }
        else
        {

            if(!estimate && 100 * files.length >= 500 && tip_check < 100 * files.length)
            {
                $('#tip').value = 100 * files.length;
                $('#tip-usd').innerHTML = Number(await satsToDollars($('#tip').value)).toFixed(2);
                alert('Minimum tipping is ' + (100 * files.length) + ' sats based on your bulk amount. A suggestion has been added to the tip.');
                return;
            }
        }
    }
    else
    {
        let plugin_tip = await active_plugin.instance.tip();

        if(!estimate && tip_check < plugin_tip)
        {
            $('#tip').value = plugin_tip;
            $('#tip-usd').innerHTML = Number(await satsToDollars($('#tip').value)).toFixed(2);
            alert('Minimum tipping has been set to ' + plugin_tip + ' sats based on your inscriptions. A suggestion has been added to the tip.');
            return;
        }
    }

    const KeyPair = cryptoUtils.KeyPair;

    let seckey = new KeyPair(privkey);
    let pubkey = seckey.pub.rawX;

    const ec = new TextEncoder();

    const init_script = [
        pubkey,
        'OP_CHECKSIG'
    ];

    const init_script_backup = [
        '0x' + buf2hex(pubkey.buffer),
        'OP_CHECKSIG'
    ];

    let init_leaf = await TAPSCRIPT.Tree.getLeaf(TAPSCRIPT.Script.encode(init_script));
    let [init_tapkey] = await TAPSCRIPT.Tweak.getPubkey(pubkey, [init_leaf]);
    const init_cblock = await TAPSCRIPT.Tree.getPath(pubkey, init_leaf);

    console.log('PUBKEY', pubkey);

    let inscriptions = [];
    let total_fee = 0;

    let feerate = await getMinFeeRate();
    sessionStorage["determined_feerate"] = sessionStorage["feerate"];

    if (sessionStorage["feerate"]) {

        feerate = Number(sessionStorage["feerate"]);
        sessionStorage["determined_feerate"] = sessionStorage["feerate"];
    }

    let base_size = 160;

    for (let i = 0; i < files.length; i++) {

        const hex = files[i].hex;
        const data = hexToBytes(hex);
        const mimetype = ec.encode(files[i].mimetype);

        const script = [
            pubkey,
            'OP_CHECKSIG',
            'OP_0',
            'OP_IF',
            ec.encode('ord'),
            '01',
            mimetype,
            'OP_0',
            data,
            'OP_ENDIF'
        ];

        const script_backup = [
            '0x' + buf2hex(pubkey.buffer),
            'OP_CHECKSIG',
            'OP_0',
            'OP_IF',
            '0x' + buf2hex(ec.encode('ord')),
            '01',
            '0x' + buf2hex(mimetype),
            'OP_0',
            '0x' + buf2hex(data),
            'OP_ENDIF'
        ];

        const leaf = await TAPSCRIPT.Tree.getLeaf(TAPSCRIPT.Script.encode(script));
        const [tapkey] = await TAPSCRIPT.Tweak.getPubkey(pubkey, [leaf]);
        const cblock = await TAPSCRIPT.Tree.getPath(pubkey, leaf);

        let inscriptionAddress = TAPSCRIPT.Address.P2TR.encode(tapkey, encodedAddressPrefix);

        console.log('Inscription address: ', inscriptionAddress);
        console.log('Tapkey:', tapkey);

        let prefix = 160;

        if(files[i].sha256 != '')
        {
            prefix = feerate > 1 ? 546 : 700;
        }

        let txsize = prefix + Math.floor(data.length / 4);

        console.log("TXSIZE", txsize);

        let fee = feerate * txsize;
        total_fee += fee;

        inscriptions.push(
            {
                leaf: leaf,
                tapkey: tapkey,
                cblock: cblock,
                inscriptionAddress: inscriptionAddress,
                txsize: txsize,
                fee: fee,
                script: script_backup,
                script_orig: script
            }
        );
    }

    // we are covering 2 times the same outputs, once for seeder, once for the inscribers
    let total_fees = total_fee + ( ( 69 + ( ( inscriptions.length + 1 ) * 2 ) * 31 + 10 ) * feerate ) +
        (base_size * inscriptions.length) + (padding * inscriptions.length);

    if(estimate)
    {
        $('#estimated-fees').innerHTML = ' = ' + total_fees + ' sats ($' + (Number(await satsToDollars(total_fees)).toFixed(2)) + ')';
        return files;
    }

    let fundingAddress = TAPSCRIPT.Address.P2TR.encode(init_tapkey, encodedAddressPrefix);
    console.log('Funding address: ', fundingAddress, 'based on', init_tapkey);

    let toAddress = $('.address').value;
    console.log('Address that will receive the inscription:', toAddress);

    let decodedToAddress = "5120" + TAPSCRIPT.Address.P2TR.decode(toAddress).hex;
    console.log('To address decoded:', decodedToAddress);

    $('#backup').style.display = "none";
    $('.submit').style.display = "none";
    $('.estimate').style.display = "none";
    $('#estimated-fees').style.display = "none";
    $('.startover').style.display = "inline-block";

    let tip = parseInt($('#tip').value);

    if(!isNaN(tip) && tip >= 500)
    {
        total_fees += (50 * feerate) + tip;
    }

    let sats_price = await satsToDollars(total_fees);
    sats_price = Math.floor(sats_price * 100) / 100;

    let html = `<p>Please send at least <strong>${total_fees} sats</strong> ($${sats_price}) to the address below (click to copy). Once you sent the amount, do NOT close this window!</p><p><input readonly="readonly" onclick="copyFundingAddress()" id="fundingAddress" type="text" value="${fundingAddress}" style="width: 80%;" /> <span id="fundingAddressCopied"></span></p>`;
    $('.display').innerHTML = html;

    let qr_value = "bitcoin:" + fundingAddress + "?amount=" + satsToBitcoin(total_fees);
    console.log("qr:", qr_value);

    let overhead = total_fees - total_fee - (padding * inscriptions.length) - tip;

    if(isNaN(overhead))
    {
        overhead = 0;
    }

    if(isNaN(tip))
    {
        tip = 0;
    }

    $('.display').append(createQR(qr_value));
    $('.display').innerHTML += `<p class="checking_mempool">Checking the mempool<span class="dots">.</span></p>`;
    $('.display').innerHTML += '<p>' + (padding * inscriptions.length) + ` sats will go to the address.</p><p>${total_fee} sats will go to miners as a mining fee.</p><p>${overhead} sats overhead will be used as boost.</p><p>${tip} sats for developer tipping.</p>`;
    $('.display').style.display = "block";
    $('#setup').style.display = "none";

    await insDateStore(privkey, new Date().toString());

    let transaction = [];
    transaction.push({txsize : 60, vout : 0, script: init_script_backup, output : {value: total_fees, scriptPubKey: '5120' + init_tapkey}});
    transaction.push({txsize : 60, vout : 1, script: init_script_backup, output : {value: total_fees, scriptPubKey: '5120' + init_tapkey}});
    await insStore(privkey, JSON.stringify(transaction));

    /*
    if(!$('#cpfp').checked){

        await loopTilAddressReceivesMoney(fundingAddress, true);
        await waitSomeSeconds(2);

        $('.modal-content').innerHTML = '<div id="funds-msg">Funds are on the way. Please wait'+(!$('#cpfp').checked ? ' for the funding transaction to confirm (CPFP disabled)' : '')+'...</div>';
        $('.modal').style.display = "block";
    }*/

    await loopTilAddressReceivesMoney(fundingAddress, true);
    await waitSomeSeconds(2);
    let txinfo = await addressReceivedMoneyInThisTx(fundingAddress);

    let txid = txinfo[0];
    let vout = txinfo[1];
    let amt = txinfo[2];

    console.log("yay! txid:", txid, "vout:", vout, "amount:", amt);

    $('.modal-content').innerHTML = '<div id="funds-msg">Inscriptions about to begin. Please wait'+(!$('#cpfp').checked ? ' for the seed transaction to confirm (CPFP disabled)' : '')+'...</div>';
    $('.modal').style.display = "block";

    let outputs = [];

    transaction = [];
    transaction.push({txsize : 60, vout : vout, script: init_script_backup, output : {value: amt, scriptPubKey: '5120' + init_tapkey}});

    for (let i = 0; i < inscriptions.length; i++) {

        outputs.push(
            {
                value: padding + inscriptions[i].fee,
                scriptPubKey: '5120' + inscriptions[i].tapkey
            }
        );

        transaction.push({txsize : inscriptions[i].txsize, vout : i, script: inscriptions[i].script, output : outputs[outputs.length - 1]});
    }

    if(!isNaN(tip) && tip >= 500)
    {
        outputs.push(
            {
                value: tip,
                scriptPubKey: '5120' + TAPSCRIPT.Address.P2TR.decode(tippingAddress, encodedAddressPrefix).hex
            }
        );
    }

    await insStore(privkey, JSON.stringify(transaction));

    const init_redeemtx = {
        version: 2,
        input: [{
            txid: txid,
            vout: vout,
            prevout: {value: amt, scriptPubKey: '5120' + init_tapkey},
            witness: []
        }],
        output: outputs,
        locktime: 0
    };

    const init_sig = await TAPSCRIPT.Sig.taproot.sign(seckey.raw, init_redeemtx, 0, {extension: init_leaf});
    init_redeemtx.input[0].witness = [init_sig, init_script, init_cblock];

    console.dir(init_redeemtx, {depth: null});
    console.log('YOUR SECKEY', seckey);

    let rawtx = TAPSCRIPT.Tx.encode(init_redeemtx);
    let _txid = await pushBTCpmt(rawtx);

    console.log('Init TX', _txid);

    let include_mempool = $('#cpfp').checked;

    async function inscribe(inscription, vout) {

        // we are running into an issue with 25 child transactions for unconfirmed parents.
        // so once the limit is reached, we wait for the parent tx to confirm.

        await loopTilAddressReceivesMoney(inscription.inscriptionAddress, include_mempool);
        await waitSomeSeconds(2);
        let txinfo2 = await addressReceivedMoneyInThisTx(inscription.inscriptionAddress);

        document.getElementById('modal-reset').style.display = 'block';
        document.getElementById('funds-msg').style.display = 'none';

        let txid2 = txinfo2[0];
        let amt2 = txinfo2[2];

        const redeemtx = {
            version: 2,
            input: [{
                txid: txid2,
                vout: vout,
                prevout: {value: amt2, scriptPubKey: '5120' + inscription.tapkey},
                witness: []
            }],
            output: [{
                value: amt2 - inscription.fee,
                scriptPubKey: decodedToAddress
            }],
            locktime: 0
        };

        const sig = await TAPSCRIPT.Sig.taproot.sign(seckey.raw, redeemtx, 0, {extension: inscription.leaf});
        redeemtx.input[0].witness = [sig, inscription.script_orig, inscription.cblock];

        console.dir(redeemtx, {depth: null});

        let rawtx2 = TAPSCRIPT.Tx.encode(redeemtx);
        let _txid2;

        // since we don't know any mempool space api rate limits, we will be careful with spamming
        await isPushing();
        pushing = true;
        _txid2 = await pushBTCpmt( rawtx2 );
        await sleep(1000);
        pushing = false;

        if(_txid2.includes('descendant'))
        {
            include_mempool = false;
            inscribe(inscription, vout);
            $('#descendants-warning').style.display = 'inline-block';
            return;
        }

        try {

            JSON.parse(_txid2);

            let html = `<p style="background-color: white; color: black;">Error: ${_txid2}</p>`;
            html += '<hr/>';
            $('.modal').innerHTML += html;

        } catch (e) {

            let html = `<p style="background-color: white; color: black;">Inscription #${vout} transaction:</p><p style="word-wrap: break-word;"><a href="https://mempool.space/${mempoolNetwork}tx/${_txid2}" target="_blank">https://mempool.space/${mempoolNetwork}tx/${_txid2}</a></p>`;
            html += `<p style="background-color: white; color: black;">Ordinals explorer (after tx confirmation):</p><p style="word-wrap: break-word;"><a href="https://ordinals.com/inscription/${_txid2}i0" target="_blank">https://ordinals.com/inscription/${_txid2}i0</a></p>`;
            html += '<hr/>';
            $('.modal-content').innerHTML += html;
        }

        $('.modal').style.display = "block";
        $('.black-bg').style.display = "block";
    }

    for (let i = 0; i < inscriptions.length; i++) {

        inscribe(inscriptions[i], i);
    }
}

async function initDatabase(){

    db = await idb.openDB("Inscriptions", 1, {
        upgrade(db, oldVersion, newVersion, transaction, event) {
            let store = db.createObjectStore("InscriptionsLog", {keyPath: "PrivKey"});
            let index = store.createIndex("PrivKey", "data.inscription", { unique: false });
            console.log(index);
            store = db.createObjectStore("InscriptionDates", {keyPath: "PrivKey"});
            index = store.createIndex("PrivKey", "data.date", { unique: false });
            console.log(index);
        }
    });
}

async function insDateStore(key, val){
    let tx = db.transaction("InscriptionDates", "readwrite");
    let store = tx.objectStore("InscriptionDates");
    await store.put({PrivKey: key, data : { date : val} });
    await tx.done;
}

async function insDateGet(key){
    let tx = db.transaction("InscriptionDates", "readwrite");
    let store = tx.objectStore("InscriptionDates");
    let date = await store.get(key);
    await tx.done;
    return date.data.date;
}

async function insDateDelete(key){
    let tx = db.transaction("InscriptionDates", "readwrite");
    let store = tx.objectStore("InscriptionDates");
    await store.delete(key);
    await tx.done;
}

async function insGet(key){
    let tx = db.transaction("InscriptionsLog", "readwrite");
    let store = tx.objectStore("InscriptionsLog");
    let inscription = await store.get(key);
    await tx.done;
    return inscription.data.inscription;
}

async function insStore(key, val){
    let tx = db.transaction("InscriptionsLog", "readwrite");
    let store = tx.objectStore("InscriptionsLog");
    await store.put({PrivKey: key, data : { inscription : val} });
    await tx.done;
}

async function insGet(key){
    let tx = db.transaction("InscriptionsLog", "readwrite");
    let store = tx.objectStore("InscriptionsLog");
    let inscription = await store.get(key);
    await tx.done;
    return inscription.data.inscription;
}

async function insDelete(key){
    let tx = db.transaction("InscriptionsLog", "readwrite");
    let store = tx.objectStore("InscriptionsLog");
    await store.delete(key);
    await tx.done;
}

async function insGetAllKeys(){
    let tx = db.transaction("InscriptionsLog", "readwrite");
    let store = tx.objectStore("InscriptionsLog");
    let index = store.index("PrivKey");
    let allKeys = await index.getAllKeys();
    await tx.done;
    return allKeys;
}

async function insQuota(){
    const quota = await navigator.storage.estimate();
    return quota;
}

async function recover(index, utxo_vout, to, privkey) {

    if(!isValidTaprootAddress(to))
    {
        $('#recovery-item-'+privkey+'-'+utxo_vout).innerHTML += '<div style="font-size: 14px;">Invalid taproot address. Please add the recovery recipient in the "Receiving address" at the very top.</a>';
        console.log('Invalid to address.');
        return;
    }

    let feerate = await getMinFeeRate();

    if (sessionStorage["feerate"]) {

        feerate = Number(sessionStorage["feerate"]);
    }

    const KeyPair = cryptoUtils.KeyPair;
    let tx = JSON.parse(await insGet(privkey));
    let seckey = new KeyPair(privkey);
    let pubkey = seckey.pub.rawX;
    let inputs = [];
    let base_fee = feerate * tx[index].txsize;
    let scripts = [];
    let plainTapKey = tx[index].output.scriptPubKey.replace('5120', '');
    let response = await getData('https://mempool.space/'+mempoolNetwork+'api/address/' + TAPSCRIPT.Address.P2TR.encode(plainTapKey, encodedAddressPrefix) + '/utxo');
    let utxos = JSON.parse(response);
    let utxo = null;

    for (let i = 0; i < utxos.length; i++)
    {
        if(utxos[i].vout == utxo_vout)
        {
            utxo = utxos[i];
            break;
        }
    }

    if(utxo === null)
    {
        $('#recovery-item-'+privkey+'-'+utxo_vout).innerHTML += '<div style="font-size: 14px;">Utxo not found</a>';
        console.log('Utxo not found');
        return;
    }

    console.log(TAPSCRIPT.Address.P2TR.encode(plainTapKey, encodedAddressPrefix));
    console.log(utxo);

    let txid = utxo.txid;

    console.log(tx[index]);

    for(let j = 0; j < tx[index].script.length; j++){

        if(tx[index].script[j].startsWith('0x'))
        {
            tx[index].script[j] = hexToBytes(tx[index].script[j].replace('0x',''), 'hex');
        }
    }

    let script = tx[index].script;
    delete tx[index].script;
    tx[index].output.value = utxo.value;

    inputs.push({
        txid: txid,
        vout: utxo_vout,
        prevout: tx[index].output,
        witness: []
    });

    scripts.push(script);

    console.log('RECOVER:INPUTS', inputs);

    if(utxo.value - base_fee <= 0){

        $('#recovery-item-'+privkey+'-'+utxo_vout).innerHTML += '<div style="font-size: 14px;">Nothing found to recover: ' + (utxo.value - base_fee) + ' sats</div>';

        return;
    }

    let output_value = utxo.value - base_fee;

    if(output_value - 546 > 546)
    {
        output_value = output_value - 546;
    }

    const redeemtx = {
        version: 2,
        input: inputs,
        output: [
            {
                value: output_value,
                scriptPubKey: '5120' + TAPSCRIPT.Address.P2TR.decode(to, encodedAddressPrefix).hex
            }
        ],
        locktime: 0
    };

    console.log(scripts);

    for(let i = 0; i < inputs.length; i++){

        let leaf = await TAPSCRIPT.Tree.getLeaf(TAPSCRIPT.Script.encode(scripts[i]));
        const cblock = await TAPSCRIPT.Tree.getPath(pubkey, leaf);
        const sig = await TAPSCRIPT.Sig.taproot.sign(seckey.raw, redeemtx, 0, { extension: leaf });

        redeemtx.input[i].witness = [sig, scripts[i], cblock];
    }

    console.log('RECOVER:REDEEMTEX', redeemtx);

    let rawtx = TAPSCRIPT.Tx.encode(redeemtx);
    let _txid = await pushBTCpmt(rawtx);

    if(_txid.includes('descendant'))
    {
        _txid = 'Please wait for the other transactions to finish and then try again.';
    }

    console.log('RECOVER:PUSHRES', _txid);

    $('#recovery-item-'+privkey+'-'+utxo_vout).innerHTML += '<div style="font-size: 14px;">Result: ' + _txid+'</div>';
}

function addMoreText(){

    let cloned = $$('.text_area')[0].cloneNode(true);
    cloned.value = '';
    document.getElementById("form_container").appendChild(cloned);
    cloned.focus();
}

function arrayBufferToBuffer(ab) {
    var buffer = new buf.Buffer(ab.byteLength)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i]
    }
    return buffer
}

function hexString(buffer) {
    const byteArray = new Uint8Array(buffer)
    const hexCodes = [...byteArray].map(value => {
        return value.toString(16).padStart(2, '0')
    })

    return '0x' + hexCodes.join('')
}

async function fileToArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader()
        const readFile = function (event) {
            const buffer = reader.result
            resolve(buffer)
        }

        reader.addEventListener('load', readFile)
        reader.readAsArrayBuffer(file)
    })
}

async function bufferToSha256(buffer) {
    return window.crypto.subtle.digest('SHA-256', buffer)
}

async function fileToSha256Hex(file) {
    const buffer = await fileToArrayBuffer(file)
    const hash = await bufferToSha256(arrayBufferToBuffer(buffer))
    return hexString(hash)
}

function copyFundingAddress() {
    let copyText = document.getElementById("fundingAddress");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    document.getElementById("fundingAddressCopied").innerHTML = ' Copied!';
    setTimeout(function () {

        document.getElementById("fundingAddressCopied").innerHTML = '';

    }, 5000);
}

async function isPushing() {
    while (pushing) {
        await sleep(10);
    }
}

function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMaxFeeRate() {
    let fees = await getData("https://mempool.space/" + mempoolNetwork + "api/v1/fees/recommended");
    fees = JSON.parse(fees);
    // if ( !( "minimumFee" in fees ) ) return "error -- site down";
    // var minfee = fees[ "minimumFee" ];
    if (!("fastestFee" in fees)) return "error -- site down";
    let maxfee = fees["fastestFee"];
    return maxfee;
}

async function getMinFeeRate() {
    let fees = await getData("https://mempool.space/" + mempoolNetwork + "api/v1/fees/recommended");
    fees = JSON.parse(fees);
    if (!("minimumFee" in fees)) return "error -- site down";
    let minfee = fees["minimumFee"];
    // if ( !( "fastestFee" in fees ) ) return "error -- site down";
    // var maxfee = fees[ "fastestFee" ];
    return minfee;
}

function isValidTaprootAddress(address) {
    try {
        TAPSCRIPT.Address.P2TR.decode(address).hex;
        return true;
    } catch (e) {
        console.log(e);
    }
    return;
}

function isValidJson(content) {
    if (!content) return;
    try {
        var json = JSON.parse(content);
    } catch (e) {
        return;
    }
    return true;
}

async function getAllFeeRates() {
    let fees = await getData("https://mempool.space/" + mempoolNetwork + "api/v1/fees/recommended");
    fees = JSON.parse(fees);
    return fees;
}

function getData(url) {
    return new Promise(async function (resolve, reject) {
        function inner_get(url) {
            let xhttp = new XMLHttpRequest();
            xhttp.open("GET", url, true);
            xhttp.send();
            return xhttp;
        }

        let data = inner_get(url);
        data.onerror = function (e) {
            resolve("error");
        }

        async function isResponseReady() {
            return new Promise(function (resolve2, reject) {
                if (!data.responseText || data.readyState != 4) {
                    setTimeout(async function () {
                        let msg = await isResponseReady();
                        resolve2(msg);
                    }, 1);
                } else {
                    resolve2(data.responseText);
                }
            });
        }

        let returnable = await isResponseReady();
        resolve(returnable);
    });
}

async function pushBTCpmt(rawtx) {

    let txid;

    try
    {
        txid = await postData("https://mempool.space/" + mempoolNetwork + "api/tx", rawtx);

        if( ( txid.toLowerCase().includes('rpc error') || txid.toLowerCase().includes('too many requests') ) && !txid.includes('descendant'))
        {
            if(encodedAddressPrefix == 'main')
            {
                console.log('USING BLOCKSTREAM FOR PUSHING INSTEAD');
                txid = await postData("https://blockstream.info/api/tx", rawtx);
            }
        }
    }
    catch(e)
    {
        if(encodedAddressPrefix == 'main')
        {
            console.log('USING BLOCKSTREAM FOR PUSHING INSTEAD');
            txid = await postData("https://blockstream.info/api/tx", rawtx);
        }
    }

    return txid;
}

function waitSomeSeconds(number) {
    let num = number.toString() + "000";
    num = Number(num);
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve("");
        }, num);
    });
}

async function postData(url, json, content_type = "", apikey = "") {
    let rtext = "";

    function inner_post(url, json, content_type = "", apikey = "") {
        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", url, true);
        if (content_type) {
            xhttp.setRequestHeader(`Content-Type`, content_type);
        }
        if (apikey) {
            xhttp.setRequestHeader(`X-Api-Key`, apikey);
        }
        xhttp.send(json);
        return xhttp;
    }

    let data = inner_post(url, json, content_type, apikey);
    data.onerror = function (e) {
        rtext = "error";
    }

    async function isResponseReady() {
        return new Promise(function (resolve, reject) {
            if (rtext == "error") {
                resolve(rtext);
            }
            if (!data.responseText || data.readyState != 4) {
                setTimeout(async function () {
                    let msg = await isResponseReady();
                    resolve(msg);
                }, 50);
            } else {
                resolve(data.responseText);
            }
        });
    }

    let returnable = await isResponseReady();
    return returnable;
}

async function loopTilAddressReceivesMoney(address, includeMempool) {
    let itReceivedMoney = false;

    async function isDataSetYet(data_i_seek) {
        return new Promise(function (resolve, reject) {
            if (!data_i_seek) {
                setTimeout(async function () {
                    console.log("waiting for address to receive money...");
                    try {
                        itReceivedMoney = await addressOnceHadMoney(address, includeMempool);
                    }catch(e){ }
                    let msg = await isDataSetYet(itReceivedMoney);
                    resolve(msg);
                }, 2000);
            } else {
                resolve(data_i_seek);
            }
        });
    }

    async function getTimeoutData() {
        let data_i_seek = await isDataSetYet(itReceivedMoney);
        return data_i_seek;
    }

    let returnable = await getTimeoutData();
    return returnable;
}

async function addressReceivedMoneyInThisTx(address) {
    let txid;
    let vout;
    let amt;
    let nonjson;

    try
    {
        nonjson = await getData("https://mempool.space/" + mempoolNetwork + "api/address/" + address + "/txs");

        if(nonjson.toLowerCase().includes('rpc error') || nonjson.toLowerCase().includes('too many requests'))
        {
            if(encodedAddressPrefix == 'main')
            {
                nonjson = await getData("https://blockstream.info/api/address/" + address + "/txs");
            }
        }
    }
    catch(e)
    {
        if(encodedAddressPrefix == 'main')
        {
            nonjson = await getData("https://blockstream.info/api/address/" + address + "/txs");
        }
    }

    let json = JSON.parse(nonjson);
    json.forEach(function (tx) {
        tx["vout"].forEach(function (output, index) {
            if (output["scriptpubkey_address"] == address) {
                txid = tx["txid"];
                vout = index;
                amt = output["value"];
            }
        });
    });
    return [txid, vout, amt];
}

async function addressOnceHadMoney(address, includeMempool) {
    let url;
    let nonjson;

    try
    {
        url = "https://mempool.space/" + mempoolNetwork + "api/address/" + address;
        nonjson = await getData(url);

        if(nonjson.toLowerCase().includes('rpc error') || nonjson.toLowerCase().includes('too many requests'))
        {
            if(encodedAddressPrefix == 'main')
            {
                url = "https://blockstream.info/api/address/" + address;
                nonjson = await getData(url);
            }
        }
    }
    catch(e)
    {
        if(encodedAddressPrefix == 'main')
        {
            url = "https://blockstream.info/api/address/" + address;
            nonjson = await getData(url);
        }
    }

    if (!isValidJson(nonjson)) return false;
    let json = JSON.parse(nonjson);
    if (json["chain_stats"]["tx_count"] > 0 || (includeMempool && json["mempool_stats"]["tx_count"] > 0)) {
        return true;
    }
    return false;
}

async function probeAddress(address) {
    let url = "https://mempool.space/" + mempoolNetwork + "api/address/" + address;
    let nonjson = await getData(url);
    if (!isValidJson(nonjson)) return false;
    return true;
}

function dotLoop(string) {
    if (!$('.dots')) {
        setTimeout(function () {
            dotLoop(string);
        }, 1000);
        return;
    }
    if (string.length < 3) {
        string = string + ".";
    } else {
        string = ".";
    }
    $('.dots').innerText = string;
    setTimeout(function () {
        dotLoop(string);
    }, 1000);
}

dotLoop(".");

function timer(num) {
    if (!num) {
        $('.timer').style.display = "none";
        return;
    }
    num = num - 1;
    $('.timer').innerText = num;
    setTimeout(function () {
        timer(num);
    }, 1000);
}

function satsToBitcoin(sats) {
    if (sats >= 100000000) sats = sats * 10;
    let string = String(sats).padStart(8, "0").slice(0, -9) + "." + String(sats).padStart(8, "0").slice(-9);
    if (string.substring(0, 1) == ".") string = "0" + string;
    return string;
}

async function satsToDollars(sats) {
    if (sats >= 100000000) sats = sats * 10;
    let bitcoin_price = sessionStorage["bitcoin_price"];
    let value_in_dollars = Number(String(sats).padStart(8, "0").slice(0, -9) + "." + String(sats).padStart(8, "0").slice(-9)) * bitcoin_price;
    return value_in_dollars;
}

function modalVanish() {
    $(".black-bg").style.display = "none";
    $(".modal").style.display = "none";
}

$$('.fee').forEach(function (item) {
    item.onclick = function () {
        $$('.fee .num').forEach(function (item2) {
            item2.style.backgroundColor = "grey";
        });
        this.getElementsByClassName("num")[0].style.backgroundColor = "green";
        sessionStorage["feerate"] = this.getElementsByClassName("num")[0].innerText;
        $('#sats_per_byte').innerText = Number(this.getElementsByClassName("num")[0].innerText);
        $('#sats_range').value = Number(this.getElementsByClassName("num")[0].innerText);
    }
});

function isValidAddress() {

    if (!isValidTaprootAddress($('.address').value)) {
        return false;
    }

    return true;
}

function isValidAddress2(address) {

    if (!isValidTaprootAddress(address)) {
        return false;
    }

    return true;
}

function checkAddress() {
    if (!isValidAddress()) {
        $('.address').style.backgroundColor = "#ff5252";
        $('.address').style.border = "2px solid red";
        $('.type_of_address').style.border = "1px solid white";
    } else {
        $('.address').style.backgroundColor = "initial";
        $('.address').style.border = "1px solid white";
        $('.type_of_address').style.borderStyle = "none";
        if(isValidAddress())
        {
            $('#transfer-balance-link').href = 'https://unisat.io/brc20?q=' + $('.address').value;
        }
    }
}

$('.address').onchange = checkAddress;
$('.address').onpaste = checkAddress;
$('.address').onkeyup = checkAddress;

async function isUsedDomain(domain) {
    let data = await getData(`https://api.sats.id/names/${encodeURIComponent(domain)}`);
    console.log("data:", data);
    data = JSON.parse(data);
    console.log("data:", data);
    if ("name" in data) return true;
    if (data["error"] == "Too many requests") return null;
    return false;
}

async function isUsedUnisatDomain(domain) {

    let data = await getData('api/existence.php?text='+encodeURIComponent(domain));

    try
    {
        data = JSON.parse(data);
    }
    catch(e)
    {
        // in case of the api not available or php not being executed, check the text and hope for the best
        let fallback = await isUsedUnisatDomainFallback(':"'+domain+'"');

        if(fallback === false)
        {
            fallback = await isUsedUnisatDomainFallback(domain);
        }

        return fallback;
    }

    if(typeof data.data[domain] == 'undefined' || data.data[domain] == 'available')
    {
        return false;
    }

    return true;
}

async function isUsedUnisatDomainFallback(domain) {

    let data = await getData('https://api2.ordinalsbot.com/search?text='+encodeURIComponent(domain));
    console.log("data:", data);
    try
    {
        data = JSON.parse(data);
    }
    catch(e)
    {
        return null;
    }

    if(data.count == 0)
    {
        return false;
    }

    return true;
}

async function checkUnisatDomain() {

    $('.unisat_checker').innerHTML = 'Please wait...';

    let i = 1;
    let registered = [];
    let rate_limited = false;
    let sats_domains = $('.unisat_text').value.split("\n");
    let sats_domains_cleaned = [];

    for (let sats_domain in sats_domains) {

        let domain = sats_domains[sats_domain].trim();

        if (domain == '' || sats_domains_cleaned.includes(domain)) {

            continue;
        }

        sats_domains_cleaned.push(domain);
    }

    for (let sats_domain in sats_domains_cleaned) {

        let domain = sats_domains_cleaned[sats_domain].trim();

        $('.unisat_checker').innerHTML = 'Checking...(' + i + '/' + sats_domains_cleaned.length + ')';

        let isUsed = await isUsedUnisatDomain(domain);

        if (domain && isUsed === true) {

            registered.push(domain);

        } else if (domain && isUsed === null) {

            rate_limited = true;
            break;
        }

        await sleep(1000);

        i++;
    }

    $('.unisat_checker').innerHTML = 'Check availability';

    if (rate_limited) {
        alert('Cannot check any domain availability as a rate limit occurred.');
    }

    if (registered.length != 0) {
        alert('The domain(s) ' + registered.join(', ') + ' is/are already registered.');
    } else {
        alert('All domains are available.');
    }
}


async function checkDomain() {

    $('.dns_checker').innerHTML = 'Please wait...';

    let i = 1;
    let registered = [];
    let rate_limited = false;
    let sats_domains = $('.dns').value.split("\n");
    let sats_domains_cleaned = [];

    for (let sats_domain in sats_domains) {

        let domain = sats_domains[sats_domain].trim();

        if (domain == '' || sats_domains_cleaned.includes(domain)) {

            continue;
        }

        sats_domains_cleaned.push(domain);
    }

    for (let sats_domain in sats_domains_cleaned) {

        let domain = sats_domains_cleaned[sats_domain].trim();

        $('.dns_checker').innerHTML = 'Checking...(' + i + '/' + sats_domains_cleaned.length + ')';

        let isUsed = await isUsedDomain(domain);

        if (domain && isUsed === true) {

            registered.push(domain);

        } else if (domain && isUsed === null) {

            rate_limited = true;
            break;
        }

        await sleep(1000);

        i++;
    }

    $('.dns_checker').innerHTML = 'Check availability';

    if (rate_limited) {
        alert('Cannot check any domain availability as a rate limit occurred.');
    }

    if (registered.length != 0) {
        alert('The domain(s) ' + registered.join(', ') + ' is/are already registered.');
    } else {
        alert('All domains are available.');
    }
}

$('.unisat_checker').onclick = checkUnisatDomain;
$('.dns_checker').onclick = checkDomain;
$('#bytes_checker').onclick = async function () {
    $('#bytes_checker').innerHTML = 'Please wait...';

    let inscribed_already = [];
    let errors = [];

    for (let i = 0; i < files.length; i++) {
        $('#bytes_checker').innerHTML = 'Please wait...(' + (i + 1) + '/' + files.length + ')';

        let hash_result = await getData('https://api2.ordinalsbot.com/search?hash=' + files[i].sha256);

        console.log(hash_result);

        try {
            hash_result = JSON.parse(hash_result);

            if (hash_result.results.length != 0) {
                inscribed_already.push(files[i].name);
            }
        } catch (e) {
            errors.push(files[i].name);
        }
        await sleep(1000);
    }

    if (inscribed_already.length != 0) {
        alert("The following files are inscribed already: " + inscribed_already.join(', '));
    }

    if (errors.length != 0) {
        alert("Could not check the following files due to an error: " + inscribed_already.join(', '));
    }

    if (inscribed_already.length == 0) {
        alert("Your files seem not to be inscribed yet.");
    }

    $('#bytes_checker').innerHTML = 'Check if file(s) are inscribed already';
}

async function init(num) {

    if (!num) {
        let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) $('.safari_warning').style.display = "block";
        let minfee = await getMinFeeRate();
        $('#sats_per_byte').innerText = minfee;
        $('#sats_range').value = minfee;
    }
    num = num + 1;
    let allrates = await getAllFeeRates();
    $('.minfee .num').innerText = allrates["minimumFee"];
    $('.midfee .num').innerText = allrates["hourFee"];
    $('.maxfee .num').innerText = allrates["fastestFee"];
    let isgreen;
    $$('.fee .num').forEach(function (item) {
        if (item.style.backgroundColor == "green" || getComputedStyle(item).backgroundColor == "rgb(0, 128, 0)") isgreen = item;
    });
    if (isgreen) {
        $('#sats_per_byte').innerText = Number(isgreen.innerText);
        $('#sats_range').value = Number(isgreen.innerText);
        sessionStorage["feerate"] = isgreen.innerText;
    }
    sessionStorage["bitcoin_price"] = await getBitcoinPrice();
    await waitSomeSeconds(10);
    init(num);
}

function encodeBase64(file) {
    return new Promise(function (resolve, reject) {
        let imgReader = new FileReader();
        imgReader.onloadend = function () {
            resolve(imgReader.result.toString());
        }
        imgReader.readAsDataURL(file);
    });
}

function base64ToHex(str) {
    const raw = atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += (hex.length === 2 ? hex : '0' + hex);
    }
    return result.toLowerCase();
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function bytesToHex(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

function textToHex(text) {
    var encoder = new TextEncoder().encode(text);
    return [...new Uint8Array(encoder)]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
}

function createQR(content) {
    let dataUriPngImage = document.createElement("img"),
        s = QRCode.generatePNG(content, {
            ecclevel: "M",
            format: "html",
            fillcolor: "#FFFFFF",
            textcolor: "#000000",
            margin: 4,
            modulesize: 8,
        });
    dataUriPngImage.src = s;
    dataUriPngImage.id = "qr_code";
    return dataUriPngImage;
}

async function getBitcoinPriceFromCoinbase() {
    let data = await getData("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    let json = JSON.parse(data);
    let price = json["data"]["amount"];
    return price;
}

async function getBitcoinPriceFromKraken() {
    let data = await getData("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
    let json = JSON.parse(data);
    let price = json["result"]["XXBTZUSD"]["a"][0];
    return price;
}

async function getBitcoinPriceFromCoindesk() {
    let data = await getData("https://api.coindesk.com/v1/bpi/currentprice.json");
    let json = JSON.parse(data);
    let price = json["bpi"]["USD"]["rate_float"];
    return price;
}

async function getBitcoinPriceFromGemini() {
    let data = await getData("https://api.gemini.com/v2/ticker/BTCUSD");
    let json = JSON.parse(data);
    let price = json["bid"];
    return price;
}

async function getBitcoinPriceFromBybit() {
    let data = await getData("https://api-testnet.bybit.com/derivatives/v3/public/order-book/L2?category=linear&symbol=BTCUSDT");
    let json = JSON.parse(data);
    let price = json["result"]["b"][0][0];
    return price;
}

async function getBitcoinPrice() {
    let prices = [];
    let cbprice = await getBitcoinPriceFromCoinbase();
    let kprice = await getBitcoinPriceFromKraken();
    let cdprice = await getBitcoinPriceFromCoindesk();
    let gprice = await getBitcoinPriceFromGemini();
    let bprice = await getBitcoinPriceFromBybit();
    prices.push(Number(cbprice), Number(kprice), Number(cdprice), Number(gprice), Number(bprice));
    prices.sort();
    return prices[2];
}

init(0);