var svg = d3.select("svg"),
    margin = {
      top: 20,
      right: 120,
      bottom: 30,
      left: 140
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

var parseTime = d3.timeParse("%Y-%m-%d");

bisectDate = d3.bisector(function (d) {
  return d.days;
}).left;

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var line = d3.line().x(function (d) {
  return x(d.days);
}).y(function (d) {
  return y(d.value);
});

var minValue = 0;
var maxValue = 0;

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("data.json", function (error, data) {
  if (error) throw error;

  data.forEach(function (d) {
    d.days = parseTime(d.days);
    d.value = +d.value;
  });

  function getMax(arr, prop) {
      var max;
      for (var i=0 ; i<arr.length ; i++) {
          if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
              max = arr[i];
      }
      return max;
  }

  function getMin(arr, prop) {
    var min;
    for (var i=0 ; i<arr.length ; i++) {
        if (!min || parseInt(arr[i][prop]) < parseInt(min[prop]))
            min = arr[i];
    }
    return min;
}

  x.domain(d3.extent(data, function (d) {
    return d.days;
  }));

  y.domain([d3.min(data, function (d) {
    return d.value;
  }) / 1.005, d3.max(data, function (d) {
    return d.value;
  }) * 1.005]);

  g.append("g").attr("class", "axis axis--x").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d")));
  g.append("g").attr("class", "axis axis--y").call(d3.axisLeft(y));
  
  g.append("path").datum(data).attr("class", "line").attr("d", line);

  g.append("linearGradient")
  .attr("id", "graph-gradient")
  .attr("gradientUnits", "userSpaceOnUse")
  .attr("x1", 0)
  .attr("y1", y(Math.min.apply(null, d)))
  .attr("x2", 0)
  .attr("y2", y(Math.max.apply(null, d)))
  .selectAll("stop")
  .data([
    { offset: "0%", color: "blue" },
    { offset: "50%", color: "white" },
    { offset: "100%", color: "red" }
  ])
  .enter()
  .append("stop")
  .attr("offset", d => d.offset)
  .attr("stop-color", d => d.color);

  var focus = g.append("g").attr("class", "focus").style("display", "none");

  focus.append("circle").attr("r", 7.5);
  focus.append("text").attr("x", 15).attr("dy", ".3em");
  
  svg.append("rect").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .style('cursor', 'pointer')
  .attr("class", "overlay").attr("width", width).attr("height", height)
  .on("mouseover touchstart", function () {
    focus.style("display", null);
  }).on("mouseout touchend", function () {
    focus.style("display", "none");
  }).on("mousemove touchmove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(data, x0, 1),
      d0 = data[i - 1],
      d1 = data[i],
      d = x0 - d0.days > d1.days - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x(d.days) + "," + y(d.value) + ")");
    focus.select("text").text(function () {
      return d.value;
    });
  }
});