export const checkComponentWillMount = (instance) => {
  instance && checkAndInvoke(instance, 'componentWillMount')
}

export const checkComponentDidMount = (instance) => {
  instance && checkAndInvoke(instance, 'componentDidMount')
}

export const checkComponentWillUnmount = (instance) => {
  instance && checkAndInvoke(instance, 'componentWillUnmount')
}

const checkAndInvoke = (instance, lifeCycle, ...args) => {
  instance[lifeCycle] && instance[lifeCycle](...args)
}
