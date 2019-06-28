import { reconcile } from './reconcile'

class Component {
  constructor (props) {
    this.props = props
    this.state = this.state || {}
  }

  setState (partialState) {
    // TODO, fix this synchronous way to update state
    const newState = Object.assign({}, this.state, partialState)
    this.state = newState
    const nextRenderedElement = this.render()
    // this component must have an actual rendered dom, get the parent node of it
    const parentDOM = this.internalInstance.dom.parentNode
    const instance = reconcile(this.internalInstance.childInstance, nextRenderedElement, parentDOM)

    this.internalInstance.childInstance = instance
    this.internalInstance.dom = instance.dom
  }
}

export default Component
