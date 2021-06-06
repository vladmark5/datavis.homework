const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected = '';

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('input', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    function updateBar(){
		regions_keys = d3.map(data, function (d) {return d['region'];}).keys();
		regions_values = d3.set(data.map(d=>d.region)).values();
		
		regions_means = [];
		regions_values.forEach(function(r_mean) {
			values = data.filter(function(d){
				return d.region == r_mean;
				}
			);
			regions_means.push(d3.mean(values, d => d[param][year]))
		});
		
		regions_key_means = []
		regions_keys.forEach((key, mean_r_value) => {
			let r_results = {"region": key, "mean": regions_means[mean_r_value]};
            regions_key_means.push(r_results);
		});
		
		xBar.domain(regions_keys);
		yBar.domain([0, d3.max(regions_means)]).range([height, 0]);
		
		xBarAxis.call(d3.axisBottom(xBar));
		yBarAxis.call(d3.axisLeft(yBar));
		
		barChart.selectAll('rect').remove();
		
		barChart.selectAll('rect')
			.data(regions_key_means)
			.enter()
			.append('rect')
			.attr('width', xBar.bandwidth())
			.attr('height', d => height - yBar(d['mean']) - 30)
			.attr('x', d => xBar(d['region']))
			.attr('y', d => yBar(d['mean']))
			.attr('region', d => d.region)
			.style("fill", d => colorScale(d['region']));
			
		d3.selectAll('rect').on('click', function(d) {
			if (selected != this || selected == '') {
				selected = this
				d3.selectAll('rect')
					.transition()
					.style('opacity', 0.4);
					
				d3.select(this)
					.transition()
					.style('opacity', 1);
					
				let bar_region = d3.select(this).attr('region');
				
				d3.selectAll('circle').style('opacity', 0);
				d3.selectAll('circle')
					.filter(d => d.region == bar_region)
					.style('opacity', 0.8)
			} else {
				selected = ''
				d3.selectAll('circle')
					.transition()
					.style('opacity', 0.8)
					
				d3.selectAll('rect')
					.transition()
					.style('opacity', 1)
			}
		});
			
			
		
        return;
    }

    function updateScattePlot(){
		let values_x = data.map(d=> +d[xParam][year]);
		let values_y = data.map(d => +d[yParam][year]);
		let values_r = data.map(d => +d[rParam][year]);
		
		x.domain([d3.min(values_x), d3.max(values_x)]);
		y.domain([d3.min(values_y), d3.max(values_y)]);
		radiusScale.domain([d3.min(values_r), d3.max(values_r)]);
		
		xAxis.call(d3.axisBottom().scale(x));
		yAxis.call(d3.axisLeft().scale(y));
		
		scatterPlot.selectAll('circle').remove();
		
		scatterPlot.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.attr('cx', d => x(d[xParam][year]))
			.attr('cy', d => y(d[yParam][year]))
			.attr('r', d => radiusScale(d[rParam][year]))
			.attr('region', d => d.region)
			.style("fill", d => colorScale(d['region']))
			.style("opacity", 0.8);
        return;
    }

    updateBar();
    updateScattePlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}