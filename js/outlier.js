d3.identity = function(d) { return d; }
var fmt = d3.format(".2f")

var create_preview = function(data) {
    var preview = data.slice(1, 5);

    d3.select("#filesize").text(file.size + " bytes uploaded");
    d3.select("#preview-table table").remove()

    var table = d3.select("#preview-table").append("table")
    table.append("thead")
        .append("tr")
            .selectAll("th")
            .data(data[0])
            .enter()
            .append("th").text(d3.identity)

        d3.select("#preview-table").style("display", "block");
        table.append("tbody")
            .selectAll("tr")
            .data(preview)
            .enter()
            .append("tr")
                .each(function(d) {
                    var rest = d.slice(1, d.length);
                    d3.select(this).append("th").text(d[0]);
                    d3.select(this)
                        .selectAll("td")
                        .data(rest)
                        .enter()
                        .append("td")
                        .text(fmt)
                })
}

var process_pca = function(data) {
    var only_data = []
    for (var i = 1; i < data.length; i++) {
        only_data.push(data[i].slice(1, data[i].length));
    }
    pca = new ML.PCA(only_data);
    var means = pca.means;
    var predicted = pca.predict(only_data)

    var predicted_with_labels = []
    for (var i = 0; i < predicted.length; i++) {
        predicted_with_labels.push([data[i + 1][0]].concat(predicted[i]))
    }
    return predicted_with_labels;
}

var create_variable_graph = function(svg, datum) {
    var only_data = datum[1].slice(1, datum[1].length);
    var min_radius = 5, max_radius = 20;
    var circle_width = 1000, circle_height = 100;
    var padding = 50;

    var circle_scale = d3.scaleLinear().domain([0, only_data.length - 1]).range([padding, circle_width - padding]);
    var radius_scale = d3.scaleLinear().domain([d3.min(only_data), d3.max(only_data)]).range([min_radius, max_radius]);

    svg.selectAll("circle").remove();
    svg.selectAll("text").remove();

    svg.append("text")
        .attr("id", "variable-label")
        .attr("x", 5)
        .attr("y", circle_height - 5)
        .text(datum[0][1] + ": " + fmt(datum[1][1]))
    svg.selectAll("circle").data(only_data).enter()
        .append("circle")
        .attr("cx", function(el, idx2) {
            return circle_scale(idx2);
        })
        .attr("cy", circle_height / 2)
        .attr("r", function(el) {
            return radius_scale(el);
        })
        .on("mouseover", function(d, idx) {
            svg.select("#variable-label").text(datum[0][idx + 1] + ": " + fmt(datum[1][idx + 1]))
            d3.select(this).classed("highlight", true);
        })
        .on("mouseout", function(d, idx) {
            d3.select(this).classed("highlight", false);
        })
}

var create_graph = function(original, data) {
    var canvas_width = 1000;
    var canvas_height = 500;
    var padding = 50;
    var radius = 5;
    var svg_circles = d3.select("#circle_canvas")
    var svg_pca = d3.select("#pca_canvas")

    d3.select("#scatter-plot").style("display", "block");
    svg_circles.selectAll("circle").remove()
    svg_pca.selectAll("circle").remove()

    var width = function(el) { return el[1] };
    var height = function(el) { return el[2] };
    var headers = original[0];

    var scale_w = d3.scaleLinear()
        .domain([
            d3.min(data, width) * 1.2,
            d3.max(data, width) * 1.2,
        ])
        .range([padding, canvas_width - padding])

    var scale_h = d3.scaleLinear()
        .domain([
            d3.min(data, height) * 1.2,
            d3.max(data, height) * 1.2,
        ])
        .range([padding, canvas_height - padding])

    svg_pca.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function(d) { return scale_w(width(d)); })
            .attr("cy", function(d) { return scale_h(height(d)); })
            .attr("r", radius)
            .on("mouseover", function(d, idx) {
                var label = d3.select("#scatter-plot #label")
                var datum = original[idx + 1];
                
                label.text(datum[0])
                create_variable_graph(svg_circles, [headers, datum]);
                d3.select(this).classed("highlight", true);
            })
            .on("mouseout", function() {
                d3.select(this).classed("highlight", false);
            })
}

d3.select("#file").on("change", function(ev) {
    var file = d3.event.target.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        var data = d3.csvParseRows(reader.result, function(row, idx) {
            if (idx == 0)
                return row;
            else
                return row.map(function(d, i) {
                    if (i == 0)
                        return d
                    else
                        return parseFloat(d);
                })
        });

        create_preview(data);
        var predicted_with_labels = process_pca(data);
        create_graph(data, predicted_with_labels);

    }
    reader.readAsText(file);
});


