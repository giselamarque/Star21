import React, { useState, useEffect } from 'react';
import { Jumbotron, Container, CardColumns, Card, Button } from 'react-bootstrap';
import {userQuery, useMutation} from '@apollo/client';

import { getMe, deleteBook } from '../utils/API';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import { REMOVE_BOOK } from '../utils/mutations';



const SavedBooks = () => {
  const [removeBook, {error}] = useMutation(REMOVE_BOOK);
  const {loading, data} = useQuery(userQuery);

  const userData = {
    username: 'janedoe',
    email: 'nomail@nomail.com',
    savedBooks: [
      {
        bookId: '1',
        authors: ['Suzanne Collins'],
        image: 'http://books.google.com/books/content?id=OzWZDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
        link: 'http://books.google.com/books?id=OzWZDwAAQBAJ&dq=intitle:The+Hunger+Games&hl=&source=gbs_api',
        title: 'The Hunger Games'
      },
      {
        bookId: '2',
        authors: ['J.K. Rowling'],
        image: 'http://books.google.com/books/content?id=OzWZDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
        link: 'http://books.google.com/books?id=OzWZDwAAQBAJ&dq=intitle:The+Hunger+Games&hl=&source=gbs_api',
        title: 'Harry Potter and the Sorcerer\'s Stone'
      }
    ]
  };

  

  // set up state for saved book data
  // const [userData, setUserData] = useState({});
  // set up state to hold saved bookId values
 const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());
  

  // create state to hold saved book data
  const [savedBooks, setSavedBooks] = useState([]);

  // create method to remove saved book data from localStorage
  const removeBookId = (bookId) => {
    const updatedSavedBookIds = savedBookIds?.filter((savedBookId) => savedBookId !== bookId);

    setSavedBookIds(updatedSavedBookIds);
  };
  

  // set up useEffect hook to get saved book data on component load


  // use this to determine if `useEffect()` hook needs to run again
  const userDataLength = Object.keys(userData).length;

  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = Auth.loggedIn() ? Auth.getToken() : null;

        if (!token) {
          return false;
        }

        const response = await getMe(token);

        if (!response.ok) {
          throw new Error('something went wrong!');
        }

        const user = await response.json();
        setUserData(user);
      } catch (err) {
        console.error(err);
      }
    };

    getUserData();
  }, [userDataLength]);

  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteBook = async (bookId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await removeBook({
        variables: {bookId}
      });
      update: (cache, {data: {removeBook}}) => {
        try {
          const {me} = cache.readQuery({query: userQuery});
          cache.writeQuery({
            query: userQuery,
            data: {me: {...me, savedBooks: [...me.savedBooks, removeBook]}}
          });
        } catch (e) {
          console.error(e);
        }
      }

      // const response = await deleteBook(bookId, token);
      
      const response = await deleteBook(bookId, token);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      // upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  // if data isn't here yet, say so
  if (!userDataLength) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      <Jumbotron fluid className='text-light bg-dark'>
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </Jumbotron>
      <Container>
        <h2>
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <CardColumns>
          {userData.savedBooks.map((book) => {
            return (
              <Card key={book.bookId} border='dark'>
                {book.image ? <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' /> : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            );
          })}
        </CardColumns>
      </Container>
    </>
  );
};

export default SavedBooks;
