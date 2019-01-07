# Pagination

Add pagintion for viewing of `Link` elements by chunks rather than having a long list.

## Preparing the Components

The goal is to use `LinkList` component for two different use cases and routes:

- Display the 10 top voted links
- Display the links into multiple pages that can be navigated through

1. ### Add the route for these cases

   Adjust `App.js` to include the new routes:

   ```js
   // -------------------
   // src/components/App.js
   // -------------------
   // 1
   import { Switch, Route, Redirect } from 'react-router-dom'
   ...

   render() {
     return (
       ...
       <Switch>
         // 2
         <Route exact path="/" render={() => <Redirect to="/new/1" />} />
         ...
         // 3
         <Route exact path="/top" component={LinkList} />
         // 4
         <Route exact path="/new/:page" component={LinkList} />
       </Switch>
       ...
     );
   }
   ```

   - `[1]` - Imports `Redirect` from `react-router-dom` package
   - `[2]` - The root route `/` now redirects to the first page of `new` route
   - `[3]` - `/top` route for the first case
   - `[4]` - `/new/:page` route for the second one, it reads the value for `page` from the URL making it available inside the component via `prop`

2. ### Attach the `Top` link to the `Header`

   Add the following lines between the `/` and the `/search` links in `Header.js`:

   ```js
   // -------------------
   // src/components/Header.js
   // -------------------
   <div className="ml1">|</div>
    <Link to="/top" className="ml1 no-underline black">
      top
    </Link>
   ```

3. ### Add pagination capability to the `feed` query

   Adjust the `feed` query in `LinkList.js` to to look as follows:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   export const FEED_QUERY = gql`
     query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
       feed(first: $first, skip: $skip, orderBy: $orderBy) {
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
         count
       }
     }
   `;
   ```

   The query now accepts three arguments:

   - `first` - Defines the _limit_ or _count_ elements in the returned list
   - `skip` - Defines the _offset_ where the query will start
   - `orderBy` - Defines how the returned list should be sorted

4. ### Add dynamic values to query variables

   Create a new function called `_getQueryVariables` within the scope of `LinkList` component, it will be responsible for generating the dynamic values of the query variables. The function should look as follows:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _getQueryVariables = () => {
     const {
       location: { pathname },
       match: { params }
     } = this.props;
     const isNewPage = pathname.includes('new');
     const page = parseInt(params.page, 10);

     const skip = isNewPage ? page - 1 * LINKS_PER_PAGE : 0;
     const first = isNewPage ? LINKS_PER_PAGE : 100;
     const orderBy = isNewPage ? 'createdAt_DESC' : null;
     return { first, skip, orderBy };
   };
   ```

   Update the `<Query>` component to pass the arguments (the return of `_getQueryVariables` function) as props to the component:

   ```js
   <Query query={FEED_QUERY} variables={this._getQueryVariables()}>
   ```

   Define the `LINKS_PER_PAGE` constant in `constants.js` file and import into the `LinkList` component:

   ```js
   // -------------------
   // src/constants.js
   // -------------------
   export const LINKS_PER_PAGE = 5;
   ```

   The value for `skip` is generated based on the current `page` from the URL param, while the value for `first` is taken from the `LINKS_PER_PAGE` constant (if it's on `new` page, otherwise `100`). Also the ordering attribute `createdAt_DESC` is set to `orderBy` (if it's on `new` page, otherwise `null`).

## Implementing navigation

Next is to add the funtionality for switching between the pages. And this will be added to the `LinkList` component.

