import deact from './deact'

const stories = [
  { name: 'Didact introduction', url: 'http://bit.ly/2pX7HNn' },
  { name: 'Rendering DOM elements ', url: 'http://bit.ly/2qCOejH' },
  { name: 'Element creation and JSX', url: 'http://bit.ly/2qGbw8S' },
  { name: 'Instances and reconciliation', url: 'http://bit.ly/2q4A746' },
  { name: 'Components and state', url: 'http://bit.ly/2rE16nh' }
]

class App extends deact.Component {
  state = {
    todos: [],
    value: ''
  }

  removeTODO = (name) => {
    this.setState({
      todos: this.state.todos.filter(({ name: todoName }) => todoName !== name)
    })
  }

  componentWillMount = () => {
    console.log('will mount')
  }

  componentDidMount = () => {
    console.log('did unmount')
  }

  render () {
    const { todos, value } = this.state
    return (
      <div>
        <input
          type='text'
          value={value}
          onInput={event => {
            event.preventDefault()
            this.setState({
              value: event.target.value
            })
          }}
        />
        <button
          onClick={() => {
            if (value) {
              this.setState({
                todos: this.state.todos.concat({ name: value }),
                value: ''
              })
            }
          }}
        >
          add
        </button>
        <ul>
          {
            todos.map(({ name }) => <li onClick={() => this.removeTODO(name)}>{name}<button>-</button></li>)
          }
        </ul>
      </div>
    )
  }
}

deact.render(<App stories={stories} />, document.getElementById('app'))
