function copyToClipboard(id, response_id) {

    let copyText = document.getElementById(id);

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(copyText.value);

    let tmp = jQuery('#'+response_id).html();

    jQuery('#'+response_id).html('Copied!');

    setTimeout(function(){

        jQuery('#'+response_id).html(tmp);

    }, 5000);
}

function copyToClipboard2(id, response_id) {

    let copyText = document.getElementById(id);

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(copyText.value);

    jQuery('#'+response_id).removeClass('fa-copy');
    jQuery('#'+response_id).addClass('fa-thumbs-up');

    setTimeout(function(){

        jQuery('#'+response_id).addClass('fa-copy');
        jQuery('#'+response_id).removeClass('fa-thumbs-up');

    }, 5000);
}