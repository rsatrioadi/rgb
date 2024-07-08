document.addEventListener('DOMContentLoaded', function () {
	const filterInput = document.getElementById('filter-input');
	const hueBarDiv = document.getElementById('hue-bar');
	const satBrightDiv = document.getElementById('sat-bright-dist');

	const url = './data/rgb.txt';

	// Fetch color data and update graphs
	async function fetchDataAndRender() {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const data = await response.text();
			const colorData = parseColorData(data);
			renderGraphs(colorData);
			setupFilterListener(colorData);
		} catch (error) {
			console.error('Error fetching or rendering color data:', error);
		}
	}

	// Parse color data from text format to array of objects
	function parseColorData(data) {
		const lines = data.split('\n');
		const colors = {};

		lines.forEach(line => {
			if (line && !line.startsWith('#')) {
				const [name, hexCode] = line.split('\t').slice(0, 2);
				colors[name] = hexCode.trim();
			}
		});

		const colorData = Object.keys(colors).map(name => {
			const hexCode = colors[name];
			const rgb = hexToRgb(hexCode);
			const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
			return {
				name: name,
				hex: hexCode,
				hue: hsv.h * 360,
				saturation: hsv.s,
				brightness: hsv.v,
				rgb: `rgb(${rgb.r},${rgb.g},${rgb.b})`
			};
		});

		return colorData;
	}

	// Convert hex color code to RGB object
	function hexToRgb(hex) {
		const hexCode = hex.replace('#', '');
		return {
			r: parseInt(hexCode.substr(0, 2), 16),
			g: parseInt(hexCode.substr(2, 2), 16),
			b: parseInt(hexCode.substr(4, 2), 16)
		};
	}

	// Convert RGB values to HSV object
	function rgbToHsv(r, g, b) {
		const rNorm = r / 255.0, gNorm = g / 255.0, bNorm = b / 255.0;
		const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
		let h, s, v = max;

		const d = max - min;
		s = max === 0 ? 0 : d / max;

		if (max === min) {
			h = 0; // achromatic
		} else {
			switch (max) {
				case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
				case gNorm: h = (bNorm - rNorm) / d + 2; break;
				case bNorm: h = (rNorm - gNorm) / d + 4; break;
			}
			h /= 6;
		}

		return { h, s, v };
	}

	// Render graphs using Plotly.js
	function renderGraphs(colorData) {
		renderHueBar(colorData);
		renderSatBrightDist(colorData);
	}

	// Render Hue Bar chart using Plotly.js
	function renderHueBar(colorData) {
		const hueValues = Array.from({ length: 360 }, (_, i) => i); // Array of hue values from 0 to 359
		const hueCounts = Array.from({ length: 360 }, () => 0);

		colorData.forEach(color => {
			const hueIndex = Math.round(color.hue);
			hueCounts[hueIndex]++;
		});

		const hueBarData = [{
			x: hueValues,
			y: hueCounts,
			type: 'bar',
			marker: {
				color: hueValues.map(h => `hsv(${h}, 100%, 100%)`)
			}
		}];

		const hueBarLayout = {
			title: 'Distribution of Hues',
			xaxis: {
				title: 'Hue (degrees)'
			},
			yaxis: {
				title: 'Count'
			}
		};

		Plotly.newPlot(hueBarDiv, hueBarData, hueBarLayout);
	}

	// Render Saturation-Brightness scatter plot using Plotly.js
	function renderSatBrightDist(colorData) {
		const satBrightData = [{
			x: colorData.map(color => color.saturation),
			y: colorData.map(color => color.brightness),
			mode: 'markers',
			text: colorData.map(color => `${color.name}<br>Hex: ${color.hex}<br>Hue: ${color.hue.toFixed(2)}<br>RGB: ${color.rgb}`),
			marker: {
				color: colorData.map(color => color.rgb),
				size: 10,
				opacity: 0.7
			},
			type: 'scatter'
		}];

		const satBrightLayout = {
			title: 'Distribution of Saturation and Brightness',
			xaxis: {
				title: 'Saturation',
				range: [-0.1, 1.1]
			},
			yaxis: {
				title: 'Brightness',
				range: [-0.1, 1.1]
			}
		};

		Plotly.newPlot(satBrightDiv, satBrightData, satBrightLayout);
	}


	// Setup filter input event listener
	function setupFilterListener(colorData) {
		filterInput.addEventListener('input', function () {
			const filterTerm = filterInput.value.trim();
			if (filterTerm === '') {
				renderGraphs(colorData); // Use colorData from parameter
			} else {
				const regex = new RegExp(filterTerm, 'i');
				const filteredData = colorData.filter(color => regex.test(color.name));
				renderGraphs(filteredData);
			}
		});
	}

	// Fetch data initially
	fetchDataAndRender();
});
