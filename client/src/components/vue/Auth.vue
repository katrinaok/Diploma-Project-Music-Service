<template>
  <div class="w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-[#170a24] p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-[#32184d] transition-colors">
      
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {{ isLogin ? $t('auth.login_title') : $t('auth.register_title') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.subtitle') }}
        </p>
      </div>

      <div v-if="message" :class="isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'" class="p-3 rounded-lg text-sm text-center font-medium">
        {{ message }}
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-4">
          
          <div v-if="!isLogin">
            <label for="username" class="sr-only">{{ $t('auth.username') }}</label>
            <input v-model="form.username" id="username" name="username" type="text" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-[#432166] bg-white dark:bg-[#231036] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              :placeholder="$t('auth.username')" />
          </div>

          <div v-if="!isLogin">
            <label for="email-address" class="sr-only">{{ $t('auth.email') }}</label>
            <input v-model="form.email" id="email-address" name="email" type="email" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-[#432166] bg-white dark:bg-[#231036] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              :placeholder="$t('auth.email')" />
          </div>

          <div v-else>
            <label for="login-identifier" class="sr-only">{{ $t('auth.login_identifier') }}</label>
            <input v-model="form.login" id="login-identifier" name="login" type="text" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-[#432166] bg-white dark:bg-[#231036] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              :placeholder="$t('auth.login_identifier')" />
          </div>

          <div>
            <label for="password" class="sr-only">{{ $t('auth.password') }}</label>
            <input v-model="form.password" id="password" name="password" type="password" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-[#432166] bg-white dark:bg-[#231036] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              :placeholder="$t('auth.password')" />
          </div>

          <div v-if="!isLogin">
            <label for="password-confirm" class="sr-only">{{ $t('auth.password_confirm') }}</label>
            <input v-model="form.passwordConfirm" id="password-confirm" name="passwordConfirm" type="password" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-[#432166] bg-white dark:bg-[#231036] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              :placeholder="$t('auth.password_confirm')" />
          </div>

          <div v-if="isLogin" class="flex items-center px-1 pt-1">
            <input 
              v-model="rememberMe" 
              id="remember-me" 
              type="checkbox" 
              class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors cursor-pointer"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              {{ $t('auth.remember_me') }}
            </label>
          </div>
        </div>

        <div>
          <button type="submit"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
            {{ isLogin ? $t('auth.btn_login') : $t('auth.btn_register') }}
          </button>
        </div>
      </form>

      <div class="text-center mt-4">
        <button @click="toggleMode" class="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors">
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
