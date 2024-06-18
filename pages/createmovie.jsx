import { useState } from 'react';
import supabase from '../src/supabase'; 
import styled from 'styled-components';
import { Button } from "../styles/globalStyles";
import { CirclePlus } from 'lucide-react';
import { useRouter } from 'next/router'; 

export default function CreateMovie() {
  const router = useRouter(); // Use useRouter hook for redirection
  const [imdbID, setImdbID] = useState('');
  const [movieData, setMovieData] = useState({
    title: '',
    director: '',
    year: '',
    personalRating: '',
    comment: '',
    watchTime: new Date().toISOString().slice(0, 10)
  });
  const [extraDetails, setExtraDetails] = useState({
    runtime: '',
    genre: '',
    ratings: []
  });
  const [poster, setPoster] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // State for success message

  const fetchMovieData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=8aab931f`);
      const data = await response.json();
      if (data.Response === "True") {
        setMovieData({
          title: data.Title,
          director: data.Director,
          year: data.Year,
          personalRating: '',
          comment: '',
          watchTime: movieData.watchTime || new Date().toISOString().slice(0, 10)
        });
        setExtraDetails({
          runtime: data.Runtime,
          genre: data.Genre,
          ratings: data.Ratings
        });
        setPoster(data.Poster);
      } else {
        setError(data.Error);
      }
    } catch (err) {
      setError('Failed to fetch movie details');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    let movieEntry = {
        title: movieData.title,
        director: movieData.director,
        year: movieData.year,
        watchTime: movieData.watchTime,
        imdb: imdbID,
        comment: movieData.comment.trim(),  // Ensure comment is trimmed
    };

    // Add rating only if it is not empty, otherwise set it to null
    movieEntry.rating = movieData.personalRating.trim() !== '' ? movieData.personalRating.trim() : null;

    try {
        const { data, error } = await supabase
            .from('movies_2024')
            .insert([movieEntry]);
        if (error) {
            setError(error.message);
        } else {
            setSuccessMessage('Movie added successfully!');
            setTimeout(() => {
                router.push('/'); // Redirect to homepage after 2 seconds
            }, 2000);
        }
    } catch (error) {
        setError('Failed to save movie details');
    }
};

  return (
    <Container>
      <h1>Add New Movie</h1>
      <InputGroup>
        <Input
          type="text"
          placeholder="IMDb ID"
          value={imdbID}
          onChange={(e) => setImdbID(e.target.value)}
        />
      </InputGroup>
      <Button onClick={fetchMovieData} disabled={isLoading || !imdbID}>
        Fetch Movie Data
      </Button>
     
      <Form>
        {Object.entries(movieData).map(([key, value]) => (
          <InputGroup key={key}>
            {key === 'comment' ? (
              <TextArea
                value={value}
                onChange={(e) => setMovieData({ ...movieData, [key]: e.target.value })}
              />
            ) : (
              <Input
                type={key === 'watchTime' ? 'date' : 'text'}
                value={value}
                onChange={(e) => setMovieData({ ...movieData, [key]: e.target.value })}
              />
            )}
            <Label>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
          </InputGroup>
        ))}
        {poster && <Poster src={poster} alt="Movie Poster" />}
       
        <Info>Runtime: {extraDetails.runtime}</Info>
        <Info>Genre: {extraDetails.genre}</Info>

        
        {extraDetails.ratings.map((rating, index) => (
          <Info key={index}>{rating.Source}: {rating.Value}</Info>
        ))}
        <Button onClick={handleSave}>
          <CirclePlus size={16} style={{ marginRight: '8px' }} /> Save Movie
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