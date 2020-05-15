import React from "react"
import { render } from "@testing-library/react"
import { memoize } from "lodash"

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component"
}

const transformElement = (element, transform) => {
  if (!React.isValidElement(element)) return element

  const type = element.type
  const props = element.props
  const children = React.Children.map(props.children, (child) =>
    transformElement(child, transform)
  )

  return React.createElement(transform(type), { ...props, children })
}

const traverse = (type) => {
  if (typeof type === "function") {
    if (type.prototype?.isReactComponent) {
      class Wrapped extends type {
        render() {
          const element = type.prototype.render.apply(this)

          return transformElement(element, substituteOrTraverse)
        }
      }

      Wrapped.displayName = getDisplayName(type)

      return Wrapped
    }

    return (props) => {
      const element = type(props)
      return transformElement(element, substituteOrTraverse)
    }
  }

  return type
}

const substituteOrTraverse = (type) => type.Substitute ?? traverse(type)

const renderWithSubs = (element, ...args) =>
  render(transformElement(element, memoize(traverse)), ...args)

const ChildWithSub = ({ children }) => <div>real child: {children}</div>
ChildWithSub.Substitute = ({ children }) => <div>sub child: {children}</div>

describe("Parent using Component with Substitute", () => {
  const Parent = () => <ChildWithSub>1</ChildWithSub>

  test("not subbing", () => {
    const { getByText } = render(<Parent />)
    const text = getByText(/real child: 1/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<Parent />)
    const text = getByText(/sub child: 1/i)
    expect(text).toBeInTheDocument()
  })
})

describe("Parent with Substitute", () => {
  const ParentWithSub = () => <ChildWithSub>1</ChildWithSub>
  ParentWithSub.Substitute = () => <div>sub parent</div>

  test("not subbing", () => {
    const { getByText } = render(<ParentWithSub />)
    const text = getByText(/real child: 1/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<ParentWithSub />)
    const text = getByText(/sub child: 1/i)
    expect(text).toBeInTheDocument()
  })
})

describe("Parent with multiple children", () => {
  const Parent = () => (
    <>
      <ChildWithSub>1</ChildWithSub>
      <ChildWithSub>2</ChildWithSub>
    </>
  )
  Parent.Substitute = () => <div>sub parent</div>

  test("not subbing", () => {
    const { getByText } = render(<Parent />)
    let child = getByText(/real child: 1/i)
    expect(child).toBeInTheDocument()

    child = getByText(/real child: 2/i)
    expect(child).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<Parent />)
    let child = getByText(/sub child: 1/i)
    expect(child).toBeInTheDocument()

    child = getByText(/sub child: 2/i)
    expect(child).toBeInTheDocument()
  })
})

describe("Multiple elements being rendered", () => {
  const Parent = () => <ChildWithSub>1</ChildWithSub>

  test("not subbing", () => {
    const { getByText } = render(
      <div>
        <Parent />
        <ChildWithSub>2</ChildWithSub>
      </div>
    )
    let child = getByText(/real child: 1/i)
    expect(child).toBeInTheDocument()

    child = getByText(/real child: 2/i)
    expect(child).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(
      <div>
        <Parent />
        <ChildWithSub>2</ChildWithSub>
      </div>
    )
    let child = getByText(/sub child: 1/i)
    expect(child).toBeInTheDocument()

    child = getByText(/real child: 2/i)
    expect(child).toBeInTheDocument()
  })
})

describe("Parent class component", () => {
  class Parent extends React.Component {
    render() {
      return <ChildWithSub>1</ChildWithSub>
    }
  }

  test("not subbing", () => {
    const { getByText } = render(<Parent />)
    const text = getByText(/real child: 1/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<Parent />)
    const text = getByText(/sub child: 1/i)
    expect(text).toBeInTheDocument()
  })
})

describe("Grandparent class component", () => {
  class GrandParent extends React.Component {
    render() {
      return <Parent />
    }
  }

  class Parent extends React.Component {
    render() {
      return <ChildWithSub>1</ChildWithSub>
    }
  }

  test("not subbing", () => {
    console.log(<GrandParent />)
    const { getByText } = render(<GrandParent />)
    const text = getByText(/real child: 1/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<GrandParent />)
    const text = getByText(/sub child: 1/i)
    expect(text).toBeInTheDocument()
  })
})
