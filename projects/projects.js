import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
const searchInput = document.querySelector(".searchBar");

let selectedIndex = -1;

function renderPieChart(projectsGiven) {

    let newSVG = d3.select("#projects-plot");
    newSVG.selectAll("path").remove();
    d3.select(".legend").selectAll("li").remove();
  

    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year
    );
  

    let newData = newRolledData.map(([year, count]) => ({
      value: count,
      label: year,
    }));

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);


    newSVG
        .selectAll("path")
        .data(newArcData)
        .enter()
        .append("path")
        .attr("d", newArcGenerator)
        .attr("fill", (d, i) => colors(i));

    let svg = d3.select("svg");
    svg.selectAll("path").remove();

    let arcs = newArcData.map((d) => newArcGenerator(d));
    arcs.forEach((arc, i) => {
        svg
        .append("path")
        .attr("d", arc)
        .attr("fill", colors(i))
        .on("click", () => {
            selectedIndex = selectedIndex === i ? -1 : i;

            if (selectedIndex === -1) {
              renderProjects(projectsGiven, projectsContainer, "h2");
            } else {
              let selectedYear = newData[selectedIndex].label; 
              let filteredProjects = projectsGiven.filter(
                (project) => project.year === selectedYear
              );
              renderProjects(filteredProjects, projectsContainer, "h2");
            }
    
            svg.selectAll("path").attr("class", (_, idx) =>
              idx === selectedIndex ? "selected" : ""
            );
          });
    });


    let legend = d3.select(".legend");
    legend.selectAll("li").remove();

    

    newData.forEach((d, idx) => {
        legend
        .append("li")
        .attr("style", `--color:${colors(idx)}`)
        .attr("class", "legend-item")
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;
    
            if (selectedIndex === -1) {
                renderProjects(projectsGiven, projectsContainer, "h2");
              } else {
                let selectedYear = newData[selectedIndex].label;
                let filteredProjects = projectsGiven.filter(
                  (project) => project.year === selectedYear
                );
                renderProjects(filteredProjects, projectsContainer, "h2");
              }
      
              svg.selectAll("path").attr("class", (_, i) =>
                i === selectedIndex ? "selected" : ""
              );
      
              legend.selectAll("li").attr("class", (_, i) =>
                i === selectedIndex ? "selected" : ""
              );
            });
    }); 
}

renderPieChart(projects);


searchInput.addEventListener("input", (event) => {
    let query = event.target.value.toLowerCase();
  

    filteredProjects = filteredProjects.filter((project) => {
        let values = Object.values(project).join("\n").toLowerCase();
        return values.includes(query);
    });
  

    renderProjects(filteredProjects, projectsContainer, "h2");
    renderPieChart(filteredProjects);
  });


// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
//   });

// let sliceGenerator = d3.pie().value((d) => d.value);
// let arcData = sliceGenerator(data);

// let total = 0;
// for (let d of data) {
//     total += d;
//   }
// let angle = 0;
// // let arcData = [];
  
// for (let d of data) {
//     let endAngle = angle + (d / total) * 2 * Math.PI;
//     arcData.push({ startAngle: angle, endAngle });
//     angle = endAngle;
//   } 


// let sliceGenerator = d3.pie();
// let arcData = sliceGenerator(data);




// let arcGenerator = d3.arc()
//   .innerRadius(0)
//   .outerRadius(50);

// let arcs = arcData.map((d) => arcGenerator(d));


// let colors = ['gold', 'purple'];
// let colors = d3.scaleOrdinal(d3.schemeTableau10);




// arcs.forEach((arc, index) => {
//     d3.select('svg')
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(index));
//   })
  

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//     legend.append('li')
//           .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
//           .attr('class', 'legend-item')
//           .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
// })

// let query = '';
// let searchInput = document.querySelector('.searchBar');


