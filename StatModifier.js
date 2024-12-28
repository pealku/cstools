let btns = document.getElementById("buttons");
let cheatButton = document.getElementById("cheatButton");
let loadCheatButton = false;
if (!cheatButton) {
    // Cheats have not been loaded yet
    loadCheatButton = true;
}
else {
    // Cheats have already been loaded
    delete url;
    delete baseURL;
    delete statCharts;
    delete chartPromise;
    delete statsProxy;
    delete modifiableStats;
    delete handleStatsChange;
    delete updateStats;
    delete loadCheats;
    clearInterval(myInterval);
    delete myInterval;
}

let childWindow;
// get the current URL
let url = window.location.href;
// strip off the index.html or mygame/ from the end of the URL
let baseURL = url.replace(/(index\.html$|mygame\/$)/, '');

console.log("Using Base Game URL: " + baseURL);

let sceneList = stats.scene.nav._sceneList;

let statCharts = [];

let sceneFiles = [];

let stringValues = {};
let stringConditions = [];

let modifiableStatChartsStats = [];
let modifiableNumericalStats = [];
let modifiableBooleanStats = [];
let modifiableStringStats = [];

let scriptHtml = (function () {
    // this will create the javscript that is used for updating values with stats in-game, passing values back and forth, and adding limits
    let opposedDrag = "function opposedDrag(event, valueId, opposedValueId) { var statBar = event.target; var dragStartX = 0; var dragStartValue = parseInt(statBar.style.width); var value = document.getElementById(valueId); if(parseInt(value.textContent) <= 0) {let fixValue = 1; statBar.style.width = fixValue + '%'; value.textContent = fixValue.toFixed(0); } if(parseInt(value.textContent) > 100) {let fixValue = 100; statBar.style.width = fixValue + '%'; value.textContent = fixValue.toFixed(0); } var opposedValue = document.getElementById(opposedValueId); function startDrag(event) { dragStartX = event.clientX; dragStartValue = parseInt(statBar.style.width); document.addEventListener('mousemove', doDrag); document.addEventListener('mouseup', stopDrag); } function doDrag(event) { var dragDistance = event.clientX - dragStartX; var newValue = dragStartValue + (dragDistance / statBar.parentNode.clientWidth) * 100; newValue = Math.min(100, Math.max(1, newValue)); statBar.style.width = newValue + '%'; value.textContent = newValue.toFixed(0); opposedValue.textContent = (100 - newValue).toFixed(0); } function stopDrag(event) { var newValue = parseInt(value.textContent); let oldValue = window.opener.stats[valueId]; window.opener.stats[valueId] = newValue; console.log('Old Value: ', oldValue, ', New Value: ', window.opener.stats[valueId]); document.removeEventListener('mousemove', doDrag); document.removeEventListener('mouseup', stopDrag); } startDrag(event); } ";
    let singleDrag = "function singleDrag(event, valueId) {var statBar = event.target;var dragStartX = 0;var dragStartValue = parseInt(statBar.style.width);var value = document.getElementById(valueId); if(parseInt(value.textContent) <= 0) {let fixValue = 1; statBar.style.width = fixValue + '%'; value.textContent = fixValue.toFixed(0); } if(parseInt(value.textContent) > 100) {let fixValue = 100; statBar.style.width = fixValue + '%'; value.textContent = fixValue.toFixed(0); } function startDrag(event) {dragStartX = event.clientX;dragStartValue = parseInt(statBar.style.width);document.addEventListener('mousemove', doDrag);document.addEventListener('mouseup', stopDrag);}function doDrag(event) {var dragDistance = event.clientX - dragStartX;var newValue = dragStartValue + (dragDistance / statBar.parentNode.clientWidth) * 100;newValue = Math.min(100, Math.max(1, newValue)); statBar.style.width = newValue + '%';value.textContent = newValue.toFixed(0);}function stopDrag(event) {var newValue = parseInt(value.textContent); let oldValue = window.opener.stats[valueId]; window.opener.stats[valueId] = newValue; console.log('Old Value: ', oldValue, ', New Value: ', window.opener.stats[valueId]); document.removeEventListener('mousemove', doDrag);document.removeEventListener('mouseup', stopDrag);}startDrag(event);} ";
    let updateStat = "function updateStat(valueId) { var value = document.getElementById(valueId); console.log(value); var inputValue = value.textContent.trim(); var inputType = value.getAttribute('data-type'); var errorValue = document.getElementById(valueId + 'Error'); var selection = window.getSelection(); var range = selection.getRangeAt(0); var start = range.startOffset; if (inputType == 'number') { inputValue = parseInt(inputValue); if (!isNaN(inputValue)) { value.textContent = Math.round(inputValue).toString(); errorValue.style.display = 'none'; } else { value.textContent = ''; errorValue.textContent = 'Please enter a valid number'; errorValue.style.display = 'inline-block'; } } else if (inputType == 'boolean') { value.textContent = inputValue; inputValue = inputValue.toLowerCase().trim(); if (inputValue == 'true' || inputValue == 'false') { errorValue.style.display = 'none'; } else { errorValue.textContent = 'Please enter true or false'; errorValue.style.display = 'inline-block'; } } else { value.textContent = inputValue; inputValue = inputValue.trim(); errorValue.style.display = 'none'; } let oldValue = window.opener.stats[valueId]; window.opener.stats[valueId] = inputValue; console.log('Old Value: ', oldValue, ', New Value: ', window.opener.stats[valueId]); range.setStart(value.firstChild, start); selection.removeAllRanges(); selection.addRange(range); } ";

    let modifyString = "function modifyString(key, type) { let val = ''; if (type == 'custom') { console.log('Custom String'); val = document.getElementById(key + '-input').value;} else { console.log('Selected String'); val = document.getElementById(key + '-select').value;} window.opener.stats[key] = val; console.log(val, window.opener.stats[key])}";
    let modifyBoolean = "function modifyBoolean(key) { let val = document.getElementById(key).value; if (val == 'true') { window.opener.stats[key] = false; } else { window.opener.stats[key] = true; } console.log(val, window.opener.stats[key])}";

    let filterTable = "function filterTable(searchInputId, tableId) { let filterValue = document.getElementById(searchInputId).value.toLowerCase(); let table = document.getElementById(tableId); let rows = table.getElementsByTagName('tr'); for (let i = 0; i < rows.length; i++) { let cells = rows[i].getElementsByTagName('td'); let rowVisible = false; for (let j = 0; j < cells.length; j++) { let cellValue = cells[j].textContent || cells[j].innerText; if (cellValue.toLowerCase().indexOf(filterValue) > -1) { rowVisible = true; break; } } rows[i].style.display = rowVisible ? '' : 'none'; } }";

    let closeChildWindow = "function closeChildWindow() {const childWindow = window.open('', '47288'); childWindow.close(); }";

    let showTab = "function showTab(tabIndex) { var tabs = document.querySelectorAll('.tabContentItem'); tabs.forEach(function(tab) { console.log(tab); tab.style.display = 'none'; }); tabs[tabIndex].style.display = 'block'; }";

    return opposedDrag + singleDrag + updateStat + modifyString + modifyBoolean + filterTable + closeChildWindow + showTab;
})();

