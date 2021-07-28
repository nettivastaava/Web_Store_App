import React, { useState, useEffect } from 'react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import Comments from './Comments'
import { ME, ALL_COMMENTS, ALL_PRODUCTS, ADD_COMMENT } from '../queries'
import { checkDocument } from '@apollo/client/utilities'
import { useRouteMatch } from 'react-router'
import { Table, Form, Button } from 'react-bootstrap'

const Product = ({ shownProduct, addToCart, setError }) => {
  const [content, setContent] = useState('')
  const [comments, setComments] = useState([])
  const [grade, setGrade] = useState(null)
  const userData = useQuery(ME)
  const [allowReview, setAllowReview] = useState(true)
  const [getComments, commentsResult] = useLazyQuery(ALL_COMMENTS)
  const [user, setUser] = useState(null)
  const [ createReview, result ] = useMutation(ADD_COMMENT, {  
    refetchQueries: [ { query: ALL_PRODUCTS } ],
    onError: (error) => {
      setError(error)
    },
  })
  useEffect(() => {
    if (!shownProduct || !localStorage.getItem('shop-user-token') || !document.getElementById('buy-button')) {
      return
    }

    setComments(shownProduct.comments) 

    const buyButton =  document.getElementById('buy-button')

    if (shownProduct.quantity < 1) {
      buyButton.disabled = true
    } else {
      buyButton.disabled = false
    }
    
  })

  useEffect(() => {    
    if (userData.data && userData.data.me) {    
      setUser(userData.data.me.username)  
    }  
  }, [userData])

  useEffect( async () => {
    if (userData.data && userData.data.me && shownProduct) {
      let reviewCheck =  await comments.filter(c => c.user === userData.data.me.username)  
  
      if (reviewCheck.length > 0) {
        setAllowReview(false)
      } else {
        setAllowReview(true)
      }
    }
  })

  if (userData.loading) {
    return (
      <div>loading...</div>
    )
  }

  if (!shownProduct) {
    return null
  }

  console.log('tuote ', shownProduct)
  console.log('kom', comments.length)
  console.log('onko sallittu ', allowReview)

  if (!localStorage.getItem('shop-user-token')) {
    return (
      <div>
        <h2>{shownProduct.name}</h2>
        <Table striped>
          <tbody>
            <tr>
              <th></th>
              <th>
                price
              </th>
              <th>
                description
              </th>
              <th>
                quantity
              </th>
              <th>
                average grade
              </th>
            </tr>
            <tr>
              <td>{shownProduct.name}</td>
              <td>${shownProduct.price}</td>
              <td>{shownProduct.description}</td>
              <td>{shownProduct.quantity}</td>
              <td>{shownProduct.average_grade}</td>
            </tr>
          </tbody>
        </Table>
        Log in to see the reviews for this product
      </div>
    )
  }
  const button = <Button id='buy-button' onClick={() => addToCart(shownProduct)}>add to cart</Button>

  const postReview = async (event) => {
    
    event.preventDefault()
    const product = shownProduct.id
    createReview({ variables: { user, product, content, grade } })
    setContent('')
    setGrade(null)
  }

  const reviewForm = () => (
    <Form onSubmit={postReview}>
      <h3>Review this product</h3>
      <Form.Label>Grade (1-5): </Form.Label>
      <input 
        id='grade'         
        type='number'
        min='1'
        max='5'
        size= '1'
        value={grade}
        onChange={({ target }) => setGrade(parseInt(target.value))}
      />
      <br></br>
      <textarea value={content} onChange={({ target }) => setContent(target.value)} className="text" cols="50" rows ="5"></textarea>
      <div>
        <Button type='submit'>Review this product</Button>
      </div>
    </Form>
  )

  return (
    <div>
      <h2>{shownProduct.name}</h2>
      <Table striped>
        <tbody>
          <tr>
            <th></th>
            <th>
              price
            </th>
            <th>
              description
            </th>
            <th>
              quantity
            </th>
            <th>
              average grade
            </th>
            <th></th>
          </tr>
          <tr>
            <td>{shownProduct.name}</td>
            <td>${shownProduct.price}</td>
            <td>{shownProduct.description}</td>
            <td>{shownProduct.quantity}</td>
            <td>{shownProduct.average_grade}</td>
            <td>{button}</td>
          </tr>
        </tbody>
      </Table>
      <Table striped>
        <tbody>
        {comments.map(c =>
          <tr key={c.id}>
            <th>
              {c.user} gave grade {c.grade} and commented:
            </th>
            <tr>
              <th>
                {c.content}
              </th>
            </tr>
          </tr>
          )}
        </tbody>
      </Table>
      {allowReview !== false && reviewForm()}
    </div>
  )
}

export default Product