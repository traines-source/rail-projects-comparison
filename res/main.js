var width = 900;
var height = 500;
var svg = d3.select("#plot");
svg
    .attr("width", width+100)
    .attr("height", height+100)
    .attr("viewBox", "-50 -50 "+(width+100)+" "+(height+100)+"")
    .append("g");

TNA.Config.default.mapProjectionScale = 3000;
TNA.Config.default.animSpeed = 10000;

var data = [];
var padding = 0.1;

var langs = {
    'en': {id: 0, per: 'per', decimal: '.'},
    'de': {id: 1, per: 'pro', decimal: ','},
    'fr': {id: 2, per: 'par', decimal: ','}
};
var lang = 'en';
d3.formatDefaultLocale({
    "decimal": langs[lang].decimal,
    "thousands": " ",
    "grouping": [3],
    "currency": ["€", ""]
});

var xScale = d3.scaleLinear()
    .domain([0, 0])
    .range([0, width]);
var yScale = d3.scaleLinear()
    .domain([0, 0])
    .range([height, 0]);
var zScale = d3.scaleLinear()
    .domain([0, 0])
    .range([0, 1]);

svg.append("g")
    .attr("id", "x-axis") 
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));
svg.append("g")
    .attr("id", "y-axis") 
    .call(d3.axisLeft(yScale));
svg.append("rect")
    .attr("id", "z-axis")
    .attr("class", "color-axis")
    .attr("x", width-95)
    .attr("y", 2)
    .attr("width", 90)
    .attr("height", 5)
    .attr("fill", "url(#gradient)");

svg.append("text")
    .attr("id", "x-unit")
    .attr("class", "unit")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6);

svg.append("text")
    .attr("id", "y-unit")
    .attr("class", "unit")
    .attr("text-anchor", "start")
    .attr("x", 6)
    .attr("y", 6);

svg.append("text")
    .attr("id", "z-unit-min")
    .attr("class", "unit")
    .attr("text-anchor", "end")
    .attr("x", width-100)
    .attr("y", 6);
svg.append("text")
    .attr("id", "z-unit-max")
    .attr("class", "unit")
    .attr("text-anchor", "start")
    .attr("x", width)
    .attr("y", 6);


function minMax(values) {
    var min = values[0];
    var max = values[0];
    for (var i=1; i<values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
    }
    return [min, max];
}

function pad(minMax) {
    var pad = (minMax[1]-minMax[0])*padding;
    var lower = minMax[0] >= 0 && minMax[0]-pad < 0 ? 0 : minMax[0]-pad;
    var upper = minMax[1]+pad;
    return [lower, upper];
}

function gradient(from, to, ratio) {
    var r = Math.ceil(from[0] * (1-ratio) + to[0] * ratio);
    var g = Math.ceil(from[1] * (1-ratio) + to[1] * ratio);
    var b = Math.ceil(from[2] * (1-ratio) + to[2] * ratio);
    return [r, g, b];
}

function updatePlot(x, y, z, animDuration) {
    xScale.domain(pad(minMax(x.col)));
    yScale.domain(pad(minMax(y.col)));
    var zMinMax = minMax(z.col);
    zScale.domain(zMinMax);
    format = zScale.tickFormat();

    svg.select("#x-axis")
    .transition()
    .duration(animDuration)
    .call(d3.axisBottom(xScale));

    svg.select("#y-axis")
    .transition()
    .duration(animDuration)
    .call(d3.axisLeft(yScale));

    svg.select("#x-unit").text(x.unit);
    svg.select("#y-unit").text(y.unit);
    svg.select("#z-unit-min").text(format(zMinMax[0]));
    svg.select("#z-unit-max").text(format(zMinMax[1])+' '+z.unit);

    svg.selectAll(".project")
    .transition()
    .duration(animDuration)
    .attr("transform", function (d, i) { return "translate(" + xScale(x.col[i]) + "," + yScale(y.col[i]) + ")" })
    .attr("stroke", function (d, i) { return "rgb(" + gradient([1, 87, 155], [183, 28, 28], zScale(z.col[i])) + ")" })

   
    var rows = d3.select('#datatable').selectAll("tr").data(Object.values(data.projects));
    rows.enter().append("tr").selectAll("td")
    .data(function (d, i) {return [d.name.lbl, x.col[i], y.col[i], z.col[i]];})
    .enter()
    .append("td")
    .text(function (d, i) {return i == 0 ? d : format(d);});

    rows.selectAll('td')
    .data(function (d, i) {return [d.name.lbl, x.col[i], y.col[i], z.col[i]];})
    .text(function (d, i) {return i == 0 ? d : format(d);});
}

function getSelectedDimension(id) {
    var idx = d3.select('#'+id).node().value;
    if (idx == -1) return null;
    return idx;
}

function getUnit(id) {
    return data.dimensions[id].unit[lang];
}

function divideColumns(mainCol, perCol) {
    var calculatedCol = [];
    for (var i=0; i<mainCol.length; i++) {
        calculatedCol.push(mainCol[i]/perCol[i]);
    }
    return calculatedCol;
}

