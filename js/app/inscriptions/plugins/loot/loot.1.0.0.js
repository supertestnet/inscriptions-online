function loot(){

    let _this = this;

    _this.onPluginLoaded = async function()
    {
        $('#loot_id').onchange = async function(){

            files = [];

            let weapons = [
                "Warhammer",
                "Quarterstaff",
                "Maul",
                "Mace",
                "Club",
                "Katana",
                "Falchion",
                "Scimitar",
                "Long Sword",
                "Short Sword",
                "Ghost Wand",
                "Grave Wand",
                "Bone Wand",
                "Wand",
                "Grimoire",
                "Chronicle",
                "Tome",
                "Book"
            ];

            let chestArmor = [
                "Divine Robe",
                "Silk Robe",
                "Linen Robe",
                "Robe",
                "Shirt",
                "Demon Husk",
                "Dragonskin Armor",
                "Studded Leather Armor",
                "Hard Leather Armor",
                "Leather Armor",
                "Holy Chestplate",
                "Ornate Chestplate",
                "Plate Mail",
                "Chain Mail",
                "Ring Mail"
            ];

            let headArmor = [
                "Ancient Helm",
                "Ornate Helm",
                "Great Helm",
                "Full Helm",
                "Helm",
                "Demon Crown",
                "Dragon's Crown",
                "War Cap",
                "Leather Cap",
                "Cap",
                "Crown",
                "Divine Hood",
                "Silk Hood",
                "Linen Hood",
                "Hood"
            ];

            let waistArmor = [
                "Ornate Belt",
                "War Belt",
                "Plated Belt",
                "Mesh Belt",
                "Heavy Belt",
                "Demonhide Belt",
                "Dragonskin Belt",
                "Studded Leather Belt",
                "Hard Leather Belt",
                "Leather Belt",
                "Brightsilk Sash",
                "Silk Sash",
                "Wool Sash",
                "Linen Sash",
                "Sash"
            ];

            let footArmor = [
                "Holy Greaves",
                "Ornate Greaves",
                "Greaves",
                "Chain Boots",
                "Heavy Boots",
                "Demonhide Boots",
                "Dragonskin Boots",
                "Studded Leather Boots",
                "Hard Leather Boots",
                "Leather Boots",
                "Divine Slippers",
                "Silk Slippers",
                "Wool Shoes",
                "Linen Shoes",
                "Shoes"
            ];

            let handArmor = [
                "Holy Gauntlets",
                "Ornate Gauntlets",
                "Gauntlets",
                "Chain Gloves",
                "Heavy Gloves",
                "Demon's Hands",
                "Dragonskin Gloves",
                "Studded Leather Gloves",
                "Hard Leather Gloves",
                "Leather Gloves",
                "Divine Gloves",
                "Silk Gloves",
                "Wool Gloves",
                "Linen Gloves",
                "Gloves"
            ];

            let necklaces = [
                "Necklace",
                "Amulet",
                "Pendant"
            ];

            let rings = [
                "Gold Ring",
                "Silver Ring",
                "Bronze Ring",
                "Platinum Ring",
                "Titanium Ring"
            ];

            let suffixes = [
                "of Power",
                "of Giants",
                "of Titans",
                "of Skill",
                "of Perfection",
                "of Brilliance",
                "of Enlightenment",
                "of Protection",
                "of Anger",
                "of Rage",
                "of Fury",
                "of Vitriol",
                "of the Fox",
                "of Detection",
                "of Reflection",
                "of the Twins"
            ];

            let namePrefixes = [
                "Agony", "Apocalypse", "Armageddon", "Beast", "Behemoth", "Blight", "Blood", "Bramble",
                "Brimstone", "Brood", "Carrion", "Cataclysm", "Chimeric", "Corpse", "Corruption", "Damnation",
                "Death", "Demon", "Dire", "Dragon", "Dread", "Doom", "Dusk", "Eagle", "Empyrean", "Fate", "Foe",
                "Gale", "Ghoul", "Gloom", "Glyph", "Golem", "Grim", "Hate", "Havoc", "Honour", "Horror", "Hypnotic",
                "Kraken", "Loath", "Maelstrom", "Mind", "Miracle", "Morbid", "Oblivion", "Onslaught", "Pain",
                "Pandemonium", "Phoenix", "Plague", "Rage", "Rapture", "Rune", "Skull", "Sol", "Soul", "Sorrow",
                "Spirit", "Storm", "Tempest", "Torment", "Vengeance", "Victory", "Viper", "Vortex", "Woe", "Wrath",
                "Light's", "Shimmering"
            ];

            let nameSuffixes = [
                "Bane",
                "Root",
                "Bite",
                "Song",
                "Roar",
                "Grasp",
                "Instrument",
                "Glow",
                "Bender",
                "Shadow",
                "Whisper",
                "Shout",
                "Growl",
                "Tear",
                "Peak",
                "Form",
                "Sun",
                "Moon"
            ];

            function pluck(item, keyPrefix, key) {

                let rand = parseInt(textToHex(keyPrefix), 16) + parseInt($('#loot_id').value, 16);
                let output = item[Math.floor(rand % item.length)];
                let greatness = rand % 22;

                if(greatness > 14)
                {
                    output = output + ' ' + suffixes[rand % suffixes.length];
                }

                if(greatness >= 19)
                {
                    let pre = namePrefixes[rand % namePrefixes.length];
                    let suf = nameSuffixes[rand % nameSuffixes.length];

                    if(greatness == 19){
                        output = '"'+pre+' '+suf+'" ' + output;
                    }
                    else
                    {
                        output = '"'+pre+' '+suf+'" ' + output + ' +1';
                    }
                }

                return output;
            }

            let svg = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">' +
                '<style>.base { fill: white; font-family: serif; font-size: 14px; }</style>' +
                '<rect width="100%" height="100%" fill="black" />' +
                '<text x="10" y="20" class="base">' + pluck(weapons, "WEAPON", privkey) + '</text>' +
                '<text x="10" y="40" class="base">' + pluck(chestArmor, "CHEST", privkey) + '</text>' +
                '<text x="10" y="60" class="base">' + pluck(headArmor, "HEAD", privkey) + '</text>' +
                '<text x="10" y="80" class="base">' + pluck(waistArmor, "WAIST", privkey) + '</text>' +
                '<text x="10" y="100" class="base">' + pluck(footArmor, "FOOT", privkey) + '</text>' +
                '<text x="10" y="120" class="base">' + pluck(handArmor, "HAND", privkey) + '</text>' +
                '<text x="10" y="140" class="base">' + pluck(necklaces, "NECK", privkey) + '</text>' +
                '<text x="10" y="160" class="base">' + pluck(rings, "RING", privkey) + '</text>' +
                '</svg>';

            let blob = new Blob([svg], {type: 'image/svg+xml'});
            let sha256 = await fileToSha256Hex(blob);
            let _mimetype = "image/svg+xml";

            files.push(
                {
                    text : svg,
                    name: textToHex(svg),
                    hex: textToHex(svg),
                    mimetype: _mimetype,
                    sha256: sha256.replace('0x','')
                }
            );

            console.log(files);
        }

        $('#loot_checker').onclick = async function () {

            $('#loot_checker').innerHTML = 'Please wait...';

            let inscribed_already = [];
            let errors = [];

            for (let i = 0; i < files.length; i++) {

                $('#loot_checker').innerHTML = 'Please wait...';

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
                alert('The token id has been looted already');
            }

            if (errors.length != 0) {
                alert("Could not check the following loot due to an error: " + inscribed_already.join(', '));
            }

            if (inscribed_already.length == 0) {
                alert("Your loot seems available.");
            }

            $('#loot_checker').innerHTML = 'Check if this token id got looted already';
        }
    }

    _this.getTitle = function(){

        return 'loot for taproot';
    }

    _this.getPadding = function(){

        return 5000;
    }

    _this.render = async function(){

        return '<p>LOOT for Taproot is the first LOOT derivative on Bitcoin, made by Rarity Garden. Read more about the LOOT Foundation <a href="https://loot.foundation/" target="_blank">here</a>.</p><div>' +
            '<p>To find available loot, please pick a random token id between 8001 - 17800 below and check if it got looted already. If not, you may inscribe and the loot will be yours.</p>' +
        '        <label for="loot_id">LOOT TOKEN ID</label>' +
        '        <input id="loot_id" class="address" placeholder="Enter a TOKEN ID from 8001 - 17800 to inscribe">' +
        '      </div>' +
        '      <button style="margin-top: 15px;" id="loot_checker" type="button">' +
        '      Check if this token id got looted already' +
        '      </button>';
    }

    _this.prepare = async function(){

        if($('#loot_id').value == '' || isNaN($('#loot_id').value) || parseInt($('#loot_id').value) < 8001 || parseInt($('#loot_id').value) > 17800){
            alert('Please enter a TOKEN ID from 8001 - 17800 to inscribe');
            return false;
        }

        return true;
    }
}