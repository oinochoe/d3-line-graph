var svg = d3.select("svg"),
   // basic margin
    margin = {
      top: 20,
      right: 120,
      bottom: 30,
      left: 140
    },
    // default width, height setting
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

// time Parsing style
var parseTime = d3.timeParse("%Y-%m-%d");

// bisectDate(tracking ball when you move)
bisectDate = d3.bisector(function (d) {
  return d.days;
}).left;

// range setting..
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// line value setting..
var line = d3.line().x(function (d) {
  return x(d.days);
}).y(function (d) {
  return y(d.value);
});

// g = svg's group and positioning
var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// get data from json (you can change the extracting method)
d3.json("data.json", function (error, data) {
  if (error) throw error;

  // data parsing time and value setting
  data.forEach(function (d) {
    d.days = parseTime(d.days);
    d.value = +d.value;
  });

  // days
  x.domain(d3.extent(data, function (d) {
    return d.days;
  }));

  // value
  y.domain([d3.min(data, function (d) {
    return d.value;
  }) / 1.005, d3.max(data, function (d) {
    return d.value;
  }) * 1.005]);

  // Add designing and drawing
  g.append("g").attr("class", "axis axis--x").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d")));
  g.append("g").attr("class", "axis axis--y").call(make_y_gridlines().tickSize(-width));
  g.append("path").datum(data).attr("class", "line").attr("d", line);
  // GRADIENT START
  g.append("linearGradient")
  .attr("id", "graph-gradient")
  .attr("gradientUnits", "userSpaceOnUse")
  .attr("x1", 0)
  .attr("y1", y(getMin(data, "value").value)) // minValue
  .attr("x2", 0)
  .attr("y2", y(getMax(data, "value").value)) // maxValue
  .selectAll("stop")                          // setting stop
  .data([
    { offset: "0%", color: "blue" },
    { offset: "50%", color: "white" },
    { offset: "100%", color: "red" }
  ])
  .enter()
  .append("stop")                             // stop Positioning
  .attr("offset", d => d.offset)              // offset setting
  .attr("stop-color", d => d.color);          // stop color
  // GRADIENT END

  /*
   * Function List
   */

   // gridLines each 5 lens
  function make_y_gridlines() {
    return d3.axisLeft(y)
        .ticks(5)
  }

  // getMax value from arrays
  function getMax(arr, prop) {
      var max;
      for (var i=0 ; i<arr.length ; i++) {
          if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
              max = arr[i];
      }
      return max;
  }

  // getMin value from arrays
  function getMin(arr, prop) {
      var min;
      for (var i=0 ; i<arr.length ; i++) {
          if (!min || parseInt(arr[i][prop]) < parseInt(min[prop]))
              min = arr[i];
      }
      return min;
  }

  // focusing position (Mouse over, move, touch over and move)
  var focus = g.append("g").attr("class", "focus").style("display", "none");

  focus.append("circle").attr("r", 1.5);
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