function arrayDiff(a, b) {
    return a.filter(e => !b.includes(e));
}

function fractionParts(a, b) {
    var part = [];
    part.push(a[0]);
    if (b.length > 1) part.push(b[1]);
    return part;
}

function fractionPartToStr(a, b, prefix, emptyStr) {
    var str = arrayDiff(a, b).join('*');
    if (str.length == 0) return emptyStr;
    return prefix+str;
}

function divideUnits(mainUnit, perUnit) {
    var mainParts = mainUnit.split('/');
    var perParts = perUnit.split('/');
    var numerator = fractionParts(mainParts, perParts);
    var denominator = fractionParts(perParts, mainParts);
    return fractionPartToStr(numerator, denominator, '', '1') + fractionPartToStr(denominator, numerator, '/', '');
}

function getSelectedColumnWithUnit(axis) {
    var main = getSelectedDimension('select-'+axis);
    var per = getSelectedDimension('select-'+axis+'-per');
    
    var mainCol = getColumn(main, true);
    var mainUnit = getUnit(main);
    if (per) {
        var calculatedCol = divideColumns(mainCol, getColumn(per, true));
        var calculatedUnit = divideUnits(mainUnit, getUnit(per));

        return {col: calculatedCol, main: main, per: per, unit: calculatedUnit};
    }

    return {col: mainCol, main: main, per: null, unit: mainUnit};
}

function triggerUpdatePlot(e) {
    var x = getSelectedColumnWithUnit('x');
    var y = getSelectedColumnWithUnit('y');
    var z = getSelectedColumnWithUnit('z');
    location.hash = '#'+x.main+'-'+x.per+'-'+y.main+'-'+y.per+'-'+z.main+'-'+z.per;
    updatePlot(x, y, z, 2000);
}

function loadJson(json) {
    data = JSON.parse(json);
    initialize();
}

function getColumn(id, asFloat) {
    console.log(id);
    return Object.values(data.projects).map(p => p[id][asFloat ? 'val' : 'lbl']);
}

function getDimensionIds() {
    return Object.keys(data.dimensions);
}

function getDimensionLabels(lang) {
    return Object.values(data.dimensions).map(v => v.hidden ? null : v.lbl[lang]);   
}

function populateSelect(id, ids, labels, per, preselected) {
    var select = d3.select('#'+id);
    select
        .on('change', per ? triggerUpdatePlot : function(e) { document.getElementById(id+'-per').value = -1; triggerUpdatePlot(e); });
    for (var i=-1; i<ids.length; i++) {
        if (!per && i == -1) continue;
        if (i != -1 && !labels[i]) continue;
        select
            .append('option')
            .attr('value', i == -1 ? -1 : ids[i])
            .attr('selected', ids[i]==preselected ? true : undefined)
            .html(i == -1 ? '' : (per ? langs[lang].per+' ' : '')+labels[i]);
    }
}

function zip(obj) {
    var arr = [];
    var numberElements = obj[obj.keys()[0]].length;
    for(var i=0;i<numberElements;i++) {
        var entry = {};
        for(var j=0;j<obj.keys();j++) {
            entry[obj.keys()[j]] = obj.values()[j][i];
        }
        arr.push(entry);
    }
    return arr;
}

function initialize() {
    var names = getColumn('name', false);
    console.log(names);
    const projectElements = svg.select("#projects").selectAll("g")
    .data(Object.values(data.projects))
    .enter()
    .append("g")
    .attr("class", "project");

    projectElements
    .append("circle", ":first-child")
    .attr("r", 10);
    projectElements    
    .append("g")
    .attr("transform", function (d, i) {
        var c = TNA.Projection.default.project(new TNA.Vector(d.longitude.val, d.latitude.val));
        return "scale("+(1/50)+") translate(" + -c.x + "," + -c.y + ")";
    })
    .html(function (d, i) { return d.paths });   
    projectElements
    .append("text")
    .attr("class", "label")
    .html(function (d, i) { return d.name.lbl });

    var ids = getDimensionIds();
    var labels = getDimensionLabels(lang);

    var presets = location.hash.replace('#', '').split('-');
    var x = presets.length == 6 ? presets[0] : 'longitude';
    var y = presets.length == 6 ? presets[2] : 'latitude';
    var z = presets.length == 6 ? presets[4] : 'length_double_track';

    populateSelect('select-x', ids, labels, false, x);
    populateSelect('select-x-per', ids, labels, true, presets.length == 6 ? presets[1] : null);
    populateSelect('select-y', ids, labels, false, y);
    populateSelect('select-y-per', ids, labels, true, presets.length == 6 ? presets[3] : null);
    populateSelect('select-z', ids, labels, false, z);
    populateSelect('select-z-per', ids, labels, true, presets.length == 6 ? presets[5] : null);

    triggerUpdatePlot();
    document.dispatchEvent(new Event('startTransportNetworkAnimator'));
}

fetch("/dist/data.json").then(response => response.text())
.then(json => loadJson(json));