let baseHtml = (function () {
    let htmlBuilder = "";
    htmlBuilder = "<style>";
    htmlBuilder += "html {font: -apple-system-body;}";
    htmlBuilder += "body {position: relative;max-width: 80ch;min-height: 100vh;font-size: 100%;font-family: Palatino,Georgia,times new roman,serif;background-color: #f7f4f1;color: rgba(0,0,0,.85);margin: 1ch auto;padding: 0;-webkit-user-select: text;transition-property: background-color,color;transition-duration: 2s;-webkit-transition-property: background-color,color;-webkit-transition-duration: 2s}";
    htmlBuilder += 'table { font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%; }';
    htmlBuilder += 'th { padding-top: 6px; padding-bottom: 6px; text-align: left;}'
    htmlBuilder += 'td { padding: 3px; }'
    htmlBuilder += "a {color: blue;text-decoration: underline;cursor: pointer}";
    htmlBuilder += "button.tabButton {appearance: none; border-width: 1px;} button.tabButton:hover {background-color: #d9d9d9}";
    htmlBuilder += "#main {line-height: 1.5}";
    htmlBuilder += ".tabContentItem { display: none; }";
    htmlBuilder += ".container {position: absolute;left: 0;right: 0;margin: 0 1ch;animation-duration: .5s;-webkit-animation-duration: .5s;transition-property: opacity;transition-duration: .5s;transition-timing-function: ease-in;-webkit-transition-property: opacity;-webkit-transition-duration: .5s;-webkit-transition-timing-function: ease-in}";
    htmlBuilder += ".statBar {background-color: #949291;height: 2.5rem;line-height: 2.5rem;margin: .5ch 0;width: 30rem;max-width: 100%;color: #f7f4f1;position: relative;z-index: 0}";
    htmlBuilder += ".opposed {background-color: #6d6dfc}";
    htmlBuilder += ".statText {margin-left: 2ex;text-indent: -1ex}";
    htmlBuilder += ".statBar>span,.statLine>span {position: relative;z-index: 1;white-space: nowrap}";
    htmlBuilder += ".statValue {background-color: #ff5955;position: absolute;top: 0;left: 0;height: 100%;z-index: -1}";
    htmlBuilder += ".searchInput {margin-bottom: 5px;}"
    htmlBuilder += "input[type=radio],input[type=checkbox] {margin-right: 1ch;}";
    htmlBuilder += "h1 {font-size: 1.5em;font-weight: 400;}";
    htmlBuilder += "h2 {font-size: 1.125em;font-weight: 400;}";
    htmlBuilder += "#footer {margin: 10px 0 75px;}";
    htmlBuilder += ".spacedLink {margin-right: .5em;}";
    htmlBuilder += ".spacedLink:last-child {margin-right: 0;}";
    htmlBuilder += ".alignleft {display: inline;float: left;margin-right: 1.625em;margin-bottom: 1.5em;}";
    htmlBuilder += ".alignright {display: inline;float: right;margin-left: 1.625em;margin-bottom: 1.5em;}";
    htmlBuilder += ".aligncenter {clear: both;display: block;margin-left: auto;margin-right: auto;margin-bottom: 1.5em;}";
    htmlBuilder += "#main form {clear: both;}";
    htmlBuilder += "@media only screen and (max-width: 480px) {.definition {display:none;} .gameTitle {display: none;} #header {margin-top: 30px;} #text .alignleft,#text .alignright {max-width: 45%;}}";
    htmlBuilder += ".editable {display: inline-block;min-width: 50px;padding: 1px 10px;border: 1px solid #ccc;border-radius: 3px;outline: none;background-color: ghostwhite;}";
    htmlBuilder += ".editable:active {border: 1px solid #ccc;border-radius: 3px;outline: none;}";
    htmlBuilder += ".editable:hover {border: 1px solid #ccc;border-radius: 3px;outline: none;}";
    htmlBuilder += ".inputContainer {display: block;}";
    htmlBuilder += ".error {color: red;font-size: smaller;margin-bottom: 0.2em;}";
    htmlBuilder += ".conditional {text-decoration: underline;}";
    htmlBuilder += ".conditional:hover::after {content: attr(title); position: absolute; background: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px;}";
    htmlBuilder += "</style>";

    return htmlBuilder;
})();

