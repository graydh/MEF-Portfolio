function visualization(){

    var dataset = [ 5, 10, 20, 20, 6, 25 ];

    var w = 1200;
    var h = 800;

    var svg = d3.select("#draw_here")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

    var outerRadius = h / 2;
    var innerRadius = h / 4;

    var arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

    var pie = d3.layout.pie();

    var color = d3.scale.category10();

    var arcs = svg.selectAll("g.arc")
            .data(pie(dataset))
            .enter()
            .append("g")
            .attr("class", "arc")
            .attr("transform", "translate("+ outerRadius + ", " + outerRadius +")");

    arcs.append("path")
            .attr("fill", function(d, i) {
                return color(i)
            })
            .attr("d", arc);

    arcs.append("text")
            .attr("transform", function(d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.value;
            });

}