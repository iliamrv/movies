import { useState, useEffect } from 'react';
import supabase from '../src/supabase'; 
import styled from 'styled-components';
import { Button } from "../styles/globalStyles";
import { CirclePlus } from 'lucide-react';
import { useRouter } from 'next/router'; 

export default function EditMovie() {
  const router = useRouter();
  const { id } = router.query; // ID of the movie to edit
  const [imdbID, setImdbID] = useState('');
  const [movieData, setMovieData] = useState({
    title: '',
    director: '',
    year: '',
    personalRating: '',
    comment: '',
    watchTime: new Date().toISOString().slice(0, 10)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) fetchMovieData(id);
  }, [id]);

  const fetchMovieData = async (movieId) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('movies_2024')
      .select('*')
      .eq('id', movieId)
      .single();
    setIsLoading(false);
    if (error) setError('Failed to fetch movie data');
    else {
      setMovieData({
        title: data.title,
        director: data.director,
        year: data.year,
        personalRating: data.rating || '',
        comment: data.comment || '',
        watchTime: data.watchTime || new Date().toISOString().slice(0, 10)
      });
      setImdbID(data.imdb);
    }
  };

  const fetchOMDBData = async () => {
    if (!imdbID) {
      setError("Please provide an IMDb ID.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=8aab931f`);
      const data = await response.json();
      if (data.Response === "True") {
        setMovieData(prev => ({
          ...prev,
          title: data.Title,
          director: data.Director,
          year: data.Year
        }));
      } else {
        setError(data.Error);
      }
    } catch (err) {
      setError('Failed to fetch movie details');
    }
    setIsLoading(false);
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('movies_2024')
      .update({
        title: movieData.title,
        director: movieData.director,
        year: movieData.year,
        rating: movieData.personalRating,
        comment: movieData.comment,
        watchTime: movieData.watchTime,
        imdb: imdbID
      })
      .eq('id', id);
    setIsLoading(false);
    if (error) {
      setError(error.message);
      setSuccessMessage('');
    } else {
      setSuccessMessage('Movie updated successfully!');
      setTimeout(() => router.push('/'), 2000);
    }
  };

  return (
    <Container>
      <h1>Edit Movie</h1>
      <InputGroup>
        <Label>IMDb ID</Label>
        <Input
          type="text"
          placeholder="Enter IMDb ID"
          value={imdbID}
          onChange={(e) => setImdbID(e.target.value)}
        />
      </InputGroup>
      <Button onClick={fetchOMDBData} disabled={isLoading}>
        Fetch Movie Data
      </Button>
      <Form>
        <InputGroup>
          <Label>Title</Label>
          <Input
            type="text"
            value={movieData.title}
            onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
          />
        </InputGroup>
        <InputGroup>
          <Label>Director</Label>
          <Input
            type="text"
            value={movieData.director}
            onChange={(e) => setMovieData({ ...movieData, director: e.target.value })}
          />
        </InputGroup>
        <InputGroup>
          <Label>Year</Label>
          <Input
            type="text"
            value={movieData.year}
            onChange={(e) => setMovieData({ ...movieData, year: e.target.value })}
          />
        </InputGroup>
        {/* Add more fields as required */}
        <Button onClick={handleUpdate} disabled={isLoading}>
          <CirclePlus size={16} style={{ marginRight: '8px' }} /> Update Movie
        </Button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      </Form>
    </Container>
  );
}


const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 600px;
  width: 100%;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;



const Label = styled.label`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const Info = styled.p`
  margin: 10px 0;
  font-size: 16px;
`;

const Poster = styled.img`
  max-width: 200px;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  height: 100px;  // Adjust height as needed
`;

const SuccessMessage = styled.div`

padding: 20px;
  margin-top: 10px;

  /* margin: 0 auto; */
  border-radius: 6px;
  background-color: #4ade80; 
  
`;

const ErrorMessage = styled.div`
padding: 20px;
  margin-top: 10px;

  /* margin: 0 auto; */
  border-radius: 6px;
  background-color: #fde047;
 
`;