let statChartsBuilder = (function () {
    let htmlBuilder = "";
    htmlBuilder += "<div class='tabContentItem' id='statChartsTab'>";
    htmlBuilder += '<div style="text-align: center;margin-bottom: 10;"><h2 style="margin-bottom: .1em;">STAT CHARTS</h2>';

    return htmlBuilder;
})();

let numericalBuilder = (function () {
    let htmlBuilder = "";
    htmlBuilder += "<div class='tabContentItem' id='numericalStatsTab'>";
    htmlBuilder += '<div style="text-align: center;margin-bottom: 10;"><h2 style="margin-bottom: .1em;">NUMERICAL STATS</h2>';

    return htmlBuilder;
})();

let booleanBuilder = (function () {
    let htmlBuilder = "";
    htmlBuilder += "<div class='tabContentItem' id='booleanStatsTab'>";
    htmlBuilder += '<div style="text-align: center;margin-bottom: 10;"><h2 style="margin-bottom: .1em;">BOOLEAN STATS</h2>';

    return htmlBuilder;
})();

let stringBuilder = (function () {
    let htmlBuilder = "";
    htmlBuilder += "<div class='tabContentItem' id='stringStatsTab'>";
    htmlBuilder += '<div style="text-align: center;margin-bottom: 10;"><h2 style="margin-bottom: .1em;">STRING STATS</h2>';

    return htmlBuilder;
})();

