<template>
  <div class="w-full flex items-center justify-center py-2 sm:py-6 px-3 sm:px-4 text-text-primary">
    <div class="max-w-md w-full space-y-6 sm:space-y-8 bg-surface p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-border-subtle transition-colors">
      
      <div class="text-center">
        <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          {{ isLogin ? $t('auth.login_title') : $t('auth.register_title') }}
        </h2>
        <p class="mt-1.5 text-xs sm:text-sm text-text-secondary">
          {{ $t('auth.subtitle') }}
        </p>
      </div>

      <div v-if="message" 
        :class="isError ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'" 
        class="flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-center font-medium transition-all">
        <svg v-if="isError" class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg v-else class="w-4 h-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ message }}</span>
      </div>

      <form class="mt-6 sm:mt-8 space-y-5 sm:space-y-6" novalidate @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-3.5 sm:gap-4">
          
          <div v-if="!isLogin">
            <label for="username" class="sr-only">{{ $t('auth.username') }}</label>
            <input v-model="form.username" id="username" name="username" type="text"
              @input="clearFieldError('username')"
              :class="fieldErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong focus:border-purple-500 focus:ring-purple-500/20'"
              class="appearance-none relative block w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 text-sm transition-all shadow-xs"
              :placeholder="$t('auth.username')" />
          </div>

          <div v-if="!isLogin">
            <label for="email-address" class="sr-only">{{ $t('auth.email') }}</label>
            <input v-model="form.email" id="email-address" name="email" type="email"
              @input="clearFieldError('email')"
              :class="fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong focus:border-purple-500 focus:ring-purple-500/20'"
              class="appearance-none relative block w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 text-sm transition-all shadow-xs"
              :placeholder="$t('auth.email')" />
          </div>

          <div v-else>
            <label for="login-identifier" class="sr-only">{{ $t('auth.login_identifier') }}</label>
            <input v-model="form.login" id="login-identifier" name="login" type="text"
              @input="clearFieldError('login')"
              :class="fieldErrors.login ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong focus:border-purple-500 focus:ring-purple-500/20'"
              class="appearance-none relative block w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 text-sm transition-all shadow-xs"
              :placeholder="$t('auth.login_identifier')" />
          </div>

          <div>
            <label for="password" class="sr-only">{{ $t('auth.password') }}</label>
            <input v-model="form.password" id="password" name="password" type="password"
              @input="clearFieldError('password')"
              :class="fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong focus:border-purple-500 focus:ring-purple-500/20'"
              class="appearance-none relative block w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 text-sm transition-all shadow-xs"
              :placeholder="$t('auth.password')" />
          </div>

          <div v-if="!isLogin">
            <label for="password-confirm" class="sr-only">{{ $t('auth.password_confirm') }}</label>
            <input v-model="form.passwordConfirm" id="password-confirm" name="passwordConfirm" type="password"
              @input="clearFieldError('passwordConfirm')"
              :class="fieldErrors.passwordConfirm ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong focus:border-purple-500 focus:ring-purple-500/20'"
              class="appearance-none relative block w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border bg-surface text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 text-sm transition-all shadow-xs"
              :placeholder="$t('auth.password_confirm')" />
          </div>

          <div v-if="isLogin" class="flex items-center px-1 pt-0.5">
            <input 
              v-model="rememberMe" 
              id="remember-me" 
              type="checkbox" 
              class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors cursor-pointer"
            />
            <label for="remember-me" class="ml-2 block text-xs sm:text-sm text-text-tertiary cursor-pointer select-none hover:text-text-primary transition-colors">
              {{ $t('auth.remember_me') }}
            </label>
          </div>
        </div>

        <div>
          <button type="submit"
            class="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md shadow-purple-600/25 active:scale-[0.99] transition-all cursor-pointer">
            {{ isLogin ? $t('auth.btn_login') : $t('auth.btn_register') }}
          </button>
        </div>
      </form>

      <div class="text-center mt-3 sm:mt-4">
        <button @click="toggleMode" class="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors cursor-pointer">
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

const fieldErrors = reactive({
  username: false,
  email: false,
  login: false,
  password: false,
  passwordConfirm: false
});

const clearFieldError = (field) => {
  fieldErrors[field] = false;
  if (message.value && isError.value) {
    message.value = '';
    isError.value = false;
  }
};

const resetErrors = () => {
  fieldErrors.username = false;
  fieldErrors.email = false;
  fieldErrors.login = false;
  fieldErrors.password = false;
  fieldErrors.passwordConfirm = false;
  message.value = '';
  isError.value = false;
};

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
  resetErrors();
  form.username = '';
  form.password = '';
  form.passwordConfirm = '';
};

const handleSubmit = async () => {
  resetErrors();

  if (isLogin.value) {
    const hasLogin = !!form.login.trim();
    const hasPass = !!form.password;

    if (!hasLogin && !hasPass) {
      fieldErrors.login = true;
      fieldErrors.password = true;
      isError.value = true;
      message.value = t('auth.err_fill_fields');
      return;
    }
    if (!hasLogin) {
      fieldErrors.login = true;
      isError.value = true;
      message.value = t('auth.err_fill_login');
      return;
    }
    if (!hasPass) {
      fieldErrors.password = true;
      isError.value = true;
      message.value = t('auth.err_fill_password');
      return;
    }
  } else {
    const hasUsername = !!form.username.trim();
    const hasEmail = !!form.email.trim();
    const hasPass = !!form.password;
    const hasConfirm = !!form.passwordConfirm;

    if (!hasUsername && !hasEmail && !hasPass && !hasConfirm) {
      fieldErrors.username = true;
      fieldErrors.email = true;
      fieldErrors.password = true;
      fieldErrors.passwordConfirm = true;
      isError.value = true;
      message.value = t('auth.err_fill_fields');
      return;
    }

    if (!hasUsername) {
      fieldErrors.username = true;
      isError.value = true;
      message.value = t('auth.err_fill_username');
      return;
    }

    if (!hasEmail) {
      fieldErrors.email = true;
      isError.value = true;
      message.value = t('auth.err_fill_email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      fieldErrors.email = true;
      isError.value = true;
      message.value = t('auth.err_invalid_email');
      return;
    }

    if (!hasPass) {
      fieldErrors.password = true;
      isError.value = true;
      message.value = t('auth.err_fill_password');
      return;
    }

    if (!hasConfirm) {
      fieldErrors.passwordConfirm = true;
      isError.value = true;
      message.value = t('auth.err_fill_password_confirm');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      fieldErrors.password = true;
      fieldErrors.passwordConfirm = true;
      isError.value = true;
      message.value = t('auth.err_password_mismatch');
      return;
    }
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
