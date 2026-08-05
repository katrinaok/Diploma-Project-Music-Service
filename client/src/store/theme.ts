import { ref } from 'vue';

// Always start false to match SSR and avoid hydration mismatch
export const isDark = ref(false);

export const initTheme = () => {
  if (typeof window !== 'undefined') {
    const theme = localStorage.getItem('theme');
    if (theme) {
      isDark.value = theme === 'dark';
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }
};

export const toggleTheme = () => {
  isDark.value = !isDark.value;
  const newTheme = isDark.value ? 'dark' : 'light';
  
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', newTheme);
  
  // Sync with backend if logged in
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Sending theme update to backend:', newTheme);
      fetch('http://localhost:5001/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      })
      .then(res => {
        if (!res.ok) {
          console.error('Server returned error when saving theme', res.status);
        }
      })
      .catch(err => console.error('Failed to save theme setting', err));
    }
  }
};
