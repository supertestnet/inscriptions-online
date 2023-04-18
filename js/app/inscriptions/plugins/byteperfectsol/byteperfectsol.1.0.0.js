function byteperfectsol(){

    let _this = this;

    _this.init = async function()
    {

    }

    _this.onPluginLoaded = async function()
    {
        jQuery('#byteperfectsol_retrieve').on('click', async function(){

            files = [];
            let failed = [];
            let succeeded = [];
            let token_ids = jQuery('#token_ids').val().split("\n");

            jQuery('#byteperfectsol_retrieve').prop('disabled', true);
            jQuery('#byteperfectsol_report').css('display','none');
            jQuery('#byteperfectsol_report').html('');

            for(let i = 0; i < token_ids.length; i++)
            {
                jQuery('#byteperfectsol_retrieve').html('Retrieving...' + (i+1) + '/' + token_ids.length);

                let id = token_ids[i].trim();

                if(id != '')
                {
                    try
                    {
                        let res = await fetch('https://api.all.art/v1/solana/'+id);
                        let json = await res.json();

                        if(typeof json.jsonUrl == 'undefined')
                        {
                            failed.push({
                                error : 'JSON not found.',
                                id    : id
                            });
                        }
                        else
                        {

                            let metadata, metadata_json;
                            let meta = json.jsonUrl;

                            if(meta.toLowerCase().startsWith('ipfs://'))
                            {
                                let exploded = meta.split(new RegExp('ipfs://', 'i'));
                                meta = 'https://ipfs.rarity.garden/ipfs/' + exploded[1];
                                metadata = await fetch(meta);
                                metadata_json = await metadata.json();
                            }
                            else if(meta.toLowerCase().includes('/ipfs/'))
                            {
                                let exploded = meta.split(new RegExp('/ipfs/', 'i'));
                                meta = 'https://ipfs.rarity.garden/ipfs/' + exploded[1];
                                metadata = await fetch(meta);
                                metadata_json = await metadata.json();
                            }
                            else if(meta.toLowerCase().startsWith('data:application/json;base64,'))
                            {
                                let splitted = meta.split(',');
                                metadata_json = JSON.parse(atob(splitted[1].trim()));
                            }
                            else
                            {
                                metadata = await fetch(meta);
                                metadata_json = await metadata.json();
                            }

                            console.log(metadata_json);

                            let url = '';
                            let blob = null;

                            if(typeof metadata_json.animation_url != 'undefined')
                            {
                                url = metadata_json.animation_url;
                            }
                            else if(typeof metadata_json.image != 'undefined')
                            {
                                url = metadata_json.image;
                            }

                            if(url != '')
                            {

                                if(url.toLowerCase().startsWith('ipfs://'))
                                {
                                    let exploded = url.split(new RegExp('ipfs://', 'i'));
                                    url = 'https://ipfs.rarity.garden/ipfs/' + exploded[1];
                                    url = await fetch(url);
                                    blob = await url.blob();
                                }
                                else if(url.toLowerCase().includes('/ipfs/'))
                                {
                                    let exploded = url.split(new RegExp('/ipfs/', 'i'));
                                    url = 'https://ipfs.rarity.garden/ipfs/' + exploded[1];
                                    url = await fetch(url);
                                    blob = await url.blob();
                                }
                                else if(url.toLowerCase().startsWith('data:image/svg+xml;base64,'))
                                {
                                    let exploded = url.split(',');
                                    blob = new Blob([atob(exploded[1])], {type: 'image/svg+xml'});
                                }
                                else
                                {
                                    url = await fetch(url);
                                    blob = await url.blob();
                                }

                                let mime = blob.type.toLowerCase().split(';');

                                switch(mime[0])
                                {
                                    case 'image/png':
                                    case 'image/apng':
                                    case 'image/jpg':
                                    case 'image/jpeg':
                                    case 'image/gif':
                                    case 'image/webp':
                                    case 'image/avif':
                                    case 'image/svg+xml':
                                    case 'text/plain':
                                    case 'text/html':
                                    case 'audio/flac':
                                    case 'audio/mpeg':
                                    case 'audio/mp4':
                                    case 'video/mp4':
                                    case 'application/mp4':
                                    case 'video/webm':

                                        let kb = Math.floor(blob.size / 1024);

                                        if(kb > 350)
                                        {
                                            throw new Error('max. file size of 350kb exceeded');
                                        }

                                        let file, sha256, hash_result;

                                        if(mime[0] == 'image/svg+xml' ||
                                            mime[0] == 'text/plain' ||
                                            mime[0] == 'text/html')
                                        {

                                            let text = await blob.text();
                                            let blob2 = new Blob([text], {type: blob.type.toLowerCase()});
                                            file = new File([blob2], '_' + id);
                                            sha256 = await fileToSha256Hex(file);
                                            hash_result = JSON.parse(await getData('https://api2.ordinalsbot.com/search?hash=' + sha256.replace('0x','')));

                                            files.push({
                                                text: text,
                                                name: id,
                                                hex: textToHex(text),
                                                mimetype: blob.type.toLowerCase(),
                                                sha256: ''
                                            });
                                        }
                                        else
                                        {

                                            file = new File([blob], '_' + id);
                                            sha256 = await fileToSha256Hex(file);
                                            hash_result = JSON.parse(await getData('https://api2.ordinalsbot.com/search?hash=' + sha256.replace('0x','')));

                                            let b64 = await encodeBase64(file);
                                            let base64 = b64.substring(b64.indexOf("base64,") + 7);
                                            let hex = base64ToHex(base64);

                                            files.push({
                                                name: id,
                                                hex: hex,
                                                mimetype: blob.type.toLowerCase(),
                                                sha256: sha256.replace('0x', '')
                                            });
                                        }

                                        succeeded.push({
                                            type : blob.type.toLowerCase(),
                                            size : blob.size,
                                            blob : blob,
                                            id   : id,
                                            inscription_count : parseInt(hash_result.count),
                                            sha256 : sha256.replace('0x','')
                                        });

                                        break;

                                    default:

                                        throw new Error('Unsupported file type');
                                }

                                console.log(blob);
                            }

                            if(blob === null)
                            {
                                throw new Error('Could not retrieve blob.');
                            }
                        }
                    }
                    catch(e)
                    {
                        failed.push({
                            error : e.message,
                            id    : id
                        });
                    }

                    await sleep(1000);
                }
            }

            console.log(succeeded);
            console.log(failed);

            let success_report = '';
            let failed_report = '';

            for(let i = 0; i < succeeded.length; i++)
            {
                success_report += '<div id="byteperfectsol_id'+succeeded[i].id+'">ID ' + succeeded[i].id + ' #inscribed: ' + succeeded[i].inscription_count + ' [<a href="javascript:active_plugin.instance.removeFile(\''+succeeded[i].id+'\')'+'">X</a>]</div>';
            }

            for(let i = 0; i < failed.length; i++)
            {
                failed_report += '<div>ID ' + failed[i].id + ' error: ' + failed[i].error + '</div>';
            }

            jQuery('#byteperfectsol_report').html(( success_report != '' ? '<div style="margin-bottom: 15px;">The following token ids may be inscribed. Please check the inscription count if you want to be first, and remove items you want to exclude:</div>' + success_report : '') );
            let html = jQuery('#byteperfectsol_report').html();
            jQuery('#byteperfectsol_report').html(html + ( failed_report != '' ? '<div style="margin-top: 15px;margin-bottom: 15px;">The following token ids had errors and will be skipped:</div>' + failed_report : '') );

            jQuery('#byteperfectsol_report').css('display','block');
            jQuery('#byteperfectsol_retrieve').prop('disabled', false);
            jQuery('#byteperfectsol_retrieve').html('Retrieve files');
        });
    }

    _this.tip = async function()
    {

        return files.length * 500;
    }

    _this.removeFile = function(token_id) {

        for (let i = 0; i < files.length; i++)
        {
            if(files[i].name == token_id)
            {
                jQuery('#byteperfectsol_id'+token_id).remove();
                files.splice(i, 1);
                break;
            }
        }
    }

    _this.getTitle = function(){

        return 'from solana';
    }

    _this.getPadding = function(){

        return 5000;
    }

    _this.render = async function(){

        return '<p>Enter Solana NFT Mint hashes in order to inscribe byte-perfectly.</p>' +
            '        <label for="token_ids">MINT HASHES</label>' +
            '        <textarea id="token_ids" style="width: 100%; height: 150px;" class="text_area" placeholder="Enter one MINT HASH per row.&#10;e.g.:&#10;65SKjguzCDauG538iSD9nSxA8xdfwL2yN89CU2mxhUQ&#10;9R8LcWLTVB4TahpjHxjcYTJ2o4wMsQM6dmAk4yJ3C4dv&#10;4iBVAsXc2Tn1wXx2fFVLYGprkjYm1SuMsnuPv5VyfVbX"></textarea>' +
            '      </div>' +
            '      <button style="margin-top: 15px;" id="byteperfectsol_retrieve" type="button">' +
            '      Retrieve files' +
            '      </button>' +
            '      <div id="byteperfectsol_report" style="display: none; max-height: 300px; overflow-x: auto; border: 1px solid white; padding: 10px; margin-top:15px; margin-bottom: 15px;"></div>';
    }

    _this.prepare = async function(){

        return true;
    }
}