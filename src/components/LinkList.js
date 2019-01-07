import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import React, { Component, Fragment } from 'react';
import Link from './Link';
import { LINKS_PER_PAGE } from '../constants';

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

class LinkList extends Component {
  render() {
    const {
      location: { pathname },
      match: { params }
    } = this.props;

    const isNewPage = pathname.includes('new');
    const pageIndex = params.page ? (params.page - 1) * LINKS_PER_PAGE : 0;

    return (
      <Query query={FEED_QUERY} variables={this._getQueryVariables()}>
        {({ loading, error, data, subscribeToMore }) => {
          if (loading) return <div>Fetching</div>;
          if (error) return <div>Error</div>;

          this._subscribeToNewLinks(subscribeToMore);
          this._subscribeToNewVotes(subscribeToMore);

          const linksToRender = this._getLinksToRender(data);

          return (
            <Fragment>
              {linksToRender.map((link, index) => (
                <Link
                  key={link.id}
                  link={link}
                  index={index + pageIndex}
                  updateStoreAfterVote={this._updateCacheAfterVote}
                />
              ))}
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

  _updateCacheAfterVote = (store, createVote, linkId) => {
    const data = store.readQuery({
      query: FEED_QUERY,
      variables: this._getQueryVariables()
    });

    const votedLink = data.feed.links.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    store.writeQuery({ query: FEED_QUERY, data });
  };

  _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        if (!subscriptionData.data) return prevData;

        const { newLink } = subscriptionData.data;
        const { links, __typename } = prevData.feed;

        return Object.assign({}, prevData, {
          feed: {
            links: [...links, newLink],
            count: links.length + 1,
            __typename
          }
        });
      }
    });
  };

  _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION
    });
  };

  _getQueryVariables = () => {
    const {
      location: { pathname },
      match: { params }
    } = this.props;
    const isNewPage = pathname.includes('new');
    const page = parseInt(params.page, 10);

    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;

    return { first, skip, orderBy };
  };

  _getLinksToRender = data => {
    const isNewpage = this.props.location.pathname.includes('new');
    if (isNewpage) {
      return data.feed.links;
    }

    const rankedList = data.feed.links.slice();
    rankedList.sort((l1, l2) => l2.votes.length - l1.votes.length);
    return rankedList.slice(0, 10);
  };

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
}

export default LinkList;
