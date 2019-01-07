# Authentication

This will implement authentication functionlity with Apollo, using the API operations - `signup` and `login` mutation

## Prepare the `Login` Component

1. ### Create the `Login` component

   Create a new file called `Login.js` inside `components` folder. Paste the following code into it:

   ```js
   // -------------------
   // src/components/Login.js
   // -------------------
   import React, { Component } from 'react';
   import { AUTH_TOKEN } from '../constants';

   class Login extends Component {
     state = {
       login: true, // switch between Login and SignUp
       email: '',
       password: '',
       name: ''
     };

     render() {
       const { login, email, password, name } = this.state;

       return (
         <div>
           <h4 className="mv3">{login ? 'Login' : 'Sign Up'}</h4>
           <div className="flex flex-column">
             {!login && (
               <input
                 value={name}
                 onChange={e => this.setState({ name: e.target.value })}
                 type="text"
                 placeholder="Your name"
               />
             )}
             <input
               value={email}
               onChange={e => this.setState({ email: e.target.value })}
               type="text"
               placeholder="Your email address"
             />
             <input
               value={password}
               onChange={e => this.setState({ password: e.target.value })}
               type="password"
               placeholder="Choose a safe password"
             />
           </div>
           <div className="flex mt3">
             <div
               className="pointer mr2 button"
               onClick={}
             >
               {login ? 'login' : 'create account'}
             </div>
             <div
               className="pointer button"
               onClick={() => this.setState({ login: !login })}
             >
               {login
                 ? 'need to create an account?'
                 : 'already have an account?'}
             </div>
           </div>
         </div>
       );
     }

     _saveUserData = token => {
       localStorage.setItem(AUTH_TOKEN, token);
     };
   }

   export default Login;
   ```

   The component has two major states:

   - `state.login: true` - For users that already have an account, the component will render `email` and `password` fields
   - `state.login: false` - For users that haven't created an account yet, the component will render a third field which is `name`

2. ### Add the `constants.js` file

   Create the file inside `src` folder and add the following definition for the `AUTH_TOKEN` constant:

   ```js
   // -------------------
   // src/constants.js
   // -------------------
   export const AUTH_TOKEN = 'auth-token';
   ```

3. ### Add the route for `Login` component

   Update `App.js` to include the new route:

   ```js
   // -------------------
   // src/components/App.js
   // -------------------
   // 1
   import Login from './Login';
   ...

   render() {
     return (
       ...
       <Switch>
         ..
         // 2
         <Route exact path="/login" component={Login} />
       </Switch>
       ...
     );
   }
   ```

- `[1]` - Imports the component to the top of the file
- `[2]` - Adds the `login` route, which will render the `Login` component when the URL matches the route's path

4. ### Attach the `Login` link to the `Header`

   Update `Header.js` file to look as follows:

   ```js
   // -------------------
   // src/components/Header.js
   // -------------------
   ...
   // 1
   import { AUTH_TOKEN } from '../constants';

   const Header = props => {
     // 2
     const authToken = localStorage.getItem(AUTH_TOKEN);
     return (
       <div className="flex pa1 justify-between nowrap orange">
         <div className="flex flex-fixed black">
           <div className="fw7 mr1">Hacker News</div>
           <Link to="/" className="ml1 no-underline black">
             new
           </Link>
           // 3
           {authToken && (
             <div className="flex">
               <div className="ml1">|</div>
               <Link to="/create" className="ml1 no-underline black">
                 submit
               </Link>
             </div>
           )}
         </div>
         // 4
         <div className="flex flex-fixed">
           {authToken ? (
             <div
               className="ml1 pointer black"
               onClick={() => {
                 localStorage.removeItem(AUTH_TOKEN);
                 props.history.push(`/`);
               }}
             >
               logout
             </div>
           ) : (
             <Link to="/login" className="ml1 no-underline black">
               login
             </Link>
           )}
         </div>
       </div>
     );
   };
   ```

   - `[1]` - Imports `AUTH_TOKEN`
   - `[2]` - Retrieves `authToken` from local storage
   - `[3]` - Renders _submit_ link if user is logged in
   - `[4]` - New links for _Login_ and _Logout_

## Using the authentication mutations

The implementation is pretty much the same way as `CreateLink`'s mutation from before.