1. ### Add the _Previous_ and _Next_ buttons

   Update the `render` function in `LinkList.js` file to look as follows:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   render() {
     // 1
     const {
       location: { pathname },
       match: { params }
     } = this.props;

     const isNewPage = pathname.includes('new');
     const pageIndex = params.page ? (params.page - 1) * LINKS_PER_PAGE : 0;

     return (
       <Query query={FEED_QUERY} variables={this._getQueryVariables()}>
         {({ loading, error, data, subscribeToMore }) => {
         ...

           // 2
           const linksToRender = this._getLinksToRender(data);

           return (
             <Fragment>
               {linksToRender.map((link, index) => (
                 <Link
                   key={link.id}
                   link={link}
                   // 3
                   index={index + pageIndex}
                   updateStoreAfterVote={this._updateCacheAfterVote}
                 />
               ))}
               // 4
               {isNewPage && (
                 <div className="flex ml4 mv3 gray">
                   <div className="pointer mr2" onClick={this._previousPage}>
                     Previous
                   </div>
                   <div
                     className="pointer mr2"
                     onClick={() => this._nextPage(data)}
                   >
                     Next
                   </div>
                 </div>
               )}
             </Fragment>
           );
         }}
       </Query>
     );
   }
   ```

   - `[1]` - Extracts the required data
   - `[2]` - The `_getLinksToRender` function will return the corresponding list of `Link`s; yet to be added
   - `[3]` - Updates the position of the `Link` based on the `pageIndex`
   - `[4]` - Renders the buttons only for `new` route

   `<Fragment>` is used here, need to import that as well into the component:

   ```js
   import React, { Component, Fragment } from 'react';
   ```

2. ### Implement `_getLinksToRender` within `LinkList` scope

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _getLinksToRender = data => {
     const isNewpage = this.props.location.pathname.includes('new');
     if (isNewpage) {
       return data.feed.links;
     }

     const rankedList = data.feed.links.slice();
     rankedList.sort((l1, l2) => l2.votes.length - l1.votes.length);
     return rankedList.slice(0, 10);
   };
   ```

   For `new` route, the `links` will be returned as is, since no need to make any manual modifications to the list that is to be rendered. While for `top` route, the list will be sorted according to the number of votes and returns the top 10 links.

3. ### Implement `_previousPage` and `_nextPage` within `LinkList` scope

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _previousPage = () => {
     const page = parseInt(this.props.match.params.page, 10);
     if (page > 1) {
       const previousPage = page - 1;
       this.props.history.push(`/new/${previousPage}`);
     }
   };

   _nextPage = data => {
     const page = parseInt(this.props.match.params.page, 10);
     if (page < data.feed.count / LINKS_PER_PAGE) {
       const nextPage = page + 1;
       this.props.history.push(`/new/${nextPage}`);
     }
   };
   ```

   The `_previousPage` function will be called when the _Previous_ button is pressed, while `_nextPage` function is called on press of the _Next_ button.

## Final adjustment

Since the `feed` query has been modified and it's now expecting for variables, need to make an adjustment in other places where the query has been used.

1. ### Re-evaluate _upvote_ feature

   Remember that the cached data has supposed to be updated after a `Link` is voted, but this doesn't work any more. That's because `readQuery` now also expects the same variables that was defined before for the `feed` query. It needs to know the variables to make sure it can deliver the right information from the cache.

   Still in `LinkList.js` file, update the `_updateCacheAfterVote` function to look as follows:

   ```js
   // -------------------
   // src/components/LinkList.js
   // -------------------
   _updateCacheAfterVote = (store, createVote, linkId) => {
     const data = store.readQuery({
       query: FEED_QUERY,
       variables: this._getQueryVariables()
     });
     ...
   };
   ```

   Just reusing here the `_getQueryVariables` function from before since it returns exactly what is required here.

2. ### Re-evaluate _create link_ feature

   Update the `<Mutation>` component in `CreateLink.js` to look as follows:

   ```js
   // -------------------
   // src/components/CreateLink.js
   // -------------------
   ...
   // 1
   import { LINKS_PER_PAGE } from '../constants'
   ...

   <Mutation
     mutation={POST_MUTATION}
     variables={{ description, url }}
     // 2
     onCompleted={() => this.props.history.push('/new/1')}
     update={(store, { data: { post } }) => {
       const data = store.readQuery({
         query: FEED_QUERY,
         // 3
         variables: {
           first: LINKS_PER_PAGE,
           skip: 0,
           orderBy: 'createdAt_DESC'
         }
       });

       data.feed.links.unshift(post);

       store.writeQuery({
         query: FEED_QUERY,
         data
       });
     }}
   >
     {postMutation => <button onClick={postMutation}>Submit</button>}
   </Mutation>
   ```

   - `[1]` - Imports the `LINKS_PER_PAGE` constants, since it's used there
   - `[2]` - After the mutation it goes to the first page of the `new` route
   - `[3]` - Passes in the variables required by the `feed` query
