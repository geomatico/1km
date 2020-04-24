class HelpControl {
  constructor (options) {
    this.show = false
  }

  onAdd (map) {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

    let controlBtn = document.createElement('button')
    controlBtn.className = 'mapboxgl-ctrl-icon'
    controlBtn.innerHTML = '<b>?</b>'
    controlBtn.onclick = () => {
        document.getElementById('welcome').style.display = 'block'
    }
    this.container.appendChild(controlBtn)

    return this.container
  }

  onRemove () {
    this.container.removeChild(this.container)
    this.map = undefined
  }
}

export default HelpControl