function getTitle(statName) {
    let title = statName.replace(/[^a-zA-Z0-9 ]/g, " ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
}

async function GenerateStatChartsHtml() {
    let statChartsHtml = statChartsBuilder;

    if (modifiableStatChartsStats.length <= 0) {
        statChartsHtml += '<div style="text-align: center;margin-bottom: 10;"><h1 style="margin-bottom: .1em;">There are no stat charts to modify.</h1></div></div></div>';
        return Promise.resolve(statChartsHtml);
    }

    for (let index = 0; index < modifiableStatChartsStats.length; index++) {

        let key = modifiableStatChartsStats[index].key;
        let value = modifiableStatChartsStats[index].value;
        let displayType = modifiableStatChartsStats[index].displayType;
        let label = modifiableStatChartsStats[index].label;

        if (displayType == "opposed_pair") {
            let opposedKey = modifiableStatChartsStats[index].opposedKey;
            let opposedLabel = modifiableStatChartsStats[index].opposedLabel;

            statChartsHtml += '<div class="statBar statLine opposed">';
            statChartsHtml += '<span style="user-select: none;pointer-events: none;display: inline-block;width: 1%;height: 1%;float: left;">&nbsp;&nbsp;' + label + ': <span id="' + key + '"></span>% </span>';
            statChartsHtml += '<span style="float: right; user-select: none; pointer-events: none; display: inline-block; height: 1%;">' + opposedLabel + ': <span id="' + opposedKey + '"></span>%&nbsp;&nbsp;</span>';
            statChartsHtml += '<div class="statValue" id="statBar' + label + '" style="width: ' + value + '%;" onmousedown="opposedDrag(event, \'' + key + '\', \'' + opposedKey + '\')">&nbsp;</div>';
            statChartsHtml += '</div>';
        }
        if (displayType == "percent") {
            statChartsHtml += '<div class="statBar statLine">';
            statChartsHtml += '<span style="user-select: none;pointer-events: none;display: inline-block;width: 1%;height: 1%;float: left;">&nbsp;&nbsp;' + label + ': <span id="' + key + '"></span>%</span>';
            statChartsHtml += '<div class="statValue" id="statBar' + label + '" style="width: ' + value + '%;" onmousedown="singleDrag(event, \'' + key + '\')">&nbsp;</div>';
            statChartsHtml += '</div>';
        }
        if (displayType == "text") {
            let statType = modifiableStatChartsStats[index].statType;

            statChartsHtml += '<div class="statText" style="text-align: left;">';
            statChartsHtml += '<div class="inputContainer">';
            statChartsHtml += '<span>' + label + ': </span>';
            statChartsHtml += '<span id="' + key + '" contenteditable="true" data-type="' + statType + '" class="editable" oninput="updateStat(\'' + key + '\')"></span>';
            statChartsHtml += '</div>';
            statChartsHtml += '<span id="' + key + 'Error" class="error"></span>';
            statChartsHtml += '</div>';
        }
    }

    statChartsHtml += "</div></div>";

    return Promise.resolve(statChartsHtml);
}

async function GenerateNumericalHtml() {
    let numericalHtml = numericalBuilder;

    if (modifiableNumericalStats.length <= 0) {
        numericalHtml += '<div style="text-align: center;margin-bottom: 10;"><h1 style="margin-bottom: .1em;">There are no numerical stats to modify.</h1></div></div></div>';
        return Promise.resolve(numericalHtml);
    }

    numericalHtml += `<input type="text" id="searchNumerical" class="searchInput" oninput="filterTable('searchNumerical', 'numericalTable')" placeholder="Search...">`;

    numericalHtml += '<table id="numericalTable" class="statTable">';
    numericalHtml += '<tr><th>Stat</th>';
    numericalHtml += '<th>Value</th></tr>';

    for (let index = 0; index < modifiableNumericalStats.length; index++) {
        let key = modifiableNumericalStats[index].key;
        let displayType = modifiableNumericalStats[index].displayType;
        let title = getTitle(key);

        if (modifiableStatChartsStats.find(x => x.key == key) === undefined) {

            numericalHtml += '<tr>';
            numericalHtml += '<td>' + title + '</td>';
            numericalHtml += '<td>';

            numericalHtml += '<div class="statText" style="text-align: left;">';
            numericalHtml += '<div class="inputContainer">';
            numericalHtml += '<span id="' + key + '" contenteditable="true" data-type="' + displayType + '" class="editable" oninput="updateStat(\'' + key + '\')"></span>';
            numericalHtml += '</div>';
            numericalHtml += '<span id="' + key + 'Error" class="error"></span>';
            numericalHtml += '</div>';

            numericalHtml += '</td></tr>';

        }
    }

    numericalHtml += "</table></div></div>";

    return Promise.resolve(numericalHtml);
}

async function GenerateBooleanHtml() {
    let booleanHtml = booleanBuilder;

    if (modifiableBooleanStats.length <= 0) {
        booleanHtml += '<div style="text-align: center;margin-bottom: 10;"><h1 style="margin-bottom: .1em;">There are no boolean stats to modify.</h1></div></div></div>';
        return Promise.resolve(booleanHtml);
    }

    booleanHtml += `<input type="text" id="searchBoolean" class="searchInput" oninput="filterTable('searchBoolean', 'booleanTable')" placeholder="Search...">`;

    booleanHtml += '<table id="booleanTable" class="statTable">';
    booleanHtml += '<tr><th>Stat</th>';
    booleanHtml += '<th>Value</th></tr>';

    for (let index = 0; index < modifiableBooleanStats.length; index++) {
        let key = modifiableBooleanStats[index].key;
        let value = modifiableBooleanStats[index].value;
        let title = getTitle(key);

        booleanHtml += '<tr>';
        booleanHtml += '<td>' + title + '</td>';

        booleanHtml += '<td><input type="checkbox" id="' + key + '" name="' + key + '" value="' + value + '" onchange="modifyBoolean(\'' + key + '\')"/><span id="bool-' + key + '">True</span></td>';
        booleanHtml += '</tr>';
    }

    booleanHtml += "</table></div></div>";

    return Promise.resolve(booleanHtml);
}

async function GenerateStringHtml() {
    selectType = "select";
    customType = "custom";
    conditional = false;

    let stringHtml = stringBuilder;

    if (modifiableStringStats.length <= 0) {
        stringHtml += '<div style="text-align: center;margin-bottom: 10;"><h1 style="margin-bottom: .1em;">There are no string stats to modify.</h1></div></div></div>';
        return Promise.resolve(stringHtml);
    }

    stringHtml += `<input type="text" id="searchString" class="searchInput" oninput="filterTable('searchString', 'stringTable')" placeholder="Search...">`;

    stringHtml += '<table id="stringTable" class="statTable">';
    stringHtml += '<tr><th>Stat</th>';
    stringHtml += '<th>Game Values</th>';
    stringHtml += '<th>Input Value</th></tr>';

    for (let index = 0; index < modifiableStringStats.length; index++) {
        let key = modifiableStringStats[index].key;
        let value = modifiableStringStats[index].value;
        let title = getTitle(key);


        // look for variable in stringConditions to determine if it shouldn't be modified
        let stringCondition = stringConditions.find(x => x == key);
        if (stringCondition != undefined) {
            conditional = true;
        }
        else {
            conditional = false;
        }

        stringHtml += '<tr>';
        if (conditional) {
            stringHtml += '<td class="conditional" title="Stat is in conditional">' + '<u>' + title + '</u>' + '</td>';
        }
        else {
            stringHtml += '<td>' + title + '</td>';
        }

        stringHtml += '<td><select name="' + key + '" id="' + key + '-select" onchange="modifyString(\'' + key + '\', \'' + selectType + '\')">';
        let currentValue = value;
        stringHtml += '<option value="' + value + '">' + value + '</option>';
        for (let i = 0; i < stringValues[key].length; i++) {
            value = stringValues[key][i];
            if (value != currentValue) {
                stringHtml += '<option value="' + value + '">' + value + '</option>';
            }
        }
        stringHtml += '</select></td>';
        stringHtml += '<td><input type="text" id="' + key + '-input" value="' + value + '" oninput="modifyString(\'' + key + '\', \'' + customType + '\')"></td>';
        stringHtml += '</tr>';
    }

    stringHtml += "</table></div></div>";

    return Promise.resolve(stringHtml);
}

let CheatPageHtml;

async function GenerateHtml() {

    CheatPageHtml = baseHtml;

    CheatPageHtml += "<div class='container' id='container'>";
    CheatPageHtml += "<div id='main' style='text-align: center;'>";
    CheatPageHtml += "<div id='text' style='display: inline-block;'>";

    CheatPageHtml += '<div style="text-align: center;margin-bottom: 10;"><h1 style="margin-bottom: .1em;">Modify Stats</h1>';

    CheatPageHtml += "<div id='tabButtons'>";
    CheatPageHtml += "<button class='tabButton' onclick='showTab(0)'>Stat Charts</button>";
    CheatPageHtml += "<button class='tabButton' onclick='showTab(1)'>Numerical Stats</button>";
    CheatPageHtml += "<button class='tabButton' onclick='showTab(2)'>Boolean Stats</button>";
    CheatPageHtml += "<button class='tabButton' onclick='showTab(3)'>String Stats</button>";
    CheatPageHtml += "</div>";

    CheatPageHtml += "<div id='tabContent'>";

    let statChartsPromise = await GenerateStatChartsHtml();
    CheatPageHtml += await statChartsPromise;

    let numericalPromise = await GenerateNumericalHtml();
    CheatPageHtml += await numericalPromise;

    let booleanPromise = await GenerateBooleanHtml();
    CheatPageHtml += await booleanPromise;

    let stringPromise = await GenerateStringHtml();
    CheatPageHtml += await stringPromise;

    CheatPageHtml += "</div></div></div></div>";

    return Promise.resolve(CheatPageHtml);
}

function removeBold(line) {
    line = line.replace(/\[b\]/g, '').replace(/\[\/b\]/g, '');
    line = line.trim();

    return line;
}
function removeItalic(line) {
    line = line.replace(/\[i\]/g, '').replace(/\[\/i\]/g, '');
    line = line.trim();

    return line;
}
function removeBoldItalic(line) {
    line = line.replace(/\[b\]/g, '').replace(/\[\/b\]/g, '').replace(/\[i\]/g, '').replace(/\[\/i\]/g, '');
    line = line.trim();

    return line;
}

let statIndex = 0;
function ParseStatChart(rawStatChart) {
    // Parse the stat chart
    let stat = {};

    for (let i = 0; i < rawStatChart.length; i++) {
        let line = rawStatChart[i];
        let indent = line.search(/\S|$/);

        let pieces = line.trim().split(' ');
        let type = pieces[0];
        let variable = pieces[1];
        let label = '';

        if (type == 'text') {
            if (pieces.length > 2) {
                label = line.substring(line.indexOf(pieces[2])).trim();
                label = removeBoldItalic(label);
                variable = variable.toLowerCase();
            }
            else {
                label = variable;
                variable = variable.toLowerCase();
            }
            stat = { statIndex, type, variable, label };
            statCharts.push(stat);
        }
        else if (type == 'percent') {
            if (pieces.length > 2) {
                label = line.substring(line.indexOf(pieces[2])).trim();
                variable = variable.toLowerCase();
            }
            else {
                label = variable;
                variable = variable.toLowerCase();
            }
            stat = { statIndex, type, variable, label };
            statCharts.push(stat);
        }
        else if (type == 'opposed_pair') {
            let nextLine = rawStatChart[i + 1];
            let nextNextLine = rawStatChart[i + 2];
            let twoLabels = nextNextLine && nextNextLine.search(/\S|$/) > indent;
            let opposed_label = '';
            if (twoLabels) {
                label = nextLine.trim();
                opposed_label = nextNextLine.trim();
                variable = variable.toLowerCase();
                i += 2;
            } else {
                label = variable;
                opposed_label = nextLine.trim();
                variable = variable.toLowerCase();
                i++;
            }
            stat = { statIndex, type, variable, label, opposed_label };
            statCharts.push(stat);
        }
        else {
            console.log('Error: Invalid display type -> ' + line);
            return;
        }
        statIndex++;
    }
}

function ParseFileText(text) {
    // Split the scene file content into lines
    let lines = text.split(/\r?\n/);

    let currentLine = 0;
    // Read the scene file line by line
    while (currentLine < lines.length) {
        let line = lines[currentLine];
        // Check if *stat_chart by chomping off whitespace from the beginning of the line
        if (line.trim().startsWith('*stat_chart')) {
            // if we found a *stat_chart then we can start parsing the stat chart
            let rawStatChart = [];
            // we need to keep track of the indentation level of the first line (the *stat_chart line)
            let firstIndent = line.search(/\S|$/);
            // then we move to the next line
            currentLine++;
            while (currentLine < lines.length) {
                // update the line
                line = lines[currentLine];
                // If the line is blank or a *comment, skip it
                let skippable = line.trim().length == 0 || line.trim().startsWith('*comment');
                if (skippable) {
                    currentLine++;
                }
                else {
                    // get the current indentation level
                    let currentIndent = line.search(/\S|$/);

                    // If the next line is indented more than the first line, add it to the rawStatChart
                    if (currentIndent > firstIndent) {
                        rawStatChart.push(line);
                        currentLine++;
                    }
                    else {
                        break;
                    }
                }
            }
            ParseStatChart(rawStatChart);
        }
        else if (!line.trim().startsWith('*') && line.search(/\S|$/) == 0) {
            if (line.includes('[b]') || line.endsWith('[/b]')) {
                line = removeBold(line);
            }
            if (line.includes('[i]') || line.endsWith('[/i]')) {
                line = removeItalic(line);
            }

            if (line.endsWith('}') && line.includes('$', '{')) {
                let type = 'text';
                // check the number of variables in the line
                let openBrackets = line.split('{').length - 1;
                let closeBrackets = line.split('}').length - 1;

                let numVariables = Math.min(openBrackets, closeBrackets);

                if (numVariables > 1) {
                    let lines = [];
                    // if there is more than one variable, the labels will just be the variable name with the first letter capitalized
                    let variables = line.match(/\{\w+}/g);
                    variables.forEach((variable) => {
                        variable = variable.replace('{', '').replace('}', '');
                        let label = variable.charAt(0).toUpperCase() + variable.slice(1);
                        line = type + ' ' + variable + ' ' + label;
                        lines.push(line);
                    });
                    ParseStatChart(lines);
                }
                else {
                    if (line.includes('[b]') || line.endsWith('[/b]')) {
                        line = removeBold(line);
                    }
                    if (line.includes('[i]') || line.endsWith('[/i]')) {
                        line = removeItalic(line);
                    }
                    let variable = line.substring(line.indexOf('{') + 1, line.indexOf('}')).toLowerCase();
                    let label = line.substring(0, line.indexOf('$')).trim().replace(/\W+$/, '');

                    line = type + ' ' + variable + ' ' + label;

                    ParseStatChart([line]);
                }
            }
            currentLine++;
        }
        else {
            currentLine++;
        }
    }
}

let chartPromise = new Promise(function (resolve) {
    // Load the scene file content by appending the scene file name to the base URL
    let statsURL = baseURL + "mygame/scenes/choicescript_stats.txt";

    console.log(`Loading choicescript_stats.txt...`);

    fetch(statsURL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        })
        .then(text => {
            ParseFileText(text);
        })
        .catch(error => {
            console.error("Error:", error);
        });

    console.log(`*** choicescript_stats.txt Loaded ***`);

    resolve(statCharts);
});

