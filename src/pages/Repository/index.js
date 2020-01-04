import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import PropTypes from 'prop-types';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter, PageActions } from './styles';

export default class Repository extends Component {
  state = {
    repository: {},
    issues: [],
    loading: true,
    loadingIssues: false,
    filters: [
      { state: 'all', label: 'Todas', active: false },
      { state: 'open', label: 'Abertas', active: true },
      { state: 'closed', label: 'Fechadas', active: false }
    ],
    filterIndex: 1,
    page: 1
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters, filterIndex } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters[filterIndex].state,
          per_page: 5
        }
      })
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, filterIndex, page } = this.state;

    this.setState({ loadingIssues: true });

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[filterIndex].state,
        per_page: 5,
        page
      }
    });

    this.setState({ issues: response.data, loadingIssues: false });
  };

  handleFilterClick = async filterIndex => {
    await this.setState({ filterIndex, page: 1 });
    this.loadIssues();
  };

  handlePage = async action => {
    const { page } = this.state;

    await this.setState({
      page: action === 'back' ? page - 1 : page + 1
    });

    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      loadingIssues,
      filters,
      filterIndex,
      page
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos Repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        {!loadingIssues ? (
          <>
            <IssueList>
              <IssueFilter active={filterIndex}>
                {filters.map((filter, index) => (
                  <button
                    type="button"
                    key={filter.label}
                    onClick={() => this.handleFilterClick(index)}
                  >
                    {filter.label}
                  </button>
                ))}
              </IssueFilter>

              {issues.map(issue => (
                <li key={String(issue.id)}>
                  <img src={issue.user.avatar_url} alt={issue.user.login} />
                  <div>
                    <strong>
                      <a href={issue.html_url}>{issue.title}</a>
                      {issue.labels.map(label => (
                        <span key={String(label.id)}>{label.name}</span>
                      ))}
                    </strong>
                    <p>{issue.user.login}</p>
                  </div>
                </li>
              ))}
            </IssueList>

            {issues.length > 0 && (
              <PageActions>
                <button
                  type="button"
                  disabled={page < 2}
                  onClick={() => this.handlePage('back')}
                >
                  Anterior
                </button>

                <span>Página {page}</span>

                <button type="button" onClick={() => this.handlePage('next')}>
                  Próximo
                </button>
              </PageActions>
            )}
          </>
        ) : (
          <IssueList>
            <div className="load-issues">
              <FaSpinner color="#333" size={50} />
            </div>
          </IssueList>
        )}
      </Container>
    );
  }
}

Repository.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string
    })
  }).isRequired
};