1. ### Write the GraphQL mutations using `gql` function

   Add the following definitions on top of `Login.js`:

   ```js
   // -------------------
   // src/components/Login.js
   // -------------------
   const SIGNUP_MUTATION = gql`
     mutation SignupMutation(
       $email: String!
       $password: String!
       $name: String!
     ) {
       signup(email: $email, password: $password, name: $name) {
         token
       }
     }
   `;

   const LOGIN_MUTATION = gql`
     mutation LoginMutation($email: String!, $password: String!) {
       login(email: $email, password: $password) {
         token
       }
     }
   `;
   ```

   Both mutations expect number of arguments and return the `token` that can be attached to subsequent requests to authenticate the user.

2. ### Use the `<Mutation>` component

   On the same file, replace the first button to look as follows:

   ```js
   // -------------------
   // src/components/Login.js
   // -------------------
   <Mutation
     mutation={login ? LOGIN_MUTATION : SIGNUP_MUTATION}
     variables={{ email, password, name }}
   >
     {() => (
       <div className="pointer mr2 button" onClick={}>
         {login ? 'login' : 'create account'}
       </div>
     )}
   </Mutation>
   ```

   The `<Mutation>` component will either use `login` or `signup` mutation depending on the `Login` component's `login` state. Regardless, both are expecting the same set of variables hence the corresponding values stored in the state are passed as props to `<Mutation>` component.

3. ### Attach the injected mutate function to the button

   ```js
   {mutate => (
     <div className="pointer mr2 button" onClick={mutate}>...
   )}
   ```

4. ### Finish up the implementation

   Few more things are required to complete the _Login_ and _SignUp_. But before that, import `Mutation` and `gql` on top of `Login.js`:

   ```js
   // -------------------
   // src/components/Login.js
   // -------------------
   import { Mutation } from 'react-apollo';
   import gql from 'graphql-tag';
   ```

   Add the following `onCompleted` callback to the `<Mutation>` component:

   ```js
   <Mutation
     mutation={login ? LOGIN_MUTATION : SIGNUP_MUTATION}
     variables={{ email, password, name }}
     onCompleted={data => this._confirm(data)}
   >...
   ```

   Define the `_confirm` function within the `Login` scope which has the following code:

   ```js
   _confirm = async data => {
     const { token } = this.state.login ? data.login : data.signup;
     this._saveUserData(token);
     this.props.history.push('/');
   };
   ```

   After the mutation's completed, the returned `token` is stored in `localStorage` and navigate back to the root route.

Verify the _Login_ and _SignUp_ worked by sending a `users` query through the Database Playground.

## Configuring Apollo with the authentication token

Need to attached the `token` obtained from the server to all requests that are sent to the API. Since these requests are created and sent by `ApolloClient` instance of the app, need to make sure it knows about this token. Apollo provides a way for authenticating all requests by using the concept of middleware via [Apollo Link](https://github.com/apollographql/apollo-link)

1. ### Install the dependency to the App

   ```shell
   $ yarn add apollo-link-context
   ```

2. ### Implement the authentication link middleware

   Update `index.js` to look as follows:

   ```js
   // -------------------
   // src/index.js
   // -------------------
   // 1
   import { setContext } from 'apollo-link-context';
   import { AUTH_TOKEN } from './constants';

   const httpLink = createHttpLink({
     uri: 'http://localhost:4000/'
   });

   // 2
   const authLink = setContext((_, { headers }) => {
     const token = localStorage.getItem(AUTH_TOKEN);
     return {
       header: {
         ...headers,
         authorization: token ? `Bearer ${token}` : ''
       }
     };
   });

   const client = new ApolloClient({
     // 3
     link: authLink.concat(httpLink),
     cache: new InMemoryCache()
   });
   ...
   ```

   - `[1]` - Imports corresponding dependencies
   - `[2]` - Uses `setContext` from `apollo-link-context` to set the client headers, so that `httpLink` can read them
   - `[3]` - Instantiates `ApolloClient` with the `authLink` middleware

## Requiring authentication on the server-side

Open `/server/src/resolvers/Mutation.js` and adjust the `post` resolver to look as follows:

```js
function post(parent, args, context) {
  const userId = getUserId(context);
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } }
  });
}
```

Check [here](https://github.com/nelsieborja/graphql-server/blob/master/README_authentication.md#add-the-following-resolver-implementation-for-post-in-mutationjs-file) to understand what's going on in this function. With all the authentication and `token` in place, protected operations can now only be accessed through authenticated requests.
