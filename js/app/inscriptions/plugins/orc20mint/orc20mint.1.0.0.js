function orc20mint(){

    let _this = this;

    _this.init = async function()
    {

    }

    _this.onPluginLoaded = async function()
    {

    }

    _this.tip = async function()
    {

        return files.length >= 5 ? files.length * 100 : 500;
    }


    _this.getTitle = function(){

        return 'orc-20 mint';
    }

    _this.getPadding = function(){

        return 546;
    }

    _this.render = async function(){

        return '<div>\n' +
            '                <label for="orc20-mint-ticker">Ticker</label>' +
            '                    <input id="orc20-mint-ticker" type="text" value=""' +
            '                           placeholder="e.g. orc"/>' +
            '                </div>' +
            '                    <label for="orc20-mint-amt">Amount</label>' +
            '                    <input id="orc20-mint-amt" type="text" value=""' +
            '                           placeholder="e.g. 1000"/>' +
            '                </div>' +
            '                </div>' +
            '                    <label for="orc20-mint-id">ID (optional)</label>' +
            '                    <input id="orc20-mint-id" type="text" value=""' +
            '                           placeholder="default: 1"/>' +
            '                </div>' +
            '                <div>' +
            '                    <label for="orc20-mint-msg">Message (optional)</label>' +
            '                    <input id="orc20-mint-msg" type="text" value="" placeholder="any text"/>' +
            '                </div>' +
            '                </div>' +
            '                    <label for="orc20-mint-repeat">Repeat</label>' +
            '                    <input id="orc20-mint-repeat" type="text" value="1"' +
            '                           placeholder="default: 1"/>' +
            '                </div>';
    }

    _this.prepare = async function(){

        files = [];

        let tick = '';
        let id = 1;
        let amt = 0;
        let msg = '';

        msg = $('#orc20-mint-msg').value;

        if ($('#orc20-mint-ticker').value == '') {
            alert('Invalid ticker length. Must be at least 1 character.');
            return;
        }
        else
        {
            tick = $('#orc20-mint-ticker').value;
        }

        if ($('#orc20-mint-id').value != '' && ( isNaN(parseInt($('#orc20-mint-id').value)) || parseInt($('#orc20-mint-id').value) < 1 ) ) {
            alert('Invalid ID.');
            return;
        }
        else
        {
            id = parseInt($('#orc20-mint-id').value) != id ? parseInt($('#orc20-mint-id').value) : id;
        }

        if (isNaN(parseInt($('#orc20-mint-amt').value)) || parseInt($('#orc20-mint-amt').value) <= 0) {
            alert('Invalid Amount.');
            return;
        }
        else
        {
            amt = parseInt($('#orc20-mint-amt').value) != id ? parseInt($('#orc20-mint-amt').value) : amt;
        }
        
        let mint = '{' +
            '"p": "orc-20",' +
            '"op": "mint",' +
            '"tick": "",' +
            '"amt": "",' +
            ( id > 1 ? '"id": "",' : '' ) +
            ( msg != '' ? '"msg": "",' : '' );

        mint = mint.endsWith(',') ? mint.slice(0, -1) : mint;
        mint += '}';

        mint = JSON.parse(mint);

        mint.tick = tick

        if(typeof mint.msg != 'undefined')
        {
            mint.msg = ""+msg;
        }

        if(typeof mint.id != 'undefined')
        {
            mint.id = ""+id;
        }

        if(typeof mint.amt != 'undefined')
        {
            mint.amt = ""+amt;
        }

        let mimetype = "text/plain;charset=utf-8";

        let repeat = parseInt($('#orc20-mint-repeat').value);

        if(isNaN(repeat))
        {
            alert('Please enter a valid repeat amount');
            return;
        }

        for(let i = 0; i < repeat; i++)
        {

            files.push({text: JSON.stringify(mint), name: mint.tick, hex: textToHex(JSON.stringify(mint)), mimetype: mimetype, sha256: ''});
        }

        console.log(files);

        return true;
    }
}