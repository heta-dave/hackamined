import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const EmotionalArcChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = 500;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Scales
    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([-1, 1]) // Sentiment range
      .range([height - margin.bottom, margin.top]);

    // Line generator
    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d.score))
      .curve(d3.curveMonotoneX);

    // Draw Line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#60A5FA") // Tailwind blue-400
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add Area under line
    const area = d3.area()
      .x((d, i) => x(i))
      .y0(y(0))
      .y1(d => y(d.score))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "url(#gradient)")
      .attr("opacity", 0.3)
      .attr("d", area);

    // Gradient definition
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#60A5FA");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "transparent");

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `Beat ${d}`))
      .attr("color", "#eaeaea");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(3))
      .attr("color", "#eaeaea");

    // Zero line
    svg.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#f0f0f0")
      .attr("stroke-dasharray", "4");

  }, [data]);

  return (
    <div className="w-full">
      <svg ref={svgRef} viewBox="0 0 500 200" className="w-full h-auto"></svg>
    </div>
  );
};

export default EmotionalArcChart;
