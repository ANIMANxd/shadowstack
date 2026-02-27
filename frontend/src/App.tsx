import Layout from './components/Layout/Layout'

/**
 * App – root component.
 * Routing is handled inside Layout via React Router v6.
 * BrowserRouter is mounted in main.tsx.
 */
export default function App(): JSX.Element {
    return <Layout />
}
