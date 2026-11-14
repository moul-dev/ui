// Wiring for the page transition demo on /docs/components/pagetransition/:
// each button changes the place shown, inside the element's start().
const places = [
  ['Kampot', 'Pepper farms and a slow river under Bokor.'],
  ['Kep', 'Crab market at dawn and a beach lined with old villas.'],
  ['Siem Reap', 'Temples in the morning, the Old Market at night.'],
  ['Mondulkiri', 'Pine hills, waterfalls and cold mornings.'],
]
let index = 0

function show(step) {
  index = (index + step + places.length) % places.length
  const box = document.getElementById('page-transition-place')
  if (!box) return
  const [name, line] = places[index]
  box.querySelector('strong').textContent = name
  box.querySelector('span').textContent = line
}

document.addEventListener('press', (event) => {
  const button = event.target?.closest?.('[data-page-effect]')
  const transition = document.getElementById('page-transition-demo')
  if (!button || typeof transition?.start !== 'function') return
  const effect = button.dataset.pageEffect
  if (effect === 'back') {
    transition.start(() => show(-1), { direction: 'backward' })
    return
  }
  transition.effect = effect
  transition.start(() => show(1))
})
