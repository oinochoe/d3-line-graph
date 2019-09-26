var drawgraph = (function(priceData) {

  // init
  drawgraph.init = function () {
    drawgraph.draw();
  }

  drawgraph.draw = function () {
    // default
    if(d3.select("svg") !== null) {
      d3.select("svg").remove();
    }

    var margin = { top: 20, right: 20, bottom: 30, left: 40}
    var width = 1000 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
    var svg = d3.select(".graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).call(responsiveSvg);

    // time Parsing style
    var parseTime = d3.timeParse("%Y-%m-%d");

    // bisectDate(tracking ball when you move)
    bisectDate = d3.bisector(function (d) {
      return d.days;
    }).left;

    // range setting
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // line value setting.
    var line = d3.line().x(function (d) {
      return x(d.days);
    }).y(function (d) {
      return y(d.value);
    });

    // g = svg's group and positioning
    var g = svg.append("g").classed("group", true).attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // priceData binding
    if(priceData !== undefined) {
      priceData.forEach(function (d) {
        d.days = parseTime(d.days);
        d.value = +d.value;
      });
    }

    // days
    x.domain(d3.extent(priceData, function (d) {
      return d.days;
    }));

    // value
    y.domain([d3.min(priceData, function (d) {
      return d.value;
    }) / 1.005, d3.max(priceData, function (d) {
      return d.value;
    }) * 1.005]);

    // Add designing and drawing
    g.append("g").attr("class", "axis axis--x").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%m/%d")));
    g.append("g").attr("class", "axis axis--y").call(d3.axisLeft(y).ticks(3).tickFormat(d3.format(",.1s")));

    // d3 label per unit
    var lasttext;
    d3.select('.axis--y').select('text').each(function(){
      lasttext = this.textContent.split('').pop();
    });

    if (lasttext !== "" && lasttext !== /[0-9]/g) {
      if (lasttext === "k") {
        document.querySelector('.unit').innerText = "(1,000)";
      } else if (lasttext === "M") {
        document.querySelector('.unit').innerText = "(1,000,000)";
      } else if (lasttext === "G") {
        document.querySelector('.unit').innerText = "(1,000,000,000)";
      } else if (lasttext === "T") {
        document.querySelector('.unit').innerText = "(1,000,000,000,000)";
      }
    }

    //call(make_y_gridlines().tickSize(-width));
    g.append("path").datum(priceData).attr("class", "line").attr("d", line);
    // GRADIENT START
    g.append("linearGradient")
      .attr("id", "graph-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(getMin(priceData, "value").value)) // minValue
      .attr("x2", 0)
      .attr("y2", y(getMax(priceData, "value").value)) // maxValue
      .selectAll("stop")                          // setting stop
      .data([
        { offset: "0%", color: "#0000ff" },
        { offset: "50%", color: "#ffffff" },
        { offset: "100%", color: "#ff0000" }
      ])
      .enter()
      .append("stop")                             // stop Positioning
      .attr("offset", d => d.offset)              // offset setting
      .attr("stop-color", d => d.color);          // stop color
    
    // if same both minValue and maxValue
    if(d3.select('.line')._groups[0][0].nextElementSibling.y1.animVal.value === d3.select('.line')._groups[0][0].nextElementSibling.y2.animVal.value) {
      d3.select('.line').style.stroke="white";
      for(var i = 0; d3.select('.line')._groups[0][0].nextSibling.children.length > i; i++ ) {
        d3.select('.line')._groups[0][0].nextSibling.children[i].__data__.color="white";
      }
    }
    // GRADIENT END
    /*
    * Function List
    */

    // gridLines each 5 lens
    function make_y_gridlines() {return d3.axisLeft(y).ticks(5)}

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
      i = bisectDate(priceData, x0, 1),
      d0 = priceData[i - 1],
      d1 = priceData[i];
      if(typeof d1 !== "undefined") {
        var d = x0 - d0.days > d1.days - x0 > 0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.days) + "," + y(d.value) + ")");
        focus.select("text").text(function () {
          return d.value.toString().replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
        });
      }
    }

    function isEmpty(data) {
      if (typeof (data) == 'string') {
          data = data.trim();
      }
      return (data == null || data == '' || data == undefined);
    }

    // resize function
    function responsiveSvg(svg, maxw) {
      // get container + svg aspect
      var container = d3.select(svg.node().parentNode),
          width = parseInt(svg.style("width")),
          height = parseInt(svg.style("height")),
          aspect = width / height;

      // add viewBox and preserveAspectRatio properties
      // and call resize so that svg resizes on initial page load
      svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(resize);

      // to register multiple listeners
      d3.select(window).on("resize." + container.attr("id"), resize);

      // get width of container and resize svg to fit it
      function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
      }

      // trigger resize event
      var el = document;
      var event = document.createEvent("HTMLEvents");
      event.initEvent("resize", true, false);
      el.dispatchEvent(event);
    }
    // when modal open window resize dispatch
    // window.dispatchEvent(new Event("resize"));
  };
  drawgraph.init();
});