let sceneFilePromise = new Promise(function (resolve) {
    console.log(`Loading Scene Files...`);

    sceneFiles = sceneList.map(function (sceneName) {
        return sceneName + ".txt";
    });

    console.log(`*** Scene Files Loaded ***`);

    resolve(sceneFiles);
});

function addStringOption(line) {
    let lineElements = line.trim().split(" ");
    if (lineElements.length >= 3 && lineElements[2].startsWith('"')) {
        try {
            // Extract the name of the string
            let name = lineElements[1].toLowerCase();
            // Extract the value of the string
            let value = line.split('"')[1];
            stringValues[name] = stringValues[name] || [];
            if (!stringValues[name].includes(value)) {
                // Add the value to the stringValues object
                stringValues[name].push(value);
            }
        }
        catch (err) {
            console.log(`   Error at ${line} -> ${err}`);
        }
    }
}
function lineExists(line) {
    if (line != "" && typeof line != "undefined" && line != undefined) {
        return true;
    }
    else {
        return false;
    }
}
function lineAssignable(line) {
    if (!lineExists(line)) {
        return false;
    }
    if ((line.startsWith("*create") || line.startsWith("*set")) && line.split(" ").length > 2) {
        return true;
    }
    else {
        return false;
    }
}
function lineConditional(line) {
    if (!lineExists(line)) {
        return false;
    }
    if (line.startsWith("*if") || line.startsWith("*elseif") || line.startsWith("*elsif") || line.startsWith("*selectable_if")) {
        return true;
    }
    else {
        return false;
    }
}

