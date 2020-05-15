import React from "react"
import { render } from "@testing-library/react"
import App from "./App"

const Subbing = React.createContext(false)

const withSub = (Component, Substitute) => ({
  __DO_NOT_SUB = false,
  ...props
}) => {
  const subbing = React.useContext(Subbing)
  if (subbing && !__DO_NOT_SUB) {
    return Substitute(props)
  }

  return Component(props)
}

const ChildWithSub = withSub(
  () => <div>real child</div>,
  () => <div>sub child</div>
)

const Parent = () => <ChildWithSub />
const ParentWithSub = withSub(
  () => <ChildWithSub />,
  () => <div>sub parent</div>
)

const doNotSubShallow = (element) => {
  return React.cloneElement(element, { __DO_NOT_SUB: true })
}

const renderWithSubs = (element, ...args) =>
  render(
    <Subbing.Provider value={true}>
      {doNotSubShallow(element)}
    </Subbing.Provider>,
    ...args
  )

describe("Parent using Component with Substitute", () => {
  test("not subbing", () => {
    const { getByText } = render(<Parent />)
    const text = getByText(/real/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<Parent />)
    const text = getByText(/sub child/i)
    expect(text).toBeInTheDocument()
  })
})

describe("Parent with Substitute", () => {
  test("not subbing", () => {
    const { getByText } = render(<ParentWithSub />)
    const text = getByText(/real/i)
    expect(text).toBeInTheDocument()
  })

  test("subbing", () => {
    const { getByText } = renderWithSubs(<ParentWithSub />)
    const text = getByText(/sub child/i)
    expect(text).toBeInTheDocument()
  })
})
