# Getting Started

## Frontend

### Creating the app

1. Use `npx` to bootstrap the React App with `create-react-app`:

   ```shell
   $ npx create-react-app hackernews-react-apollo
   ```

   > `npx` is the `npm` package (lives inside a local `node_modules` folder or not globally installed) manager. It can also be used for one-off commands, which is in this case.

2. Start the app to check if everything works:

   ```shell
   $ cd hackernews-react-apollo
     yarn start
   ```

   This will open a browser and navigates to `http://localhost:3000` where the App is running.

3. Improve the project structure

   Create two folders with:

   ```shell
   $ mkdir src/components
     mkdir src/styles
   ```

   - `components` - move the component file into this folder [`App.js`]
   - `styles` - move the CSS files into this folder [`App.css`, `index.css`]


    Change the references to these files in `index.js` accordingly:

    ```js
    // -------------------
    // src/index.js
    // -------------------
    import React from 'react';
    import ReactDOM from 'react-dom';
    import './styles/index.css';
    import App from './components/App';
    ```

    Need also to update the file references in `App.js`:

    ```js
    import React, { Component } from 'react';
    import logo from '../logo.svg';
    import '../styles/App.css';
    ```

### Create styling

In order to focus on GraphQL, reduce the usage of CSS in the project by using [Tachyons](http://tachyons.io/) library which provides a number of CSS classes.

1. Include the library in `public/index.html` within the `head` tag:

   ```html
   <!-- public/index.html -->
   <link
     rel="stylesheet"
     href="https://unpkg.com/tachyons@4.2.1/css/tachyons.min.css"
   />
   ```

2. Add some custom styling, replace `src/styles/index.css` content with the code from [here](https://github.com/howtographql/react-apollo/blob/master/src/styles/index.css)

### Install Apollo Client

Install Apollo Client along with the rest of dependencies:

```shell
$ yarn add apollo-boost react-apollo graphql
```

- `apollo-boost` is bundled with several packages needed when working with Apollo Client:
  - `apollo-client` - Where all the magic happens; helps build a UI that fetches data with GraphQL
  - `apollo-cache-inmemory` - Cache implementation for Apollo Client
  - `apollo-link-http` - An Apollo Link for remote data fetching
  - `apollo-link-error` - For error handling
  - `apollo-link-state` - For local state management
  - `graphql-tag` - Exports the `gql` helper function for parsing GraphQL query strings into GraphQL AST
- `react-apollo` contains the bindings to use Apollo Client with React
- `graphql`

### Configure `ApolloClient`

With Apollo, no need to deal with constructing HTTP requests, instead you can simply write queries and mutations and send them using `ApolloClient` instance.

Update `src/index.js` file to look as follows:

```js
// -------------------
// src/index.js
// -------------------
...
// 1
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
// 2
const httpLink = createHttpLink({
  uri: 'http://localhost:4000'
});
// 3
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});

ReactDOM.render(
  // 4
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);
...
```

- `[1]` - Imports the required dependencies from the installed packages
- `[2]` - Creates the `httpLink` that connects the `ApolloClient` instance with the GraphQL API, by specifying the endpoint of the GraphQL server which is `http://localhost:4000`
- `[3]` - Instantiates `ApolloClient` by passing in the `httpLink` and a new instance of an `InMemoryCache`
- `[4]` - Wraps the root component with the `ApolloProvider` HOC which receives `client` as prop

---

## Backend

It will use exactly [this](//github.com/nelsieborja/graphql-server) setup but you can pull in the resources from the [Node tutorial](https://www.howtographql.com/graphql-js/0-introduction) itself by running the following command in the root directory of the App:

```shell
$ curl https://codeload.github.com/howtographql/react-apollo/tar.gz/starter | tar -xz --strip=1 react-apollo-starter/server
```

Here are the allowed API _operations_ based on the GrahpQL schema - `server/src/schema.graphql`:

- ### Queries (fetch):
  - `feed` - Retrieves all links from the backend; allows _filter_, _sorting_ and _pagination_ arguments
- ### Mutations (add/update/remove):
  - `post` - Allows _authenticated_ users to create a new link
  - `signup` - Create an account for a new user
  - `login` - Login an existing user
  - `vote` - Allows _authenticated_ users to vote for an existing link
- ### Subscriptions (receive realtime update):
  - `newLink` - When a new link is created
  - `newVote` - When a new vote was submitted

### Deploying the Prisma datamodel

First, need to install the server environment dependencies by running the following command inside `server` folder:

```shell
$ yarn install
```

Then run the following command to deploy Prisma:

```shell
$ yarn prisma deploy
```

This will start an [interactive process](https://github.com/nelsieborja/graphql-server/blob/master/README_adding-database.md#time-to-deploy-the-server). You can emit `yarn` in the above command if you have `prisma` CLI installed globally on your machine.

### Exploring the server

Now that Prisma is deployed, start the GraphQL server with:

```shell
$ yarn start
```

Going to the URL outputted by the terminal, would be the GraphQL Playground. Send the following mutation through it:

```js
mutation {
  prismaLink: post(
    description: "Prisma replaces traditional ORMs and makes it easy to build GraphQL servers 😎",
    url: "https://www.prisma.io"
  ) {
    id
  }
  apolloLink: post(
    description: "The best GraphQL client for React",
    url: "https://www.apollographql.com/docs/react/"
  ) {
    id
  }
}
```

`prismaLink` and `apolloLink` are just an [aliases](https://graphql.org/learn/queries/#aliases), which is required in this case so that the two `post` fields would not be conflicted.

Verify the mutation actually worked with the following query:

```js
{
  feed {
    links {
      id
      description
      url
    }
  }
}
```
