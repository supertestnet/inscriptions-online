function satsresolver(){

    let _this = this;

    _this.init = async function()
    {

    }

    _this.onPluginLoaded = async function()
    {

    }

    _this.tip = async function()
    {

        return 4000;
    }

    _this.getTitle = function(){

        return '.sats domain hosting';
    }

    _this.getPadding = function(){

        return 546;
    }

    _this.render = async function(){

        return '<div style="border: 1px solid white; padding: 10px; margin-bottom: 15px;"><p>In order to visit .sats domains, a browser plugin is required (similar to Metamask and ENS domains).</p>' +
            '<p>As initial revision, there is an extension for Chrome/Brave/Edge that must be downloaded and installed <a href="ordinals-sats-resolver.zip" target="_blank">from here</a>. Please read <a href="https://bashvlas.com/blog/install-chrome-extension-in-developer-mode/" target="_blank">these instructions</a> on how to manually install browser extensions.</p>' +
            '<p>The extension has been submitted for review to Google. Once accepted, you may directly install from the Google Store. Also see the <a href="https://github.com/BennyTheDev/sats-resolver" target="_blank">project on Github</a>.</p>' +
            '<hr/>' +
            '<p>Howto:</p>' +
            '<p>I. Inscribe a resolver below to a receiving address specified above that does NOT own the original .sats registration inscription. The "Content" field accepts either an ipfs or https location where your sats domain should redirect to.</p>' +
            '<p>II. Wait for the resolver inscription to confirm.</p>' +
            '<p>III. Using your wallet, send your original .sats registration inscription to the same receiving address as the resolver. ONLY send the registration inscription AFTER the resolver has been confirmed. Do NOT send both in the same block.</p>' +
            '<p>IV. Install the browser extension and enter your sats domain in the url bar (e.h. https://supergreg.sats/). It is important that the domain in the url bar starts with https://, otherwise you will be lead to search results by the browser instead.</p>' +
            '<hr/>' +
            '<p>Note:</p>' +
            '<p>Since you will be sending your registration inscription to a new address, wallets like Unisat will send funds to the new address. It may take a little after all transactions have been confirmed before your domain works.</p>' +
            '</div>' +
            '<div>' +
            '<label for="satsresolver_domain">Your Domain</label>' +
            '<input type="text" id="satsresolver_domain" placeholder="your .sats domain. e.g. ordi.sats"/>' +
            '<label for="satsresolver_content">Content (to redirect to)</label>' +
            '<input type="text" id="satsresolver_content" placeholder="e.g. ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5"/>' +
            '</div>';

    }

    _this.prepare = async function(){

        files = [];

        let _domain = $('#satsresolver_domain').value;
        let _content = $('#satsresolver_content').value;

        if(!_domain.endsWith('.sats'))
        {
            alert('Please enter a sats domain. The domain must be registered before. If you did not yet register your domain, please do so first.');
            return false;
        }

        if(!_content.startsWith('ipfs://') && !_content.startsWith('https://') && !_content.startsWith('http://') )
        {
            alert('Please enter an ipfs address with hash or a domain name starting with https.');
            return false;
        }

        let mimetype = "text/plain;charset=utf-8";
        let domain = {"p": "sns", "op": "res", "name": _domain.trim(), "content" : _content};
        files.push({
            text: JSON.stringify(domain),
            name: _domain.trim(),
            hex: textToHex(JSON.stringify(domain)),
            mimetype: mimetype,
            sha256: ''
        });

        console.log(domain);

        return true;
    }
}