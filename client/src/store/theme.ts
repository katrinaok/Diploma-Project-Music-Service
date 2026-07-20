import { ref } from 'vue';

// Always start false to match SSR and avoid hydration mismatch
export const isDark = ref(false);

export const initTheme = () => {
  if (typeof window !== 'undefined') {
    isDark.value = document.documentElement.classList.contains('dark');
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
