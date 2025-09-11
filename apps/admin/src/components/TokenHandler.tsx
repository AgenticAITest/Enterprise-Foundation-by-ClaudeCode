import { useEffect } from 'react';

const TokenHandler: React.FC = () => {
  useEffect(() => {
    console.log('TokenHandler: Checking for token in URL');
    // Check if there's a token in the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('TokenHandler: Found token:', token ? 'Yes' : 'No');
    
    if (token) {
      console.log('TokenHandler: Storing token in localStorage');
      // Store the token in localStorage
      localStorage.setItem('auth_token', token);
      
      // Remove the token from the URL for security
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.toString());
      
      // Trigger a page reload to reinitialize auth
      console.log('TokenHandler: Reloading page to reinitialize auth');
      window.location.reload();
    } else {
      // Check if we already have a token stored
      const existingToken = localStorage.getItem('auth_token');
      console.log('TokenHandler: Existing token in localStorage:', existingToken ? 'Yes' : 'No');
    }
  }, []);

  return null; // This component doesn't render anything
};

export default TokenHandler;