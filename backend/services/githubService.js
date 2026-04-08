const axios = require('axios');

class GithubService {
  /**
   * Fetch user repositories using pagination to ensure all are fetched.
   */
  async fetchUserRepos(accessToken) {
    let repos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100,
          page,
          sort: 'updated'
        }
      });

      if (response.data.length === 0) {
        hasMore = false;
      } else {
        repos = repos.concat(response.data);
        page++;
      }
    }

    // Filter relevant fields to save memory
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      language: repo.language,
      private: repo.private
    }));
  }

  // Future methods: fetchCommits, fetchTree will be used by the background worker
}

module.exports = new GithubService();
