

const express = require('express')
const expressGraphQL = require('express-graphql')

const cors = require('cors')

const {GraphQLSchema,GraphQLObjectType,GraphQLString,GraphQLList,
  GraphQLInt,GraphQLNonNull} = require('graphql')

const app = express()

const authors = [
	{ id: 1, name: 'Hans Christian Andersen' },
	{ id: 2, name: 'J. K. Rowling' },
	{ id: 3, name: 'F. Scott Fitzgerald' },
  { id: 4, name: 'Dan Brown' },
  { id: 5, name: 'Fyodor Dostoevsky' }
]

const books = [
	{ id: 1, name: 'Mala sirena', authorId: 1,year:1837,genre:"bajka"},
	{ id: 2, name: 'Djevojčica sa šibicama', authorId: 1,year:1845,genre:"bajka" },
	{ id: 3, name: 'Carevo novo ruho', authorId: 1,year:1837,genre:"bajka" },
  { id: 4, name: 'Snježna kraljica', authorId: 1,year:1844,genre:"bajka" },
	{ id: 5, name: 'Harry Potter i kamen mudraca', authorId: 2,year:1997,genre:"fantastika" },
	{ id: 6, name: 'Čudesne zvijeri i gdje ih naći', authorId: 2,year:2001,genre:"fantastika" },
	{ id: 7, name: 'Nemirna krv', authorId: 2,year:2020,genre:"fantastika" },
  { id: 8, name: 'Harry Potter i Darovi smrti', authorId: 2,year:2007,genre:"fantastika" },
	{ id: 9, name: 'Veliki Gatsby', authorId: 3,year:1925,genre:"Modernistički roman" },
	{ id: 10, name: 'Da Vincijev kod', authorId: 4,year:2003,genre:"kriminalistički triler" },
  { id: 11, name: 'Zločin i kazna', authorId: 5,year:1866,genre:"kriminalistički triler" },
  { id: 12, name: 'Braća Karamazovi', authorId: 5,year:1880,genre:"filozofski dramski roman" }
]

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: 'Knjiga tip',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    authorId: { type: GraphQLNonNull(GraphQLInt) },
    year: { type: GraphQLNonNull(GraphQLInt) },
    genre: { type: GraphQLNonNull(GraphQLString) },
    author: {
      type: AuthorType,
      resolve: (book) => {
        return authors.find(author => author.id === book.authorId)
      }
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: 'autor tip',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    books: {
      type: new GraphQLList(BookType),
      resolve: (author) => {
        return books.filter(book => book.authorId === author.id)
      }
    }
  })
})

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query',
  fields: () => ({
    book: {
      type: BookType,
      description: 'Knjiga',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => books.find(book => book.id === args.id)
    },
    books: {
      type: new GraphQLList(BookType),
      description: 'List Knjiga',
      resolve: () => books
    },
    authors: {
      type: new GraphQLList(AuthorType),
      description: 'List Autora',
      resolve: () => authors
    },
    author: {
      type: AuthorType,
      description: 'Autor',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => authors.find(author => author.id === args.id)
    }
  })
})

const RootMutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root Mutation',
  fields: () => ({
    addBook: {
      type: BookType,
      description: 'Dodaj knjigu',
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        const book = { id: books.length + 1, name: args.name, authorId: args.authorId }
        books.push(book)
        return book
      }
    },
    addAuthor: {
      type: AuthorType,
      description: 'Dodaj autora',
      args: {
        name: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: (parent, args) => {
        const author = { id: authors.length + 1, name: args.name }
        authors.push(author)
        return author
      }
    },
    removeBook: {
      type: BookType,
      description: 'Ukloni knjigu pojedinog autora',
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        books.forEach( (book, index) => {
          if (book.id === args.id) {
            books.splice(index,1)
          }
          return books
      })
    }
    },
    removeAuthor: {
      type: AuthorType,
      description: 'Ukloni autora i njegove knjige',
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        for(var i=0;i<=books.length-1;i++){
          if (books[i].authorId == args.id) {
            books.splice(i,1)
            i-=1
          }
      }
        authors.forEach( (author, index) => {
          if (author.id === args.id) {
            authors.splice(index,1)
          }
      })
    }
    },
    updateBook: {
      type: BookType,
      description: 'Azuriraj knjigu',
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) },
        newName: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: (parent, args) => {
        books.forEach( (book, index) => {
          if (book.id === args.id) {
            books[index].name=args.newName
          }
          return books
      })
    }
    },
    updateAuthor: {
      type: AuthorType,
      description: 'Azuriraj autora',
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) },
        newName: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: (parent, args) => {
        authors.forEach( (author, index) => {
          if (author.id === args.id) {
            authors[index].name=args.newName
          }
          return author
      })
    }
    }        
  })
})
const RootSubscriptionType = new GraphQLObjectType({
  name: 'Subscription',
  description: 'Root Subscription',
  fields: () => ({
    postAuthor: {
          type: AuthorType,
          subscribe: () => authors
    }

  })

})

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
  subscription: RootSubscriptionType
})
app.use(cors())
app.use('/graphql', expressGraphQL({
  schema: schema,
  graphiql: true
}))
app.listen(5000, () => console.log('Sve ispravno'))