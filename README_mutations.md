# Mutations: Creating Links

This will implement the creating of `Link` elements, using another API operation - `post` mutation.

Sending mutations with Apollo is not that different from sending queries, it follows the same process mentioned before. But instead of the `<Query>` component, with _mutations_ the `<Mutation>` component has to be used.

## Preparing the `CreateLink` Component

Create the component where users will be able to add new `Link`s. Name the component file as `CreateLink.js` and lives inside the `components` folder. Paste the following code into it:

```js
// -------------------
// src/components/CreateLink.js
// -------------------
import React, { Component } from 'react';

class CreateLink extends Component {
  state = {
    description: '',
    url: ''
  };

  render() {
    const { description, url } = this.state;

    return (
      <div>
        <div className="flex flex-column mt3">
          <input
            className="mb2"
            value={description}
            onChange={e => this.setState({ description: e.target.value })}
            type="text"
            placeholder="A description for the Link"
          />
          <input
            className="mb2"
            value={url}
            onChange={e => this.setState({ url: e.target.value })}
            type="text"
            placeholder="The URL for the link"
          />
        </div>
        <button onClick={}>Submit</button>
      </div>
    );
  }
}

export default CreateLink;
```

The component has two `input` fields where users can provide the `url` and `description` of the `Link` they want to create. The value for these fields is stored in the component's `state` and will be used when mutation is sent.

## Writing the mutation

With the same process from before in mind..

1.  ### Write the GraphQL mutation string, wrap it with the `gql` function:

    On the same file, add the following `POST_MUTATION` definition on top of it:

    ```js
    // -------------------
    // src/components/CreateLink.js
    // -------------------
    const POST_MUTATION = gql`
      mutation PostMutation($description: String!, $url: String!) {
        post(description: $description, url: $url) {
          id
          createdAt
          description
          url
        }
      }
    `;
    ```

2.  ### Use the `<Mutation>` component with the GraphQL mutation attached to its `mutation` prop:

    Still on the same file, replace the `button` with the following:

    ```js
    <Mutation mutation={POST_MUTATION} variables={{ description, url }}>
      {() => <button onClick={}>Submit</button>}
    </Mutation>
    ```

    Since the `post` mutation expects some variables, the `description` and `url` from `CreateLink` component's state are passed as props to `<Mutation>` component.

3.  ### Use the mutate function that Apollo injects into the component's `render prop function`:

    ```js
    <Mutation mutation={POST_MUTATION} variables={{ description, url }}>
      {postMutation => <button onClick={postMutation}>Submit</button>}
    </Mutation>
    ```

    The `postMutation` function is now attached to the `button` so that clicking on it will send the mutation along with the required params to the server.

4.  ### Import `Mutation` and `gql` on top of the same file:

    ```js
    import { Mutation } from 'react-apollo';
    import gql from 'graphql-tag';
    ```

## Testing the mutation

Update `App.js` to import and render `CreateLink` component, it should look as follows:

```js
// -------------------
// src/components/App.js
// -------------------
import React, { Component } from 'react';
import CreateLink from './CreateLink';

class App extends Component {
  render() {
    return <CreateLink />;
  }
}
export default App;
```

Go to the App, enter a data into `description` and `url` fields then click on the **submit** button. To check that the mutation worked, run the following query through the Playground and you should get a response containing the data that you've entered.

```js
{
  feed {
    links {
      description
      url
    }
  }
}
```
