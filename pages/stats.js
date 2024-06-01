import React, { useEffect, useState } from 'react';
import supabase from '../src/supabase';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Import this to register controllers, elements, scales, and plugins for Chart.js

export default function Stats() {
	const [movieData, setMovieData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchMovies() {
			setLoading(true);
			const { data, error } = await supabase
				.from('movies_2024')
				.select('rating, watchTime')
				.eq('watched_mark', true);

			if (error) {
				console.error('Error fetching movies:', error);
				setLoading(false);
				return;
			}

			setMovieData(data);
			setLoading(false);
		}

		fetchMovies();
	}, []);

	if (loading) {
		return <p>Loading...</p>;
	}

	// Processing data for the bar chart (rating distribution)
	const ratingsCount = new Array(8).fill(0); // Array for ratings 3-10
	movieData.forEach(movie => {
		if (movie.rating && movie.rating >= 3 && movie.rating <= 10) {
			ratingsCount[movie.rating - 3]++;
		}
	});

	const ratingsChartData = {
		labels: Array.from({ length: 8 }, (_, i) => i + 3),
		datasets: [{
			label: 'Number of Movies by Rating (3-10)',
			data: ratingsCount,
			backgroundColor: 'rgba(53, 162, 235, 0.5)',
		}]
	};

	// Processing data for movies watched per year
	const watchedPerYear = {};
	movieData.forEach(movie => {
		const year = new Date(movie.watchTime).getFullYear();
		if (year >= 2000) {
			watchedPerYear[year] = (watchedPerYear[year] || 0) + 1;
		}
	});

	const watchedPerYearData = {
		labels: Object.keys(watchedPerYear).sort(),
		datasets: [{
			label: 'Movies Watched per Year (from 2000)',
			data: Object.values(watchedPerYear),
			backgroundColor: 'rgba(75, 192, 192, 0.5)',
		}]
	};

	return (
		<div>
			<h1>Movie Statistics</h1>
			<div>
				<h2>Rating Distribution (3-10)</h2>
				<Bar data={ratingsChartData} options={{ scales: { y: { beginAtZero: true } } }} />
			</div>
			<div>
				<h2>Movies Watched per Year (from 2000)</h2>
				<Bar data={watchedPerYearData} options={{ scales: { y: { beginAtZero: true } } }} />
			</div>
		</div>
	);
}
