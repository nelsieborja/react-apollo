# More Mutations and Updating the Store

This will implement the voting feature, using another API operation - `vote` mutation.

## Preparing the React Components

1. ### Adjust `Link` component

   Update the `render` function in `Link.js` to look as follows:

   ```js
   // -------------------
   // src/components/Link.js
   // -------------------
   render() {
     // 1
     const authToken = localStorage.getItem(AUTH_TOKEN);
     const {
       index,
       link: { createdAt, description, url, votes, postedBy }
     } = this.props;

     return (
       <div className="flex mt2 items-start">
         <div className="flex items-center">
           // 2
           <span className="gray">{index + 1}.</span>
           // 3
           {authToken && (
             <div className="ml1 gray f11" onClick={}>
               ▲
             </div>
           )}
         </div>
         <div className="ml1">
           <div>
             {description} ({url})
           </div>
           // 4
           <div className="f6 lh-copy gray">
             {votes.length} votes | by {postedBy ? postedBy.name : 'Unknown'}{' '}
             {timeDifferenceForDate(createdAt)}
           </div>
         </div>
       </div>
     );
   }
   ```

   - `[1]` - Retrieves the user's token from local storage
   - `[2]` - Represents the position of the `Link` item in the list
   - `[3]` - Renders _upvote_ button if user is logged in
   - `[4]` - Displays the count of `Vote`s for each `Link`, corresponding `User`'s name (otherwise _"Unknown"_), invokes `timeDifferenceForDate` function by passing in `createdAt` to convert its timestamp value to a more user-friendly string


    On the same file, import `AUTH_TOKEN` and `timeDifferenceForDate` on top of it:

    ```js
    import { AUTH_TOKEN } from '../constants';
    import { timeDifferenceForDate } from '../utils';
    ```

    Create the file `utils.js` inside `src` folder, copy its code from [here](https://github.com/howtographql/react-apollo/blob/master/src/utils.js).

3. ### Adjust `LinkList` component

   Update the rendering of `Link` components inside `render` function to include the `Link`'s position using the `index` param:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   return (
     <div>
       {linksToRender.map((link, index) => (
         <Link key={link.id} link={link} index={index} />
       ))}
     </div>
   );
   ```

   Update the `FEED_QUERY` definition to look as follows:

   ```js
   const FEED_QUERY = gql`
     {
       feed {
         links {
           id
           createdAt
           url
           description
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

   `postedBy` and `votes` were added in the query's payload, to include information about the user who posted the `Link`s as well the `Vote`s for each link.

## Calling the Mutation

1. ### Write the GraphQL mutation using `gql` function

   Add the following `VOTE_MUTATION` definition to the top of `Link.js`:

   ```js
   // -------------------
   // src/components/Link.js
   // -------------------
   const VOTE_MUTATION = gql`
     mutation VoteMutation($linkId: ID!) {
       vote(linkId: $linkId) {
         id
         link {
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

2. ### Use the `<Mutation>` component and the mutate function

   On the same file, adjust _upvote_ button to attach the mutation to it. It should look as follows:

   ```js
   // -------------------
   // src/components/Link.js
   // -------------------
   <Mutation mutation={VOTE_MUTATION} variables={{ linkId: id }}>
     {voteMutation => (
       <div className="ml1 gray f11" onClick={voteMutation}>
         ▲
       </div>
     )}
   </Mutation>
   ```

   The `vote` mutation and the `id` of the `Link` are passed as props to `<Mutation>` component, using its `render prop function` to render the _upvote_ button with the `voteMutation` attached to it.

3. ### Import `Mutation` and `gql` on top of `Link.js`:

   ```js
   import { Mutation } from 'react-apollo';
   import gql from 'graphql-tag';
   ```

Clicking on the _upvote_ button on a link will not give any UI feedback yet but after refreshing the page the votes are added. This means the mutation is working, will add the automatic UI update after each mutation next.

## Updating the cache

Atm, GraphQL server gets updated in every mutation while Apollo cache (or the `store`) becomes out of sync. Apollo provides the `update` function, the recommended way to update the cache after a query. Using `update` gives access to the store which has some utility functions that can be used to read/write queries to the store as if it were a server.

1. ### Add `update` to `Link`'s mutation component

   Adjust `<Mutation>` component in `Links.js` to add `update` as prop:

   ```js
   // -------------------
   // src/components/Link.js
   // -------------------
   <Mutation
     mutation={VOTE_MUTATION}
     variables={{ linkId: id }}
     update={(store, { data: { vote } }) =>
       this.props.updateStoreAfterVote(store, vote, id)
     }
   >
     {voteMutation => (
       <div className="ml1 gray f11" onClick={voteMutation}>
         ▲
       </div>
     )}
   </Mutation>
   ```

   - `update` - Gets called after the server returned the response
   - `store` - First argument, the Apollo cache
   - `data` - Second argument, the payload of the mutation
   - `updateStoreAfterVote` - Will contain the logic for updating the cache, to be implemented next

2. ### Create `updateStoreAfterVote` function in the parent component

   Add the following function inside the scope of the `LinkList` component:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _updateCacheAfterVote = (store, createVote, linkId) => {
     // 1
     const data = store.readQuery({ query: FEED_QUERY });
     // 2
     const votedLink = data.feed.links.find(link => link.id === linkId);
     votedLink.votes = createVote.link.votes;
     // 3
     store.writeQuery({ query: FEED_QUERY, data });
   };
   ```

   - `[1]` - Reads the current state of the cached data for the `FEED_QUERY` from the `store`

     > `store.readQuery` function is similar to the `query` function on `ApolloClient` except that `readQuery` will _never_ make a request to the the GraphQL server

   - `[2]` - Retrieves the link that's just voted for from the cached `links` list, then replacing its `votes` with the `votes` returned by the server
   - `[3]` - Writes the modified data back into the store

     > `store.writeQuery` is `readQuery` counterparts except they also require an additional `data` variable


    Pass this function down to the `Link` component so it can be called from there:
    ```js
    // -------------------
    // src/components/LinkList.js
    // -------------------
    <Link
      key={link.id}
      link={link}
      index={index}
      updateStoreAfterVote={this._updateCacheAfterVote}
    />
    ```

With the `update` set in place, clicking on the button should now give a UI feedback (eg: `votes` is increased by 1). Time to implement `update` for adding new links..

3. ### Add `update` to `CreateLink`'s mutation component

   Adjust `<Mutation>` component in `CreateLink.js` to add `update` as prop:

   ```js
   // -------------------
   // src/components/CreateLink.js
   // -------------------
   <Mutation
     mutation={POST_MUTATION}
     variables={{ description, url }}
     onCompleted={() => this.props.history.push('/')}
     update={(store, { data: { post } }) => {
       const data = store.readQuery({ query: FEED_QUERY });
       data.feed.links.unshift(post);
       store.writeQuery({ query: FEED_QUERY, data });
     }}
   >
     {postMutation => <button onClick={postMutation}>Submit</button>}
   </Mutation>
   ```

   The `update` works in a very similar way as before, except its logic is added here directly. With `unshift` function, the new `post` will be added at the beginning of the cached list of `Link`s.

   Before this starts working, need to import `FEED_QUERY` into the file:

   ```js
   import { FEED_QUERY } from './LinkList';
   ```

   Finally `FEED_QUERY` needs to be exported from where it's defined. Adjust its definition in `LinkList.js` by adding the `export` keyword to it:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   export const FEED_QUERY = ...
   ```
