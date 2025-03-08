let data = [];
let commits = [];
let filteredCommits = [];

let xScale;
let yScale;
let commitProgress = 100;
let commitMaxTime;
let timeScale;

let NUM_ITEMS = 100; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 30; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');

let NUM_ITEMS_FILES = 100;  // Adjust based on total files
let totalHeightFiles = (NUM_ITEMS_FILES - 1) * ITEM_HEIGHT;
const scrollContainerFiles = d3.select('#scroll-container-files');
const spacerFiles = d3.select('#spacer-files');
spacerFiles.style('height', `${totalHeightFiles}px`);
const itemsContainerFiles = d3.select('#items-container-files');



// scrollContainer.on('scroll', () => {
//   const scrollTop = scrollContainer.property('scrollTop');
//   let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
//   startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));

//   renderItems(startIndex);
// });
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));

  renderItems(startIndex);
});

scrollContainerFiles.on('scroll', () => {
  const scrollTop = scrollContainerFiles.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));

  renderFileItems(startIndex);  // ✅ This updates the file visualization
});





async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), 
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    // Process commits after loading data
    processCommits();

    // Now that commits are populated, define the timeScale
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);

    // Filter initial commits
    filterCommitsByTime();

    // Initialize scatterplot with filtered data
    updateScatterplot(filteredCommits);

    // Initialize slider UI
    setupFilterUI();

    // displayCommitFiles();
}

function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/syw003/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: true,
            });

            return ret;
        });
}

function filterCommitsByTime() {
    // ✅ Filter commits dynamically based on commitMaxTime
    filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
}

function formatTime(date) {
    return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
function updateFileVisualization() {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = [];
  files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });

  // Clear previous file list
  d3.select('.files').selectAll('div').remove();
  


  // Append file data
  let filesContainer = d3.select('.files')
      .selectAll('div')
      .data(files)
      .enter()
      .append('div');

    filesContainer.append('dt')
      .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  // Append a <dd> element containing small divs for each line
    let lineContainer = filesContainer.append('dd');

    lineContainer.selectAll('.line')
        .data(d => d.lines)
        .enter()
        .append('div')
        .attr('class', 'line')
        .style('background', d => fileTypeColors(d.type));;
}

function updateTimeDisplay() {
    commitProgress = Number(document.getElementById('commit-slider').value);
    commitMaxTime = timeScale.invert(commitProgress);

    if (!commitMaxTime || isNaN(commitMaxTime)) {
        d3.select("#selectedTime").text("Loading...");
        return;
    }

    // ✅ Update the selected time string
    d3.select("#selectedTime").text(`Selected Time: ${formatTime(commitMaxTime)}`);

    // ✅ Apply filtering before updating scatterplot
    filterCommitsByTime();

    // ✅ Update scatterplot with new filtered commits
    updateScatterplot(filteredCommits);
    updateFileVisualization();
}

function setupFilterUI() {
    const slider = document.getElementById('commit-slider');

    slider.addEventListener('input', () => {
        updateTimeDisplay();
    });

    // ✅ Initialize the display
    updateTimeDisplay();
}

function updateScatterplot(filteredCommits) {
    d3.select('svg').remove();

    const width = 1000;
    const height = 600;

    const svg = d3.select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3.scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale)
            .tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([7, 30]);

    dots.selectAll('circle')
        .data(filteredCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', d => {
            const hour = d.datetime.getHours();
            return (hour >= 6 && hour < 18) ? 'orange' : 'steelblue';
        })
        .on('mouseenter', (event, commit) => {
          const tooltip = d3.select("#commit-tooltip");
  
          // Update tooltip content
          tooltip.select("#commit-id").text(commit.id);
          tooltip.select("#commit-date").text(commit.datetime.toLocaleDateString("en-US", { dateStyle: "full" }));
          tooltip.select("#commit-time").text(commit.datetime.toLocaleTimeString("en-US", { timeStyle: "short" }));
          tooltip.select("#commit-author").text(commit.author);
          tooltip.select("#commit-lines").text(commit.totalLines);
  
          // Position tooltip
          tooltip.style("left", `${event.pageX + 10}px`)
                 .style("top", `${event.pageY + 10}px`)
                 .style("display", "block")
                 .attr("hidden", null);
      })
      .on('mouseleave', () => {
          d3.select("#commit-tooltip").attr("hidden", true);
      });

    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
}


function renderItems(startIndex) {
  // Clear existing elements
  itemsContainer.selectAll('div').remove();

  // Determine which slice of commits to show
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);

  // Update scatterplot with new filtered commits
  updateScatterplot(newCommitSlice);
  displayCommitFiles(newCommitSlice);

  // Bind the commit data to the container
  let commitDivs = itemsContainer.selectAll('div')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .classed('item', true);

  // Append commit date
  commitDivs.append('strong')
      .text(d => d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" }));

  // Append commit details
  commitDivs.append('p')
      .html((d, index) => `
          On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, 
          I made <a href="${d.url}" target="_blank">
              ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>. 
          I edited ${d.totalLines} lines across ${d3.rollups(d.lines, v => v.length, l => l.file).length} files.
      `);
}

function renderFileItems(startIndex) {
  // Clear existing items
  itemsContainerFiles.selectAll('div').remove();

  // Determine which slice of commits to show
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);

  // Update unit visualization
  displayCommitFiles(newCommitSlice);

  // Bind commit data to the file scrollytelling
  let fileDivs = itemsContainerFiles.selectAll('div')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .classed('item', true);

  // Append file details (dummy narrative for now)
  fileDivs.append('p')
      .html((d, index) => `
          In this commit, <a href="${d.url}" target="_blank">
          ${index > 0 ? 'another important update' : 'a big structural change'}
          </a>, 
          ${d.totalLines} lines were modified across ${d3.rollups(d.lines, v => v.length, l => l.file).length} files.
      `);
}

function displayCommitFiles(filteredCommits) {
  // Flatten commit lines for visualization
  const lines = filteredCommits.flatMap((d) => d.lines);

  // Create a color scale for file types
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  // Group by file name
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({
      name, lines
  }));

  // Sort files by number of lines
  files = d3.sort(files, (d) => -d.lines.length);

  // **Clear previous visualization**  
  d3.select('.files').selectAll('div').remove();

  // **Bind files to new divs**
  let filesContainer = d3.select('.files').selectAll('div')
      .data(files)
      .enter()
      .append('div');

  // **Add file name and total lines edited**
  filesContainer.append('dt')
      .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  // **Bind each line to a dot**
  filesContainer.append('dd')
      .selectAll('div')
      .data(d => d.lines)  // ✅ Correctly binding the dots to filtered data
      .enter()
      .append('div')
      .attr('class', 'line')
      .style('background', d => fileTypeColors(d.type));
}



// function displayCommitFiles(newCommitSlice) {
//   const lines = filteredCommits.flatMap((d) => d.lines);
//   let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
//   let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
//     return { name, lines };
//   });
//   files = d3.sort(files, (d) => -d.lines.length);
//   d3.select('.files').selectAll('div').remove();
//   let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
//   filesContainer.append('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
//   filesContainer.append('dd')
//                 .selectAll('div')
//                 .data(d => d.lines)
//                 .enter()
//                 .append('div')
//                 .attr('class', 'line')
//                 .style('background', d => fileTypeColors(d.type));
// }




document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    brushSelector();
    updateFileVisualization();
    displayCommitFiles(commits);
    renderItems(0);
});
