const GithubLoginButton = ({ onSuccess }) => {
    const handleGithubLogin = () => {
      window.location.href = 'http://localhost:5000/api/auth/github';
    };
  
    return (
      <button 
        onClick={handleGithubLogin}
        className="github-login-btn"
      >
        Login with GitHub
      </button>
    );
  };
  
  export default GithubLoginButton;