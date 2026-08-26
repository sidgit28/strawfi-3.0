import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Plus } from 'lucide-react';

interface Repository {
  id: string;
  title: string;
  content: string;
  current_branch: string;
  head_commit: string;
  last_modified: string;
}

interface Props {
  user: { id: string };
}

const RepositoryManager: React.FC<Props> = ({ user }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch(`/api/git/repositories?userId=${user.id}`);
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const fetchBranches = async (repoId: string) => {
    try {
      const response = await fetch(`/api/git/branches?repoId=${repoId}&userId=${user.id}`);
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const createRepository = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/git/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, userId: user.id })
      });
      const data = await response.json();
      if (data.repository) {
        setRepositories([...repositories, data.repository]);
      }
    } catch (error) {
      console.error('Error creating repository:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Research Repositories</h2>
        <button
          onClick={() => createRepository('New Research', 'Description')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Repository
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
            onClick={() => {
              setSelectedRepo(repo.id);
              fetchBranches(repo.id);
            }}
          >
            <h3 className="text-lg font-semibold mb-2">{repo.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{repo.content}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <GitBranch size={16} />
                {repo.current_branch}
              </span>
              <span className="flex items-center gap-1">
                <GitCommit size={16} />
                {repo.head_commit.substring(0, 7)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepositoryManager;