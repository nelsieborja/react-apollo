# Queries: Loading Links

This will implement the loading and displaying the list of `Link` elements, using the first API operation - `feed` query.

## Preparing the React Components

1. ### Create the `Link` component

   Create the component that will render a single `Link` element. Name it as `Link.js` and lives inside `components` folder, should contain the following code:

   ```js
   // -------------------
   // src/components/Link.js
   // -------------------
   import React, { Component } from 'react';

   class Link extends Component {
     const { link: { description, url } } = this.props;
     render() {
       return (
         <div>
           <div>
             {description} ({url})
           </div>
         </div>
       );
     }
   }

   export default Link;
   ```

2. ### Create the `LinkList` component

   This component will render the list of `Link` elements. Name it as `LinkList.js` also lives inside `components` folder and has the following code:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   import React, { Component } from 'react';
   import Link from './Link';

   const linksToRender = [
     {
       id: '1',
       description:
         'Prisma replaces traditional ORMs and makes it easy to build GraphQL servers 😎',
       url: 'https://www.prisma.io'
     },
     {
       id: '2',
       description: 'The best GraphQL client',
       url: 'https://www.apollographql.com/docs/react/'
     }
   ];

   class LinkList extends Component {
     render() {
       return (
         <div>
           {linksToRender.map(link => (
             <Link key={link.id} link={link} />
           ))}
         </div>
       );
     }
   }

   export default LinkList;
   ```

   Right now it is using a hardcoded data of `linksToRender` just to make sure the component setup works.

3. ### Update `App` component to render `LinkList` component

   ```js
   // -------------------
   // src/components/App.js
   // -------------------
   import React, { Component } from 'react';
   import LinkList from './LinkList';

   class App extends Component {
     render() {
       return <LinkList />;
     }
   }
   export default App;
   ```

Go to the URL where the App is running from the browser. If the links from the `linksToRender` array are displayed then everything works so far.

## Queries with Apollo Client

With Apollo, there are two ways of sending queries to the server:

1. ### Use `query` method on the `ApolloClient` instance directly

   This is a very direct way of fetching data and it returns a _promise_. A practical example would look as follows:

   ```js
   client
     .query({
       query: gql`
         {
           feed {
             links {
               id
             }
           }
         }
       `
     })
     .then(response => console.log(response.data.feed.links));
   ```

2. ### Use the declative way via `<Query>` component

   With Apollo's new [render prop API](https://blog.apollographql.com/introducing-react-apollo-2-1-c837cc23d926), fetching data becomes simpler. The process of adding data fetching logic will be similar every time:

   1. Write the GraphQL query string, wrap it with the `gql` parser function:

      ```js
      const FEED_QUERY = gql`
        {
          feed {
            links {
              url
              description
            }
          }
        }
      `;
      ```

   2. Use the `<Query>` component with the GraphQL query attached to its `query` prop:

      ```js
      return (
        <Query query={FEED_QUERY}>
          {() => linksToRender.map(link => <Link key={link.id} link={link} />)}
        </Query>
      );
      ```

   3. Access the query result that gets injected into `<Query>` component's `render prop function`:

      ```js
      return (
        <Query query={FEED_QUERY}>
          {({ data }) =>
            data.feed.links.map(link => <Link key={link.id} link={link} />)
          }
        </Query>
      );
      ```

   Putting it together, the `LinkList.js` should now look as follows:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   // 1
   import { Query } from 'react-apollo';
   import gql from 'graphql-tag';
   import React from 'react';
   import Link from './Link';

   const FEED_QUERY = gql`
     {
       feed {
         links {
           id
           createdAt
           url
           description
         }
       }
     }
   `;

   const LinkList = () => {
     return (
       <Query query={FEED_QUERY}>
         // 2
         {({ loading, error, data }) => {
           if (loading) return <div>Fetching</div>;
           if (error) return <div>Error</div>;

           // 3
           const linksToRender = data.feed.links;

           return (
             <div>
               {linksToRender.map(link => (
                 <Link key={link.id} link={link} />
               ))}
             </div>
           );
         }}
       </Query>
     );
   };

   export default LinkList;
   ```

   - `[1]` - Imports corresponding dependencies
   - `[2]` - Apollo injects several props (read more about it [here](https://www.apollographql.com/docs/react/essentials/queries.html#render-prop)) into the component's `render prop function`, they provide information about the <ins>_state_ of the network request</ins>:

     - `loading` - Indicates the request is ongoing and response hasn't been received
     - `error` - In case the request fails, this will contain information about what exactly went wrong
     - `data` - Actual data from the server

   - `[3]` - Displays the `links` from the query result replacing the hardcoded data from before
