import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { AUTH_TOKEN } from '../constants';
import { timeDifferenceForDate } from '../utils';

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

class Link extends Component {
  render() {
    const authToken = localStorage.getItem(AUTH_TOKEN);
    const {
      index,
      link: { id, createdAt, description, url, votes, postedBy },
      updateStoreAfterVote
    } = this.props;

    return (
      <div className="flex mt2 items-start">
        <div className="flex items-center">
          <span className="gray">{index + 1}.</span>
          {authToken && (
            <Mutation
              mutation={VOTE_MUTATION}
              variables={{ linkId: id }}
              update={(store, { data: { vote } }) =>
                updateStoreAfterVote(store, vote, id)
              }
            >
              {voteMutation => (
                <div className="ml1 gray f11 pointer" onClick={voteMutation}>
                  ▲
                </div>
              )}
            </Mutation>
          )}
        </div>
        <div className="ml1">
          <div>
            {description} ({url})
          </div>
          <div className="f6 lh-copy gray">
            {votes.length} votes | by {postedBy ? postedBy.name : 'Unknown'}{' '}
            {timeDifferenceForDate(createdAt)}
          </div>
        </div>
      </div>
    );
  }
}

export default Link;
