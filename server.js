import {createServer} from "http";
import express from "express";
import expressGraphQL from "express-graphql";
import cors from "cors";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  execute,
  subscribe,
} from "graphql";
import { PubSub } from "graphql-subscriptions";
import {SubscriptionServer} from "subscriptions-transport-ws";
import {ApolloServer} from "apollo-server-express";

(async () => {
  const PORT = 5000;
  const pubsub = new PubSub();
  const app = express();
  const httpServer = createServer(app);

  const authors = [
    { id: 1, name: "Hans Christian Andersen" },
    { id: 2, name: "J. K. Rowling" },
    { id: 3, name: "F. Scott Fitzgerald" },
    { id: 4, name: "Dan Brown" },
    { id: 5, name: "Fyodor Dostoevsky" },
  ];

  const books = [
    {id:1,name:"Mala sirena",authorId:1,year:1837,genre:"bajka"},
    {id:2,name:"Djevojčica sa šibicama",authorId:1,year:1845,genre:"bajka",},
    {id:3,name:"Carevo novo ruho",authorId:1,year:1837,genre:"bajka",},
    {id:4,name:"Snježna kraljica",authorId:1,year:1844,genre:"bajka",},
    {id:5,name:"Harry Potter i kamen mudraca",authorId:2,year:1997,genre:"fantastika",},
    {id:6,name:"Čudesne zvijeri i gdje ih naći",authorId:2,year:2001,genre:"fantastika",},
    {id:7,name:"Nemirna krv",authorId:2,year:2020,genre:"fantastika",},
    {id:8,name:"Harry Potter i Darovi smrti",authorId:2,year:2007,genre:"fantastika",},
    {id:9,name:"Veliki Gatsby",authorId:3,year:1925,genre:"Modernističkiroman",},
    {id:10,name:"Da Vincijev kod",authorId:4,year:2003,genre:"kriminalističkitriler",},
    {id:11,name:"Zločin i kazna",authorId:5,year:1866,genre:"kriminalističkitriler",},
    {id:12,name:"Braća Karamazovi",authorId:5,year:1880,genre:"filozofskidramskiroman",},
  ];
  const BookType = new GraphQLObjectType({
    name: "Book",
    description: "Knjiga tip",
    fields: () => ({
      id: { type: GraphQLNonNull(GraphQLInt) },
      name: { type: GraphQLNonNull(GraphQLString) },
      authorId: { type: GraphQLNonNull(GraphQLInt) },
      year: { type: GraphQLNonNull(GraphQLInt) },
      genre: { type: GraphQLNonNull(GraphQLString) },
      author: {
        type: AuthorType,
        resolve: (book) => {
          return authors.find((author) => author.id === book.authorId);
        },
      },
    }),
  });

  const AuthorType = new GraphQLObjectType({
    name: "Author",
    description: "autor tip",
    fields: () => ({
      id: { type: GraphQLNonNull(GraphQLInt) },
      name: { type: GraphQLNonNull(GraphQLString) },
      books: {
        type: new GraphQLList(BookType),
        resolve: (author) => {
          return books.filter((book) => book.authorId === author.id);
        },
      },
    }),
  });

  const RootQueryType = new GraphQLObjectType({
    name: "Query",
    description: "Root Query",
    fields: () => ({
      book: {
        type: BookType,
        description: "Knjiga",
        args: {
          id: { type: GraphQLInt },
        },
        resolve: (parent, args) => books.find((book) => book.id === args.id),
      },
      books: {
        type: new GraphQLList(BookType),
        description: "List Knjiga",
        resolve: () => books,
      },
      authors: {
        type: new GraphQLList(AuthorType),
        description: "List Autora",
        resolve: () => authors,
      },
      author: {
        type: AuthorType,
        description: "Autor",
        args: {
          id: { type: GraphQLInt },
        },
        resolve: (parent, args) =>
          authors.find((author) => author.id === args.id),
      },
    }),
  });

  const RootMutationType = new GraphQLObjectType({
    name: "Mutation",
    description: "Root Mutation",
    fields: () => ({
      addAuthor: {
        type: AuthorType,
        description: "Dodaj autora",
        args: {
          name: { type: GraphQLNonNull(GraphQLString) },
        },
        resolve: (parent, args) => {
          const author = {
            id: Math.floor(Math.random() * 1000) + 6,
            name: args.name,
          };
          authors.push(author);
          pubsub.publish("NEW_AUTHOR", { AuthorAdded: author });
          return author;
        },
      },
      addBook: {
        type: BookType,
        description: "Dodaj knjigu",
        args: {
          name: { type: GraphQLNonNull(GraphQLString) },
          authorId: { type: GraphQLNonNull(GraphQLInt) },
        },
        resolve: (parent, args) => {
          const book = {
            id: Math.floor(Math.random() * 1000) + 13,
            name: args.name,
            authorId: args.authorId,
            year: 0,
            genre: "Žanr",
          };
          books.push(book);
          pubsub.publish("NEW_BOOK", { BookAdded: book });
          return book;
        },
      },
      removeBook: {
        type: BookType,
        description: "Ukloni knjigu pojedinog autora",
        args: {
          id: { type: GraphQLNonNull(GraphQLInt) },
        },
        resolve: (parent, args) => {
          books.forEach((book, index) => {
            if (book.id === args.id) {
              books.splice(index, 1);
            }
            return books;
          });
        },
      },
      removeAuthor: {
        type: AuthorType,
        description: "Ukloni autora i njegove knjige",
        args: {
          id: { type: GraphQLNonNull(GraphQLInt) },
        },
        resolve: (parent, args) => {
          for (var i = 0; i <= books.length - 1; i++) {
            if (books[i].authorId == args.id) {
              books.splice(i, 1);
              i -= 1;
            }
          }
          authors.forEach((author, index) => {
            if (author.id === args.id) {
              authors.splice(index, 1);
            }
          });
        },
      },
      updateBook: {
        type: BookType,
        description: "Azuriraj knjigu",
        args: {
          id: { type: GraphQLNonNull(GraphQLInt) },
          newName: { type: GraphQLNonNull(GraphQLString) },
        },
        resolve: (parent, args) => {
          books.forEach((book, index) => {
            if (book.id === args.id) {
              books[index].name = args.newName;
            }
            return books;
          });
        },
      },
      updateAuthor: {
        type: AuthorType,
        description: "Azuriraj autora",
        args: {
          id: { type: GraphQLNonNull(GraphQLInt) },
          newName: { type: GraphQLNonNull(GraphQLString) },
        },
        resolve: (parent, args) => {
          authors.forEach((author, index) => {
            if (author.id === args.id) {
              authors[index].name = args.newName;
            }
            return author;
          });
        },
      },
    }),
  });
  const RootSubscriptionType = new GraphQLObjectType({
    name: "Subscription",
    description: "Root Subscription",
    fields: () => ({
      AuthorAdded: {
        type: AuthorType,
        description: "update autori",
        subscribe: () => pubsub.asyncIterator(["NEW_AUTHOR"]),
      },
      BookAdded: {
        type: BookType,
        description: "update knjige",
        subscribe: () => pubsub.asyncIterator(["NEW_BOOK"]),
      },
    }),
  });

  const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType,
    subscription: RootSubscriptionType,
  });
  const server = new ApolloServer({
    schema,
  });
  await server.start();
  server.applyMiddleware({ app });
  app.use(cors());
  app.use(
    "/graphql",
    expressGraphQL({
      schema: schema,
      graphiql: true,
    })
  );
  SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath }
  );
  httpServer.listen(PORT, () => {
    console.log(
      `Postavljanje upita na http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `Pretplate su dostupne na ws://localhost:${PORT}${server.graphqlPath}`
    );
  });
})();