function extractConditionalStatements(line) {
    let regexMatcher = /\((.+?)\)/g;
    let matches = line.match(regexMatcher);

    if (matches) {
        for (let i = 0; i < matches.length; i++) {
            let innerText = matches[i].substring(1, matches[i].length - 1); // Remove outer parentheses
            extractConditionalStatements(innerText); // Recursively process inner text
        }
    }
    else {
        // No more nested parentheses
        line = line.replace(/\(|\)/g, '');
        // Determine if = or != is used. If so, split the line on that character
        let splitChar = '';
        if (line.includes('!=')) {
            splitChar = '!=';
        }
        else if (line.includes('=')) {
            splitChar = '=';
        }
        if (splitChar != '') {
            let splitLine = line.split(splitChar);
            let variable = splitLine[0].trim().toLowerCase();
            if (stringValues[variable]) {
                // Don't add a duplicate
                if (!stringConditions.includes(variable)) {
                    stringConditions.push(variable);
                }
            }
        }
    }
}

function getstringOptions() {
    console.log(`Loading String Options...`);

    let promises = [];

    // Iterate through each scene file
    for (let i = 0; i < sceneFiles.length; i++) {
        let sceneFile = sceneFiles[i];
        // Load the scene file content
        let sceneURL = baseURL + "mygame/scenes/" + sceneFile;

        let promise = fetch(sceneURL).then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        }).then(text => {
            console.log(`   Loading ${sceneFile}...`);
            // Split the scene file content into lines
            let sceneLines = text.split("\n");
            // Throw an error if the scene file has less than 3 lines
            if (sceneLines.length < 3) {
                throw new Error("Scene file has less than 3 lines");
            }
            // Iterate through each line of the scene file
            for (let j = 0; j < sceneLines.length; j++) {
                try {
                    let line = sceneLines[j].trim();
                    if (lineExists(line)) {
                        // Check if the line starts with *create or *temp or *set
                        if (lineAssignable(line)) {
                            addStringOption(line)
                        }
                        // Check if a string stat is being used as a condition, and if so, add it to the conditionStrings array
                        if (lineConditional(line)) {
                            // Remove the conditional keywords
                            line = line.replace(/\*if|\*elseif|\*elsif|\*selectable_if/g, '');
                            extractConditionalStatements(line);
                        }
                    }
                }
                catch (err) {
                    console.log(`   Error at ${sceneFile} -> ${err}`);
                }
            }
        }).then(() => {
            console.log(`   *** ${sceneFile} Loaded ***`);
        }).catch(error => {
            console.log(`   Error: ${error} when loading ${sceneFile}`);
        });
        promises.push(promise);
    }

    Promise.all(promises)
        .then(() => {
            console.log(`*** String Options Loaded ***`);
        })
        .catch(error => {
            console.log(`Error: ${error}`);
        });
}

