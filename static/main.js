export default function donutChart() {
    // adapted from https://bl.ocks.org/mbhall88/22f91dc6c9509b709defde9dc29c63f2
    var // DOM binding
        data = [], // outer donut
        dataI = [], // inner donut
        as_of_date,
        dataKey = [],
        centerText = [],

        // 'hidden' chart data
        dataInner = {}, // inner donut - dataI = dataInner[currentInner]

        // schema
        variable,
        variableInner, // TODO - NOT USED
        category,
        categoryInner,

        // current user state
        currentInner,
        currentEquityIndex,

        // chart attributes
        width = 1380,
        height = 400,
        keyWidth = 280,
        keyHeight = 350,
        margin = {top: 10, right: 10, bottom: 10, left: 10},
        color = d3.scaleOrdinal([d3.rgb(128,12,44), d3.rgb(105,13,39), d3.rgb(69,7,27), d3.rgb(0,0,0), d3.rgb(38,38,38), d3.rgb(89,89,89), d3.rgb(191,191,191), d3.rgb(217,217,217), d3.rgb(188,162,170), d3.rgb(197, 145, 160), d3.rgb(166,84,107)]),  // MEF color scheme
        padAngle = 0.02, // gap between slices
        transTime = 0,
        cornerRadius = 1,
        keyMaxTextLength = 25,

        // functions
        updateData,
        generateKeyList,

        floatFormat = d3.format('.2f'),
        percentFormat = d3.format(',.1%'),
        moneyFormat = d3.format(',.2f');



    function chart(selection){
        selection.each(function() {
            // generate chart
            // ===========================================================================================
            var radius = Math.min(width, height) / 2;

            var pie = d3.pie()
                .value(function(d) { return floatFormat(d[variable]); })
                .sort(null);

            var arc = d3.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.6)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle);

            var outerArc = d3.arc()
                .outerRadius(radius * 0.9)
                .innerRadius(radius * 0.9);

            var svg = selection.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
              .append('g')
                .attr('transform', 'translate(' + (width / 2)  + ',' + (height / 2) + ')');

            svg.append('g').attr('class', 'slices');
            svg.append('g').attr('class', 'labelName');
            svg.append('g').attr('class', 'lines');
            svg.append('g').attr('class', 'inner');
            svg.append('g').attr('class', 'innerLabel');
            svg.append('g').attr('class', 'keyRect')
                .attr('transform', 'translate(' + (width * 9/30) + ',' + (-keyHeight / 2) + ')');
            svg.append('g').attr('class', 'author')
                .attr('transform', 'translate(' + (-width * 14/30) + ',' + (keyHeight * 0.4) + ')');

            var path = svg.select('.slices')
                .selectAll('path')
                .data(pie(data))
              .enter().append('path')
                .attr('fill', outer_fill_color)
                .attr('stroke', outer_stroke_color)
                .attr('d', arc);

            var label = svg.select('.labelName').selectAll('text')
                .data(pie(data))
              .enter().append('text')
                .attr('dy', '.35em')
                .html(updateLabelText)
                .attr('transform', labelTransform)
                .style('text-anchor', function(d) {
                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
                });
            // add lines connecting labels to slice
            var polyline = svg.select('.lines')
                .selectAll('polyline')
                .data(pie(data))
              .enter().append('polyline')
                .attr('points', calculatePoints);

            // add as_of_date signature
            svg.select('.author').append('text').attr("dy", "0em").attr('font-size', '0.75em').text('Holdings updated as of ' + as_of_date);
            // add author signature
            svg.select('.author').append('text').attr("dy", "1em").attr('font-size', '0.75em').text('Designed by Declan Gray-Mullen');

            // add inner donut
            var pieInner = d3.pie()
                .value(function(d) { return floatFormat(d["Market Value ($)"]); })
                .sort(null);

            var arc2 = d3.arc()
                .outerRadius(radius * 0.55)
                .innerRadius(radius * 0.35)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle*2);

            var pathInner = svg.select('.inner')
                    .selectAll('path')
                    .data(pieInner(dataI))
                .enter().append('path')
                    .attr('fill', inner_fill_color)
                    .attr('stroke', inner_stroke_color)
                    .attr('d', arc2);

            // TODO - refactor key functions
            var ellipse = function(stringToFinish){
                if(stringToFinish.length > keyMaxTextLength) {
                    return "..."
                }
                return ""
            }
            var correctCapitalization = function(stringToFix){
                return stringToFix.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            }
            var generateKeyList = function(obj) {
                dataKey = [
                    { "label":"Sector", "value":obj["Sector"].substring(0, keyMaxTextLength) + ellipse(obj["Sector"]) },
                    { "label":"Name", "value":correctCapitalization(obj[categoryInner].substring(0, keyMaxTextLength)) + ellipse(obj[categoryInner]) }
                ];
                if(obj["Product Type"] == "Stock"){
                    datakey.push( { "label":"Ticker", "value":obj["Symbol"] });
                    dataKey.push( { "label":"Current", "value":"$" + moneyFormat(obj["Last ($)"]) } );
                    var avg_cost = obj["Adjusted Cost ($)"]/obj["Quantity"];
                    dataKey.push( { "label":"Cost", "value":"$" + moneyFormat(avg_cost) } );
                    var pct_return = (obj["Last ($)"] - avg_cost) / avg_cost;
                    dataKey.push( { "label":"Return", "value":percentFormat(pct_return) } );
                    dataKey.push( { "label":"Shares", "value":obj["Quantity"] } );
                }
                dataKey.push( { "label":"Value", "value":"$" + moneyFormat(obj["Market Value ($)"]) } );
                return dataKey;
            }

            var keyRect = svg.select('.keyRect').append('rect')
                .attr('width', keyWidth)
                .attr('height', keyHeight)
                .attr('stroke', 'black')
                .attr('fill', 'none');
            generateKeyList(dataI[currentEquityIndex]);
            var keyText = svg.select('.keyRect').selectAll('text').data(dataKey).enter()
                    .append('text')
                    .html(updateKeyText)
                    .attr('y', function(d,i){ return 30 + i*40})
                    .attr('x', 10);

            svg.select('.innerLabel').append('circle')
                    .attr('id', 'coloredCircle')
                    .attr('r', 40)
                    .style('fill', color(dataI[currentEquityIndex][categoryInner]));
            svg.select('.innerLabel').append('circle')
                    .attr('id', 'whiteCircle')
                    .attr('r', 36)
                    .style('fill', 'white');
            var innerLabel = svg.select('.innerLabel').selectAll('text').data(centerText).enter()
                    .append('text')
                    .html(f => f)
                    .attr('dy', '.35em')
                    .style('text-anchor', 'middle');

            // add userInput function for mouse clicks
            d3.selectAll('.slices path ').call(userInput);
            d3.selectAll('.inner path').call(userInput);
            d3.selectAll('.labelName text').call(userInput);
            d3.selectAll('.innerLabelName text').call(userInput);

            // FUNCTION TO UPDATE CHART
            updateData = function() {
                console.log("Data update!");

                // Update Center Selection
                var currSelect = dataI[currentEquityIndex];
                generateKeyList(currSelect);
                centerText.pop();
                centerText.push(currSelect[variableInner]);

                d3.select('#coloredCircle')
                    .style('fill', color(dataI[currentEquityIndex][categoryInner]));

                var updateCenter = d3.select('.innerLabel').selectAll('text');
                updateCenter = updateCenter.data(centerText, function(d){return d;});
                updateCenter.enter().append('text')
                    .html(f => f)
                    .attr('dy', '.35em')
                    .style('text-anchor', 'middle');
                updateCenter.exit()
                    .remove();

                // Update Inner Donut
                var updateInnerData = d3.select('.inner').selectAll('path')
                    .attr('fill', inner_fill_color)
                    .attr('stroke', inner_stroke_color);
                var innerdata0 = updateInnerData.data(),
                    innerdata1 = pieInner(dataI);
                updateInnerData = updateInnerData.data(innerdata1, key);
                updateInnerData.enter().append('path')
                    .each(function(d, i) { this._current = findNeighborArc(i, innerdata0, innerdata1, key) || d; })
                    .attr('fill', inner_fill_color)
                    .attr('stroke', inner_stroke_color)
                    .attr('d', arc2);
                updateInnerData.exit()
                    .transition()
                    .duration(1)
                    .attrTween("d", arcTween2)
                    .remove();

                // Update Outer Donut
                var updatePath = d3.select('.slices').selectAll('path')
                    .attr('fill', outer_fill_color)
                    .attr('stroke', outer_stroke_color);
                var data0 = path.data(),
                    data1 = pie(data);
                updatePath = updatePath.data(data1, key);
                updatePath.enter().append('path')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('fill', outer_fill_color)
                    .attr('stroke', outer_stroke_color)
                    .attr('d', arc);
                updatePath.exit()
                    .transition()
                    .duration(transTime)
                    //change fill and stroke opacity to avoid CSS conflicts
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0)
                    .attrTween("d", arcTween)
                    .remove();

               // Update Outer Labels
                var updateLines = d3.select('.lines').selectAll('polyline');
                var updateLabels = d3.select('.labelName').selectAll('text');
                updateLines = updateLines.data(data1, key);
                updateLabels = updateLabels.data(data1, key);
                updateLines.enter().append('polyline')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('points', calculatePoints);
                updateLabels.enter().append('text')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .html(updateLabelText)
                    .attr('transform', labelTransform)
                    .style('text-anchor', function(d) { return (midAngle(d)) < Math.PI ? 'start' : 'end'; });
                updateLines.exit()
                    .transition()
                    .duration(transTime)
                    .attrTween("points", pointTween)
                    .remove();
                updateLabels.exit()
                    .remove();

                updateLabels.html(updateLabelText); // update the label text

                // Update the Key
                var updateKey = d3.select('.keyRect').selectAll('text');
                var keydata0 = updateKey.data(),
                    keydata1 = dataKey;
                updateKey = updateKey.data(keydata1, function(d) { return d["value"]; } );
                updateKey.enter().append('text')
                    .html(updateKeyText)
                    .attr('y', function(d,i){ return 30 + i*40})
                    .attr('x', 10);
                updateKey.exit()
                    .remove();

                // add interactive userInput(selection) for mouse clicks
                d3.selectAll('.slices path').call(userInput);
                d3.selectAll('.inner path').call(userInput);
                d3.selectAll('.labelName text').call(userInput);
                d3.selectAll('.innerLabelName text').call(userInput);

            };

            // determines the path stroke color
            function outer_stroke_color(d) {
                d = d.data[category];
                if(d == currentInner){ return color(d) };
                return null;
            }
            function inner_stroke_color(d, i){
                if( i == currentEquityIndex){ return color(d.data[categoryInner]) };
                return null;
            }
            // determines the path fill color
            function outer_fill_color(d) {
                d = d.data[category]
                if(d == currentInner) { return 'white' };
                return color(d);
            }
            function inner_fill_color(d, i) {
                if( i == currentEquityIndex) { return 'white' };
                return color(d.data[categoryInner]);
            }

            // calculates the angle for the middle of a slice
            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            function userInput(selection) {
                selection.on('click', function (data) {
                    if(data.data['Product Type'] != null){
                        currentEquityIndex = data.index
                    }
                    else{
                        currentInner = data.data[category];
                        dataI = dataInner[currentInner];
                        currentEquityIndex = 0;
                    }
                    updateData();
                });
            }

            // calculate the points for the polyline to pass through
            function calculatePoints(d) {
                // see label transform function for explanations of these three lines.
                var pos = outerArc.centroid(d);
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return [arc.centroid(d), outerArc.centroid(d), pos]
            }

            function labelTransform(d) {
                // effectively computes the centre of the slice.
                // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
                var pos = outerArc.centroid(d);

                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            }

            function updateLabelText(d) {
                return d.data[category] + ': <tspan>' + percentFormat(d.data[variable]) + '</tspan>';
            }

            function updateKeyText(d) {
                return '<tspan>' + d["label"] + ': </tspan>' + d["value"];
            }

            function updateInnerSymbolText(d) {
                return d;
            }

            // function that calculates transition path for label and also it's text anchoring
            function labelStyleTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? 'start':'end';
                };
            }

            function labelTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2  = interpolate(t),
                        pos = outerArc.centroid(d2); // computes the midpoint [x,y] of the centre line that would be
                    // generated by the given arguments. It is defined as startangle + endangle/2 and innerR + outerR/2
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1); // aligns the labels on the sides
                    return 'translate(' + pos + ')';
                };
            }

            function pointTween(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2  = interpolate(t),
                        pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            }

            // function to calculate the tween for an arc's transition.
            // see http://bl.ocks.org/mbostock/5100636 for a thorough explanation.
            function arcTween(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function(t) { return arc(i(t)); };
            }

            function arcTween2(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function(t) { return arc2(i(t)); };
            }

            function findNeighborArc(i, data0, data1, key) {
                var d;
                return (d = findPreceding(i, data0, data1, key)) ? {startAngle: d.endAngle, endAngle: d.endAngle}
                    : (d = findFollowing(i, data0, data1, key)) ? {startAngle: d.startAngle, endAngle: d.startAngle}
                        : null;
            }
            // Find the element in data0 that joins the highest preceding element in data1.
            function findPreceding(i, data0, data1, key) {
                var m = data0.length;
                while (--i >= 0) {
                    var k = key(data1[i]);
                    for (var j = 0; j < m; ++j) {
                        if (key(data0[j]) === k) return data0[j];
                    }
                }
            }

            function key(d) {
                if (d.data === undefined) return null;
                if (d.data[categoryInner]) return d.data[categoryInner]; // If inner data
                return d.data[category];
            }

            // Find the element in data0 that joins the lowest following element in data1.
            function findFollowing(i, data0, data1, key) {
                var n = data1.length, m = data0.length;
                while (++i < n) {
                    var k = key(data1[i]);
                    for (var j = 0; j < m; ++j) {
                        if (key(data0[j]) === k) return data0[j];
                    }
                }
            }
        });
    }

    // getter and setter functions. See Mike Bostocks post "Towards Reusable Charts" for a tutorial on how this works.

    chart.variable = function(value) {
        if (!arguments.length) return variable;
        variable = value;
        return chart;
    };

    chart.category = function(value) {
        if (!arguments.length) return category;
        category = value;
        return chart;
    };

    chart.variableInner = function(value) {
        if (!arguments.length) return variableInner;
        variableInner = value;
        return chart;
    };

    chart.categoryInner = function(value) {
        if (!arguments.length) return categoryInner;
        categoryInner = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value["bySector"];
        dataInner = value["byEquity"];
        as_of_date = value["as_of_date"];
        currentInner = value["default_sector"];
        currentEquityIndex = 0
        dataI = dataInner[currentInner];
        centerText = [dataI[currentEquityIndex][variableInner]];
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    return chart;
}