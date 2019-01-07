# Routing

Using `react-router` library with Apollo to implement navigation functionality.

## Install dependencies

```shell
$ yarn add react-router react-router-dom
```

## Create the `Header` Component

This component will be responsible for rendering the pages' link of the App. Name the file as `Header.js` lives inside `component` folder and has the following code:

```js
// -------------------
// src/components/Header.js
// -------------------
import React from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';

const Header = () => (
  <div className="flex pa1 justify-between nowrap orange">
    <div className="flex flex-fixed black">
      <div className="fw7 mr1">Hacker News</div>
      <Link to="/" className="ml1 no-underline black">
        new
      </Link>
      <div className="ml1">|</div>
      <Link to="/create" className="ml1 no-underline black">
        submit
      </Link>
    </div>
  </div>
);

export default withRouter(Header);
```

It renders two `Link` components that can be used to navigate between the `LinkList` and `CreateLink` components - will put it together in a bit!

> [Link](https://reacttraining.com/react-router/web/api/Link) from `react-router-dom` renders an anchor element. When clicking a `Link`, the URL gets updated and so as the rendered content, without reloading the page.
>
> [withRouter](https://reacttraining.com/react-router/web/api/withRouter) function from `react-router` can be used to connect components to the router, components that are not rendered by React Router but need to get access to the [history](https://reacttraining.com/web/api/history) object's properties

## Setup routes

1. ### Configure the routes of the app in the root component - `App`

   Update the `render` function in `App.js` to include `Header`, as well as `LinkList` and `CreateLink` components under different routes:

   ```js
   // -------------------
   // src/components/App.js
   // -------------------
   render() {
     return (
       <div className="center w85">
         <Header />
         <div className="ph3 pv1 background-gray">
           <Switch>
             <Route exact path="/" component={LinkList} />
             <Route exact path="/create" component={CreateLink} />
           </Switch>
         </div>
       </div>
     )
   }
   ```

   Add the following import statements to the top of the file:

   ```js
   import { Switch, Route } from 'react-router-dom';
   import Header from './Header';
   import LinkList from './LinkList';
   import CreateLink from './CreateLink';
   ```

   > [Switch](https://reacttraining.com/react-router/web/api/Switch) from `react-router-dom` can be used to make sure only one `<Route>` is rendered at a time
   >
   > [Route](https://reacttraining.com/react-router/web/api/Route) defines the available routes of the App. It renders a component when the URL matches the route's path

2. ### Wrap the `App` with `BrowserRouter`

   Update the `ReactDOM.render` in `index.js` to look as follows:

   ```js
   // -------------------
   // src/index.js
   // -------------------
   ReactDOM.render(
     <BrowserRouter>
       <ApolloProvider client={client}>
         <App />
       </ApolloProvider>
     </BrowserRouter>,
     document.getElementById('root')
   );
   ```

   Import `BrowserRouter` to the top of the file:

   ```js
   import { BrowserRouter } from 'react-router-dom';
   ```

   > [BrowserRouter](https://reacttraining.com/react-router/web/api/BrowserRouter) from `react-router-dom` is a `<Router>` that uses the HTML5 history API to keep the UI in sync with the URL

## Implement navigation

Add an automatic redirect from `CreateLink` to `LinkList` after a `post` mutation was performed. Update `<Mutation>` component in `CreateLink.js` to look as follows:

```js
// -------------------
// src/components/CreateLink.js
// -------------------
<Mutation
  mutation={POST_MUTATION}
  variables={{ description, url }}
  onCompleted={() => this.props.history.push('/')}
>...
```

> `onCompleted` is another available prop of `<Mutation>` component, where you can provide a callback which will be called once the mutation is successfully completed