let stringOptionsPromise = new Promise(async function (resolve) {
    await sceneFilePromise;
    getstringOptions();

    resolve();
});

// Create a Proxy object to listen for changes to the stats object
let statsProxy = new Proxy(stats, {
    set: function (target, property, value) {
        target[property] = value;
        handleStatsChange();
        return true;
    },
});

// Replace the original stats object with the Proxy object
stats = statsProxy;

// Define the callback function to call when a change occurs
function handleStatsChange() {
    updateStats();
}

function compileStatCharts() {
    return new Promise((resolve, reject) => {

        try {
            let statKeyValues = Object.entries(stats);
            // Clear the modifiableStatChartsStats array
            modifiableStatChartsStats = [];
            for (const [key, value] of statKeyValues) {
                let stat = statCharts.find(stat => stat.variable == key);
                if (stat !== undefined) {
                    try {
                        let regexMatcher = /\$\{(.+?)\}/;
                        let match = regexMatcher.exec(stat.label);
                        let x = match ? match[1] : null;
                        let regex = new RegExp(`\\$\\{\\s*(${x})\\s*\\}`, 'g'); // match `${key}` syntax and capture the variable name
                        stat.label = stat.label.replace(regex, (_, x) => {
                            let variableValue = statKeyValues.find(([k, v]) => k == x)?.[1];
                            if (variableValue == undefined) {
                                return ''; // replace with an empty string
                            } else {
                                return variableValue; // replace with the value from the stats object
                            }
                        }).trim();
                        let hasLetters = /[a-zA-Z]/.test(value);
                        if (typeof value == "boolean") {
                            let val = value;
                            if (stat.type == "opposed_pair") {
                                let opposedKey = stat.opposed_label.toLowerCase();
                                modifiableStatChartsStats.push({ index: stat.statIndex, key: key, opposedKey: opposedKey, value: val, statType: "boolean", displayType: stat.type, label: stat.label, opposedLabel: stat.opposed_label });
                            }
                            else {
                                modifiableStatChartsStats.push({ index: stat.statIndex, key: key, value: val, statType: "boolean", displayType: stat.type, label: stat.label });
                            }
                        }
                        else if ((Number.isNaN(value) == false && value != null && typeof value != "undefined" && hasLetters == false && value != "") || Number.isInteger(value) == true) {
                            let val = parseInt(value);
                            if (stat.type == "opposed_pair") {
                                let opposedKey = stat.opposed_label.toLowerCase();
                                modifiableStatChartsStats.push({ index: stat.statIndex, key: key, opposedKey: opposedKey, value: val, statType: "number", displayType: stat.type, label: stat.label, opposedLabel: stat.opposed_label });
                            }
                            else {
                                modifiableStatChartsStats.push({ index: stat.statIndex, key: key, value: val, statType: "number", displayType: stat.type, label: stat.label });
                            }
                        }
                        else {
                            let val = value;
                            if (typeof val == "string") {
                                if (stat.type == "opposed_pair") {
                                    let opposedKey = stat.opposed_label.toLowerCase();
                                    modifiableStatChartsStats.push({ index: stat.statIndex, key: key, opposedKey: opposedKey, value: val, statType: "string", displayType: stat.type, label: stat.label, opposedLabel: stat.opposed_label });
                                }
                                else {
                                    modifiableStatChartsStats.push({ index: stat.statIndex, key: key, value: val, statType: "string", displayType: stat.type, label: stat.label });
                                }
                            }
                        }
                    } catch (err) {
                        console.log(`Error (${err}) -> ${key}: ${value}`);
                    }
                }
            }
            modifiableStatChartsStats = Object.values(modifiableStatChartsStats).sort((a, b) => a.index - b.index);
            resolve();
        }
        catch (error) {
            console.log(error);
            reject(error);
        }

    });
}

function compileAllStats() {
    return new Promise((resolve, reject) => {

        try {
            modifiableBooleanStats = [];
            modifiableNumericalStats = [];
            modifiableStringStats = [];

            for (const [key, value] of Object.entries(stats)) {
                try {
                    let hasLetters = /[a-zA-Z]/.test(value);
                    if (typeof value == "boolean") {
                        // variable is a boolean
                        let val = value;
                        modifiableBooleanStats.push({ key: key, value: val, displayType: "boolean" });
                    }
                    else if ((Number.isNaN(value) == false && value != null && typeof value != "undefined" && hasLetters == false && value != "") || Number.isInteger(value) == true) {
                        // print each check to see why it's passing as a number

                        let val = parseInt(value);
                        // variable is a number
                        modifiableNumericalStats.push({ key: key, value: val, displayType: "number" });
                    }
                    else {
                        let val = value;
                        if (typeof val == "string") {
                            // variable is a string
                            if (typeof stringValues[key] != "undefined" && stringValues[key].length > 1) {
                                modifiableStringStats.push({ key: key, value: val, displayType: "string" });
                            }
                        }
                    }
                }
                catch (err) {
                    console.log(`Error (${err}) -> ${key}: ${value}`);
                }
            }
            resolve();
        }
        catch (error) {
            console.log(error);
            reject(error);
        }

    });
}

