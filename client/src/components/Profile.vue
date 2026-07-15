<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Шапка профілю -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Привіт, Користувачу! 👋</h1>
          <p class="text-gray-500 text-sm mt-1">Твій музичний всесвіт MusicVerse</p>
        </div>
        <button @click="logout" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
          Вийти
        </button>
      </div>

      <!-- Секція контенту (Плейлисти) -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-bold text-gray-900 mb-4 text-purple-600">Мої плейлисти</h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Заглушка для пустого стану -->
          <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
            <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl mb-2">+</div>
            <p class="text-sm font-medium text-gray-700">Створити плейлист</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
  }
});

const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};
</script>