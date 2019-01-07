# Filtering: Searching the List of Links

This will implement the search feature..

## Preparing the `Search` Component

1. ### Build the `Search` component

   Add a new file called `Search.js` inside `components` folder and add the following code into it:

   ```js
   // -------------------
   // src/components/Search.js
   // -------------------
   import React, { Component } from 'react';
   import gql from 'graphql-tag';
   import Link from './Link';

   class Search extends Component {
     state = {
       links: [],
       filter: ''
     };

     render() {
       return (
         <div>
           <div>
             Search
             <input
               type="text"
               onChange={e => this.setState({ filter: e.target.value })}
             />
             <button onClick={this._executeSearch}>OK</button>
           </div>
           {this.state.links.map((link, index) => (
             <Link key={link.id} link={link} index={index} />
           ))}
         </div>
       );
     }

     _executeSearch = async () => {};
   }

   export default Search;
   ```

   The component has two states:

   - `this.state.links` - Holds all the `Link` elements retrieved from the server response to be rendered
   - `this.state.filter` - Holds the search text to be passed in the `feed` query, which will be used to constrain the list of `Link`s

2. ### Add the route for `Search` component

   Adjust `App.js` to include the new route:

   ```js
   // -------------------
   // src/components/App.js
   // -------------------
   // 1
   import Search from './Search';
   ...

   render() {
     return (
       ...
       <Switch>
         ...
         // 2
         <Route exact path="/search" component={Search} />
       </Switch>
       ...
     );
   }
   ```

   - `[1]` - Imports the component on top of the file
   - `[2]` - Adds the `search` route, which will render the `Search` component when the URL matches the route's path

3. ### Attach the `Search` link to the `Header`

   Adjust `Header.js` to put a new `Link` called `search` between `new` and `submit`:

   ```js
   // -------------------
   // src/components/Header.js
   // -------------------
   <div className="flex flex-fixed black">
     <div className="fw7 mr1">Hacker News</div>
     <Link to="/" className="ml1 no-underline black">
       new
     </Link>
     <div className="ml1">|</div>
     <Link to="/search" className="ml1 no-underline black">
       search
     </Link>
     {authToken && (
       <div className="flex">
         <div className="ml1">|</div>
         <Link to="/create" className="ml1 no-underline black">
           submit
         </Link>
       </div>
     )}
   </div>
   ```

## Filtering `Link`s

1. ### Write the GraphQL query for `Search`

   Copy the `feed` query from before, adjust it a little bit to accept a `filter` param, paste it on top of `Search.js` file:

   ```js
   // -------------------
   // src/components/Search.js
   // -------------------
   const FEED_SEARCH_QUERY = gql`
     query FeedSearchQuery($filter: String!) {
       feed(filter: $filter) {
         links {
           id
           url
           description
           createdAt
           postedBy {
             id
             name
           }
           votes {
             id
             user {
               id
             }
           }
         }
       }
     }
   `;
   ```

2. ### Implement the sending of query via `ApolloClient`

   Instead of using the `graphql` HOC from before, this time use the `query` method from the `ApolloClient` instance. First, still on `Search.js` file, update the export definition to look as follows:

   ```js
   export default withApollo(Search);
   ```

   Then import `withApollo` from `react-apollo` package, at the top of the file:

   ```js
   import { withApollo } from 'react-apollo';
   ```

   The `withApollo` function injects the `ApolloClient` instance which was [configured previously](README_getting-started.md#configure-apolloclient) in `index.js` into the `Search` component as a new prop called `client`.

   Implement the `_executeSearch` function to use `query` from the `client` prop to send the query manually and to store the retrieved data in the component's `state`. It should look as follows:

   ```js
   _executeSearch = async () => {
     const { filter } = this.state;
     const { client } = this.props;
     const result = await client.query({
       query: FEED_SEARCH_QUERY,
       variables: { filter }
     });
     const { links } = result.data.feed;
     this.setState({ links });
   };
   ```
