const { ApolloServer, UserInputError, gql } = require('apollo-server')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')
const Product = require('./models/product')
const User = require('./models/user')
const Comment = require('./models/comment')
const config = require('./utils/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

console.log('connecting to', config.MONGODB_URI)

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Product {
    name: String!
    price: Float!
    quantity: Int!
    categories: [String!]!
    id: ID!
    description: String 
    comments: [Comment]!
    units_sold: Int!
  }

  type Query {
    productCount: Int!
    allProducts(category: String): [Product]!
    allCategories: [String]!
    me: User
    findProduct(name: String): Product
    allComments(product: String): [Comment]!
  }

  type User {
    username: String!
    password: String!
    id: ID!
  }

  type Comment {
    user: String!
    product: String!
    content: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Mutation {
    addProduct(
      name: String!
      price: Float!
      quantity: Int!
      categories: [String!]!
      description: String
      comments: [String]!
      units_sold: Int!
    ): Product
    increaseQuantity(    
      name: String!    
      quantity: Int! 
    ): Product
    decreaseQuantity(
      name: String!
      quantity: Int!
    ): Product
    createUser(
      username: String!
      password: String!
      passwordConf: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
    addComment(
      product: String!
      user: String!
      content: String!
    ): Comment
  }
`

const resolvers = {
  Query: {
      productCount: () => Product.collection.countDocuments(),
      allProducts: async (root, args) => {
        const products = await Product.find({}).populate('comments')
        console.log('products, ', products)

        if (!args.category) {
          return products.sort((p1, p2) => p2.units_sold - p1.units_sold)
        } else {
          return products.filter(product => product.categories.includes(args.category))          
        }
      },
      me: async (root, args, context) => {
        return await context.currentUser
      },
      allCategories: async () => {
        const products = await Product.find({})
        const categories = products.map(product => product.categories)
        .reduce((previous, current) => previous.concat(current))

        const uniqueCategories = [...new Set(categories)];
        return uniqueCategories
      },
      findProduct: async (root, args) => {
        const product = await Product.findOne({ name: args.name })
        return product
      },
      allComments: async (root, args) => {
        const comments = await Comment.find({})
        console.log(comments)
        
        return comments
      }
  },
  Mutation: {
    addProduct: async (root, args) => {
      const product = new Product({ ...args })

      try {
        await product.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return product
    },
    increaseQuantity: async (root, args) => {
      const product = await Product.findOne({ name: args.name })

      if (args.quantity < 1) {
        throw new UserInputError("Quantity can only be incremented by a positive integer", {
          invalidArgs: args,
        })
      }

      product.quantity = product.quantity + args.quantity

      try {
        await product.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return product
    },
    decreaseQuantity: async (root, args) => {
      const product = await Product.findOne({ name: args.name })

      if (args.quantity < 1) {
        throw new UserInputError("Quantity can only be decremented by a positive integer", {
          invalidArgs: args,
        })
      }

      if (args.quantity > product.quantity) {
        throw new UserInputError("Given value exceeds the quantity of the product", {
          invalidArgs: args,
        })
      }

      product.quantity = product.quantity - args.quantity
      product.units_sold = product.units_sold + args.quantity

      try {
        await product.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return product
    },
    createUser: async (root, args) => {
      if (args.password !== args.passwordConf) {
        throw new UserInputError("make sure the passwords match", {
          invalidArgs: args,
        })
      }

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.password, saltRounds)
   
      const user = new User({
        username: args.username,
        passwordHash,
      })

      console.log(user)

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      const passwordCorrect = user === null
        ? false
        : await bcrypt.compare(args.password, user.passwordHash)

      if (!(user && passwordCorrect)) {
        throw new UserInputError("invalid credentials", {
          invalidArgs: args,
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    addComment: async (root, args, context) => {
      const comment = new Comment({ ...args })
      const product = await Product.findById(args.product)

      try {
        await comment.save()
        product.comments = product.comments.concat(comment)      
        await product.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return comment
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null    
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )      
      const currentUser = await User
        .findById(decodedToken.id)
        return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})