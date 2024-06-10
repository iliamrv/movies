import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../../src/supabase';
import Image from 'next/image';

import { Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { StyledButtons, Button } from '../../styles/globalStyles';

export default function MovieDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = () => {
  router.push(`/edit-movie/${id}`); // Assuming you have a route set up for editing
};

    const handleDelete = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from("movies_2024").delete().eq("id", id);

    if (error) {
      // console.log(error);
      setFormError("Error");
    } else {
      // setFormError(null);
      router.push("/");
    }
  };

    const displayRatings = (ratings) => {
    if (!ratings) return null;
    return ratings.map((rating, index) => (
      <p key={index}>{rating.Source}: {rating.Value}</p>
    ));
  };

  useEffect(() => {
    if (!id) return;
    fetchMovie(id);
  }, [id]);

  const fetchMovie = async (id) => {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('movies_2024')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      setMovie(data);

      if (data.imdb) {
        const response = await fetch(`https://www.omdbapi.com/?i=${data.imdb}&apikey=8aab931f`);
        const imdbData = await response.json();
        if (imdbData.Response === "True") {
          setMovie(prev => ({ ...prev, ...imdbData }));
        } else {
          console.error('IMDb data fetch error:', imdbData.Error);
        }
      }
    } catch (err) {
      setError('Failed to fetch movie details: ' + err.message);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading ? <p>Loading...</p> : (
        movie ? (
          <div  className=' description  '>
            <h1>{movie.title}</h1>

                {movie.Poster && 
                
                <Image src={movie.Poster}  width={250}
            height={250}  className="object-cover rounded-t-lg "
            alt="Movie pic"/>
                
                
              
                
                
                }


            <p>Director: {movie.director}</p>
              <p>Director (IMDB): {movie.Director}</p>
            <p>Year: {movie.year}</p>
                <p>Runtime: {movie.Runtime}</p>
                <p>Genre: {movie.Genre}</p>
              <br />
                  <div>
              <strong>Ratings:</strong>
              {movie.Ratings ? displayRatings(movie.Ratings) : <p>No ratings available.</p>}
            </div>
<br />
            {/* <p>IMDb ID: {movie.imdb}</p> */}
            <p>Watch Time: {movie.watchTime ? movie.watchTime: "n/a"}</p>
           
           <div> <p>Comment: <br />
            {movie.comment}</p></div>
            
           
           
           
          
          
        
                 
        <StyledButtons>
        <Button onClick={handleEdit} type="button" className="button">
  <Edit3 size={16} style={{ marginRight: '8px' }} /> Edit
</Button>

          <Button onClick={handleDelete} type="button"  className="button">
            <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete
          </Button>

          <Button type="button" onClick={ () => {
    router.back();
  }} className="button">
            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
          </Button>
        </StyledButtons>


          </div>
        ) : <p>Movie not found.</p>
      )}
      {error && <p>Error: {error}</p>}



 

    </div>
  );
}
