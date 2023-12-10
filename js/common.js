const { ref, createApp, onMounted } = Vue

const common = {
  setup () {
    const rwdMenuVisible = ref(false)
    const advancedSearchVisible = ref(false)

    return {
      rwdMenuVisible,
      advancedSearchVisible
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(common)
  app.mount('._congress')
})