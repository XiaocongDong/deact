# deact
A retarded react just for fun.

**Notes:** Don't use it for production unless you want to be fired.

## Usage
```js
import deact from 'deact'

class Timer extends deact.Component {
  state = {
    time: 0
  }

  timerId = null

  componentDidMount = () => {
    this.timerId = setInterval(() => {
      this.setState({
        time: this.state.time + 1
      })
    }, 1000)
  }

  componentWillUnmount = () => {
    clearInterval(this.timerId)
  }

  render () {
    return <div>{this.state.time}</div>
  }
}

deact.render(<Timer />, document.getElementById('app'))
```

Done:
* Class Component
* Functional Component
* ComponentWillMount, componentDidMount and componentWillUnmount lifecycles
* Render
* Brute-force reconcile
* Synchronous setState [stack-reconciler branch]
* Fiber reconcile

Doing:
* Asynchronous setState

Maybe:
* Hook

References:
* [didact](https://engineering.hexacta.com/didact-learning-how-react-works-by-building-it-from-scratch-51007984e5c5)
