<template>
  <div class="w-full flex items-center justify-center py-4 sm:py-6 px-4 text-text-primary">
    <div class="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl shadow-xl border border-border-subtle transition-colors">
      
      <div class="text-center">
        <h2 class="mt-4 text-3xl font-extrabold text-text-primary">
          {{ isLogin ? $t('auth.login_title') : $t('auth.register_title') }}
        </h2>
        <p class="mt-2 text-sm text-text-secondary">
          {{ $t('auth.subtitle') }}
        </p>
      </div>

      <div v-if="message" :class="isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'" class="p-3.5 rounded-xl text-sm text-center font-semibold">
        {{ message }}
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-4">
          
          <div v-if="!isLogin">
            <label for="username" class="sr-only">{{ $t('auth.username') }}</label>
            <input v-model="form.username" id="username" name="username" type="text" required
              class="appearance-none relative block w-full px-4 py-3 border border-border-strong bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all shadow-xs"
              :placeholder="$t('auth.username')" />
          </div>

          <div v-if="!isLogin">
            <label for="email-address" class="sr-only">{{ $t('auth.email') }}</label>
            <input v-model="form.email" id="email-address" name="email" type="email" required
              class="appearance-none relative block w-full px-4 py-3 border border-border-strong bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all shadow-xs"
              :placeholder="$t('auth.email')" />
          </div>

          <div v-else>
            <label for="login-identifier" class="sr-only">{{ $t('auth.login_identifier') }}</label>
            <input v-model="form.login" id="login-identifier" name="login" type="text" required
              class="appearance-none relative block w-full px-4 py-3 border border-border-strong bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all shadow-xs"
              :placeholder="$t('auth.login_identifier')" />
          </div>

          <div>
            <label for="password" class="sr-only">{{ $t('auth.password') }}</label>
            <input v-model="form.password" id="password" name="password" type="password" required
              class="appearance-none relative block w-full px-4 py-3 border border-border-strong bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all shadow-xs"
              :placeholder="$t('auth.password')" />
          </div>

          <div v-if="!isLogin">
            <label for="password-confirm" class="sr-only">{{ $t('auth.password_confirm') }}</label>
            <input v-model="form.passwordConfirm" id="password-confirm" name="passwordConfirm" type="password" required
              class="appearance-none relative block w-full px-4 py-3 border border-border-strong bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all shadow-xs"
              :placeholder="$t('auth.password_confirm')" />
          </div>

          <div v-if="isLogin" class="flex items-center px-1 pt-1">
            <input 
              v-model="rememberMe" 
              id="remember-me" 
              type="checkbox" 
              class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors cursor-pointer"
            />
            <label for="remember-me" class="ml-2 block text-sm text-text-tertiary cursor-pointer select-none hover:text-text-primary transition-colors">
              {{ $t('auth.remember_me') }}
            </label>
          </div>
        </div>

        <div>
          <button type="submit"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md shadow-purple-600/25 active:scale-[0.99] transition-all cursor-pointer">
            {{ isLogin ? $t('auth.btn_login') : $t('auth.btn_register') }}
          </button>
        </div>
      </form>

      <div class="text-center mt-4">
        <button @click="toggleMode" class="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors cursor-pointer">
          {{ isLogin ? $t('auth.toggle_to_register') : $t('auth.toggle_to_login') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const isLogin = ref(true);
const message = ref('');
const isError = ref(false);
const rememberMe = ref(false);

const form = reactive({
  username: '',
  email: '',
  login: '',
  password: '',
  passwordConfirm: ''
});

onMounted(() => {
  // If user already has an active token, immediately redirect to /home
  const token = localStorage.getItem('token');
  if (token) {
    window.location.replace(`/${locale.value}/home`);
    return;
  }

  const savedLogin = localStorage.getItem('savedLogin');
  if (savedLogin) {
    form.login = savedLogin;
    rememberMe.value = true;
  }
});

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  message.value = '';
  form.username = '';
  form.password = '';
  form.passwordConfirm = '';
};

const handleSubmit = async () => {
  message.value = '';
  isError.value = false;

  if (!isLogin.value && form.password !== form.passwordConfirm) {
    isError.value = true;
    message.value = t('auth.err_password_mismatch');
    return;
  }

  const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register';

  try {
    const response = await fetch(`http://localhost:5001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await response.json();

    if (!response.ok) {
      isError.value = true;
      message.value = data.error || t('auth.err_something_wrong');
      return;
    }

    // ЛОГІН
    if (isLogin.value && data.token) {
      const storage = rememberMe.value ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      if (rememberMe.value) {
        localStorage.setItem('savedLogin', form.login);
      } else {
        localStorage.removeItem('savedLogin');
      }

      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.username) document.cookie = `username=${encodeURIComponent(payload.username)}; path=/; max-age=31536000`;
      } catch (e) {}
      window.location.href = `/${locale.value}/home`;
    } 
    // РЕЄСТРАЦІЯ (Автологін)
    else if (!isLogin.value) {
      message.value = t('auth.success_register');
      
      const loginResponse = await fetch(`http://localhost:5001/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        localStorage.setItem('token', loginData.token);
        if (loginData.refreshToken) {
          localStorage.setItem('refreshToken', loginData.refreshToken);
        }
        try {
          const payload = JSON.parse(atob(loginData.token.split('.')[1]));
          if (payload.username) document.cookie = `username=${encodeURIComponent(payload.username)}; path=/; max-age=31536000`;
        } catch (e) {}
        window.location.href = `/${locale.value}/home`;
      } else {
        isLogin.value = true;
        form.password = '';
        form.passwordConfirm = '';
        message.value = t('auth.msg_login_manual');
      }
    }

  } catch (err) {
    isError.value = true;
    message.value = t('auth.err_server');
  }
};
</script>
