import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';
import supabase from '../../src/supabase';
import styled from 'styled-components';

import { CirclePlus } from 'lucide-react';


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
import { Button } from '../../styles/globalStyles';

export default function EditMovie() {
  const router = useRouter();
  const { id } = router.query; // ID of the movie to edit
  const [movieData, setMovieData] = useState({
    title: '',
    imdb: "",
    director: '',
    year: '',
    personalRating: '',
    comment: '',
    watchTime: ''
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
    else setMovieData({
      title: data.title,
      imdb: data.imdb,
      director: data.director,
      year: data.year,
      personalRating: data.rating || '',
      comment: data.comment || '',
      watchTime: data.watchTime || new Date().toISOString().slice(0, 10)
    });
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('movies_2024')
      .update({
        title: movieData.title,
        imdb: movieData.imdb,
        director: movieData.director,
        year: movieData.year,
        rating: movieData.personalRating,
        comment: movieData.comment,
        watchTime: movieData.watchTime
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

        <InputGroup>
    <Label>Imdb ID</Label>
    <Input
      type="text"
      value={movieData.imdb}
      onChange={(e) => setMovieData({ ...movieData, imdb: e.target.value })}
    />
  </InputGroup>



  <InputGroup>
    <Label>Personal Rating</Label>
    <Input
      type="text"
      value={movieData.personalRating}
      onChange={(e) => setMovieData({ ...movieData, personalRating: e.target.value })}
    />
  </InputGroup>

  <InputGroup>
    <Label>Watch Time</Label>
    <Input
      type="date"
      value={movieData.watchTime}
      onChange={(e) => setMovieData({ ...movieData, watchTime: e.target.value })}
    />
  </InputGroup>

  <InputGroup>
    <Label>Comment</Label>
    <TextArea
      value={movieData.comment}
      onChange={(e) => setMovieData({ ...movieData, comment: e.target.value })}
    />
  </InputGroup>

  <Button onClick={handleUpdate} disabled={isLoading}>
    <CirclePlus size={16} style={{ marginRight: '8px' }} /> Update Movie
  </Button>
  
  {error && <ErrorMessage>{error}</ErrorMessage>}
  {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
</Form>
    </Container>
  );
}


