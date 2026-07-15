<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
      
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          {{ isLogin ? 'З поверненням!' : 'Створити акаунт' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          MusicVerse чекає на тебе
        </p>
      </div>

      <div v-if="message" :class="isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'" class="p-3 rounded-lg text-sm text-center font-medium">
        {{ message }}
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-4">
          
          <div v-if="!isLogin">
            <label for="username" class="sr-only">Ім'я користувача</label>
            <input v-model="form.username" id="username" name="username" type="text" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="Ім'я користувача" />
          </div>

          <div>
            <label for="email-address" class="sr-only">Email</label>
            <input v-model="form.email" id="email-address" name="email" type="email" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="Email адреса" />
          </div>

          <div>
            <label for="password" class="sr-only">Пароль</label>
            <input v-model="form.password" id="password" name="password" type="password" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="Пароль" />
          </div>

          <div v-if="!isLogin">
            <label for="password-confirm" class="sr-only">Повторіть пароль</label>
            <input v-model="form.passwordConfirm" id="password-confirm" name="passwordConfirm" type="password" required
              class="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="Підтвердіть пароль" />
          </div>
        </div>

        <div>
          <button type="submit"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
            {{ isLogin ? 'Увійти' : 'Зареєструватися' }}
          </button>
        </div>
      </form>

      <div class="text-center mt-4">
        <button @click="toggleMode" class="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors">
          {{ isLogin ? 'Немає акаунту? Створити' : 'Вже є акаунт? Увійти' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const isLogin = ref(true);
const message = ref('');
const isError = ref(false);

const form = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirm: ''
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
    message.value = 'Паролі не збігаються';
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
      message.value = data.error || 'Щось пішло не так';
      return;
    }
    
    message.value = data.message;
    
    if (isLogin.value && data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = '/profile';
    } else if (!isLogin.value) {
      setTimeout(() => {
        isLogin.value = true;
        form.password = '';
        form.passwordConfirm = '';
        message.value = 'Тепер увійдіть з новим паролем';
      }, 1500);
    }
    
  } catch (err) {
    isError.value = true;
    message.value = 'Помилка з\'єднання з сервером';
  }
};
</script>