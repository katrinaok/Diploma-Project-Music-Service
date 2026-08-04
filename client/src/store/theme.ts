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
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};
