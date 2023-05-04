function orc20deploy(){

    let _this = this;

    _this.init = async function()
    {

    }

    _this.onPluginLoaded = async function()
    {

    }

    _this.tip = async function()
    {

        return 1000;
    }


    _this.getTitle = function(){

        return 'orc-20 deploy';
    }

    _this.getPadding = function(){

        return 546;
    }

    _this.render = async function(){

        return '<p>Basic Options</p><div>\n' +
            '                <label for="orc20-deploy-ticker">Ticker</label>' +
            '                    <input id="orc20-deploy-ticker" type="text" value=""' +
            '                           placeholder="e.g. orc"/>' +
            '                </div>' +
            '                    <label for="orc20-deploy-name">Name (optional)</label>' +
            '                    <input id="orc20-deploy-name" type="text" value=""' +
            '                           placeholder="e.g. My Token"/>' +
            '                </div>' +
            '                </div>' +
            '                    <label for="orc20-deploy-id">ID (optional)</label>' +
            '                    <input id="orc20-deploy-id" type="text" value=""' +
            '                           placeholder="default: 1"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-max">Supply (optional)</label>' +
            '                    <input id="orc20-deploy-max" type="text" value="" placeholder="default: unlimited"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-lim">Limit per mint (optional)</label>' +
            '                    <input id="orc20-deploy-lim" type="text" value="" placeholder="default: 1"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-dec">Decimals (optional)</label>' +
            '                    <input id="orc20-deploy-dec" type="text" value="" placeholder="default: 18"/>' +
            '                </div>' +
            '<p>Advanced Options</p>' +
            '                <div>' +
            '                    <label for="orc20-deploy-ug">Upgradable (optional)</label>' +
            '                    <input id="orc20-deploy-ug" type="text" value="" placeholder="default: true"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-wp">Migration (optional)</label>' +
            '                    <input id="orc20-deploy-wp" type="text" value="" placeholder="default: false"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-v">Version (optional)</label>' +
            '                    <input id="orc20-deploy-v" type="text" value="" placeholder="e.g. 1.0"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-deploy-msg">Message (optional)</label>' +
            '                    <input id="orc20-deploy-msg" type="text" value="" placeholder="any text"/>' +
            '                </div>' +
        '                <div>' +
        '                    <label for="orc20-deploy-key">Custom Key (optional)</label>' +
        '                    <input id="orc20-deploy-key" type="text" value="" placeholder="custom typed information"/>' +
        '                </div>';
    }

    _this.prepare = async function(){

        files = [];

        let max = 0;
        let lim = 1;
        let tick = '';
        let name = '';
        let id = 1;
        let dec = 18;
        let ug = true;
        let wp = false;
        let v = '';
        let msg = '';
        let key = '';

        name = $('#orc20-deploy-name').value;
        msg = $('#orc20-deploy-msg').value;
        key = $('#orc20-deploy-key').value;
        v = $('#orc20-deploy-v').value;

        if ($('#orc20-deploy-max').value != '' && ( isNaN(parseInt($('#orc20-deploy-max').value)) || parseInt($('#orc20-deploy-max').value) < 0 ) ) {
            alert('Invalid supply.');
            return;
        }
        else
        {
            max = parseInt($('#orc20-deploy-max').value) != max ? parseInt($('#orc20-deploy-max').value) : max;
        }

        if ($('#orc20-deploy-lim').value != '' && ( isNaN(parseInt($('#orc20-deploy-lim').value)) || parseInt($('#orc20-deploy-lim').value) < 1 ) ) {
            alert('Invalid limit.');
            return;
        }
        else
        {
            lim = parseInt($('#orc20-deploy-lim').value) != lim ? parseInt($('#orc20-deploy-lim').value) : lim;
        }

        if ($('#orc20-deploy-ticker').value == '') {
            alert('Invalid ticker length. Must be at least 1 character.');
            return;
        }
        else
        {
            tick = $('#orc20-deploy-ticker').value;
        }

        if ($('#orc20-deploy-id').value != '' && ( isNaN(parseInt($('#orc20-deploy-id').value)) || parseInt($('#orc20-deploy-id').value) < 1 ) ) {
            alert('Invalid ID.');
            return;
        }
        else
        {
            id = parseInt($('#orc20-deploy-id').value) != id ? parseInt($('#orc20-deploy-id').value) : id;
        }

        if ($('#orc20-deploy-dec').value != '' && ( isNaN(parseInt($('#orc20-deploy-dec').value)) || parseInt($('#orc20-deploy-dec').value) > 18 || parseInt($('#orc20-deploy-dec').value) < 0)) {
            alert('Invalid decimals.');
            return;
        }
        else
        {
            dec = parseInt($('#orc20-deploy-dec').value) != dec ? parseInt($('#orc20-deploy-dec').value) : dec;
        }

        if($('#orc20-deploy-ug').value != '' && $('#orc20-deploy-ug').value.toLowerCase().trim() === 'false') {

            ug = false;
        }
        else
        {
            ug = true;
        }

        if ($('#orc20-deploy-wp').value != '' && $('#orc20-deploy-wp').value.toLowerCase().trim() === 'true') {

            wp = true;
        }
        else
        {
            wp = false;
        }
        
        let deploy = '{' +
            '"p": "orc-20",' +
            '"op": "deploy",' +
            '"tick": "",' +
            ( max > 0 ? '"max": "",' : '' ) +
            ( lim > 1 ? '"lim": "",' : '' ) +
            ( name != '' ? '"name": "",' : '' ) +
            ( id > 1 ? '"id": "",' : '' ) +
            ( max > 0 ? '"max": "",' : '' ) +
            ( dec < 18 ? '"dec": "",' : '' ) +
            ( ug == false ? '"ug": "",' : '' ) +
            ( wp == true ? '"wp": "",' : '' ) +
            ( v != '' ? '"v": "",' : '' ) +
            ( msg != '' ? '"msg": "",' : '' ) +
            ( key != '' ? '"key": "",' : '' );

        deploy = deploy.endsWith(',') ? deploy.slice(0, -1) : deploy;
        deploy += '}';

        deploy = JSON.parse(deploy);

        deploy.tick = tick

        if(typeof deploy.lim != 'undefined')
        {
            deploy.lim = ""+lim;
        }

        if(typeof deploy.key != 'undefined')
        {
            deploy.key = ""+key;
        }

        if(typeof deploy.msg != 'undefined')
        {
            deploy.msg = ""+msg;
        }

        if(typeof deploy.v != 'undefined')
        {
            deploy.v = ""+v;
        }

        if(typeof deploy.wp != 'undefined')
        {
            deploy.wp = ""+wp;
        }

        if(typeof deploy.ug != 'undefined')
        {
            deploy.ug = ""+ug;
        }

        if(typeof deploy.dec != 'undefined')
        {
            deploy.dec = ""+dec;
        }

        if(typeof deploy.max != 'undefined')
        {
            deploy.max = ""+max;
        }

        if(typeof deploy.id != 'undefined')
        {
            deploy.id = ""+id;
        }

        if(typeof deploy.name != 'undefined')
        {
            deploy.name = ""+name;
        }

        let mimetype = "text/plain;charset=utf-8";
        files.push({text: JSON.stringify(deploy), name: deploy.tick, hex: textToHex(JSON.stringify(deploy)), mimetype: mimetype, sha256: ''});

        console.log(files);

        return true;
    }
}