async function complileHtml() {
    await GenerateHtml();

    if (loadCheatButton) {
        btns.innerHTML = btns.innerHTML + "<button id='cheatButton' class='spacedLink' onclick='loadCheats()'>Modify Stats</button>";
        loadCheatButton = false;
    }

    return Promise.resolve();
}

// Function to update the modifiableStatChartsStats and statModifiers arrays
async function updateStats() {
    await chartPromise;
    await stringOptionsPromise;
    await compileStatCharts();
    await compileAllStats();
    await complileHtml();
}

function OpenCheatWindow() {
    // open a new pop up window to put all the stats and give it a title
    childWindow = window.open('', '47288', 'width=1280,height=720,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizeable=0,left=0,top=0');
    childWindow.document.title = 'ChoiceScript Editor';

    // attach script to windows
    let scriptTag = childWindow.document.createElement('script');

    let inlineScript = childWindow.document.createTextNode(scriptHtml);
    scriptTag.appendChild(inlineScript);
    childWindow.document.body.appendChild(scriptTag);

    let wrapperDiv = childWindow.document.createElement('div');
    childWindow.document.body.appendChild(wrapperDiv);

    wrapperDiv.innerHTML = CheatPageHtml;
}

async function loadCheats() {
    // Call updateStats once at the start to initialize the arrays
    // Show loading indicator (e.g., spinning cursor)
    document.body.style.cursor = "wait";

    console.log(`Loading Cheats...`);

    try {
        // Call updateStats to initialize the arrays
        await updateStats();
        // Open the cheat window after stats are updated
        OpenCheatWindow();
    }
    catch (error) {
        console.error("Error: ", error);
    }
    finally {
        // Hide loading indicator
        document.body.style.cursor = "auto";
    }

    console.log(`*** Cheats Loaded ***`);
}

// every 2.5 seconds, update the existing table with the values found in the game stats. 
// Sometimes the game will reset the stats, so this ensures the player always sees the latest values
let myInterval = setInterval(async function () {
    // only run if the child window is open
    if (childWindow && !childWindow.closed) {
        try {
            await chartPromise;
            await stringOptionsPromise;
            await compileStatCharts();
            await compileAllStats();
            await complileHtml();

            for (let index = 0; index < modifiableStatChartsStats.length; index++) {
                let key = modifiableStatChartsStats[index].key;
                let value = modifiableStatChartsStats[index].value;
                let displayType = modifiableStatChartsStats[index].displayType;

                try {
                    if (displayType == "opposed_pair") {
                        let opposedKey = modifiableStatChartsStats[index].opposedKey;
                        childWindow.document.getElementById(key).textContent = parseInt(value);
                        childWindow.document.getElementById(opposedKey).textContent = (100 - parseInt(value));
                    }
                    if (displayType == "percent") {
                        childWindow.document.getElementById(key).textContent = parseInt(value);
                    }
                    if (displayType == "text") {
                        childWindow.document.getElementById(key).textContent = value;
                    }
                }
                catch (error) {
                    if (error instanceof ReferenceError) {
                        // Error: childWindow is not defined
                    }
                    else {
                        console.log(`Error with StatChartsStats: ${modifiableStatChartsStats} -> ${error}`);
                    }
                }
            }

            for (let index = 0; index < modifiableBooleanStats.length; index++) {
                let key = modifiableBooleanStats[index].key;
                let value = modifiableBooleanStats[index].value;

                try {
                    childWindow.document.getElementById(key).value = value;
                    childWindow.document.getElementById(key).checked = value;
                }
                catch (error) {
                    if (error instanceof ReferenceError) {
                        // Error: childWindow is not defined
                    }
                    else {
                        console.log(`Error with BooleanStats: ${modifiableBooleanStats} -> ${error}`);
                    }
                }
            }
            for (let index = 0; index < modifiableNumericalStats.length; index++) {
                let key = modifiableNumericalStats[index].key;
                let value = modifiableNumericalStats[index].value;

                try {
                    childWindow.document.getElementById(key).textContent = value;
                }
                catch (error) {
                    if (error instanceof ReferenceError) {
                        // Error: childWindow is not defined
                    }
                    else {
                        console.log(`Error with NumericalStats: ${modifiableNumericalStats} -> ${error}`);
                    }
                }
            }
            for (let index = 0; index < modifiableStringStats.length; index++) {
                let key = modifiableStringStats[index].key;
                let value = modifiableStringStats[index].value;

                try {
                    // two string inputs to update: key-input and key-select
                    childWindow.document.getElementById(key + "-input").value = value;
                    childWindow.document.getElementById(key + "-input").textContent = value;
                    childWindow.document.getElementById(key + "-select").value = value;

                    let selectElement = childWindow.document.getElementById(key + "-select");
                    let val = selectElement.value;
                    let options = selectElement.options;

                    try {
                        if (typeof options != "undefined") {
                            for (let i = 0; i < options.length; i++) {
                                let option = options[i];

                                if (option.value != val) {
                                    option.removeAttribute("selected");
                                }
                                else {
                                    option.setAttribute("selected", "");
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.log(`Error with StringOptions: ${options} -> ${error}`);
                    }
                }
                catch (error) {
                    if (error instanceof ReferenceError) {
                        // Error: childWindow is not defined
                    }
                    else {
                        console.log(`Error with StringStats: ${modifiableStringStats} -> ${error}`);
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    else {
        if (loadCheatButton) {
            await updateStats();
        }
    }
}, 3000);
