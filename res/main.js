var width = 700;
var height = 700;
var svg = d3.select("#plot");
svg
        .attr("width", "100%")
        .attr("height", height+200)
        .attr("viewBox", (-50)+" "+(-100)+" "+(width+100)+" "+(height+200)+"")

TNA.Config.default.mapProjectionScale = 100;
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
    .attr("y", height - 10);

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
        if (values[i] > max && isFinite(values[i])) max = values[i];
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
    var xDomain = pad(minMax(x.col));
    var yDomain = pad(minMax(y.col));
    svg.select('#bgmap').transition()
    .duration(animDuration).style("opacity", "0");
    if (x.unit == y.unit) {
        if (x.unit == 'degree') {
            svg.select('#bgmap').transition()
            .duration(animDuration).style("opacity", "1");
        } else {
            xDomain = yDomain = [Math.min(xDomain[0], yDomain[0]), Math.max(xDomain[1], yDomain[1])];
        }
    }
    xScale.domain(xDomain);
    yScale.domain(yDomain);
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

   
    var rows = d3.select('#datatable').selectAll("tr").data(data.projects);
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
    var node = d3.select('#'+id).node();
    console.log(node.options, node.selectedIndex);
    if (node.value == -1 || node.selectedIndex == -1)
        return null;
    return {
        id: node.value,
        unit: node.options[node.selectedIndex].dataset.unit
    };
}

function divideColumns(mainCol, perCol) {
    var calculatedCol = [];
    for (var i=0; i<mainCol.length; i++) {
        var v = mainCol[i]/perCol[i];
        calculatedCol.push(v);
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

function getColumn(id, asFloat) {
    console.log('f', id);
    return data.projects.map(p => p[id][asFloat ? 'val' : 'lbl']);
}

function getSelectedColumnWithUnit(axis) {
    var main = getSelectedDimension('select-'+axis);
    var per = getSelectedDimension('select-'+axis+'-per');
    console.log(main, per);
    var mainCol = getColumn(main.id, true);
    if (per) {
        var calculatedCol = divideColumns(mainCol, getColumn(per.id, true));
        var calculatedUnit = divideUnits(main.unit, per.unit);

        return {col: calculatedCol, main: main.id, per: per.id, unit: calculatedUnit};
    }

    return {col: mainCol, main: main.id, per: null, unit: main.unit};
}

function triggerUpdatePlot(e) {
    var x = getSelectedColumnWithUnit('x');
    var y = getSelectedColumnWithUnit('y');
    var z = getSelectedColumnWithUnit('z');
    location.hash = '#'+x.main+'-'+x.per+'-'+y.main+'-'+y.per+'-'+z.main+'-'+z.per;
    updatePlot(x, y, z, 2000);
}

function loadJson(json) {
    data = json;
    initialize();
}

function loadBgMap() {
    var lonScale = d3.scaleLinear()
        .domain(pad(minMax(getColumn('longitude', true))))
        .range([0, width]);
    var latScale = d3.scaleLinear()
        .domain(pad(minMax(getColumn('latitude', true))))
        .range([height, 0]);
    var xyScale = function(c) {        
        return [lonScale(c[0]), latScale(c[1])];
    }
    
    TNA.Projection.projections['custom'] = function(c) {
        return new TNA.Vector(lonScale(c.x), latScale(c.y))
    };
    TNA.Config.default.mapProjection = 'custom';

    d3.json("/res/europe.geojson").then(function(data) {
        svg.select("#bgmap")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", d => {
                d.geometry.coordinates = d.geometry.coordinates.map(cs => cs.map(c => Array.isArray(c[0]) ? c.map(xyScale) : xyScale(c)));
                return d3.geoPath().projection(null)(d);
            })
    });
}

function presetSelect(id, per, preselected) {
    var select = d3.select('#'+id);
    select.on('change', per ? triggerUpdatePlot : function(e) { d3.select('#'+id+'-per').node().value = -1; triggerUpdatePlot(e); });
    select.node().value = preselected;
}

function preset(presets, idx, fallback) {
    return presets.length == 6 ? presets[idx] : fallback
}

function initialize() {
    loadBgMap();
    var names = getColumn('name', false);
    console.log(names);
    const projectElements = svg.select("#projects").selectAll("g")
    .data(data.projects)
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
        return "scale("+(1/100)+") translate(" + -c.x + "," + -c.y + ")";
    })
    .html(function (d, i) { return d.paths });   
    projectElements
    .append("text")
    .attr("class", "label")
    .html(function (d, i) { return d.name.lbl });

    var presets = location.hash.replace('#', '').split('-');
    presetSelect('select-x', false, preset(presets, 0, 'longitude'));
    presetSelect('select-x-per', true, preset(presets, 1, null));
    presetSelect('select-y', false, preset(presets, 2, 'latitude'));
    presetSelect('select-y-per', true, preset(presets, 3, null));
    presetSelect('select-z', false, preset(presets, 4, 'length_double_track'));
    presetSelect('select-z-per', true, preset(presets, 5, null));

    triggerUpdatePlot();
    document.dispatchEvent(new Event('startTransportNetworkAnimator'));
}

d3.json("/dist/data.json").then(loadJson);