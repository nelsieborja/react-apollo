# Realtime Updates with GraphQL Subscriptions

This is all about bringing realtime functionality into the app by using GraphQL subscriptions - `newLink` and `newVote` operations.

## Subscriptions with Apollo

When using with Apollo, need to configure the `ApolloClient` with information about the subscriptions endpoint. This is done by adding another `ApolloLink`, the `WebSocketLink` from the `apollo-link-ws` package, to the Apollo middleware chain.

1. ### Install the dependecies to the App

   ```shell
   $ yarn add apollo-link-ws subscriptions-transport-ws
   ```

2. ### Attach the subscription server to `ApolloClient`

   Create a new `WebSocketLink` that represents the Websocket connection. Use `split` for proper "routing" of the requests and update the constructor call of `ApolloClient`:

   ```js
   // -------------------
   // src/index.js
   // -------------------
   // 1
   import { split } from 'apollo-link';
   import { WebSocketLink } from 'apollo-link-ws';
   import { getMainDefinition } from 'apollo-utilities';

   // 2
   const wsLink = new WebSocketLink({
     uri: 'ws://localhost:4000',
     options: {
       reconnect: true,
       connectionParams: {
         authToken: localStorage.getItem(AUTH_TOKEN)
       }
     }
   });
   // 3
   const link = split(
     ({ query }) => {
       const { kind, operation } = getMainDefinition(query);
       return kind === 'OperationDefinition' && operation === 'subscription';
     },
     wsLink,
     authLink.concat(httpLink)
   );

   const client = new ApolloClient({
     link,
     cache: new InMemoryCache()
   });
   ```

   - `[1]` - Imports corresponding dependencies
   - `[2]` - Instantiates a `WebSocketLink` that knows the subscription endpoint. The endpoint is similar to HTTP endpoint except it uses the `ws` protocol, also the connection is authenticated via the user's `token` from `localStorage`
   - `[3]` - Uses `split` to "route" a request to a specific middleware link. It takes three arguments:
     - First one is a `test` function - in this case it's checking if the requested operation is a _subscription_
     - Second is of type `ApolloLink` and request will be forwarded to it if `test` returns `true`;
     - if `false`, to the third one which is also of type `ApolloLink`

## Subscribing to new `Link`s

Implement the subcription in the `LinkList` component since that's where all the links are rendered.

1. ### Subscribe to the event via `subscribeToMore`

   Update `LinkList.js` to add the function within `<Query>` component's `render prop function`:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   <Query query={FEED_QUERY}>
     {({ loading, error, data, subscribeToMore }) => {
       if (loading) return <div>Fetching</div>;
       if (error) return <div>Error</div>;

       this._subscribeToNewLinks(subscribeToMore);
       ...
       );
     }}
   </Query>
   ```

   The `_subscribeToNewLinks` function will subscribe using `subscribeToMore`. The `subscribeToMore` function gets invoke every time subscription returns.

2. ### Implement `_subscribeToNewLinks` within `LinkList` scope

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _subscribeToNewLinks = subscribeToMore => {
     subscribeToMore({
       document: NEW_LINKS_SUBSCRIPTION,
       updateQuery: (prev, { subscriptionData }) => {
         if (!subscriptionData.data) return prev;

         const { newLink } = subscriptionData.data;
         const { links, __typename } = prev.feed;

         return Object.assign({}, prev, {
           feed: {
             links: [...links, newLink],
             count: links.length + 1,
             __typename
           }
         });
       }
     });
   };
   ```

   The `subscribeToMore` function takes two arguments:

   - `document` - Represents the subscription query itself; to be added next
   - `updateQuery` - Similar to cache `update` from before, here you can update the query's store with the new data. In this case, it merges the new link into the existing list of `Link`s.

     > The `updateQuery` callback must return an object of the same shape as the initial query data, otherwise the new data won’t be merged

3. ### Add the subscription query

   Define `NEW_LINKS_SUBSCRIPTION` constant on top of `LinkList.js`:

   ```js
   const NEW_LINKS_SUBSCRIPTION = gql`
     subscription {
       newLink {
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
   `;
   ```

## Subscribing to new `Vote`s

Subscribe to new votes so that the latest vote count is always visible in the App. The implementation would be exactly the same way as subscribing to new `Link`s.

1. ### Subscribe to the event via `subscribeToMore`

   Still in `LinkList.js` file, add the following code just after `_subscribeToNewLinks`:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   this._subscribeToNewVotes(subscribeToMore);
   ```

2. ### Implement `_subscribeToNewVotes`

   ```js
   _subscribeToNewVotes = subscribeToMore => {
     subscribeToMore({
       document: NEW_VOTES_SUBSCRIPTION
     });
   };
   ```

   Notice that there's no `updateQuery` provided this time. Since the updated data already exists (via `id`s) in the store, this will be merged _instantly_.

3. ### Add the `NEW_VOTES_SUBSCRIPTION` constant

   ```js
   const NEW_VOTES_SUBSCRIPTION = gql`
     subscription {
       newVote {
         id
         link {
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
         user {
           id
         }
       }
     }
   `;
   ```
