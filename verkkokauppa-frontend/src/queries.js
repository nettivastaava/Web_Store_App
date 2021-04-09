import { gql } from '@apollo/client'

export const ALL_PRODUCTS = gql`
  query allProductsByCategory($category: String){
    allProducts(category: $category) {
      name
      price
      quantity
      id
      categories
      description
    }
  }
  `
export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`

export const ALL_CATEGORIES = gql`
query {
  allCategories
}
`
export const ME = gql`
  query {
    me {
      username
    }
  }
  `

export const CREATE_USER = gql`
  mutation createUser($username: String!, $password: String!, $passwordConf: String!) {
    createUser(username: $username, password: $password, passwordConf: $passwordConf) {
      username
    }
  }
`

export const DECREASE_QUANTITY = gql`
  mutation decreaseQuantity($name: String!, $quantity: Int!) {
    decreaseQuantity(name: $name, quantity: $quantity) {
      name
      quantity
    }
  }
`

export const FIND_PRODUCT = gql`
  query findProduct($name: String!) {
    findProduct(name: $name) {
      name
      price
      quantity
    }
  }
`