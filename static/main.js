export default function donutChart() {
    // adapted from https://bl.ocks.org/mbhall88/22f91dc6c9509b709defde9dc29c63f2

    var data = [], // outer donut
        dataI = [], // inner donut (selection),
        dataKey = [],
        dataInner = {}, // inner donut (all sectors)
        currentInner = "Healthcare",
        currentEquityIndex = 0,
        keyDataStrings = [],
        width,
        height,
        margin = {top: 10, right: 10, bottom: 10, left: 10},
        colour = d3.scaleOrdinal([d3.rgb(133,4,31), d3.rgb(139,26,58), d3.rgb(145,48,76), d3.rgb(151,70,93), d3.rgb(157,92,111), d3.rgb(162,114,128), d3.rgb(168,136,145), d3.rgb(174,158,163), d3.rgb(180,180,180)]), //MEF Color Space
        variable, // value in data that will dictate proportions on chart
        variableInner,
        category, // compare data by
        categoryInner,
        padAngle, // effectively dictates the gap between slices
        transTime, // transition time
        updateData,
        generateKeyList,
        floatFormat = d3.format('.4r'),
        nf = new Intl.NumberFormat(),
        cornerRadius, // sets how rounded the corners are on each slice
        percentFormat = d3.format(',.2%'),
        keyWidth = 280,
        keyHeight = 350,
        keyMaxTextLength = 22;

    function chart(selection){
        selection.each(function() {
            // generate chart
            // ===========================================================================================
            // Set up constructors for making donut. See https://github.com/d3/d3-shape/blob/master/README.md
            var radius = Math.min(width, height) / 2;

            var pie = d3.pie()
                .value(function(d) { return floatFormat(d[variable]); })
                .sort(null);

            var arc = d3.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.6)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle);

            // this arc is used for aligning the text labels
            var outerArc = d3.arc()
                .outerRadius(radius * 0.9)
                .innerRadius(radius * 0.9);
            // ===========================================================================================

            // ===========================================================================================
            // append the svg object to the selection
            // var svg = selection.append('svg')
            var svg = selection.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
              .append('g')
                .attr('transform', 'translate(' + (width / 2)  + ',' + (height / 2) + ')');
            // ===========================================================================================

            // ===========================================================================================
            // g elements to keep elements within svg modular
            svg.append('g').attr('class', 'slices');
            svg.append('g').attr('class', 'labelName');
            svg.append('g').attr('class', 'lines');
            svg.append('g').attr('class', 'inner');
            svg.append('g').attr('class', 'innerLabelName');
            svg.append('g').attr('class', 'keyRect')
                .attr('transform', 'translate(' + (width * 9/30) + ',' + (-keyHeight / 2) + ')');
            // ===========================================================================================

            // ===========================================================================================
            // add and colour the donut slices
            var path = svg.select('.slices')
                .selectAll('path')
                .data(pie(data))
              .enter().append('path')
                .attr('fill', function(d) { return colour(d.data[category]); })
                .attr('d', arc);
            // ===========================================================================================

            // ===========================================================================================
            // add text labels
            var label = svg.select('.labelName').selectAll('text')
                .data(pie(data))
              .enter().append('text')
                .attr('dy', '.35em')
                .html(updateLabelText)
                .attr('transform', labelTransform)
                .style('text-anchor', function(d) {
                    // if slice centre is on the left, anchor text to start, otherwise anchor to end
                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
                });
            // ===========================================================================================

            // ===========================================================================================
            // add lines connecting labels to slice. A polyline creates straight lines connecting several points
            var polyline = svg.select('.lines')
                .selectAll('polyline')
                .data(pie(data))
              .enter().append('polyline')
                .attr('points', calculatePoints);
            // ===========================================================================================

            // ===========================================================================================
            // add inner Equity donut
            var pieInner = d3.pie()
                .value(function(d) { return floatFormat(d["market_value"]); })
                .sort(null);

            var arc2 = d3.arc()
                .outerRadius(radius * 0.55)
                .innerRadius(radius * 0.35)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle);

            var arcInnerText = d3.arc()
                .outerRadius(radius * 0.15)
                .innerRadius(radius * 0.15);

            var pathInner = svg.select('.inner')
                    .selectAll('path')
                    .data(pieInner(dataI))
                .enter().append('path')
                    .attr('fill', function(d) { return colour(d.data["name"]); })
                    .attr('d', arc2);

            var centerLabel = svg.select('.innerLabelName')
                    .selectAll('text')
                    .data(pieInner(dataI))
                .enter().append('text')
                    .attr('dy', '.35em')
                    .html(updateInnerLabelText)
                    .attr('transform', labelInnerTransform)
                    .style('text-anchor', function(d) { return (midAngle(d)) < Math.PI ? 'start' : 'end'; });

            // ===========================================================================================
            var ellipse = function(stringToFinish){
                if(stringToFinish.length > keyMaxTextLength) {
                    return "..."
                }
                return ""
            }

            generateKeyList = function(dataObj) { //dataI[currentEquityIndex] as parameter
                dataKey = [];
                dataKey.push( { "label":"Sector", "value":dataObj["sector"].substring(0, keyMaxTextLength) + ellipse(dataObj["sector"]) } );
                dataKey.push( { "label":"Name", "value":dataObj["name"].substring(0, keyMaxTextLength) + ellipse(dataObj["name"]) } );
                dataKey.push({ "label":"Ticker", "value":dataObj["symbol"] } );
                if(dataObj["asset_type"] == "Stocks / Options"){
                    dataKey.push( { "label":"Current", "value":"$" + nf.format(dataObj["last_price"]) } );
                    dataKey.push( { "label":"Cost", "value":"$" + dataObj["avg_cost"] } );
                    dataKey.push( { "label":"Return", "value":parseFloat(100 * (dataObj["last_price"] - dataObj["avg_cost"]) / dataObj["avg_cost"]).toFixed(2).toString() + "%" } );
                    dataKey.push( { "label":"Shares", "value":dataObj["quantity"] } );
                }
                dataKey.push( { "label":"Value", "value":"$" + nf.format(floatFormat(dataObj["market_value"])) } );
                return dataKey;
            }

            var keyRect = svg.select('.keyRect').append('rect')
                .attr('width', keyWidth)
                .attr('height', keyHeight)
                .attr('stroke', 'black')
                .attr('fill', 'none');
            dataKey = generateKeyList(dataI[currentEquityIndex]);
            var keyText = svg.select('.keyRect').selectAll('text').data(dataKey).enter()
                    .append('text')
                    .html(updateKeyText)
                    .attr('y', function(d,i){ return 30 + i*40})
                    .attr('x', 10);

            // ===========================================================================================

            // ===========================================================================================
            // add tooltip to mouse events on slices and labels
            d3.selectAll('.slices path ').call(toolTip);
            d3.selectAll('.inner path').call(toolTip);
            // ===========================================================================================
            // ===========================================================================================
            // FUNCTION TO UPDATE CHART
            updateData = function() {
                var updatePath = d3.select('.slices').selectAll('path');
                var updateLines = d3.select('.lines').selectAll('polyline');
                var updateLabels = d3.select('.labelName').selectAll('text');
                var updateInnerData = d3.select('.inner').selectAll('path');
                var updateInnerLabels = d3.select('.innerLabelName').selectAll('text');
                var updateKey = d3.select('.keyRect').selectAll('text');

                generateKeyList(dataI[currentEquityIndex]);

                var data0 = path.data(), // store the current data before updating to the new
                    data1 = pie(data);
                var innerdata0 = updateInnerData.data(),
                    innerdata1 = pieInner(dataI);
                var keydata0 = updateKey.data(),
                    keydata1 = dataKey;
                // update data attached to the slices, labels, and polylines. the key function assigns the data to
                // the correct element, rather than in order of how the data appears. This means that if a category
                // already exists in the chart, it will have its data updated rather than removed and re-added.
                updatePath = updatePath.data(data1, key);
                updateLines = updateLines.data(data1, key);
                updateLabels = updateLabels.data(data1, key);
                updateInnerData = updateInnerData.data(innerdata1, key);
                updateInnerLabels = updateInnerLabels.data(innerdata1, key);
                updateKey = updateKey.data(keydata1, function(d) { return d; } );


                // adds new slices/lines/labels
                updatePath.enter().append('path')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('fill', function(d) {  return colour(d.data[category]); })
                    .attr('d', arc);

                updateLines.enter().append('polyline')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .attr('points', calculatePoints);

                updateLabels.enter().append('text')
                    .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
                    .html(updateLabelText)
                    .attr('transform', labelTransform)
                    .style('text-anchor', function(d) { return (midAngle(d)) < Math.PI ? 'start' : 'end'; });

                updateInnerData.enter().append('path')
                    .each(function(d, i) { this._current = findNeighborArc(i, innerdata0, innerdata1, key) || d; })
                    .attr('fill', function(d) { return colour(d.data["name"]); })
                    .attr('d', arc2);

                updateInnerLabels.enter().append('text')
                    .attr('dy', '.35em')
                    .html(updateInnerLabelText)
                    .attr('transform', labelInnerTransform)
                    .style('text-anchor', function(d) { return (midAngle(d)) < Math.PI ? 'start' : 'end'; });

                updateKey.enter().append('text')
                    .html(updateKeyText)
                    .attr('y', function(d,i){ return 30 + i*40})
                    .attr('x', 10);

                // removes slices/labels/lines that are not in the current dataset
                updatePath.exit()
                    .transition()
                    .duration(transTime)
                    //change fill and stroke opacity to avoid CSS conflicts
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0)
                    .attrTween("d", arcTween)
                    .remove();

                updateLines.exit()
                    .transition()
                    .duration(transTime)
                    .attrTween("points", pointTween)
                    .remove();

                updateLabels.exit()
                    .remove();

                updateInnerData.exit()
                    .transition()
                    .duration(1)
                    .attrTween("d", arcTween2)
                    .remove();

                updateInnerLabels.exit()
                    .remove();

                updateKey.exit()
                    .remove();

                // animates the transition from old angle to new angle for slices/lines/labels
                updateInnerData.transition().duration(transTime)
                    .attrTween('d', arcTween2);

                updateLabels.html(updateLabelText); // update the label text

                // add tooltip to mouse events on slices and labels
                d3.selectAll('.slices path').call(toolTip);
                d3.selectAll('.inner path').call(toolTip);

            };


            // calculates the angle for the middle of a slice
            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            function toolTip(selection) {
                selection.on('click', function (data) {
                    if(data.data['asset_type'] != null){
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

            // function to create the HTML string for the tool tip. Loops through each key in data object
            // and returns the html string key: value
            function toolTipHTML(data) {

                var tip = '',
                    i   = 0;

                for (var key in data.data) {

                    // if value is a number, format it as a percentage
                    var value = (!isNaN(parseFloat(data.data[key]))) ? percentFormat(data.data[key]) : data.data[key];

                    // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
                    // tspan effectively imitates a line break.
                    if (i === 0) tip += '<tspan x="0">' + key + ': ' + value + '</tspan>';
                    else tip += '<tspan x="0" dy="1.2em">' + key + ': ' + value + '</tspan>';
                    i++;
                }

                return tip;
            }

            // calculate the points for the polyline to pass through
            function calculatePoints(d) {
                // see label transform function for explanations of these three lines.
                var pos = outerArc.centroid(d);
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return [arc.centroid(d), outerArc.centroid(d), pos]
            }
            // same but for inner
            function calculatePoints2(d) {
                var pos = arcInnerText.centroid(d);
                var arcInnerLabelEnd = d3.arc()
                    .outerRadius(radius * 0.3)
                    .innerRadius(radius * 0.3);
                pos[0] = radius * 0.15 * (midAngle(d) < Math.PI ? 1 : -1);
                return [arc2.centroid(d), arcInnerLabelEnd.centroid(d), pos]
            }

            function labelTransform(d) {
                // effectively computes the centre of the slice.
                // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
                var pos = outerArc.centroid(d);

                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            }

            function labelInnerTransform(d) {
                var pos = arcInnerText.centroid(d);

                // changes the point to be on left or right depending on where label is.
                pos[0] = pos[0] + radius * 0.07 * (midAngle(d) > Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            }

            function updateLabelText(d) {
                return d.data[category] + ': <tspan>' + percentFormat(d.data[variable]) + '</tspan>';
            }

            function updateInnerLabelText(d) {
                return d.data['symbol'];
            }

            function updateKeyText(d) {
                return '<tspan>' + d["label"] + ': </tspan>' + d["value"];
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

            // same but for inner
            function pointTween2(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t){
                    var d2  = interpolate(t),
                        pos = arcInnerText.centroid(d2);
                    pos[0] = radius * 0.005 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc2.centroid(d2), arcInnerText.centroid(d2), pos];
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
                if (d.data['name']) return d.data[categoryInner]; // If inner data
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
    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };

    chart.padAngle = function(value) {
        if (!arguments.length) return padAngle;
        padAngle = value;
        return chart;
    };

    chart.cornerRadius = function(value) {
        if (!arguments.length) return cornerRadius;
        cornerRadius = value;
        return chart;
    };

    chart.colour = function(value) {
        if (!arguments.length) return colour;
        colour = value;
        return chart;
    };

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

    chart.transTime = function(value) {
        if (!arguments.length) return transTime;
        transTime = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value["bySector"];
        dataInner = value["byEquity"][0]; //hardcode 0 for 1 time tick instead of dynamic-
        dataI = dataInner[currentInner];
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    return chart;
}