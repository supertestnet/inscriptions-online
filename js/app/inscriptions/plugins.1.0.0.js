async function loadPlugins()
{

    for(let i = 0; i < plugins.length; i++)
    {
        let plugin = plugins[i];

        await loadScript('js/app/inscriptions/plugins/'+plugin.name+'/'+plugin.file);

        plugins[i].instance = eval('new ' + plugins[i].name);

        $('#plugin-list ul').innerHTML += '<li class="nav-item">' +
            '<a id="'+plugin.name+'_nav" class="'+plugin.name+'" href="javascript:void(0);">'+plugin.instance.getTitle()+'</a>' +
            '</li>';

        $('#'+plugin.name+'_nav').onclick = async function()
        {
            active_plugin = plugin;
            files = [];
            $('#padding').value = ''+plugin.instance.getPadding();
            padding = ''+plugin.instance.getPadding();
            $('#app-form').reset();

            $$('.option_form').forEach(function(item){
                item.style.display = 'none';
            });

            $$('.options a').forEach(function(item){
                item.classList.remove('active');
            });

            $('#'+plugin.name+'_nav').classList.add('active');
            $('#plugin_form').innerHTML = await plugin.instance.render();
            $('#plugin_form').style.display = 'block';

            await plugins[i].instance.onPluginLoaded();
        }
    }

    if(plugins.length != 0)
    {
        $('#plugin-list').style.display = 'inline-block';
    }
}

let loadScript = function(uri){
    return new Promise((resolve, reject) => {
        let tag = document.createElement('script');
        tag.src = uri;
        tag.async = true;
        tag.onload = () => {
            resolve();
        };
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
}